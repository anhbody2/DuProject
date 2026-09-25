import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { col, fn } from 'sequelize';
import { PaginationQueryDto, pageOptions, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Order,
  OrderItem,
  Product,
  ProductReview,
  Profile,
  Store,
  StoreOrder,
  StoreReview,
  User,
} from '../../database/models';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

type ReviewModel = typeof StoreReview | typeof ProductReview;

const AUTHOR = {
  model: User,
  attributes: ['id', 'username'],
  include: [{ model: Profile, attributes: ['firstName', 'lastName', 'avatarUrl'] }],
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(StoreReview) private readonly storeReviews: typeof StoreReview,
    @InjectModel(ProductReview) private readonly productReviews: typeof ProductReview,
    @InjectModel(Store) private readonly stores: typeof Store,
    @InjectModel(Product) private readonly products: typeof Product,
    @InjectModel(Order) private readonly orders: typeof Order,
  ) {}

  // ---------------------------------------------------------------- store reviews

  listForStore(storeId: number, query: PaginationQueryDto) {
    return this.list(this.storeReviews, { storeId }, query);
  }

  async createForStore(user: AuthUser, storeId: number, dto: CreateReviewDto) {
    if (!(await this.stores.count({ where: { id: storeId } }))) throw new NotFoundException('Store not found');
    const eligible = await this.orders.count({
      where: { id: dto.orderId, userId: user.id },
      include: [{ model: StoreOrder, where: { storeId, status: 'completed' }, attributes: [] }],
    });
    if (!eligible) throw new BadRequestException('You can only review stores from your completed orders');
    return this.storeReviews.create({ ...dto, storeId, userId: user.id });
  }

  // ---------------------------------------------------------------- product reviews

  listForProduct(productId: number, query: PaginationQueryDto) {
    return this.list(this.productReviews, { productId }, query);
  }

  async createForProduct(user: AuthUser, productId: number, dto: CreateReviewDto) {
    if (!(await this.products.count({ where: { id: productId } }))) throw new NotFoundException('Product not found');
    const eligible = await this.orders.count({
      where: { id: dto.orderId, userId: user.id },
      include: [
        {
          model: StoreOrder,
          where: { status: 'completed' },
          attributes: [],
          include: [{ model: OrderItem, where: { productId }, attributes: [] }],
        },
      ],
    });
    if (!eligible) throw new BadRequestException('You can only review products from your completed orders');
    return this.productReviews.create({ ...dto, productId, userId: user.id });
  }

  // ---------------------------------------------------------------- own review edits

  async update(kind: 'store' | 'product', user: AuthUser, id: number, dto: UpdateReviewDto) {
    const review = await this.findOwn(kind, user, id);
    return review.update(dto);
  }

  async remove(kind: 'store' | 'product', user: AuthUser, id: number) {
    const review = await this.findOwn(kind, user, id);
    await review.destroy();
  }

  // ---------------------------------------------------------------- helpers

  private async list(model: ReviewModel, where: Record<string, number>, query: PaginationQueryDto) {
    const [{ rows, count }, [stats]] = await Promise.all([
      (model as typeof StoreReview).findAndCountAll({
        where,
        include: [AUTHOR],
        order: [['createdAt', 'DESC']],
        ...pageOptions(query),
      }),
      (model as typeof StoreReview).findAll({
        where,
        attributes: [[fn('COALESCE', fn('ROUND', fn('AVG', col('rating')), 2), 0), 'average']],
        raw: true,
      }) as unknown as Promise<{ average: number }[]>,
    ]);
    return { ...paginate(rows, count, query), averageRating: Number(stats.average) };
  }

  private async findOwn(kind: 'store' | 'product', user: AuthUser, id: number) {
    const model = (kind === 'store' ? this.storeReviews : this.productReviews) as typeof StoreReview;
    const review = await model.findByPk(id);
    // Admins may moderate any review.
    if (!review || (user.role !== 'admin' && review.userId !== user.id)) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}
