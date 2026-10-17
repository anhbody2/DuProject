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
  ProductReviewReply,
  Profile,
  Store,
  StoreOrder,
  StoreReview,
  User,
} from '../../database/models';
import { CreateReplyDto, CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

type ReviewModel = typeof StoreReview | typeof ProductReview;

/** Include that keeps only orders with a completed store order containing the product. */
const completedWith = (productId: number) => [
  {
    model: StoreOrder,
    where: { status: 'completed' },
    attributes: [],
    include: [{ model: OrderItem, where: { productId }, attributes: [] }],
  },
];

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
    @InjectModel(ProductReviewReply) private readonly replies: typeof ProductReviewReply,
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

  async listForProduct(productId: number, query: PaginationQueryDto) {
    const page = await this.list(this.productReviews, { productId }, query);
    // Replies are loaded in a second query so they don't skew the page's limit/count.
    const reviews = page.items as unknown as ProductReview[];
    const replies = reviews.length
      ? await this.replies.findAll({
          where: { reviewId: reviews.map((r) => r.id) },
          include: [AUTHOR],
          order: [['createdAt', 'ASC']],
        })
      : [];
    for (const review of reviews) {
      review.setDataValue('replies', replies.filter((r) => r.reviewId === review.id));
    }
    return page;
  }

  async createForProduct(user: AuthUser, productId: number, dto: CreateReviewDto) {
    if (!(await this.products.count({ where: { id: productId } }))) throw new NotFoundException('Product not found');
    const eligible = await this.orders.count({
      where: { id: dto.orderId, userId: user.id },
      include: completedWith(productId),
    });
    if (!eligible) throw new BadRequestException('You can only review products from your completed orders');
    return this.productReviews.create({ ...dto, productId, userId: user.id });
  }

  /** The caller's reviews of a product, and their completed orders with it that aren't reviewed yet. */
  async mineForProduct(user: AuthUser, productId: number) {
    const [reviews, orders] = await Promise.all([
      this.productReviews.findAll({
        where: { productId, userId: user.id },
        include: [AUTHOR],
        order: [['createdAt', 'DESC']],
      }),
      this.orders.findAll({
        where: { userId: user.id },
        attributes: ['id'],
        include: completedWith(productId),
        order: [['createdAt', 'DESC']],
      }),
    ]);
    const reviewed = new Set(reviews.map((r) => r.orderId));
    return { reviews, reviewableOrderIds: orders.map((o) => o.id).filter((id) => !reviewed.has(id)) };
  }

  // ---------------------------------------------------------------- replies to product reviews

  /** Any signed-in user may comment on an existing product review. */
  async reply(user: AuthUser, reviewId: number, dto: CreateReplyDto) {
    if (!(await this.productReviews.count({ where: { id: reviewId } }))) {
      throw new NotFoundException('Review not found');
    }
    const reply = await this.replies.create({ reviewId, userId: user.id, comment: dto.comment.trim() });
    return reply.reload({ include: [AUTHOR] });
  }

  async removeReply(user: AuthUser, id: number) {
    const reply = await this.replies.findByPk(id);
    // Admins may moderate any reply.
    if (!reply || (user.role !== 'admin' && reply.userId !== user.id)) {
      throw new NotFoundException('Reply not found');
    }
    await reply.destroy();
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
    const [{ rows, count }, [stats], perRating] = await Promise.all([
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
      (model as typeof StoreReview).findAll({
        where,
        attributes: ['rating', [fn('COUNT', col('id')), 'count']],
        group: ['rating'],
        raw: true,
      }) as unknown as Promise<{ rating: number; count: number }[]>,
    ]);
    // Always all five keys, so clients can draw the breakdown without gaps.
    const ratingCounts = Object.fromEntries([1, 2, 3, 4, 5].map((r) => [r, 0])) as Record<number, number>;
    for (const row of perRating) ratingCounts[row.rating] = Number(row.count);
    return { ...paginate(rows, count, query), averageRating: Number(stats.average), ratingCounts };
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
