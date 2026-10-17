import { App, Button, Input, Segmented, Table, Tag } from 'antd';
import { Search } from 'lucide-react';
import { toast } from '@/lib/toast';
import DeliveryAddress from '@/components/AddressPicker/DeliveryAddress';
import { dateVN, fmt } from '@/lib/format';
import {
  errorMessage,
  useAdminCancelOrderMutation,
  useAdminOrdersQuery,
  useUpdateDeliveryMutation,
  useUpdatePaymentStatusMutation,
  useUpdateStoreOrderStatusMutation,
  type AdminOrdersQuery,
} from '@/redux/api';
import type { AdminOrder, DeliveryStatus, OrderStatus, PaymentStatus } from '@/redux/types';
import {
  DELIVERY_NEXT, DELIVERY_STATUS, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_NEXT, PAYMENT_STATUS, STORE_ORDER_NEXT, optionsOf,
} from './labels';
import { Grid, Muted, PageHead, Panel, Toolbar } from './styles';
import StatusStep from './StatusStep';
import { PAGE_SIZE, useListParams } from './useListParams';

function OrderDetail({ o }: { o: AdminOrder }) {
  const [setStoreOrder] = useUpdateStoreOrderStatusMutation();
  const [setPayment] = useUpdatePaymentStatusMutation();
  const [setDelivery] = useUpdateDeliveryMutation();
  const done = (p: Promise<unknown>) => p.then(() => toast('Đã cập nhật')).catch((e) => toast(errorMessage(e)));

  return (
    <Grid $cols="minmax(0, 3fr) minmax(0, 2fr)" style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {o.storeOrders?.map((so) => (
          <Panel key={so.id} $pad={14} style={{ boxShadow: 'none', borderWidth: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <b>{so.store?.name ?? `Quán #${so.storeId}`}</b>
              <StatusStep<OrderStatus> value={so.status} map={ORDER_STATUS} next={STORE_ORDER_NEXT}
                onChange={(status) => done(setStoreOrder({ id: so.id, status }).unwrap())} />
            </div>
            <Muted>Tạm tính {fmt(so.subtotal)} · phí giao {fmt(so.deliveryFee)}</Muted>
          </Panel>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-body)', fontSize: 13 }}>
        {o.payments?.map((p) => (
          <div key={p.id}>
            <Muted>Thanh toán · {PAYMENT_METHOD[p.method] ?? p.method} · {fmt(p.amount)}</Muted>
            <StatusStep<PaymentStatus> value={p.status} map={PAYMENT_STATUS} next={PAYMENT_NEXT}
              onChange={(status) => done(setPayment({ id: p.id, status }).unwrap())} />
          </div>
        ))}
        {o.delivery && (
          <div>
            <Muted>Giao hàng{o.delivery.deliveredAt && ` · giao lúc ${dateVN(o.delivery.deliveredAt)}`}</Muted>
            <StatusStep<DeliveryStatus> value={o.delivery.status} map={DELIVERY_STATUS} next={DELIVERY_NEXT}
              onChange={(status) => done(setDelivery({ id: o.delivery!.id, status }).unwrap())} />
          </div>
        )}
        <div>
          <Muted>Địa chỉ nhận</Muted>
          <DeliveryAddress addr={o.deliveryAddress} />
        </div>
        {o.note && (
          <div>
            <Muted>Ghi chú của khách</Muted>
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{o.note}</div>
          </div>
        )}
      </div>
    </Grid>
  );
}

export default function OrdersView() {
  const { modal } = App.useApp();
  const list = useListParams(['status'] as const);
  const { data, isFetching } = useAdminOrdersQuery(list.query as AdminOrdersQuery);
  const [cancel] = useAdminCancelOrderMutation();

  const cancellable = (o: AdminOrder) => o.status !== 'cancelled' && (o.storeOrders ?? []).every((so) => ['pending', 'confirmed', 'cancelled'].includes(so.status));
  const confirmCancel = (o: AdminOrder) => modal.confirm({
    title: `Huỷ đơn #DU-${o.id}?`,
    content: 'Tồn kho được hoàn lại, thanh toán và giao hàng được cập nhật theo.',
    okText: 'Huỷ đơn', cancelText: 'Giữ lại',
    okButtonProps: { danger: true },
    onOk: () => cancel(o.id).unwrap().then(() => toast('Đã huỷ đơn')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <>
      <PageHead>
        <div>
          <h1>ĐƠN HÀNG</h1>
          <p>{data?.meta.total ?? '…'} đơn · mở một đơn để cập nhật từng quán, thanh toán và giao hàng</p>
        </div>
      </PageHead>

      <Panel>
        <Toolbar>
          <Input className="grow" allowClear prefix={<Search size={16} />} placeholder="Mã đơn, tên đăng nhập hoặc email khách" value={list.text} onChange={(e) => list.setText(e.target.value)} />
          <Segmented<string>
            value={list.filters.status ?? ''}
            onChange={(v) => list.setFilter('status', v || undefined)}
            options={[{ value: '', label: 'Tất cả' }, ...optionsOf(ORDER_STATUS)]}
          />
        </Toolbar>

        <Table<AdminOrder>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 900 }}
          expandable={{ expandedRowRender: (o) => <OrderDetail o={o} />, expandRowByClick: false }}
          pagination={{ current: list.page, pageSize: PAGE_SIZE, total: data?.meta.total ?? 0, onChange: list.setPage, showSizeChanger: false }}
          columns={[
            { title: 'Mã', dataIndex: 'id', width: 100, render: (id: number) => <b>#DU-{id}</b> },
            { title: 'Khách', width: 190, render: (_, o) => o.user ? <div><b>{o.user.username}</b><br /><Muted>{o.user.email}</Muted></div> : <Muted>—</Muted> },
            { title: 'Cửa hàng', render: (_, o) => o.storeOrders?.map((so) => so.store?.name).filter(Boolean).join(', ') || <Muted>—</Muted> },
            { title: 'Thời gian', dataIndex: 'createdAt', width: 150, render: (d: string) => <Muted>{dateVN(d)}</Muted> },
            {
              title: 'Thanh toán',
              width: 130,
              render: (_, o) => {
                const p = o.payments?.[o.payments.length - 1];
                return p ? <Tag color={PAYMENT_STATUS[p.status].color}>{PAYMENT_STATUS[p.status].label}</Tag> : <Muted>—</Muted>;
              },
            },
            { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (s: OrderStatus) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag> },
            { title: 'Tổng', dataIndex: 'total', width: 120, align: 'right', render: (v: number) => <b>{fmt(v)}</b> },
            {
              title: '',
              width: 90,
              render: (_, o) => cancellable(o) && <Button size="small" danger onClick={() => confirmCancel(o)}>Huỷ</Button>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
