import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Input } from 'antd';
import { SendHorizontal } from 'lucide-react';
import { toast } from '@/lib/toast';
import { socketSend, socketTyping, useChatSocket } from '@/lib/chatSocket';
import { useAppDispatch, useAuth } from '@/redux';
import {
  errorMessage,
  http,
  mergeMessages,
  useChatMessagesQuery,
  useMarkChatReadMutation,
  useSendMessageMutation,
} from '@/redux/api';
import type { ChatMessagesPage, Conversation } from '@/redux/types';
import { Empty, Spinner } from '@/components/ui';
import { Bubble, Composer, DayLabel, Messages, Older, SendButton, Sender, Typing } from './styles';
import { clock, dayLabel, peerName } from './util';

const MAX = 2000;

export default function Thread({ conversation }: { conversation: Conversation }) {
  const id = conversation.id;
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const socket = useChatSocket();
  const { currentData: data, isLoading, isError } = useChatMessagesQuery(id);
  const [sendRest] = useSendMessageMutation();
  const [markRead] = useMarkChatReadMutation();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number | null>(null);
  const stickToBottom = useRef(true);
  const lastTypingSent = useRef(0);

  // Admins answer support threads as a team: every non-customer message is "ours".
  const staffView = conversation.type === 'support' && user?.role === 'admin';
  const isMine = (senderId: number) => (staffView ? senderId !== conversation.peer?.id : senderId === user?.id);
  const theirLabel = conversation.peer ? peerName(conversation.peer) : 'Dủ hỗ trợ';

  const items = data?.items ?? [];
  const last = items[items.length - 1];

  // Mark read when opening, and whenever a message from the other side lands while it's open.
  useEffect(() => {
    if (!last || !isMine(last.senderId) || conversation.unread > 0) markRead(id);
  }, [id, last?.id]);

  // Keep the view pinned: to the bottom for new messages, in place when older ones are prepended.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prevHeight.current != null) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    } else if (stickToBottom.current || (last && isMine(last.senderId))) {
      el.scrollTop = el.scrollHeight;
    }
  }, [items.length]);

  // "Typing…" from the other side, cleared after 3 s of silence or when their message arrives.
  useEffect(() => {
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout>;
    const onTyping = (p: { conversationId: number; userId: number }) => {
      if (p.conversationId !== id || isMine(p.userId)) return;
      setPeerTyping(true);
      clearTimeout(timer);
      timer = setTimeout(() => setPeerTyping(false), 3000);
    };
    socket.on('typing', onTyping);
    return () => { socket.off('typing', onTyping); clearTimeout(timer); };
  }, [socket, id]);
  useEffect(() => setPeerTyping(false), [last?.id]);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (!items.length) return;
    setLoadingOlder(true);
    try {
      const res = await http.get<ChatMessagesPage>(`/chat/conversations/${id}/messages`, { params: { before: items[0].id, limit: 30 } });
      prevHeight.current = listRef.current?.scrollHeight ?? null;
      dispatch(mergeMessages(id, res.data.items, res.data.hasMore));
    } catch {
      toast('Không tải được tin nhắn cũ');
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      // Socket first (instant); REST when the socket is down. Either way the message is merged once.
      const message = (await socketSend(id, body).catch((err) => {
        if (err?.status) throw err; // the server refused it: don't retry over REST
        return null;
      })) ?? (await sendRest({ conversationId: id, body }).unwrap());
      dispatch(mergeMessages(id, [message]));
      setText('');
      stickToBottom.current = true;
    } catch (err) {
      toast(errorMessage(err, 'Chưa gửi được, thử lại nhé'));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const onChange = (value: string) => {
    setText(value);
    const now = Date.now();
    if (value.trim() && now - lastTypingSent.current > 2500) {
      lastTypingSent.current = now;
      socketTyping(id);
    }
  };

  return (
    <>
      <Messages ref={listRef} onScroll={onScroll} aria-live="polite">
        {isLoading ? <Spinner /> : isError ? (
          <Empty title="Không mở được cuộc trò chuyện" hint="Thử lại sau nhé." />
        ) : !items.length ? (
          <Empty title="Chưa có tin nhắn" hint={conversation.type === 'support' && !staffView ? 'Đội ngũ Dủ sẽ trả lời bạn sớm nhất.' : 'Gửi lời chào đầu tiên nào!'} />
        ) : (
          <>
            {data?.hasMore && <Older onClick={loadOlder} disabled={loadingOlder}>{loadingOlder ? 'Đang tải…' : 'Xem tin cũ hơn'}</Older>}
            {items.map((m, i) => {
              const prev = items[i - 1];
              const next = items[i + 1];
              const mine = isMine(m.senderId);
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const groupStart = newDay || !prev || isMine(prev.senderId) !== mine;
              const tail = !next || isMine(next.senderId) !== mine;
              // In the admin view, several admins may answer: name the other ones.
              const label = staffView && mine && m.senderId !== user?.id ? 'Admin khác' : !mine ? theirLabel : null;
              return (
                <Fragment key={m.id}>
                  {newDay && <DayLabel>{dayLabel(m.createdAt)}</DayLabel>}
                  {groupStart && label && <Sender $mine={mine}>{label}</Sender>}
                  <Bubble $mine={mine} $tail={tail}>
                    {m.body}
                    {tail && <time dateTime={m.createdAt}>{clock(m.createdAt)}</time>}
                  </Bubble>
                </Fragment>
              );
            })}
          </>
        )}
      </Messages>
      <Typing>{peerTyping && `${theirLabel} đang nhập…`}</Typing>
      <Composer onSubmit={send}>
        <Input.TextArea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập tin nhắn… (Shift+Enter để xuống dòng)"
          autoSize={{ minRows: 1, maxRows: 5 }}
          maxLength={MAX}
          aria-label="Nội dung tin nhắn"
          autoFocus
        />
        <SendButton type="submit" disabled={!text.trim() || sending} aria-label="Gửi" title="Gửi">
          <SendHorizontal size={20} strokeWidth={2.6} />
        </SendButton>
      </Composer>
    </>
  );
}
