import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

/** Socket room of one user (every tab / device they are connected from). */
export const userRoom = (userId: number) => `user:${userId}`;
/** Every connected admin; receives all support-thread traffic. */
export const ADMINS_ROOM = 'admins';

/**
 * Pushes chat events to connected sockets. ChatGateway binds the Socket.IO server
 * at start-up; ChatService uses this so REST and socket writes broadcast the same way.
 */
@Injectable()
export class ChatEvents {
  private server: Server | null = null;

  bind(server: Server) {
    this.server = server;
  }

  emit(rooms: string[], event: string, payload: unknown) {
    if (this.server && rooms.length) this.server.to(rooms).emit(event, payload);
  }
}
