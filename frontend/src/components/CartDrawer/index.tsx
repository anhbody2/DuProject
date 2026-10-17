import { useNavigate } from 'react-router';
import { Drawer } from 'antd';
import { Trash2, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { DELIVERY_FEE_PER_STORE, fmt, imageOf, storeHref } from '@/lib/format';
import { useAppDispatch, useAppSelector, useAuth } from '@/redux';
import { errorMessage, useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/redux/api';
import { setCartOpen } from '@/redux/slices/uiSlice';
import { Empty, GreenButton, IconButton, Muted, Photo, Spinner, Stack, SumRow, TextButton } from '@/components/ui';
import { Head, FeeNote, Lines, Line, Qty, Foot } from './styles';

export default function CartDrawer() {
  const open = useAppSelector((s) => s.ui.cartOpen);
  const { token } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCartQuery(undefined, { skip: !token });
  const [update, updating] = useUpdateCartItemMutation();
  const [remove, removing] = useRemoveCartItemMutation();
  const busy = updating.isLoading || removing.isLoading;

  const close = () => dispatch(setCartOpen(false));
  const go = (href: string) => { close(); navigate(href); };
  const run = (p: Promise<unknown>) => p.catch((e) => toast(errorMessage(e)));

  const lines = cart?.items ?? [];
  const available = lines.filter((l) => l.available);
  // A cart (and so an order) holds one store's dishes: one delivery fee.
  const store = lines.length ? cart?.store : null;
  const fee = available.length ? DELIVERY_FEE_PER_STORE : 0;
  const subtotal = cart?.subtotal ?? 0;
  const count = cart?.itemCount ?? 0;

  return (
    <Drawer
      open={open}
      onClose={close}
      placement="right"
      size="min(420px, 100vw)"
      closable={false}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
        section: { borderLeft: '4px solid var(--edge)', boxShadow: '-10px 0 0 rgba(153,36,40,.9)' },
      }}
    >
      <Head>
        <div><b>GIỎ HÀNG</b><small>{count} món</small></div>
        <IconButton onClick={close} aria-label="Đóng" $anim="wiggle" $hoverColor="#fff" style={{ color: 'var(--gold)' }}><X size={24} strokeWidth={2.8} /></IconButton>
      </Head>

      {token && store && (
        <FeeNote>
          Đặt từ <button type="button" onClick={() => go(storeHref(store.id))} style={{ all: 'unset', cursor: 'pointer', fontWeight: 900, textDecoration: 'underline' }}>{store.name}</button> · phí giao {fmt(DELIVERY_FEE_PER_STORE)}
        </FeeNote>
      )}

      <Lines>
        {!token ? (
          <Empty title="Bạn chưa đăng nhập" hint="Đăng nhập để giữ giỏ hàng và đặt món." action={<GreenButton onClick={() => go('/login')}>ĐĂNG NHẬP</GreenButton>} />
        ) : isLoading ? (
          <Spinner />
        ) : !lines.length ? (
          <Empty title="Giỏ đang trống" hint="Chọn vài món cho bữa trưa nè." action={<GreenButton onClick={() => go('/menu')}>XEM THỰC ĐƠN</GreenButton>} />
        ) : (
          lines.map((c) => (
            <Line key={c.id} $off={!c.available}>
              <div style={{ width: 64, height: 64, background: 'var(--surface)' }}><Photo src={imageOf(c.product)} alt="" /></div>
              <Stack $gap={8}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <Stack $gap={2}>
                    <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>{c.product.name}</span>
                    {!!c.options?.length && <Muted $size={12}>{c.options.map((o) => o.name).join(' · ')}</Muted>}
                    {!c.available && <Muted $size={11}>Tạm hết, không tính tiền</Muted>}
                  </Stack>
                  <IconButton onClick={() => run(remove(c.id).unwrap())} disabled={busy} aria-label="Bỏ món" title="Bỏ món" $anim="wiggle" $hoverColor="var(--red-text)" style={{ color: 'var(--muted)', width: 28, height: 28 }}>
                    <Trash2 size={18} />
                  </IconButton>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Qty>
                    <button disabled={busy} aria-label="Bớt" onClick={() => run(c.quantity <= 1 ? remove(c.id).unwrap() : update({ itemId: c.id, quantity: c.quantity - 1 }).unwrap())}>−</button>
                    <span>{c.quantity}</span>
                    <button disabled={busy || c.quantity >= 99} aria-label="Thêm" onClick={() => run(update({ itemId: c.id, quantity: c.quantity + 1 }).unwrap())}>+</button>
                  </Qty>
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--red-text)' }}>{fmt(c.lineTotal)}</span>
                </div>
              </Stack>
            </Line>
          ))
        )}
      </Lines>

      {token && lines.length > 0 && (
        <Foot>
          <SumRow><span>Tạm tính</span><span>{fmt(subtotal)}</span></SumRow>
          <SumRow><span>Phí giao (dự kiến)</span><span>{fee ? fmt(fee) : '—'}</span></SumRow>
          <SumRow $size={18} $bold $divider style={{ marginTop: 2 }}><span>Tổng</span><span style={{ color: 'var(--red-text)' }}>{fmt(subtotal + fee)}</span></SumRow>
          {store && <TextButton type="button" onClick={() => go(storeHref(store.id))} style={{ alignSelf: 'center', fontSize: 13 }}>+ Thêm món của {store.name}</TextButton>}
          <GreenButton $size={22} $block onClick={() => go('/checkout')} disabled={!available.length} style={{ marginTop: 6 }}>THANH TOÁN</GreenButton>
        </Foot>
      )}
    </Drawer>
  );
}
