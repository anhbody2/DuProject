import { useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/redux/api/axiosClient';
import type { ChatMessage } from '@/redux/types';

/**
 * The one Socket.IO connection of this tab. The API serves it at `<API_URL>/socket.io`
 * (i.e. /api/socket.io), so it goes through the same Vite / nginx proxy as REST.
 * `ChatSocketSync` connects it while logged in; components read it with `useChatSocket()`.
 */
let socket: Socket | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function endpoint() {
  // API_URL is relative ('/api') by default, or absolute when VITE_API_URL is set.
  const url = new URL(API_URL, window.location.origin);
  return { origin: url.origin, path: `${url.pathname.replace(/\/$/, '')}/socket.io` };
}

export function connectChat(token: string): Socket {
  disconnectChat();
  const { origin, path } = endpoint();
  socket = io(origin, { path, auth: { token } });
  notify();
  return socket;
}

export function disconnectChat() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  notify();
}

export function useChatSocket(): Socket | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => socket,
  );
}

type Ack<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/** Sends over the socket when it is connected; resolves null when it isn't (caller falls back to REST). */
export async function socketSend(conversationId: number, body: string): Promise<ChatMessage | null> {
  if (!socket?.connected) return null;
  const ack = (await socket.timeout(8000).emitWithAck('message:send', { conversationId, body })) as Ack<ChatMessage>;
  if (!ack.ok) throw { status: ack.status, data: { message: ack.error } };
  return ack.data;
}

/** Tells the other side we're typing (the caller throttles it). */
export function socketTyping(conversationId: number) {
  if (socket?.connected) socket.emit('typing', { conversationId });
}
