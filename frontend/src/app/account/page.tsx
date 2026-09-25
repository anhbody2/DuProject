'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { dateVN, displayName, fmt } from '@/lib/format';
import { useAppDispatch, useAuth } from '@/store';
import { logout } from '@/store/authSlice';
import {
  errorMessage, useAddToCartMutation, useCancelOrderMutation, useLazyOrderQuery, useOrderQuery, useOrdersQuery,
} from '@/store/api';
import type { Order, OrderStatus } from '@/store/types';
import { useFavoriteProducts } from '@/hooks/useShop';
import { Empty, Reveal, Spinner, strokeHead } from '@/components/ui';

const STEPS = ['Đã nhận', 'Đang nấu', 'Đang giao', 'Đã tới'];
const STEP_OF: Record<OrderStatus, number> = { pending: 0, confirmed: 0, preparing: 1, ready: 1, delivering: 2, completed: 3, cancelled: -1 };
const LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ quán xác nhận', confirmed: 'Quán đã nhận đơn', preparing: 'Quán đang nấu', ready: 'Món đã xong, chờ shipper',
  delivering: 'Shipper đang tới', completed: 'Đã giao', cancelled: 'Đã huỷ',
};
const ACTIVE = (o: Order) => o.status !== 'completed' && o.status !== 'cancelled';

function CurrentOrder({ id }: { id: number }) {
  const { data: o, isLoading } = useOrderQuery(id, { pollingInterval: 30_000 });
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  if (isLoading || !o) return <Spinner />;
  const step = STEP_OF[o.status];
  const items = o.storeOrders?.flatMap((so) => so.items ?? []) ?? [];
  const addr = o.deliveryAddress;

  return (
    <div style={sx('background:#fff;padding:20px;box-shadow:0 6px 0 var(--line);display:flex;flex-direction:column;gap:16px')}>
      <div style={sx('display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px')}>
        <span style={sx('font-weight:900;font-size:16px')}>#DU-{o.id}</span>
        <span style={sx('font-size:12px;color:var(--muted);font-weight:500')}>{dateVN(o.createdAt)}</span>
      </div>
      <div style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:6px')}>
        {STEPS.map((label, i) => (
          <div key={label} style={sx('display:flex;flex-direction:column;gap:6px')}>
            <div style={{ height: 6, borderRadius: 3, background: i <= step ? 'var(--green)' : 'var(--line)', transition: 'background .4s' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? 'var(--green)' : i < step ? 'var(--ink)' : '#a89a78' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={sx('background:var(--cream);padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap')}>
        <span style={sx('font-size:13px;font-weight:700;color:var(--green)')}>
          {LABEL[o.status]}{o.delivery?.estimatedAt && ` — dự kiến ${new Date(o.delivery.estimatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
        </span>
        {addr && <span style={sx('font-size:12px;color:var(--muted)')}>{[addr.addressLine, addr.district].filter(Boolean).join(', ')}</span>}
      </div>
      <div style={sx('display:flex;flex-direction:column;gap:8px;font-size:14px')}>
        {items.map((it) => (
          <div key={it.id} style={sx('display:flex;justify-content:space-between;gap:12px')}><span>{it.quantity}× {it.productName}</span><span style={{ fontWeight: 700 }}>{fmt(it.subtotal)}</span></div>
        ))}
        <div style={sx('display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--muted)')}><span>Phí giao</span><span>{fmt(o.deliveryFee)}</span></div>
        <div style={sx('display:flex;justify-content:space-between;gap:12px;border-top:2px dashed var(--line);padding-top:8px;font-weight:900')}><span>Tổng</span><span style={{ color: 'var(--red)' }}>{fmt(o.total)}</span></div>
      </div>
      {(o.status === 'pending' || o.status === 'confirmed') && (
        <button
          disabled={cancelling}
          onClick={() => cancel(o.id).unwrap().then(() => toast('Đã huỷ đơn')).catch((e) => toast(errorMessage(e)))}
          className="hv-bg-red"
          style={sx('all:unset;cursor:pointer;align-self:flex-start;background:var(--ink);color:var(--cream);font-size:12px;font-weight:800;padding:9px 14px')}
        >
          {cancelling ? 'Đang huỷ…' : 'Huỷ đơn'}
        </button>
      )}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user, hydrated } = useAuth();
  const favs = useFavoriteProducts();
  const { data: orders, isLoading } = useOrdersQuery(undefined, { skip: !token });
  const [loadOrder] = useLazyOrderQuery();
  const [addToCart] = useAddToCartMutation();
  const [reordering, setReordering] = useState<number | null>(null);

  useEffect(() => { if (hydrated && !token) router.replace('/login?next=/account'); }, [hydrated, token, router]);
  if (!hydrated || !user) return <Spinner />;

  const list = orders?.items ?? [];
  const current = list.find(ACTIVE);
  const history = list.filter((o) => o !== current);

  const reorder = async (o: Order) => {
    setReordering(o.id);
    try {
      const detail = await loadOrder(o.id, true).unwrap();
      const items = detail.storeOrders?.flatMap((so) => so.items ?? []).filter((it) => it.productId) ?? [];
      const results = await Promise.allSettled(items.map((it) => addToCart({ productId: it.productId!, quantity: it.quantity }).unwrap()));
      const failed = results.filter((r) => r.status === 'rejected').length;
      toast(failed ? `Đã thêm ${items.length - failed}/${items.length} món — có món đã hết hoặc ngừng bán` : `Đã thêm đơn #DU-${o.id} vào giỏ`);
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setReordering(null);
    }
  };

  const summary = (o: Order) => o.storeOrders?.map((so) => so.store?.name).filter(Boolean).join(', ') || 'Đơn hàng';

  return (
    <div>
      <div style={sx('filter:drop-shadow(0 7px 0 var(--brown));position:relative;z-index:2')}>
        <section className="red-texture" style={sx('padding:30px clamp(16px,4vw,56px) 150px;clip-path:polygon(0 0,100% 0,100% 100%,0 calc(100% - 110px))')}>
          <div style={sx('max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:24px clamp(24px,4vw,48px)')}>
            <Reveal kind="pop" style={sx('position:relative;width:clamp(140px,22vw,260px);aspect-ratio:1/1;border-radius:50%;background:var(--green);overflow:hidden')}>
              <Image src={user.profile?.avatarUrl || '/images/user-avatar.webp'} alt={displayName(user)} fill sizes="260px" unoptimized={!!user.profile?.avatarUrl} style={{ objectFit: 'cover' }} />
            </Reveal>
            <div style={sx('display:flex;flex-direction:column;gap:8px;min-width:0;flex:1 1 300px')}>
              <h1 style={sx('margin:0;color:var(--gold);font-weight:900;font-size:clamp(40px,6vw,80px);line-height:1.05')}>{displayName(user).toUpperCase()}</h1>
              <p style={sx('margin:0;color:var(--gold);font-weight:800;font-size:clamp(18px,2.6vw,34px);word-break:break-all')}>{user.email.toUpperCase()}</p>
              <div style={sx('display:flex;flex-wrap:wrap;gap:10px;margin-top:10px')}>
                <span style={sx('background:var(--gold);color:var(--ink);font-size:12px;font-weight:800;padding:6px 12px;border-radius:20px')}>{favs.count} món yêu thích</span>
                <span style={sx('border:2px solid var(--gold);color:var(--gold);font-size:12px;font-weight:800;padding:4px 12px;border-radius:20px')}>
                  Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                </span>
                {user.role !== 'customer' && <span style={sx('border:2px solid var(--cream);color:var(--cream);font-size:12px;font-weight:800;padding:4px 12px;border-radius:20px')}>{user.role === 'admin' ? 'Quản trị viên' : 'Chủ quán'}</span>}
                <button onClick={() => { dispatch(logout()); toast('Đã đăng xuất'); router.push('/login'); }} className="hv-gold" style={sx('all:unset;cursor:pointer;background:var(--ink);color:var(--cream);font-size:12px;font-weight:800;padding:6px 12px;border-radius:20px')}>Đăng xuất</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section style={sx('padding:40px clamp(16px,4vw,56px) 90px')}>
        <div style={sx('max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:clamp(32px,5vw,64px);align-items:start')}>
          <div style={sx('display:flex;flex-direction:column;gap:18px')}>
            <Reveal kind="head"><h2 style={sx(`margin:0;font-weight:900;font-size:clamp(28px,3.4vw,44px);${strokeHead}`)}>ĐƠN HÀNG</h2></Reveal>
            {isLoading ? <Spinner /> : current ? <CurrentOrder id={current.id} /> : (
              <Empty title="Chưa có đơn đang giao" hint="Đói bụng chưa? Chọn vài món nè." action={<Link href="/menu" style={sx('background:var(--green);color:var(--gold);font-weight:900;font-size:16px;padding:10px 20px')}>XEM THỰC ĐƠN</Link>} />
            )}
          </div>
          <div style={sx('display:flex;flex-direction:column;gap:18px')}>
            <Reveal kind="head"><h2 style={sx(`margin:0;font-weight:900;font-size:clamp(28px,3.4vw,44px);${strokeHead}`)}>LỊCH SỬ</h2></Reveal>
            {isLoading ? <Spinner /> : !history.length ? <Empty title="Chưa có lịch sử" hint="Các đơn đã giao sẽ nằm ở đây." /> : (
              <div style={sx('display:flex;flex-direction:column;gap:12px')}>
                {history.map((o, i) => (
                  <Reveal key={o.id} kind="card" delay={Math.min(i, 8) * 0.06}>
                    <div style={sx('background:#fff;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;align-items:center;box-shadow:0 4px 0 var(--line)')}>
                      <div style={sx('display:flex;flex-direction:column;gap:3px;min-width:0')}>
                        <span style={sx('font-size:12px;color:var(--muted);font-weight:500')}>{dateVN(o.createdAt)} · #DU-{o.id} · {LABEL[o.status]}</span>
                        <span style={sx('font-size:14px;font-weight:700;line-height:1.3')}>{summary(o)}</span>
                        <span style={sx('font-size:13px;font-weight:800;color:var(--red)')}>{fmt(o.total)}</span>
                      </div>
                      <button onClick={() => reorder(o)} disabled={reordering !== null} className="hv-dim" style={sx('all:unset;cursor:pointer;background:var(--ink);color:var(--cream);font-size:12px;font-weight:800;padding:9px 14px;white-space:nowrap')}>
                        {reordering === o.id ? 'Đang thêm…' : 'Đặt lại'}
                      </button>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
