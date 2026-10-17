import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Radio } from 'antd';
import { toast } from '@/lib/toast';
import { DELIVERY_FEE_PER_STORE, ORDER_NOTE_MAX, addressText, fmt, storeHref } from '@/lib/format';
import { useAuth } from '@/redux';
import { errorMessage, useAddressesQuery, useCartQuery, useCheckoutMutation } from '@/redux/api';
import type { PaymentMethod } from '@/redux/types';
import { Card, CardTitle, Container, Cta, Empty, GreenButton, Muted, Section, Spinner, Split, Stack, StrokeHeading, SumRow, TextButton } from '@/components/ui';
import AddressForm from '@/components/AddressPicker/AddressForm';
import { Choices, NewAddress, NoteBox } from './styles';

const METHODS: { id: PaymentMethod; name: string }[] = [
  { id: 'cash', name: 'Tiền mặt khi nhận món' },
  { id: 'bank_transfer', name: 'Chuyển khoản' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { data: cart, isLoading } = useCartQuery(undefined, { skip: !token });
  const { data: addresses = [], isLoading: loadingAddr } = useAddressesQuery(undefined, { skip: !token });
  const [checkout, { isLoading: placing }] = useCheckoutMutation();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => { if (!token) navigate('/login?next=/checkout', { replace: true }); }, [token, navigate]);
  useEffect(() => {
    if (addressId == null && addresses.length) setAddressId((addresses.find((x) => x.isDefault) ?? addresses[0]).id);
    if (!loadingAddr && !addresses.length) setAdding(true);
  }, [addresses, addressId, loadingAddr]);

  if (!token || isLoading) return <Spinner />;
  const lines = (cart?.items ?? []).filter((l) => l.available);
  if (!lines.length) {
    return <Empty title="Chưa có món để thanh toán" hint="Giỏ hàng đang trống hoặc các món đã hết." action={<GreenButton as={Link} to="/menu" $size={16}>XEM THỰC ĐƠN</GreenButton>} />;
  }

  // One store per cart and per order: one delivery fee.
  const store = cart?.store;
  const fee = DELIVERY_FEE_PER_STORE;

  const place = async () => {
    if (!addressId) return toast('Chọn địa chỉ giao hàng nhé');
    try {
      const order = await checkout({
        deliveryAddressId: addressId, paymentMethod: method,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, optionIds: (l.options ?? []).map((o) => o.id) })),
      }).unwrap();
      toast(`Đặt hàng thành công! Đơn #DU-${order.id}`);
      navigate('/account');
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  return (
    <Section>
      <Container>
        <Stack $gap={24}>
          <StrokeHeading>THANH TOÁN</StrokeHeading>
          <Split>
            <Stack $gap={24}>
              <Card>
                <CardTitle>GIAO TỚI</CardTitle>
                {addresses.length > 0 && (
                  <Choices value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                    {addresses.map((x) => (
                      <Radio key={x.id} value={x.id}>
                        <b>{x.recipientName}</b> · {x.phone}<br />
                        <Muted $size={14}>{x.label && <b>{x.label} · </b>}{addressText(x)}</Muted>
                      </Radio>
                    ))}
                  </Choices>
                )}
                {adding ? (
                  <NewAddress>
                    <AddressForm
                      isFirst={!addresses.length}
                      onSaved={(created) => { setAddressId(created.id); setAdding(false); }}
                      onCancel={addresses.length ? () => setAdding(false) : undefined}
                    />
                  </NewAddress>
                ) : (
                  <TextButton onClick={() => setAdding(true)} style={{ alignSelf: 'flex-start' }}>+ Thêm địa chỉ mới</TextButton>
                )}
              </Card>

              <Card>
                <CardTitle>THANH TOÁN BẰNG</CardTitle>
                <Choices value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => <Radio key={m.id} value={m.id} style={{ fontWeight: 700 }}>{m.name}</Radio>)}
                </Choices>
              </Card>

              <Card>
                <CardTitle>GHI CHÚ CHO QUÁN</CardTitle>
                <NoteBox
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ít cay, không hành, gọi trước khi giao… (không bắt buộc)"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  maxLength={ORDER_NOTE_MAX}
                  showCount
                />
              </Card>
            </Stack>

            <Card>
              <CardTitle>ĐƠN CỦA BẠN{store && <> · <Link to={storeHref(store.id)} style={{ color: 'inherit' }}>{store.name.toUpperCase()}</Link></>}</CardTitle>
              {lines.map((l) => (
                <SumRow key={l.id}>
                  <span>{l.quantity}× {l.product.name}{l.options?.length ? ` (${l.options.map((o) => o.name).join(', ')})` : ''}</span>
                  <span>{fmt(l.lineTotal)}</span>
                </SumRow>
              ))}
              <SumRow $divider><span>Tạm tính</span><span>{fmt(cart!.subtotal)}</span></SumRow>
              <SumRow><span>Phí giao</span><span>{fmt(fee)}</span></SumRow>
              <SumRow $size={20} $bold><span>Tổng</span><span style={{ color: 'var(--red-text)' }}>{fmt(cart!.subtotal + fee)}</span></SumRow>
              <Cta onClick={place} disabled={placing || !addressId} rotate={0} style={{ marginTop: 8 }}>{placing ? 'ĐANG ĐẶT…' : 'ĐẶT MÓN'}</Cta>
            </Card>
          </Split>
        </Stack>
      </Container>
    </Section>
  );
}
