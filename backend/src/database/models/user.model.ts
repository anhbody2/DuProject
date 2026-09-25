import {
  Column,
  DataType,
  DefaultScope,
  HasMany,
  HasOne,
  Model,
  Scopes,
  Table,
} from 'sequelize-typescript';
import { Address } from './address.model';
import { Cart } from './cart.model';
import { Order } from './order.model';
import { Profile } from './profile.model';
import { Store } from './store.model';
import { StoreMember } from './store-member.model';

export const USER_ROLES = ['customer', 'store_owner', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

@DefaultScope(() => ({ attributes: { exclude: ['passwordHash'] } }))
@Scopes(() => ({ withPassword: { attributes: { include: ['passwordHash'] } } }))
@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  username: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  passwordHash: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'customer' })
  role: UserRole;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'active' })
  status: UserStatus;

  createdAt: Date;
  updatedAt: Date;

  @HasOne(() => Profile)
  profile?: Profile;

  @HasMany(() => Address)
  addresses?: Address[];

  @HasMany(() => Store, 'ownerId')
  ownedStores?: Store[];

  @HasMany(() => StoreMember)
  memberships?: StoreMember[];

  @HasOne(() => Cart)
  cart?: Cart;

  @HasMany(() => Order)
  orders?: Order[];
}
