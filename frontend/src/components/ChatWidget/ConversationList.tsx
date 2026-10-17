import { useEffect, useState } from 'react';
import { Avatar, Input } from 'antd';
import { LifeBuoy, Search } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useAuth } from '@/redux';
import {
  errorMessage,
  useConversationsQuery,
  useOpenDirectChatMutation,
  useOpenSupportChatMutation,
  useSearchChatUsersQuery,
  useSupportInboxQuery,
} from '@/redux/api';
import type { ChatPeer, Conversation } from '@/redux/types';
import { Empty, Muted, Spinner } from '@/components/ui';
import { useDebounced } from '@/hooks/useDebounced';
import { Dot, Row, Scroll, SearchBox, SectionLabel, Tabs } from './styles';
import { chatTime, peerName } from './util';

export function PeerAvatar({ peer, size = 44 }: { peer: ChatPeer | null; size?: number }) {
  if (!peer) return <Avatar size={size} shape="square" style={{ background: 'var(--red)', flex: 'none' }} icon={<LifeBuoy size={size / 2} />} />;
  return (
    <Avatar size={size} shape="square" src={peer.avatarUrl || undefined} style={{ background: 'var(--green)', fontWeight: 900, flex: 'none' }}>
      {peerName(peer).charAt(0).toUpperCase()}
    </Avatar>
  );
}

function ConversationRow({ c, onOpen }: { c: Conversation; onOpen: (id: number) => void }) {
  const { user } = useAuth();
  const m = c.lastMessage;
  // In a support thread seen by an admin, anything not from the customer came from the team.
  const mine = m && (c.type === 'support' && user?.role === 'admin' ? m.senderId !== c.peer?.id : m.senderId === user?.id);
  return (
    <Row $unread={c.unread > 0} onClick={() => onOpen(c.id)}>
      <PeerAvatar peer={c.peer} />
      <div style={{ minWidth: 0 }}>
        <div className="name">{c.peer ? peerName(c.peer) : 'Hỗ trợ từ Dủ'}</div>
        <div className="preview">{m ? `${mine ? 'Bạn: ' : ''}${m.body}` : 'Chưa có tin nhắn'}</div>
      </div>
      <div className="meta">
        {c.lastMessageAt && <span>{chatTime(c.lastMessageAt)}</span>}
        {c.unread > 0 && <Dot>{c.unread > 99 ? '99+' : c.unread}</Dot>}
      </div>
    </Row>
  );
}

/** Search box + results: pick a user to open a direct conversation with. */
function PeopleSearch({ onOpen, children }: { onOpen: (id: number) => void; children: React.ReactNode }) {
  const [text, setText] = useState('');
  const q = useDebounced(text.trim(), 300);
  const { data: people, isFetching } = useSearchChatUsersQuery(q, { skip: !q });
  const [openDirect, opening] = useOpenDirectChatMutation();

  const start = (p: ChatPeer) =>
    openDirect(p.id).unwrap()
      .then((c) => { setText(''); onOpen(c.id); })
      .catch((e) => toast(errorMessage(e)));

  return (
    <>
      <SearchBox>
        <Input
          allowClear
          prefix={<Search size={16} />}
          placeholder="Tìm người theo tên đăng nhập"
          value={text}
          maxLength={50}
          onChange={(e) => setText(e.target.value)}
          aria-label="Tìm người để nhắn tin"
        />
      </SearchBox>
      <Scroll>
        {q ? (
          isFetching && !people ? <Spinner /> : !people?.length ? (
            <Empty title="Không tìm thấy ai" hint="Thử gõ phần đầu tên đăng nhập." />
          ) : (
            <>
              <SectionLabel>NHẮN TIN MỚI</SectionLabel>
              {people.map((p) => (
                <Row key={p.id} onClick={() => start(p)} disabled={opening.isLoading}>
                  <PeerAvatar peer={p} />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{peerName(p)}</div>
                    <div className="preview">@{p.username}</div>
                  </div>
                  <span />
                </Row>
              ))}
            </>
          )
        ) : children}
      </Scroll>
    </>
  );
}

function MyConversations({ onOpen }: { onOpen: (id: number) => void }) {
  const { user } = useAuth();
  const { data = [], isLoading } = useConversationsQuery();
  const [openSupport, openingSupport] = useOpenSupportChatMutation();
  const isAdmin = user?.role === 'admin';
  // Customers always see their support thread pinned first, even before writing to it.
  const support = data.find((c) => c.type === 'support');
  const others = data.filter((c) => c !== support);

  const goSupport = () =>
    support ? onOpen(support.id) : openSupport().unwrap().then((c) => onOpen(c.id)).catch((e) => toast(errorMessage(e)));

  return (
    <PeopleSearch onOpen={onOpen}>
      {!isAdmin && (
        support ? <ConversationRow c={support} onOpen={onOpen} /> : (
          <Row onClick={goSupport} disabled={openingSupport.isLoading}>
            <PeerAvatar peer={null} />
            <div style={{ minWidth: 0 }}>
              <div className="name">Hỗ trợ từ Dủ</div>
              <div className="preview">Hỏi đội ngũ Dủ về đơn hàng, tài khoản…</div>
            </div>
            <span />
          </Row>
        )
      )}
      {isLoading ? <Spinner /> : others.map((c) => <ConversationRow key={c.id} c={c} onOpen={onOpen} />)}
      {!isLoading && !others.length && (
        <div style={{ padding: 20, textAlign: 'center' }}><Muted>Tìm tên đăng nhập ở trên để bắt đầu trò chuyện, hoặc bấm “Nhắn quán” ở Chợ Xóm.</Muted></div>
      )}
    </PeopleSearch>
  );
}

function SupportInbox({ onOpen }: { onOpen: (id: number) => void }) {
  const { data, isLoading } = useSupportInboxQuery();
  if (isLoading) return <Spinner />;
  if (!data?.items.length) return <Scroll><Empty title="Chưa có yêu cầu hỗ trợ" hint="Tin nhắn của khách gửi đội ngũ Dủ sẽ hiện ở đây." /></Scroll>;
  return <Scroll>{data.items.map((c) => <ConversationRow key={c.id} c={c} onOpen={onOpen} />)}</Scroll>;
}

/** Conversation list. Admins also get the shared support inbox in a second tab. */
export default function ConversationList({ onOpen, supportUnread }: { onOpen: (id: number) => void; supportUnread: number }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'mine' | 'support'>('mine');
  if (user?.role !== 'admin') return <MyConversations onOpen={onOpen} />;
  return (
    <>
      <Tabs role="tablist">
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>TIN NHẮN</button>
        <button role="tab" aria-selected={tab === 'support'} onClick={() => setTab('support')}>
          HỖ TRỢ{supportUnread > 0 && ` (${supportUnread})`}
        </button>
      </Tabs>
      {tab === 'mine' ? <MyConversations onOpen={onOpen} /> : <SupportInbox onOpen={onOpen} />}
    </>
  );
}
