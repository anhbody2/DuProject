import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';

export const SOCIAL_PROVIDERS = ['google', 'facebook'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

/** A Google / Facebook identity linked to a user; created on the first social login. */
@Table({ tableName: 'social_accounts', underscored: true, updatedAt: false })
export class SocialAccount extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  provider: SocialProvider;

  /** Google `sub` / Facebook user id. Stable, unlike the email. */
  @Column({ type: DataType.STRING(255), allowNull: false })
  providerUserId: string;

  createdAt: Date;

  @BelongsTo(() => User)
  user?: User;
}
