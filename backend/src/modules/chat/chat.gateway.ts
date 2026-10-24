import { HttpException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AuthUser, JwtPayload } from '../../common/types/auth-user';
import { User } from '../../database/models';
import { ADMINS_ROOM, ChatEvents, userRoom } from './chat.events';
import { ChatService } from './chat.service';

/** Same rule as app.enableCors: CORS_ORIGIN (comma-separated) or any origin. Read per request, after .env is loaded. */
function corsOrigin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
  const allowed = process.env.CORS_ORIGIN?.split(',');
  cb(null, !allowed || !origin || allowed.includes(origin));
}

type Ack<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/**
 * Realtime chat. Served under /api/socket.io so the Vite dev proxy and nginx forward
 * it with the rest of /api. Clients authenticate with `auth: { token }` in the handshake.
 *
 * Server -> client: `message:new` (MessageView), `conversation:read`, `typing`.
 * Client -> server (acked with `{ ok, data | status, error }`): `message:send`, `conversation:read`, `typing`.
 */
@WebSocketGateway({ path: '/api/socket.io', cors: { origin: corsOrigin, credentials: true } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chat: ChatService,
    private readonly events: ChatEvents,
    private readonly jwt: JwtService,
    @InjectModel(User) private readonly users: typeof User,
  ) {}

  afterInit(server: Server) {
    this.events.bind(server);
    // Handshake auth: the same checks as JwtAuthGuard (valid JWT, user still exists and is active).
    server.use((socket, next) => {
      this.authenticate(socket.handshake.auth?.token)
        .then((user) => {
          socket.data.user = user;
          next();
        })
        .catch((err: Error) => next(err));
    });
  }

  handleConnection(socket: Socket) {
    const user = socket.data.user as AuthUser;
    void socket.join(userRoom(user.id));
    if (user.role === 'admin') void socket.join(ADMINS_ROOM);
  }

  @SubscribeMessage('message:send')
  send(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId?: unknown; body?: unknown }) {
    return this.run(socket, (user) => this.chat.send(user, toId(data?.conversationId), String(data?.body ?? '')));
  }

  @SubscribeMessage('conversation:read')
  read(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId?: unknown }) {
    return this.run(socket, (user) => this.chat.markRead(user, toId(data?.conversationId)));
  }

  /** Relayed to the other side only; nothing is stored. */
  @SubscribeMessage('typing')
  typing(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId?: unknown }) {
    return this.run(socket, async (user) => {
      const { conversation } = await this.chat.access(user, toId(data?.conversationId));
      const payload = { conversationId: conversation.id, userId: user.id };
      socket.to(this.chat.rooms(conversation)).except(userRoom(user.id)).emit('typing', payload);
      return payload;
    });
  }

  /** Re-checks the account (it may have been suspended since connecting) and turns errors into an ack. */
  private async run<T>(socket: Socket, fn: (user: AuthUser) => Promise<T>): Promise<Ack<T>> {
    try {
      const user = await this.reload((socket.data.user as AuthUser).id);
      if (!user) {
        socket.disconnect(true);
        return { ok: false, status: 401, error: 'Session is no longer valid' };
      }
      return { ok: true, data: await fn(user) };
    } catch (err) {
      if (err instanceof HttpException) return { ok: false, status: err.getStatus(), error: err.message };
      this.logger.error(err);
      return { ok: false, status: 500, error: 'Internal server error' };
    }
  }

  private async authenticate(token: unknown): Promise<AuthUser> {
    if (typeof token !== 'string' || !token) throw new Error('Missing token');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new Error('Invalid or expired token');
    }
    const user = await this.reload(payload.sub);
    if (!user) throw new Error('Account is not active');
    return user;
  }

  private async reload(id: number): Promise<AuthUser | null> {
    const user = await this.users.findByPk(id);
    if (!user || user.status !== 'active') return null;
    return { id: user.id, username: user.username, email: user.email, role: user.role };
  }
}

/** 0 never exists, so a malformed id ends as a 404 from ChatService.access. */
function toId(value: unknown): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}
