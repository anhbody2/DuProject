import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Store } from './store.model';
import { User } from './user.model';

export const STORE_MEMBER_ROLES = ['owner', 'manager', 'staff'] as const;
export type StoreMemberRole = (typeof STORE_MEMBER_ROLES)[number];

@Table({ tableName: 'store_members', underscored: true })
export class StoreMember extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'staff' })
  role: StoreMemberRole;

  @BelongsTo(() => Store)
  store?: Store;

  @BelongsTo(() => User)
  user?: User;
}
