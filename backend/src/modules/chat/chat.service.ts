import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { paginate, pageOptions, type PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Conversation,
  ConversationParticipant,
  Message,
  Profile,
  Store,
  User,
  type ConversationType,
} from '../../database/models';
import { ADMINS_ROOM, ChatEvents, userRoom } from './chat.events';
import { MESSAGE_MAX_LENGTH, MessagesQueryDto } from './dto/chat.dto';

/** Public card of a chat user (never the email). */
export interface ChatPeer {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  role: User['role'];
}

export interface MessageView {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: Date;
}

export interface ConversationView {
  id: number;
  type: ConversationType;
  /** Direct: the other user. Support: the customer when an admin views it, null for the customer (the admin team). */
  peer: ChatPeer | null;
  lastMessage: MessageView | null;
  lastMessageAt: Date | null;
  unread: number;
}

/** How the caller reaches a conversation: as a participant, or as an admin answering a support thread. */
interface Access {
  conversation: Conversation;
  participant: ConversationParticipant | null;
  staff: boolean;
}

const PEER_INCLUDE = { model: User, attributes: ['id', 'username', 'role'], include: [Profile] };

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation) private readonly conversations: typeof Conversation,
    @InjectModel(ConversationParticipant) private readonly participants: typeof ConversationParticipant,
    @InjectModel(Message) private readonly messages: typeof Message,
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(Store) private readonly stores: typeof Store,
    private readonly events: ChatEvents,
    private readonly sequelize: Sequelize,
  ) {}

  /* ------------------------------------------------------------ lists */

  /** The caller's own conversations that have at least one message, newest first. */
  async listMine(user: AuthUser): Promise<ConversationView[]> {
    const rows = await this.conversations.findAll({
      where: {
        lastMessageAt: { [Op.ne]: null },
        id: { [Op.in]: this.sequelize.literal(`(SELECT conversation_id FROM conversation_participants WHERE user_id = ${Number(user.id)})`) },
      },
      include: [{ model: ConversationParticipant, include: [PEER_INCLUDE] }],
      order: [['lastMessageAt', 'DESC'], ['id', 'DESC']],
    });
    return this.views(rows, user);
  }

  /** Admin inbox: every support thread with messages, newest first. */
  async listSupport(user: AuthUser, query: PaginationQueryDto) {
    const { rows, count } = await this.conversations.findAndCountAll({
      where: { type: 'support', lastMessageAt: { [Op.ne]: null } },
      include: [{ model: ConversationParticipant, include: [PEER_INCLUDE] }],
      order: [['lastMessageAt', 'DESC'], ['id', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(await this.views(rows, user), count, query);
  }

  async findOne(user: AuthUser, id: number): Promise<ConversationView> {
    const { conversation } = await this.access(user, id);
    const [view] = await this.views([conversation], user);
    return view;
  }

  /** Total unread messages across the caller's conversations (plus the support inbox for admins). */
  async unreadCount(user: AuthUser): Promise<{ count: number; support: number }> {
    const [{ n }] = await this.sequelize.query<{ n: number }>(
      `SELECT count(*)::int AS n
         FROM messages m
         JOIN conversation_participants p ON p.conversation_id = m.conversation_id AND p.user_id = :me
        WHERE m.sender_id <> :me AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)`,
      { replacements: { me: user.id }, type: QueryTypes.SELECT },
    );
    const support = user.role === 'admin' ? Array.from((await this.staffUnread()).values()).reduce((a, b) => a + b, 0) : 0;
    return { count: n + support, support };
  }

  /** Active users whose username starts with `q`, to start a direct chat with. */
  async searchUsers(user: AuthUser, q: string): Promise<ChatPeer[]> {
    const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
    const rows = await this.users.findAll({
      attributes: ['id', 'username', 'role'],
      where: { username: { [Op.iLike]: `${escaped}%` }, status: 'active', id: { [Op.ne]: user.id } },
      include: [Profile],
      order: [['username', 'ASC']],
      limit: 10,
    });
    return rows.map(peerOf);
  }

  /* ------------------------------------------------------------ open (get or create) */

  async openDirect(user: AuthUser, targetId: number): Promise<ConversationView> {
    if (targetId === user.id) throw new BadRequestException('You cannot chat with yourself');
    const target = await this.users.findOne({ where: { id: targetId, status: 'active' } });
    if (!target) throw new NotFoundException('User not found');

    const [low, high] = [user.id, targetId].sort((a, b) => a - b);
    const conversation = await this.getOrCreate('direct', `direct:${low}:${high}`, [low, high]);
    return this.findOne(user, conversation.id);
  }

  /** Direct chat with the owner of an active store. */
  async openStore(user: AuthUser, storeId: number): Promise<ConversationView> {
    const store = await this.stores.findOne({ where: { id: storeId, status: 'active' } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId === user.id) throw new BadRequestException('This is your own store');
    return this.openDirect(user, store.ownerId);
  }

  /** The caller's own thread with the admin team. */
  async openSupport(user: AuthUser): Promise<ConversationView> {
    if (user.role === 'admin') throw new BadRequestException('Admins answer support threads instead of opening one');
    const conversation = await this.getOrCreate('support', `support:${user.id}`, [user.id]);
    return this.findOne(user, conversation.id);
  }

  /** Admin: open (or create) a user's support thread to contact them first. */
  async openSupportFor(admin: AuthUser, userId: number): Promise<ConversationView> {
    const target = await this.users.findByPk(userId);
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'admin') throw new BadRequestException('Admins have no support thread');
    const conversation = await this.getOrCreate('support', `support:${userId}`, [userId]);
    return this.findOne(admin, conversation.id);
  }

  /* ------------------------------------------------------------ messages */

  async listMessages(user: AuthUser, conversationId: number, { before, limit }: MessagesQueryDto) {
    await this.access(user, conversationId);
    const rows = await this.messages.findAll({
      where: { conversationId, ...(before ? { id: { [Op.lt]: before } } : {}) },
      order: [['id', 'DESC']],
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    return { items: rows.slice(0, limit).reverse().map(messageOf), hasMore };
  }

  async send(user: AuthUser, conversationId: number, rawBody: string): Promise<MessageView> {
    const body = typeof rawBody === 'string' ? rawBody.trim() : '';
    if (!body) throw new BadRequestException('Message is empty');
    if (body.length > MESSAGE_MAX_LENGTH) throw new BadRequestException(`Message is longer than ${MESSAGE_MAX_LENGTH} characters`);

    const access = await this.access(user, conversationId);
    const message = await this.sequelize.transaction(async (transaction) => {
      const created = await this.messages.create({ conversationId, senderId: user.id, body }, { transaction });
      const at = created.createdAt;
      // Sending counts as having read everything before it.
      await access.conversation.update(
        { lastMessageAt: at, ...(access.staff ? { staffReadAt: at } : {}) },
        { transaction },
      );
      if (access.participant) await access.participant.update({ lastReadAt: at }, { transaction });
      return created;
    });

    const view = messageOf(message);
    this.events.emit(this.rooms(access.conversation), 'message:new', view);
    return view;
  }

  async markRead(user: AuthUser, conversationId: number): Promise<{ conversationId: number; readAt: Date }> {
    const access = await this.access(user, conversationId);
    const readAt = new Date();
    if (access.participant) await access.participant.update({ lastReadAt: readAt });
    else await access.conversation.update({ staffReadAt: readAt });

    const payload = { conversationId, userId: user.id, staff: access.staff, readAt };
    this.events.emit(this.rooms(access.conversation), 'conversation:read', payload);
    return { conversationId, readAt };
  }

  /** Throws 404 unless the caller may see the conversation. */
  async access(user: AuthUser, conversationId: number): Promise<Access> {
    const conversation = await this.conversations.findByPk(conversationId, {
      include: [{ model: ConversationParticipant, include: [PEER_INCLUDE] }],
    });
    const participant = conversation?.participants?.find((p) => p.userId === user.id) ?? null;
    const staff = !participant && conversation?.type === 'support' && user.role === 'admin';
    if (!conversation || (!participant && !staff)) throw new NotFoundException('Conversation not found');
    return { conversation, participant, staff };
  }

  /** Socket rooms that should hear about activity in this conversation. */
  rooms(conversation: Conversation): string[] {
    const rooms = (conversation.participants ?? []).map((p) => userRoom(p.userId));
    if (conversation.type === 'support') rooms.push(ADMINS_ROOM);
    return rooms;
  }

  /* ------------------------------------------------------------ helpers */

  private async getOrCreate(type: ConversationType, key: string, userIds: number[]): Promise<Conversation> {
    const existing = await this.conversations.findOne({ where: { key } });
    if (existing) return existing;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        const created = await this.conversations.create({ type, key }, { transaction });
        await this.participants.bulkCreate(
          userIds.map((userId) => ({ conversationId: created.id, userId })),
          { transaction },
        );
        return created;
      });
    } catch (err) {
      // Both sides opened it at the same moment: use the one that won.
      if (err instanceof UniqueConstraintError) {
        const winner = await this.conversations.findOne({ where: { key } });
        if (winner) return winner;
      }
      throw err;
    }
  }

  private async views(rows: Conversation[], user: AuthUser): Promise<ConversationView[]> {
    if (!rows.length) return [];
    const ids = rows.map((c) => c.id);

    const last = await this.sequelize.query<{ id: number; conversation_id: number; sender_id: number; body: string; created_at: Date }>(
      `SELECT DISTINCT ON (conversation_id) id, conversation_id, sender_id, body, created_at
         FROM messages WHERE conversation_id IN (:ids)
        ORDER BY conversation_id, id DESC`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    );
    const lastBy = new Map(last.map((m) => [m.conversation_id, m]));

    const unreadRows = await this.sequelize.query<{ conversation_id: number; n: number }>(
      `SELECT m.conversation_id, count(*)::int AS n
         FROM messages m
         JOIN conversation_participants p ON p.conversation_id = m.conversation_id AND p.user_id = :me
        WHERE m.conversation_id IN (:ids) AND m.sender_id <> :me
          AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
        GROUP BY m.conversation_id`,
      { replacements: { ids, me: user.id }, type: QueryTypes.SELECT },
    );
    const unreadBy = new Map(unreadRows.map((r) => [r.conversation_id, r.n]));
    const staffUnread = user.role === 'admin' ? await this.staffUnread(ids) : new Map<number, number>();

    return rows.map((c) => {
      const mine = c.participants?.some((p) => p.userId === user.id);
      const other = c.participants?.find((p) => p.userId !== user.id)?.user;
      const m = lastBy.get(c.id);
      return {
        id: c.id,
        type: c.type,
        peer: other ? peerOf(other) : null,
        lastMessage: m ? { id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, body: m.body, createdAt: m.created_at } : null,
        lastMessageAt: c.lastMessageAt,
        unread: mine ? unreadBy.get(c.id) ?? 0 : staffUnread.get(c.id) ?? 0,
      };
    });
  }

  /** Support threads: customer messages newer than the admin team's read marker. */
  private async staffUnread(ids?: number[]): Promise<Map<number, number>> {
    const rows = await this.sequelize.query<{ conversation_id: number; n: number }>(
      `SELECT m.conversation_id, count(*)::int AS n
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         JOIN conversation_participants p ON p.conversation_id = c.id AND p.user_id = m.sender_id
        WHERE c.type = 'support' ${ids ? 'AND c.id IN (:ids)' : ''}
          AND (c.staff_read_at IS NULL OR m.created_at > c.staff_read_at)
        GROUP BY m.conversation_id`,
      { replacements: { ids: ids ?? [] }, type: QueryTypes.SELECT },
    );
    return new Map(rows.map((r) => [r.conversation_id, r.n]));
  }
}

function peerOf(u: User): ChatPeer {
  // Vietnamese order (family name first), like displayName() on the frontend.
  const name = [u.profile?.lastName, u.profile?.firstName].filter(Boolean).join(' ') || null;
  return { id: u.id, username: u.username, name, avatarUrl: u.profile?.avatarUrl ?? null, role: u.role };
}

function messageOf(m: Message): MessageView {
  return { id: m.id, conversationId: m.conversationId, senderId: m.senderId, body: m.body, createdAt: m.createdAt };
}
