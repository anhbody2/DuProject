import type { ChatPeer } from '@/redux/types';

export const peerName = (p: ChatPeer) => p.name || p.username;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** 14:05 today, "Hôm qua", or 03/09 for older. */
export function chatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, new Date(now.getTime() - 86_400_000))) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export const clock = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Divider label between days in a thread. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return 'Hôm nay';
  if (sameDay(d, new Date(now.getTime() - 86_400_000))) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}
