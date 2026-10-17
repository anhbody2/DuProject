'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { DELIVERY_FEE_PER_STORE, fmt, imageOf } from '@/lib/format';
import { useAppDispatch, useAppSelector, useAuth } from '@/store';
import { errorMessage, useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/store/api';
import { setCartOpen } from '@/store/uiSlice';
import { Empty, Photo, Spinner } from './ui';

const qtyBtn = 'all:unset;cursor:pointer;width:32px;height:32px;display:grid;place-items:center;font-weight:900;font-size:18px';
const greenBtn = 'all:unset;cursor:pointer;background:var(--green);color:var(--gold);font-weight:900;font-size:18px;padding:10px 22px;outline:2px dashed var(--cream);outline-offset:-6px';

export default function CartDrawer() {
  const open = useAppSelector((s) => s.ui.cartOpen);
  const { token } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: cart, isLoading } = useCartQuery(undefined, { skip: !token });
  const [update, updating] = useUpdateCartItemMutation();
  const [remove, removing] = useRemoveCartItemMutation();
  const busy = updating.isLoading || removing.isLoading;

  const close = () => dispatch(setCartOpen(false));
  const go = (href: string) => { close(); router.push(href); };
  const run = (p: Promise<unknown>) => p.catch((e) => toast(errorMessage(e)));

  const lines = cart?.items ?? [];
  const available = lines.filter((l) => l.available);
  const storeCount = new Set(available.map((l) => l.product.storeId)).size;
  const fee = storeCount * DELIVERY_FEE_PER_STORE;
  const subtotal = cart?.subtotal ?? 0;
  const count = cart?.itemCount ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <motion.div onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ position: 'absolute', inset: 0, background: 'rgba(43,29,42,.55)' }} />
          <motion.aside
            initial={{ x: '105%' }} animate={{ x: 0 }} exit={{ x: '105%' }} transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            style={sx('position:absolute;top:0;right:0;height:100%;width:min(420px,100%);background:var(--cream);border-left:4px solid var(--ink);display:flex;flex-direction:column;box-shadow:-10px 0 0 rgba(153,36,40,.9)')}
          >
            <div className="red-texture" style={sx('padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
              <div style={sx('display:flex;align-items:baseline;gap:10px')}>
                <span style={sx('font-weight:900;font-size:28px;color:var(--gold);text-shadow:0 3px 0 var(--brown)')}>GIỎ HÀNG</span>
                <span style={sx('font-size:13px;font-weight:800;color:var(--cream)')}>{count} món</span>
              </div>
              <button onClick={close} title="Đóng" className="hv-wiggle-white" style={sx('all:unset;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;color:var(--gold)')}><X size={24} strokeWidth={2.8} /></button>
            </div>

            {storeCount > 0 && (
              <div style={sx('padding:14px 20px;border-bottom:2px dashed var(--line);font-size:12px;font-weight:800;color:var(--green)')}>
                {storeCount} quán · phí giao {fmt(DELIVERY_FEE_PER_STORE)} mỗi quán
              </div>
            )}

            <div style={sx('flex:1;overflow-y:auto;padding:8px 20px')}>
              {!token ? (
                <Empty title="Bạn chưa đăng nhập" hint="Đăng nhập để giữ giỏ hàng và đặt món." action={<button onClick={() => go('/login')} className="hv-green2" style={sx(greenBtn)}>ĐĂNG NHẬP</button>} />
              ) : isLoading ? (
                <Spinner />
              ) : !lines.length ? (
                <Empty title="Giỏ đang trống" hint="Chọn vài món cho bữa trưa nè." action={<button onClick={() => go('/menu')} className="hv-green2" style={sx(greenBtn)}>XEM THỰC ĐƠN</button>} />
              ) : (
                lines.map((c) => (
                  <div key={c.id} style={{ ...sx('display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;padding:14px 0;border-bottom:2px dashed var(--line)'), opacity: c.available ? 1 : 0.55 }}>
                    <div style={sx('width:64px;height:64px;background:#fff')}><Photo src={imageOf(c.product)} alt="" sizes="64px" /></div>
                    <div style={sx('display:flex;flex-direction:column;gap:8px;min-width:0')}>
                      <div style={sx('display:flex;justify-content:space-between;gap:8px;align-items:flex-start')}>
                        <div style={sx('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                          <span style={sx('font-size:14px;font-weight:800;line-height:1.3')}>{c.product.name}</span>
                          <span style={sx('font-size:11px;color:var(--muted)')}>{c.product.store?.name}{!c.available && ' · Tạm hết, không tính tiền'}</span>
                        </div>
                        <button onClick={() => run(remove(c.id).unwrap())} disabled={busy} title="Bỏ món" className="hv-wiggle-red" style={sx('all:unset;cursor:pointer;color:var(--muted);display:grid')}><Trash2 size={18} /></button>
                      </div>
                      <div style={sx('display:flex;justify-content:space-between;align-items:center;gap:8px')}>
                        <div style={sx('display:flex;align-items:center;border:2px solid var(--ink);background:#fff')}>
                          <button disabled={busy} onClick={() => run(c.quantity <= 1 ? remove(c.id).unwrap() : update({ itemId: c.id, quantity: c.quantity - 1 }).unwrap())} className="hv-bg-gold" style={sx(qtyBtn)}>−</button>
                          <span style={sx('min-width:28px;text-align:center;font-weight:900;font-size:14px')}>{c.quantity}</span>
                          <button disabled={busy || c.quantity >= 99} onClick={() => run(update({ itemId: c.id, quantity: c.quantity + 1 }).unwrap())} className="hv-bg-gold" style={sx(qtyBtn)}>+</button>
                        </div>
                        <span style={sx('font-size:15px;font-weight:900;color:var(--red)')}>{fmt(c.lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {token && lines.length > 0 && (
              <div style={sx('border-top:3px solid var(--ink);padding:16px 20px 20px;display:flex;flex-direction:column;gap:8px;background:#fff')}>
                <div style={sx('display:flex;justify-content:space-between;font-size:14px')}><span>Tạm tính</span><span style={{ fontWeight: 700 }}>{fmt(subtotal)}</span></div>
                <div style={sx('display:flex;justify-content:space-between;font-size:14px')}><span>Phí giao (dự kiến)</span><span style={{ fontWeight: 700 }}>{fee ? fmt(fee) : '—'}</span></div>
                <div style={sx('display:flex;justify-content:space-between;font-size:18px;font-weight:900;border-top:2px dashed var(--line);padding-top:10px;margin-top:2px')}><span>Tổng</span><span style={{ color: 'var(--red)' }}>{fmt(subtotal + fee)}</span></div>
                <button onClick={() => go('/checkout')} disabled={!available.length} className="hv-bright" style={{ ...sx('all:unset;cursor:pointer;text-align:center;color:var(--gold);font-weight:900;font-size:22px;padding:14px;margin-top:6px;outline:2px dashed var(--cream);outline-offset:-7px'), background: available.length ? 'var(--green)' : '#a89a78' }}>THANH TOÁN</button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
