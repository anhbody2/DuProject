import { useEffect } from 'react';
import { useAppDispatch, useAuth, store } from '@/redux';
import { baseApi, mergeMessages } from '@/redux/api';
import type { ChatMessage } from '@/redux/types';
import { connectChat, disconnectChat } from '@/lib/chatSocket';
import { toast } from '@/lib/toast';
import { logout } from '@/redux/slices/authSlice';

const LISTS = ['Conversations', 'ChatUnread', 'SupportInbox'] as const;

/**
 * Keeps the socket connected while logged in and folds its events into the RTK Query cache:
 * new messages are appended to the open thread, and the lists / unread badge refetch.
 */
export default function ChatSocketSync() {
  const dispatch = useAppDispatch();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const socket = connectChat(token);
    let connectedOnce = false;

    // After a reconnect, anything sent while we were offline is only on the server: refetch.
    socket.on('connect', () => {
      if (connectedOnce) dispatch(baseApi.util.invalidateTags([...LISTS, 'ChatMessages']));
      connectedOnce = true;
    });

    // The handshake re-checks the account (ChatGateway.authenticate). A rejected session
    // means the token expired or the account was suspended: sign out like the REST client does.
    socket.on('connect_error', (err: Error) => {
      if (/^(Invalid or expired token|Account is not active)$/.test(err.message)) {
        toast('Phiên đăng nhập đã hết hoặc tài khoản đã bị khoá');
        dispatch(logout());
      }
    });

    socket.on('message:new', (m: ChatMessage) => {
      dispatch(mergeMessages(m.conversationId, [m]));
      dispatch(baseApi.util.invalidateTags([...LISTS]));
      const { ui, auth } = store.getState();
      const watching = ui.chatOpen && ui.chatId === m.conversationId;
      if (m.senderId !== auth.user?.id && !watching) toast('Bạn có tin nhắn mới');
    });

    socket.on('conversation:read', () => dispatch(baseApi.util.invalidateTags([...LISTS])));

    return () => disconnectChat();
  }, [token, dispatch]);

  return null;
}
