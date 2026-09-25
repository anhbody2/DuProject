import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Includeable, Op, Order, Transaction, WhereOptions, literal } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { slugify } from '../../common/utils/slugify';
import {
  CartItem,
  Category,
  OptionGroup,
  Product,
  ProductImage,
  ProductOption,
  Store,
} from '../../database/models';
import { StoreAccessService } from '../stores/store-access.service';
import {
  CreateProductDto,
  ListProductsQueryDto,
  OptionDto,
  OptionGroupDto,
  ProductImageDto,
  UpdateOptionDto,
  UpdateOptionGroupDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from './dto/product.dto';

const EFFECTIVE_PRICE = 'COALESCE("Product"."sale_price", "Product"."price")';

const SORTS: Record<ListProductsQueryDto['sort'], Order> = {
  newest: [['createdAt', 'DESC']],
  name: [['name', 'ASC']],
  price_asc: [[literal(EFFECTIVE_PRICE), 'ASC']],
  price_desc: [[literal(EFFECTIVE_PRICE), 'DESC']],
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product) private readonly products: typeof Product,
    @InjectModel(ProductImage) private readonly images: typeof ProductImage,
    @InjectModel(OptionGroup) private readonly groups: typeof OptionGroup,
    @InjectModel(ProductOption) private readonly options: typeof ProductOption,
    @InjectModel(Category) private readonly categories: typeof Category,
    @InjectModel(CartItem) private readonly cartItems: typeof CartItem,
    private readonly access: StoreAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  // ---------------------------------------------------------------- public

  async findAll(query: ListProductsQueryDto) {
    const where: WhereOptions = { status: { [Op.in]: ['active', 'out_of_stock'] } };
    const and: unknown[] = [];
    if (query.storeId) Object.assign(where, { storeId: query.storeId });
    if (query.categoryId) Object.assign(where, { categoryId: query.categoryId });
    if (query.q) Object.assign(where, { name: { [Op.iLike]: `%${query.q}%` } });
    if (query.minPrice !== undefined) and.push(literal(`${EFFECTIVE_PRICE} >= ${Number(query.minPrice)}`));
    if (query.maxPrice !== undefined) and.push(literal(`${EFFECTIVE_PRICE} <= ${Number(query.maxPrice)}`));
    if (and.length) Object.assign(where, { [Op.and]: and });

    const { rows, count } = await this.products.findAndCountAll({
      where,
      include: [
        { model: Store, where: { status: 'active' }, attributes: ['id', 'name', 'slug', 'logoUrl'] },
        { model: ProductImage, separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']] },
      ],
      order: SORTS[query.sort],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  /** Public product page - hidden if the product is inactive or the store isn't active. */
  async findPublic(id: number) {
    const product = await this.products.findOne({
      where: { id, status: { [Op.ne]: 'inactive' } },
      include: this.detailIncludes({ publicOnly: true }),
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ---------------------------------------------------------------- store managers

  async create(user: AuthUser, dto: CreateProductDto) {
    await this.access.assert(user, dto.storeId);
    await this.assertCategory(dto.categoryId);
    this.assertSalePrice(dto.price, dto.salePrice);
    dto.optionGroups?.forEach((g) => this.assertSelectionRange(g.minSelection ?? 0, g.maxSelection ?? 1));

    const productId = await this.sequelize.transaction(async (transaction) => {
      const product = await this.products.create(
        {
          ...dto,
          slug: await this.uniqueSlug(dto.storeId, dto.slug ?? slugify(dto.name), transaction),
          images: this.normalizeImages(dto.images ?? []),
        },
        {
          include: [
            { association: 'images' },
            { association: 'optionGroups', include: [{ association: 'options' }] },
          ],
          transaction,
        },
      );
      return product.id;
    });
    return this.findDetail(productId);
  }

  async update(user: AuthUser, id: number, dto: UpdateProductDto) {
    const product = await this.findManaged(user, id);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);
    this.assertSalePrice(dto.price ?? product.price, dto.salePrice === undefined ? product.salePrice : dto.salePrice);
    if (dto.slug && dto.slug !== product.slug) {
      dto.slug = await this.uniqueSlug(product.storeId, dto.slug);
    }

    // Keep status in sync with stock unless the caller sets the status explicitly.
    const stock = dto.stock ?? product.stock;
    if (!dto.status && product.status !== 'inactive') {
      dto.status = stock > 0 ? 'active' : 'out_of_stock';
    }

    await product.update(dto);
    return this.findDetail(id);
  }

  async remove(user: AuthUser, id: number) {
    const product = await this.findManaged(user, id);
    await this.sequelize.transaction(async (transaction) => {
      // cart_items -> products is ON DELETE RESTRICT, so clear carts first.
      await this.cartItems.destroy({ where: { productId: id }, transaction });
      await product.destroy({ transaction });
    });
  }

  // ---------------------------------------------------------------- images

  async addImage(user: AuthUser, productId: number, dto: ProductImageDto) {
    await this.findManaged(user, productId);
    return this.sequelize.transaction(async (transaction) => {
      const count = await this.images.count({ where: { productId }, transaction });
      const isPrimary = dto.isPrimary || count === 0;
      if (isPrimary) await this.clearPrimaryImage(productId, transaction);
      return this.images.create({ ...dto, productId, isPrimary, sortOrder: dto.sortOrder ?? count }, { transaction });
    });
  }

  async updateImage(user: AuthUser, productId: number, imageId: number, dto: UpdateProductImageDto) {
    await this.findManaged(user, productId);
    const image = await this.images.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Image not found');
    return this.sequelize.transaction(async (transaction) => {
      if (dto.isPrimary) await this.clearPrimaryImage(productId, transaction);
      return image.update(dto, { transaction });
    });
  }

  async removeImage(user: AuthUser, productId: number, imageId: number) {
    await this.findManaged(user, productId);
    const deleted = await this.images.destroy({ where: { id: imageId, productId } });
    if (!deleted) throw new NotFoundException('Image not found');
  }

  // ---------------------------------------------------------------- option groups & options

  async addOptionGroup(user: AuthUser, productId: number, dto: OptionGroupDto) {
    await this.findManaged(user, productId);
    this.assertSelectionRange(dto.minSelection ?? 0, dto.maxSelection ?? 1);
    const group = await this.groups.create(
      { ...dto, productId },
      { include: [{ association: 'options' }] },
    );
    return group;
  }

  async updateOptionGroup(user: AuthUser, productId: number, groupId: number, dto: UpdateOptionGroupDto) {
    await this.findManaged(user, productId);
    const group = await this.findGroup(productId, groupId);
    this.assertSelectionRange(dto.minSelection ?? group.minSelection, dto.maxSelection ?? group.maxSelection);
    return group.update(dto);
  }

  async removeOptionGroup(user: AuthUser, productId: number, groupId: number) {
    await this.findManaged(user, productId);
    const group = await this.findGroup(productId, groupId);
    await group.destroy();
  }

  async addOption(user: AuthUser, productId: number, groupId: number, dto: OptionDto) {
    await this.findManaged(user, productId);
    await this.findGroup(productId, groupId);
    return this.options.create({ ...dto, optionGroupId: groupId });
  }

  async updateOption(user: AuthUser, productId: number, groupId: number, optionId: number, dto: UpdateOptionDto) {
    await this.findManaged(user, productId);
    await this.findGroup(productId, groupId);
    const option = await this.findOption(groupId, optionId);
    return option.update(dto);
  }

  async removeOption(user: AuthUser, productId: number, groupId: number, optionId: number) {
    await this.findManaged(user, productId);
    await this.findGroup(productId, groupId);
    const option = await this.findOption(groupId, optionId);
    await option.destroy();
  }

  // ---------------------------------------------------------------- helpers

  private async findManaged(user: AuthUser, id: number) {
    const product = await this.products.findByPk(id);
    if (!product) throw new NotFoundException('Product not found');
    await this.access.assert(user, product.storeId);
    return product;
  }

  private async findDetail(id: number) {
    const product = await this.products.findByPk(id, { include: this.detailIncludes() });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private detailIncludes({ publicOnly = false } = {}): Includeable[] {
    return [
      {
        model: Store,
        attributes: ['id', 'name', 'slug', 'logoUrl', 'status'],
        ...(publicOnly ? { where: { status: 'active' } } : {}),
      },
      { model: Category, attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']] },
      {
        model: OptionGroup,
        separate: true,
        order: [['id', 'ASC']],
        include: [{ model: ProductOption }],
      },
    ];
  }

  private async findGroup(productId: number, id: number) {
    const group = await this.groups.findOne({ where: { id, productId } });
    if (!group) throw new NotFoundException('Option group not found');
    return group;
  }

  private async findOption(optionGroupId: number, id: number) {
    const option = await this.options.findOne({ where: { id, optionGroupId } });
    if (!option) throw new NotFoundException('Option not found');
    return option;
  }

  private clearPrimaryImage(productId: number, transaction: Transaction) {
    return this.images.update({ isPrimary: false }, { where: { productId, isPrimary: true }, transaction });
  }

  private normalizeImages(images: ProductImageDto[]) {
    const hasPrimary = images.some((i) => i.isPrimary);
    let primarySeen = false;
    return images.map((img, i) => {
      const isPrimary = hasPrimary ? !!img.isPrimary && !primarySeen : i === 0;
      if (isPrimary) primarySeen = true;
      return { ...img, sortOrder: img.sortOrder ?? i, isPrimary };
    });
  }

  private async assertCategory(id: number) {
    if (!(await this.categories.count({ where: { id } }))) {
      throw new BadRequestException('Category does not exist');
    }
  }

  private assertSalePrice(price: number, salePrice?: number | null) {
    if (salePrice !== undefined && salePrice !== null && Number(salePrice) > Number(price)) {
      throw new BadRequestException('salePrice cannot exceed price');
    }
  }

  private assertSelectionRange(min: number, max: number) {
    if (max < min) throw new BadRequestException('maxSelection must be >= minSelection');
  }

  private async uniqueSlug(storeId: number, base: string, transaction?: Transaction) {
    const root = base || 'product';
    let slug = root;
    for (let i = 2; await this.products.count({ where: { storeId, slug }, transaction }); i++) {
      slug = `${root}-${i}`;
    }
    return slug;
  }
}
