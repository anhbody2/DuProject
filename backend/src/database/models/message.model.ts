import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Conversation } from './conversation.model';
import { User } from './user.model';

@Table({ tableName: 'messages', underscored: true, updatedAt: false })
export class Message extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Conversation)
  @Column({ type: DataType.BIGINT, allowNull: false })
  conversationId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  senderId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  body: string;

  createdAt: Date;

  @BelongsTo(() => Conversation)
  conversation?: Conversation;

  @BelongsTo(() => User)
  sender?: User;
}
