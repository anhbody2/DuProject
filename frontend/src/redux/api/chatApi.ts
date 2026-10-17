import { baseApi } from './baseApi';
import type { ChatMessage, ChatMessagesPage, ChatPeer, Conversation, Paginated } from '../types';

/** Anything that changes a conversation's preview, order or unread count. */
const LISTS = ['Conversations', 'ChatUnread', 'SupportInbox'] as const;

/**
 * Chat over REST. Live updates arrive through the socket (see `lib/chatSocket.ts` and
 * `ChatSocketSync`), which appends to the `chatMessages` cache and invalidates the lists.
 */
export const chatApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    conversations: b.query<Conversation[], void>({
      query: () => '/chat/conversations',
      providesTags: ['Conversations'],
    }),
    conversation: b.query<Conversation, number>({
      query: (id) => `/chat/conversations/${id}`,
      providesTags: ['Conversations'],
    }),
    /** Admin inbox of support threads. */
    supportInbox: b.query<Paginated<Conversation>, { page?: number } | void>({
      query: (p) => ({ url: '/chat/support', params: { page: p?.page, limit: 50 } }),
      providesTags: ['SupportInbox'],
    }),
    chatUnread: b.query<{ count: number; support: number }, void>({
      query: () => '/chat/unread',
      providesTags: ['ChatUnread'],
    }),
    /** Latest page; older pages are prepended by `loadOlderMessages`. */
    chatMessages: b.query<ChatMessagesPage, number>({
      query: (id) => ({ url: `/chat/conversations/${id}/messages`, params: { limit: 30 } }),
      providesTags: (_r, _e, id) => [{ type: 'ChatMessages', id }],
    }),
    sendMessage: b.mutation<ChatMessage, { conversationId: number; body: string }>({
      query: ({ conversationId, body }) => ({ url: `/chat/conversations/${conversationId}/messages`, method: 'POST', data: { body } }),
      invalidatesTags: [...LISTS],
    }),
    markChatRead: b.mutation<unknown, number>({
      query: (id) => ({ url: `/chat/conversations/${id}/read`, method: 'POST' }),
      invalidatesTags: [...LISTS],
    }),
    searchChatUsers: b.query<ChatPeer[], string>({
      query: (q) => ({ url: '/chat/users', params: { q } }),
    }),
    openDirectChat: b.mutation<Conversation, number>({
      query: (userId) => ({ url: '/chat/conversations/direct', method: 'POST', data: { userId } }),
    }),
    openStoreChat: b.mutation<Conversation, number>({
      query: (storeId) => ({ url: `/chat/conversations/store/${storeId}`, method: 'POST' }),
    }),
    openSupportChat: b.mutation<Conversation, void>({
      query: () => ({ url: '/chat/conversations/support', method: 'POST' }),
    }),
    /** Admin: contact a user through their support thread. */
    openSupportFor: b.mutation<Conversation, number>({
      query: (userId) => ({ url: `/chat/support/${userId}`, method: 'POST' }),
    }),
  }),
});

export const {
  useConversationsQuery,
  useConversationQuery,
  useSupportInboxQuery,
  useChatUnreadQuery,
  useChatMessagesQuery,
  useSendMessageMutation,
  useMarkChatReadMutation,
  useSearchChatUsersQuery,
  useOpenDirectChatMutation,
  useOpenStoreChatMutation,
  useOpenSupportChatMutation,
  useOpenSupportForMutation,
} = chatApi;

/** Adds messages to a cached thread, skipping ids it already has, and keeps it in id order. */
export const mergeMessages = (conversationId: number, incoming: ChatMessage[], hasMore?: boolean) =>
  chatApi.util.updateQueryData('chatMessages', conversationId, (draft) => {
    const seen = new Set(draft.items.map((m) => m.id));
    const fresh = incoming.filter((m) => !seen.has(m.id));
    if (fresh.length) draft.items = [...draft.items, ...fresh].sort((a, b) => a.id - b.id);
    if (hasMore !== undefined) draft.hasMore = hasMore;
  });
