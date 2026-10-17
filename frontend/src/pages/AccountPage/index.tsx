import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { App } from 'antd';
import { GUTTER } from '@/theme/tokens';
import { toast } from '@/lib/toast';
import { addressText, dateVN, displayName, fmt } from '@/lib/format';
import { useAppDispatch, useAuth } from '@/redux';
import { logout, setUser } from '@/redux/slices/authSlice';
import {
  errorMessage, useAddToCartMutation, useCancelOrderMutation, useClearCartMutation, useLazyOrderQuery, useMyStoresQuery, useOrderHistoryInfiniteQuery,
  useOrderQuery, useOrdersQuery, useRemoveAvatarMutation, useUploadAvatarMutation,
} from '@/redux/api';
import { setCartOpen } from '@/redux/slices/uiSlice';
import type { Order, OrderStatus } from '@/redux/types';
import { useCartSwitch, useFavoriteProducts } from '@/hooks/useShop';
import { useOnVisible } from '@/hooks/useOnVisible';
import DishCard from '@/components/DishCard';
import { Card, Container, Empty, FillImg, GreenButton, Grid3, InkButton, Muted, Photo, RedBand, Reveal, Section, Spinner, Split, Stack, StrokeHeading, SumRow } from '@/components/ui';
import AddressBook from './AddressBook';
import { Steps, Step, StatusStrip, Avatar, Name, Pill, HistoryRow, Tabs, AvatarWrap, AvatarAction, AvatarInitial } from './styles';

type Tab = 'orders' | 'addresses' | 'favorites' | 'stores';
const TABS: Tab[] = ['orders', 'addresses', 'favorites', 'stores'];

// Mirrors the API's limits (POST /me/avatar) so bad files fail before uploading.
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_MB = 2;

const STEPS = ['Đã nhận', 'Đang nấu', 'Đang giao', 'Đã tới'];
const STEP_OF: Record<OrderStatus, number> = { pending: 0, confirmed: 0, preparing: 1, ready: 1, delivering: 2, completed: 3, cancelled: -1 };
const LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ quán xác nhận', confirmed: 'Quán đã nhận đơn', preparing: 'Quán đang nấu', ready: 'Món đã xong, chờ shipper',
  delivering: 'Shipper đang tới', completed: 'Đã giao', cancelled: 'Đã huỷ',
};
const ROLE_LABEL: Record<string, string> = { admin: 'Quản trị viên', store_owner: 'Chủ quán', member: 'Thành viên' };
const STORE_STATUS: Record<string, string> = { pending: 'Chờ duyệt', active: 'Đang bán', inactive: 'Tạm nghỉ', suspended: 'Bị khoá' };
const STORE_ROLE: Record<string, string> = { owner: 'Người thêm', manager: 'Quản lý', staff: 'Nhân viên' };

function CurrentOrder({ id }: { id: number }) {
  const { modal } = App.useApp();
  const { data: o, isLoading } = useOrderQuery(id, { pollingInterval: 30_000 });
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  if (isLoading || !o) return <Spinner />;
  const step = STEP_OF[o.status];
  const items = o.storeOrders?.flatMap((so) => so.items ?? []) ?? [];
  const addr = o.deliveryAddress;
  // Returning the promise keeps the OK button spinning until the request settles.
  const doCancel = () => cancel(o.id).unwrap().then(() => toast('Đã huỷ đơn')).catch((e) => toast(errorMessage(e)));
  const confirmCancel = () => modal.confirm({
    title: 'Huỷ đơn?',
    content: `Bạn có chắc muốn huỷ đơn #DU-${o.id} không?`,
    okText: 'Huỷ đơn', cancelText: 'Giữ lại',
    okButtonProps: { danger: true },
    onOk: doCancel,
  });
  return (
    <Card $gap={16}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontWeight: 900, fontSize: 16 }}>#DU-{o.id}</span>
        <Muted>{dateVN(o.createdAt)}</Muted>
      </div>
      <Steps>
        {STEPS.map((label, i) => <Step key={label} $state={i === step ? 'now' : i < step ? 'done' : 'todo'}><span>{label}</span></Step>)}
      </Steps>
      <StatusStrip>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-text)' }}>
          {LABEL[o.status]}{o.delivery?.estimatedAt && ` — dự kiến ${new Date(o.delivery.estimatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
        </span>
        {addr && <Muted>{addressText(addr)}</Muted>}
        {o.note && <Muted style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Ghi chú: {o.note}</Muted>}
      </StatusStrip>
      <Stack $gap={8}>
        {items.map((it) => <SumRow key={it.id}><span>{it.quantity}× {it.productName}</span><span>{fmt(it.subtotal)}</span></SumRow>)}
        <SumRow $size={13} style={{ color: 'var(--muted)' }}><span>Phí giao</span><span style={{ fontWeight: 400 }}>{fmt(o.deliveryFee)}</span></SumRow>
        <SumRow $bold $divider><span>Tổng</span><span style={{ color: 'var(--red-text)' }}>{fmt(o.total)}</span></SumRow>
      </Stack>
      {(o.status === 'pending' || o.status === 'confirmed') && (
        <InkButton
          disabled={cancelling}
          onClick={confirmCancel}
          style={{ alignSelf: 'flex-start' }}
        >
          {cancelling ? 'Đang huỷ…' : 'Huỷ đơn'}
        </InkButton>
      )}
    </Card>
  );
}

export default function AccountPage() {
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, user } = useAuth();
  const favs = useFavoriteProducts();
  // In-progress orders (few at a time) load at once; finished ones page in as the list is scrolled.
  const { data: activeOrders, isLoading } = useOrdersQuery({ scope: 'active' }, { skip: !token });
  const historyQuery = useOrderHistoryInfiniteQuery(undefined, { skip: !token });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = historyQuery;
  const moreHistory = useOnVisible<HTMLDivElement>(() => { fetchNextPage(); }, hasNextPage && !isFetchingNextPage && !historyQuery.isError);
  const [loadOrder] = useLazyOrderQuery();
  const [addToCart] = useAddToCartMutation();
  const [clearCart] = useClearCartMutation();
  const confirmSwitch = useCartSwitch();
  const [reordering, setReordering] = useState<number | null>(null);
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((t) => t === params.get('tab')) ?? 'orders';
  const { data: myStores, isLoading: storesLoading } = useMyStoresQuery(undefined, { skip: !token });
  const switchTab = (t: Tab) => setParams(t === 'orders' ? {} : { tab: t }, { replace: true });
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: removing }] = useRemoveAvatarMutation();

  useEffect(() => { if (!token) navigate('/login?next=/account', { replace: true }); }, [token, navigate]);
  if (!token || !user) return <Spinner />;

  // Every order still in progress gets its own tracking card (a customer can have several at once);
  // history is what's finished (completed or cancelled). An order finishing between page loads
  // shifts the offsets, so the same order can come back on two pages: show it once.
  const active = activeOrders?.items ?? [];
  const history = [...new Map(historyQuery.data?.pages.flatMap((p) => p.items).map((o) => [o.id, o])).values()];

  // Orders are single-store, like the cart (orders placed before that rule may span several
  // stores and can't be reordered in one go). Refilling the cart may replace another store's dishes.
  const reorderStore = (o: Order) => (o.storeOrders?.length === 1 ? o.storeOrders[0].store : undefined);
  const reorder = async (o: Order) => {
    const store = reorderStore(o);
    if (!store) return;
    const replace = await confirmSwitch(store);
    if (replace === null) return;
    setReordering(o.id);
    try {
      const detail = await loadOrder(o.id, true).unwrap();
      const items = detail.storeOrders?.flatMap((so) => so.items ?? []).filter((it) => it.productId) ?? [];
      if (replace) await clearCart().unwrap();
      let failed = 0;
      // One at a time: repeated dishes merge into one cart line.
      for (const it of items) await addToCart({ productId: it.productId!, quantity: it.quantity }).unwrap().catch(() => { failed += 1; });
      toast(failed ? `Đã thêm ${items.length - failed}/${items.length} món — có món đã hết hoặc ngừng bán` : `Đã thêm đơn #DU-${o.id} vào giỏ`);
      if (failed < items.length) dispatch(setCartOpen(true));
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setReordering(null);
    }
  };

  const onPickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return toast('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) return toast(`Ảnh tối đa ${AVATAR_MAX_MB}MB thôi nha`);
    try {
      dispatch(setUser(await uploadAvatar(file).unwrap()));
      toast('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast(errorMessage(err));
    }
  };
  const confirmRemoveAvatar = () => modal.confirm({
    title: 'Xoá ảnh đại diện?',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => removeAvatar().unwrap()
      .then((u) => { dispatch(setUser(u)); toast('Đã xoá ảnh đại diện'); })
      .catch((err) => toast(errorMessage(err))),
  });

  const summary = (o: Order) => o.storeOrders?.map((so) => so.store?.name).filter(Boolean).join(', ') || 'Đơn hàng';
  const doSignOut = () => { dispatch(logout()); toast('Đã đăng xuất'); navigate('/login'); };
  const signOut = () => modal.confirm({
    title: 'Đăng xuất?',
    content: 'Bạn có muốn đăng xuất khỏi tài khoản này không?',
    okText: 'Đăng xuất', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: doSignOut,
  });

  return (
    <div>
      <RedBand clip="polygon(0 0,100% 0,100% 100%,0 calc(100% - 110px))" pad={`30px ${GUTTER} 150px`}>
        <Container style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px clamp(24px,4vw,48px)' }}>
          <AvatarWrap>
            <Avatar kind="pop">
              {user.profile?.avatarUrl
                ? <FillImg src={user.profile.avatarUrl} alt={displayName(user)} $fit="cover" />
                : <AvatarInitial aria-label={displayName(user)}>{(user.profile?.firstName || displayName(user)).charAt(0).toUpperCase()}</AvatarInitial>}
              {uploading && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.45)' }}><Spinner color="var(--gold)" label="Đang tải ảnh…" /></div>}
            </Avatar>
            <input ref={fileInput} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={onPickAvatar} />
            <AvatarAction $side="right" $anim="pop" title="Đổi ảnh đại diện" aria-label="Đổi ảnh đại diện" disabled={uploading || removing} onClick={() => fileInput.current?.click()}>
              <Camera size={20} />
            </AvatarAction>
            {user.profile?.avatarUrl && (
              <AvatarAction $side="left" $anim="wiggle" title="Xoá ảnh đại diện" aria-label="Xoá ảnh đại diện" disabled={uploading || removing} onClick={confirmRemoveAvatar}>
                <Trash2 size={18} />
              </AvatarAction>
            )}
          </AvatarWrap>
          <Stack $gap={8} style={{ flex: '1 1 300px' }}>
            <Name>{displayName(user).toUpperCase()}</Name>
            <p style={{ margin: 0, color: 'var(--gold)', fontWeight: 800, fontSize: 'clamp(16px,2.6vw,34px)', wordBreak: 'break-all', fontFamily: 'var(--font)' }}>{user.email.toUpperCase()}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <Pill as="button" $variant="gold" onClick={() => switchTab('favorites')} style={{ cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 800 }}>{favs.count} món yêu thích</Pill>
              <Pill $variant="outline">Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</Pill>
              {ROLE_LABEL[user.role] && <Pill $variant="cream">{ROLE_LABEL[user.role]}</Pill>}
              {user.role === 'admin' && <Pill as={Link} to="/admin" $variant="gold" style={{ textDecoration: 'none' }}>Trang quản trị →</Pill>}
              {user.role === 'store_owner' && <Pill as={Link} to="/my-store" $variant="gold" style={{ textDecoration: 'none' }}>Quán của tôi →</Pill>}
              <InkButton $round $hover="gold" onClick={signOut} style={{ background: 'var(--ink)', padding: '6px 12px' }}>Đăng xuất</InkButton>
            </div>
          </Stack>
        </Container>
      </RedBand>

      <Section>
        <Container>
          <Stack $gap={28}>
            <Tabs<Tab>
              size="large"
              value={tab}
              onChange={switchTab}
              options={[
                { label: 'ĐƠN HÀNG', value: 'orders' },
                { label: 'ĐỊA CHỈ', value: 'addresses' },
                { label: `YÊU THÍCH (${favs.count})`, value: 'favorites' },
                { label: `QUÁN ĐÃ THÊM (${myStores?.length ?? 0})`, value: 'stores' },
              ]}
            />
            {tab === 'orders' ? (
              <Split $gap="clamp(32px,5vw,64px)">
                <Stack $gap={18}>
                  <Reveal kind="head"><StrokeHeading as="h2" $size="clamp(28px,3.4vw,44px)" $align="left">ĐƠN HÀNG</StrokeHeading></Reveal>
                  {isLoading ? <Spinner /> : active.length ? (
                    <Stack $gap={18}>{active.map((o) => <CurrentOrder key={o.id} id={o.id} />)}</Stack>
                  ) : (
                    <Empty title="Chưa có đơn đang giao" hint="Đói bụng chưa? Chọn vài món nè." action={<GreenButton as={Link} to="/menu" $size={16}>XEM THỰC ĐƠN</GreenButton>} />
                  )}
                </Stack>
                <Stack $gap={18}>
                  <Reveal kind="head"><StrokeHeading as="h2" $size="clamp(28px,3.4vw,44px)" $align="left">LỊCH SỬ</StrokeHeading></Reveal>
                  {historyQuery.isLoading ? <Spinner /> : !history.length ? <Empty title="Chưa có lịch sử" hint="Các đơn đã giao sẽ nằm ở đây." /> : (
                    <Stack $gap={12}>
                      {history.map((o, i) => (
                        <Reveal key={o.id} kind="card" delay={Math.min(i, 8) * 0.06}>
                          <HistoryRow>
                            <Stack $gap={3}>
                              <Muted>{dateVN(o.createdAt)} · #DU-{o.id} · {LABEL[o.status]}</Muted>
                              <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{summary(o)}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--red-text)' }}>{fmt(o.total)}</span>
                            </Stack>
                            {reorderStore(o) && (
                              <InkButton $hover="dim" onClick={() => reorder(o)} disabled={reordering !== null}>
                                {reordering === o.id ? 'Đang thêm…' : 'Đặt lại'}
                              </InkButton>
                            )}
                          </HistoryRow>
                        </Reveal>
                      ))}
                      <div ref={moreHistory} />
                      {isFetchingNextPage && <Spinner />}
                    </Stack>
                  )}
                </Stack>
              </Split>
            ) : tab === 'addresses' ? (
              <AddressBook />
            ) : tab === 'stores' ? (
              storesLoading ? <Spinner /> : !myStores?.length ? (
                <Empty title="Chưa thêm quán nào" hint="Giới thiệu quán ruột của bạn lên chợ xóm nhé." action={<GreenButton as={Link} to="/market#add-store" $size={16}>THÊM CỬA HÀNG</GreenButton>} />
              ) : (
                <Grid3>
                  {myStores.map(({ store, role }, i) => (
                    <Reveal key={store.id} kind="card" delay={Math.min(i, 8) * 0.06}>
                      <Card $gap={10}>
                        <div style={{ position: 'relative', aspectRatio: '4/3' }}><Photo src={store.coverUrl ?? store.logoUrl} alt={store.name} /></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--red-text)', lineHeight: 1.2 }}>{store.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', color: store.status === 'active' ? 'var(--green-text)' : 'var(--red-text)' }}>{STORE_STATUS[store.status] ?? store.status}</span>
                        </div>
                        <Muted>{STORE_ROLE[role] ?? role} · {dateVN(store.createdAt)}</Muted>
                        {store.status === 'active' && <Link to={`/market?store=${store.id}`} style={{ fontSize: 11, fontWeight: 700 }}>Xem trên chợ →</Link>}
                      </Card>
                    </Reveal>
                  ))}
                </Grid3>
              )
            ) : favs.isLoading ? <Spinner /> : !favs.items.length ? (
              <Empty title="Chưa có món yêu thích" hint="Bấm vào trái tim trên món bạn thích để lưu lại." action={<GreenButton as={Link} to="/menu" $size={16}>XEM THỰC ĐƠN</GreenButton>} />
            ) : (
              <Grid3 $phone2>{favs.items.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}</Grid3>
            )}
          </Stack>
        </Container>
      </Section>
    </div>
  );
}
