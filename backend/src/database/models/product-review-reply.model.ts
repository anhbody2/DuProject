import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ProductReview } from './product-review.model';
import { User } from './user.model';

@Table({ tableName: 'product_review_replies', underscored: true })
export class ProductReviewReply extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => ProductReview)
  @Column({ type: DataType.BIGINT, allowNull: false })
  reviewId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  comment: string;

  @BelongsTo(() => ProductReview)
  review?: ProductReview;

  @BelongsTo(() => User)
  user?: User;
}
