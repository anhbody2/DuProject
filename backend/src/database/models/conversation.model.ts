import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ConversationParticipant } from './conversation-participant.model';
import { Message } from './message.model';

/** 'direct': two users. 'support': one user and the whole admin team. */
export const CONVERSATION_TYPES = ['direct', 'support'] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

@Table({ tableName: 'conversations', underscored: true })
export class Conversation extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  type: ConversationType;

  /** Dedup key: 'direct:<lowId>:<highId>' or 'support:<userId>'. */
  @Column({ type: DataType.STRING(60), allowNull: false, unique: true })
  key: string;

  @Column(DataType.DATE)
  lastMessageAt: Date | null;

  /** Support threads only: when an admin last read it (shared by the admin team). */
  @Column(DataType.DATE)
  staffReadAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  @HasMany(() => ConversationParticipant)
  participants?: ConversationParticipant[];

  @HasMany(() => Message)
  messages?: Message[];
}
