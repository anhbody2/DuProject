import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Conversation } from './conversation.model';
import { User } from './user.model';

@Table({ tableName: 'conversation_participants', underscored: true, updatedAt: false })
export class ConversationParticipant extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Conversation)
  @Column({ type: DataType.BIGINT, allowNull: false })
  conversationId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  /** Messages from others after this are unread. */
  @Column(DataType.DATE)
  lastReadAt: Date | null;

  createdAt: Date;

  @BelongsTo(() => Conversation)
  conversation?: Conversation;

  @BelongsTo(() => User)
  user?: User;
}
