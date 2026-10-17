import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { Badge } from 'antd';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, useAuth } from '@/redux';
import { useChatUnreadQuery, useConversationQuery } from '@/redux/api';
import { openChat, setChatOpen } from '@/redux/slices/uiSlice';
import { IconButton, Spinner } from '@/components/ui';
import ConversationList, { PeerAvatar } from './ConversationList';
import Thread from './Thread';
import { Fab, Head, Panel } from './styles';
import { peerName } from './util';

export { default as ChatSocketSync } from './ChatSocketSync';

/** Floating chat: a button with the unread badge, and a panel with the list or one conversation. */
export default function ChatWidget() {
  const dispatch = useAppDispatch();
  const { token, user } = useAuth();
  const { chatOpen, chatId } = useAppSelector((s) => s.ui);
  const reduce = useReducedMotion();
  const { data: unread } = useChatUnreadQuery(undefined, { skip: !token });
  // currentData, not data: data still holds the previous conversation while the next one loads,
  // and a quick Enter would then send into the wrong thread.
  const { currentData: conversation, isError } = useConversationQuery(chatId!, { skip: !token || chatId == null });

  if (!token || !user) return null;

  const count = unread?.count ?? 0;
  const close = () => dispatch(setChatOpen(false));
  const back = () => dispatch(openChat(null));
  const inThread = chatId != null;

  const title = !inThread ? 'TIN NHẮN' : conversation?.peer ? peerName(conversation.peer) : conversation ? 'HỖ TRỢ TỪ DỦ' : '…';
  const subtitle = !inThread
    ? `${count ? `${count} tin chưa đọc` : 'Trò chuyện với quán, bạn bè và đội ngũ Dủ'}`
    : conversation?.type === 'support'
      ? conversation.peer ? `@${conversation.peer.username} · yêu cầu hỗ trợ` : 'Đội ngũ Dủ trả lời bạn tại đây'
      : conversation?.peer ? `@${conversation.peer.username}` : '';

  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <Panel
            role="dialog"
            aria-label="Tin nhắn"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <Head>
              {inThread && (
                <IconButton onClick={back} aria-label="Quay lại danh sách" $anim="nudge" $hoverColor="#fff" style={{ color: 'var(--gold)' }}>
                  <ArrowLeft size={22} strokeWidth={2.8} />
                </IconButton>
              )}
              {inThread && conversation && <PeerAvatar peer={conversation.peer} size={36} />}
              <div className="title">
                <b>{title}</b>
                {subtitle && <small>{subtitle}</small>}
              </div>
              <IconButton onClick={close} aria-label="Đóng" $anim="wiggle" $hoverColor="#fff" style={{ color: 'var(--gold)' }}>
                <X size={24} strokeWidth={2.8} />
              </IconButton>
            </Head>

            {!inThread ? (
              <ConversationList onOpen={(id) => dispatch(openChat(id))} supportUnread={unread?.support ?? 0} />
            ) : conversation ? (
              <Thread key={conversation.id} conversation={conversation} />
            ) : isError ? (
              <div style={{ padding: 24, textAlign: 'center' }}>Không mở được cuộc trò chuyện này.</div>
            ) : (
              <Spinner />
            )}
          </Panel>
        )}
      </AnimatePresence>

      <Fab $open={chatOpen} onClick={() => dispatch(chatOpen ? setChatOpen(false) : openChat())} aria-label={count ? `Tin nhắn, ${count} chưa đọc` : 'Tin nhắn'} aria-expanded={chatOpen}>
        <Badge
          count={count}
          overflowCount={99}
          offset={[6, -6]}
          color="var(--red)"
          styles={{ indicator: { color: '#fff', boxShadow: '0 0 0 2px var(--edge)', fontFamily: 'var(--font)', fontWeight: 900 } }}
        >
          {chatOpen ? <X size={28} strokeWidth={2.8} color="var(--ink)" /> : <MessageCircle size={28} strokeWidth={2.6} color="var(--ink)" />}
        </Badge>
      </Fab>
    </>
  );
}
