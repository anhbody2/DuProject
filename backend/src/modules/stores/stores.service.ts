import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Includeable, Op, Transaction, WhereOptions, fn, col, literal } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { slugify } from '../../common/utils/slugify';
import {
  Category,
  Profile,
  Store,
  StoreLocation,
  StoreMember,
  StoreReview,
  User,
} from '../../database/models';
import {
  AddStoreMemberDto,
  CreateStoreDto,
  ListStoresQueryDto,
  StoreLocationDto,
  UpdateStoreDto,
  UpdateStoreLocationDto,
  UpdateStoreMemberDto,
  UpdateStoreStatusDto,
} from './dto/store.dto';
import { ALL_MEMBERS, StoreAccessService } from './store-access.service';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store) private readonly stores: typeof Store,
    @InjectModel(StoreLocation) private readonly locations: typeof StoreLocation,
    @InjectModel(StoreMember) private readonly members: typeof StoreMember,
    @InjectModel(Category) private readonly categories: typeof Category,
    @InjectModel(StoreReview) private readonly reviews: typeof StoreReview,
    @InjectModel(User) private readonly users: typeof User,
    private readonly access: StoreAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  // ---------------------------------------------------------------- public

  async findAll(query: ListStoresQueryDto) {
    if ((query.lat === undefined) !== (query.lng === undefined)) {
      throw new BadRequestException('lat and lng must be provided together');
    }
    const where: WhereOptions = { status: 'active' };
    const and: unknown[] = [];
    const options: FindOptions = {};

    if (query.q) Object.assign(where, { name: { [Op.iLike]: `%${query.q}%` } });

    if (query.categoryId) {
      and.push(
        literal(
          `EXISTS (SELECT 1 FROM store_categories sc WHERE sc.store_id = "Store"."id" AND sc.category_id = ${Number(query.categoryId)})`,
        ),
      );
    }

    if (query.lat !== undefined && query.lng !== undefined) {
      const distance = this.distanceSql(query.lat, query.lng);
      and.push(literal(`${distance} <= ${Number(query.radiusKm)}`));
      options.attributes = { include: [[literal(distance), 'distanceKm']] };
      options.order = [[literal(distance), 'ASC']];
    } else {
      options.order = [['createdAt', 'DESC']];
    }

    if (and.length) Object.assign(where, { [Op.and]: and });

    const { rows, count } = await this.stores.findAndCountAll({
      ...options,
      where,
      include: [
        { model: Category, through: { attributes: [] } },
        { model: StoreLocation, separate: true },
      ],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  /** Public store page - only active stores are visible. */
  async findPublic(id: number) {
    const store = await this.stores.findOne({
      where: { id, status: 'active' },
      include: this.detailIncludes(),
    });
    if (!store) throw new NotFoundException('Store not found');

    const [stats] = (await this.reviews.findAll({
      where: { storeId: id },
      attributes: [
        [fn('COALESCE', fn('ROUND', fn('AVG', col('rating')), 2), 0), 'average'],
        [fn('COUNT', col('id')), 'count'],
      ],
      raw: true,
    })) as unknown as { average: number; count: number }[];

    return { ...store.toJSON(), rating: { average: Number(stats.average), count: Number(stats.count) } };
  }

  findLocations(storeId: number) {
    return this.locations.findAll({
      where: { storeId },
      order: [
        ['isPrimary', 'DESC'],
        ['id', 'ASC'],
      ],
    });
  }

  // ---------------------------------------------------------------- owner / manager

  async create(user: AuthUser, dto: CreateStoreDto) {
    const storeId = await this.sequelize.transaction(async (transaction) => {
      const store = await this.stores.create(
        {
          ...dto,
          ownerId: user.id,
          slug: await this.uniqueSlug(dto.slug ?? slugify(dto.name), transaction),
          // Admin-created stores go live immediately; others await approval.
          status: user.role === 'admin' ? 'active' : 'pending',
        },
        { transaction },
      );
      await this.members.create({ storeId: store.id, userId: user.id, role: 'owner' }, { transaction });

      if (dto.categoryIds?.length) {
        await this.assertCategoriesExist(dto.categoryIds, transaction);
        await store.$set('categories', dto.categoryIds, { transaction });
      }
      if (dto.locations?.length) {
        const hasPrimary = dto.locations.some((l) => l.isPrimary);
        await this.locations.bulkCreate(
          dto.locations.map((l, i) => ({
            ...l,
            storeId: store.id,
            isPrimary: hasPrimary ? !!l.isPrimary : i === 0,
          })),
          { transaction },
        );
      }
      return store.id;
    });
    return this.findDetail(storeId);
  }

  async findForManager(user: AuthUser, id: number) {
    await this.access.assert(user, id, ALL_MEMBERS);
    return this.findDetail(id);
  }

  async update(user: AuthUser, id: number, dto: UpdateStoreDto) {
    const store = await this.access.assert(user, id);
    if (dto.slug && dto.slug !== store.slug) dto.slug = await this.uniqueSlug(dto.slug);
    await store.update(dto);
    return this.findDetail(id);
  }

  /** Only the owner (or an admin) may delete. 409 if the store has order history. */
  async remove(user: AuthUser, id: number) {
    const store = await this.access.assert(user, id, ['owner']);
    await store.destroy();
  }

  async updateStatus(id: number, dto: UpdateStoreStatusDto) {
    const store = await this.stores.findByPk(id);
    if (!store) throw new NotFoundException('Store not found');
    return store.update({ status: dto.status });
  }

  async setCategories(user: AuthUser, id: number, categoryIds: number[]) {
    const store = await this.access.assert(user, id);
    await this.sequelize.transaction(async (transaction) => {
      await this.assertCategoriesExist(categoryIds, transaction);
      await store.$set('categories', categoryIds, { transaction });
    });
    return this.categories.findAll({
      include: [{ model: Store, where: { id }, attributes: [], through: { attributes: [] } }],
      order: [['name', 'ASC']],
    });
  }

  // ---------------------------------------------------------------- locations

  async addLocation(user: AuthUser, storeId: number, dto: StoreLocationDto) {
    await this.access.assert(user, storeId);
    return this.sequelize.transaction(async (transaction) => {
      const count = await this.locations.count({ where: { storeId }, transaction });
      const isPrimary = dto.isPrimary || count === 0;
      if (isPrimary) await this.clearPrimaryLocation(storeId, transaction);
      return this.locations.create({ ...dto, storeId, isPrimary }, { transaction });
    });
  }

  async updateLocation(user: AuthUser, storeId: number, locationId: number, dto: UpdateStoreLocationDto) {
    await this.access.assert(user, storeId);
    const location = await this.findLocation(storeId, locationId);
    return this.sequelize.transaction(async (transaction) => {
      if (dto.isPrimary) await this.clearPrimaryLocation(storeId, transaction);
      return location.update(dto, { transaction });
    });
  }

  async removeLocation(user: AuthUser, storeId: number, locationId: number) {
    await this.access.assert(user, storeId);
    const location = await this.findLocation(storeId, locationId);
    await location.destroy();
  }

  // ---------------------------------------------------------------- members

  async findMembers(user: AuthUser, storeId: number) {
    await this.access.assert(user, storeId, ALL_MEMBERS);
    return this.members.findAll({
      where: { storeId },
      include: [{ model: User, include: [Profile] }],
      order: [['id', 'ASC']],
    });
  }

  async addMember(user: AuthUser, storeId: number, dto: AddStoreMemberDto) {
    await this.access.assert(user, storeId, ['owner']);
    const member = await this.users.findByPk(dto.userId);
    if (!member) throw new NotFoundException('User not found');
    if (member.status !== 'active') throw new BadRequestException('User is not active');
    return this.members.create({ storeId, userId: dto.userId, role: dto.role });
  }

  async updateMember(user: AuthUser, storeId: number, memberId: number, dto: UpdateStoreMemberDto) {
    await this.access.assert(user, storeId, ['owner']);
    const member = await this.findMember(storeId, memberId);
    return member.update({ role: dto.role });
  }

  async removeMember(user: AuthUser, storeId: number, memberId: number) {
    await this.access.assert(user, storeId, ['owner']);
    const member = await this.findMember(storeId, memberId);
    await member.destroy();
  }

  // ---------------------------------------------------------------- helpers

  private async findDetail(id: number) {
    const store = await this.stores.findByPk(id, { include: this.detailIncludes() });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  private detailIncludes(): Includeable[] {
    return [
      { model: Category, through: { attributes: [] } },
      { model: StoreLocation, separate: true, order: [['isPrimary', 'DESC']] },
      { model: User, as: 'owner', attributes: ['id', 'username'] },
    ];
  }

  private async findLocation(storeId: number, id: number) {
    const location = await this.locations.findOne({ where: { id, storeId } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  private async findMember(storeId: number, id: number) {
    const member = await this.members.findOne({ where: { id, storeId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new ForbiddenException('The store owner cannot be changed here');
    return member;
  }

  private clearPrimaryLocation(storeId: number, transaction: Transaction) {
    return this.locations.update({ isPrimary: false }, { where: { storeId, isPrimary: true }, transaction });
  }

  private async assertCategoriesExist(ids: number[], transaction?: Transaction) {
    const count = await this.categories.count({ where: { id: ids }, transaction });
    if (count !== ids.length) throw new BadRequestException('One or more categories do not exist');
  }

  /** Appends -2, -3 ... until the slug is free. */
  private async uniqueSlug(base: string, transaction?: Transaction) {
    const root = base || 'store';
    let slug = root;
    for (let i = 2; await this.stores.count({ where: { slug }, transaction }); i++) {
      slug = `${root}-${i}`;
    }
    return slug;
  }

  /** Haversine distance (km) from the point to the store's nearest location. */
  private distanceSql(lat: number, lng: number) {
    const la = Number(lat);
    const lo = Number(lng);
    return `(SELECT MIN(6371 * ACOS(LEAST(1, GREATEST(-1,
      COS(RADIANS(${la})) * COS(RADIANS(sl.latitude)) * COS(RADIANS(sl.longitude) - RADIANS(${lo}))
      + SIN(RADIANS(${la})) * SIN(RADIANS(sl.latitude))))))
      FROM store_locations sl WHERE sl.store_id = "Store"."id")`;
  }
}
