'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { DELIVERY_FEE_PER_STORE, DISTRICTS, fmt } from '@/lib/format';
import { useAuth } from '@/store';
import { errorMessage, useAddressesQuery, useCartQuery, useCheckoutMutation, useCreateAddressMutation } from '@/store/api';
import type { PaymentMethod } from '@/store/types';
import { Cta, Empty, Spinner, strokeHead } from '@/components/ui';

const field = 'font-size:15px;padding:10px 12px;border:2px solid var(--ink);background:var(--cream);border-radius:0;outline:none;width:100%';
const label = 'display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800';
const card = 'background:#fff;padding:20px;box-shadow:0 6px 0 var(--line);display:flex;flex-direction:column;gap:14px';
const METHODS: { id: PaymentMethod; name: string }[] = [
  { id: 'cash', name: 'Tiền mặt khi nhận món' },
  { id: 'bank_transfer', name: 'Chuyển khoản' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user, hydrated } = useAuth();
  const { data: cart, isLoading } = useCartQuery(undefined, { skip: !token });
  const { data: addresses = [], isLoading: loadingAddr } = useAddressesQuery(undefined, { skip: !token });
  const [createAddress, { isLoading: saving }] = useCreateAddressMutation();
  const [checkout, { isLoading: placing }] = useCheckoutMutation();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [adding, setAdding] = useState(false);
  const [a, setA] = useState({ recipientName: '', phone: '', addressLine: '', district: 'Quận 1' });

  useEffect(() => { if (hydrated && !token) router.replace('/login?next=/checkout'); }, [hydrated, token, router]);
  useEffect(() => {
    if (addressId == null && addresses.length) setAddressId((addresses.find((x) => x.isDefault) ?? addresses[0]).id);
    if (!loadingAddr && !addresses.length) setAdding(true);
  }, [addresses, addressId, loadingAddr]);
  useEffect(() => {
    // Prefill the recipient with the account's own name and phone.
    if (user) setA((s) => ({ ...s, recipientName: s.recipientName || [user.profile?.lastName, user.profile?.firstName].filter(Boolean).join(' '), phone: s.phone || user.profile?.phone || '' }));
  }, [user]);

  if (!hydrated || isLoading) return <Spinner />;
  const lines = (cart?.items ?? []).filter((l) => l.available);
  if (!lines.length) {
    return <Empty title="Chưa có món để thanh toán" hint="Giỏ hàng đang trống hoặc các món đã hết." action={<Link href="/menu" style={sx('background:var(--green);color:var(--gold);font-weight:900;font-size:16px;padding:10px 20px')}>XEM THỰC ĐƠN</Link>} />;
  }

  const storeCount = new Set(lines.map((l) => l.product.storeId)).size;
  const fee = storeCount * DELIVERY_FEE_PER_STORE;

  const saveAddress = async () => {
    if (!a.recipientName.trim() || !a.phone.trim() || !a.addressLine.trim()) return toast('Điền đủ tên, số điện thoại và địa chỉ nhé');
    try {
      const created = await createAddress({ ...a, city: 'Hồ Chí Minh', isDefault: !addresses.length }).unwrap();
      setAddressId(created.id);
      setAdding(false);
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const place = async () => {
    if (!addressId) return toast('Chọn địa chỉ giao hàng nhé');
    try {
      const order = await checkout({
        deliveryAddressId: addressId, paymentMethod: method,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      }).unwrap();
      toast(`Đặt hàng thành công! Đơn #DU-${order.id}`);
      router.push('/account');
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  return (
    <section style={sx('padding:40px clamp(16px,4vw,56px) 90px')}>
      <div style={sx('max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:24px')}>
        <h1 style={sx(`margin:0;text-align:center;font-weight:900;font-size:clamp(30px,4vw,52px);${strokeHead}`)}>THANH TOÁN</h1>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:clamp(24px,4vw,48px);align-items:start')}>
          <div style={sx('display:flex;flex-direction:column;gap:24px')}>
            <div style={sx(card)}>
              <span style={sx('font-weight:900;font-size:18px;color:var(--green)')}>GIAO TỚI</span>
              {addresses.map((x) => (
                <label key={x.id} style={sx('display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-size:14px;line-height:1.4')}>
                  <input type="radio" name="addr" checked={addressId === x.id} onChange={() => setAddressId(x.id)} style={sx('width:18px;height:18px;accent-color:var(--green);margin-top:2px')} />
                  <span><b>{x.recipientName}</b> · {x.phone}<br /><span style={{ color: 'var(--muted)' }}>{[x.addressLine, x.ward, x.district, x.city].filter(Boolean).join(', ')}</span></span>
                </label>
              ))}
              {adding ? (
                <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;border-top:2px dashed var(--line);padding-top:12px')}>
                  <label style={sx(label)}>NGƯỜI NHẬN<input value={a.recipientName} onChange={(e) => setA({ ...a, recipientName: e.target.value })} autoComplete="name" style={sx(field)} /></label>
                  <label style={sx(label)}>SỐ ĐIỆN THOẠI<input type="tel" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} autoComplete="tel" style={sx(field)} /></label>
                  <label style={{ ...sx(label), gridColumn: '1/-1' }}>ĐỊA CHỈ<input value={a.addressLine} onChange={(e) => setA({ ...a, addressLine: e.target.value })} placeholder="Số nhà, tên đường" autoComplete="street-address" style={sx(field)} /></label>
                  <label style={sx(label)}>QUẬN
                    <select value={a.district} onChange={(e) => setA({ ...a, district: e.target.value })} style={sx(field)}>{Object.keys(DISTRICTS).map((d) => <option key={d}>{d}</option>)}</select>
                  </label>
                  <div style={sx('display:flex;gap:8px;align-items:end')}>
                    <button onClick={saveAddress} disabled={saving} className="hv-bg-green" style={sx('all:unset;cursor:pointer;background:var(--ink);color:var(--gold);font-size:13px;font-weight:800;padding:11px 14px')}>{saving ? 'Đang lưu…' : 'Lưu địa chỉ'}</button>
                    {addresses.length > 0 && <button onClick={() => setAdding(false)} style={sx('all:unset;cursor:pointer;font-size:13px;font-weight:700;text-decoration:underline')}>Huỷ</button>}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdding(true)} style={sx('all:unset;cursor:pointer;font-size:13px;font-weight:800;color:var(--red);text-decoration:underline;align-self:flex-start')}>+ Thêm địa chỉ mới</button>
              )}
            </div>

            <div style={sx(card)}>
              <span style={sx('font-weight:900;font-size:18px;color:var(--green)')}>THANH TOÁN BẰNG</span>
              {METHODS.map((m) => (
                <label key={m.id} style={sx('display:flex;gap:10px;align-items:center;cursor:pointer;font-size:14px;font-weight:700')}>
                  <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} style={sx('width:18px;height:18px;accent-color:var(--green)')} />{m.name}
                </label>
              ))}
            </div>
          </div>

          <div style={sx(card)}>
            <span style={sx('font-weight:900;font-size:18px;color:var(--green)')}>ĐƠN CỦA BẠN · {storeCount} QUÁN</span>
            {lines.map((l) => (
              <div key={l.id} style={sx('display:flex;justify-content:space-between;gap:12px;font-size:14px')}>
                <span>{l.quantity}× {l.product.name} <span style={{ color: 'var(--muted)', fontSize: 12 }}>· {l.product.store?.name}</span></span>
                <span style={{ fontWeight: 700 }}>{fmt(l.lineTotal)}</span>
              </div>
            ))}
            <div style={sx('display:flex;justify-content:space-between;font-size:14px;border-top:2px dashed var(--line);padding-top:10px')}><span>Tạm tính</span><span style={{ fontWeight: 700 }}>{fmt(cart!.subtotal)}</span></div>
            <div style={sx('display:flex;justify-content:space-between;font-size:14px')}><span>Phí giao ({storeCount} × {fmt(DELIVERY_FEE_PER_STORE)})</span><span style={{ fontWeight: 700 }}>{fmt(fee)}</span></div>
            <div style={sx('display:flex;justify-content:space-between;font-size:20px;font-weight:900')}><span>Tổng</span><span style={{ color: 'var(--red)' }}>{fmt(cart!.subtotal + fee)}</span></div>
            <Cta onClick={place} disabled={placing || !addressId} rotate={0} style={{ marginTop: 8 }}>{placing ? 'ĐANG ĐẶT…' : 'ĐẶT MÓN'}</Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
