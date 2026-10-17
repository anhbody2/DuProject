import { App, Segmented, Table } from 'antd';
import { toast } from '@/lib/toast';
import { dateVN, fmt } from '@/lib/format';
import { errorMessage, useSetStoreOrderStatusMutation, useStoreOrdersQuery } from '@/redux/api';
import type { OrderStatus, StoreOrderRow } from '@/redux/types';
import DeliveryAddress from '@/components/AddressPicker/DeliveryAddress';
import StatusStep from '@/pages/AdminPage/StatusStep';
import { ORDER_STATUS, STORE_ORDER_NEXT, optionsOf } from '@/pages/AdminPage/labels';
import { Grid, Muted, PageHead, Panel, Toolbar } from '@/pages/AdminPage/styles';
import { PAGE_SIZE, useListParams } from '@/pages/AdminPage/useListParams';
import type { StoreViewProps } from '.';

const customerName = (so: StoreOrderRow) => {
  const u = so.order?.user;
  const full = [u?.profile?.lastName, u?.profile?.firstName].filter(Boolean).join(' ');
  return full || u?.username || '—';
};

function OrderDetail({ so }: { so: StoreOrderRow }) {
  return (
    <Grid $cols="minmax(0, 3fr) minmax(0, 2fr)" style={{ padding: '6px 0', fontFamily: 'var(--font-body)', fontSize: 13 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {so.items?.map((it) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <b>{it.quantity} × {it.productName}</b>
              {!!it.options?.length && <div><Muted>{it.options.map((o) => o.optionName).join(', ')}</Muted></div>}
            </div>
            <span>{fmt(it.subtotal)}</span>
          </div>
        ))}
        <Muted>Tiền món {fmt(so.subtotal)} · phí giao {fmt(so.deliveryFee)} · phí sàn {fmt(so.commissionAmount)}</Muted>
      </div>
      <div>
        <Muted>Giao đến</Muted>
        <DeliveryAddress addr={so.order?.deliveryAddress} />
        {so.order?.note && <div style={{ marginTop: 8 }}><Muted>Ghi chú của khách</Muted><div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{so.order.note}</div></div>}
      </div>
    </Grid>
  );
}

export default function OrdersView({ store }: StoreViewProps) {
  const { modal } = App.useApp();
  const list = useListParams(['status'] as const);
  const status = list.filters.status as OrderStatus | undefined;
  const { data, isFetching } = useStoreOrdersQuery({ storeId: store.id, page: list.page, limit: PAGE_SIZE, status });
  const [setStatus] = useSetStoreOrderStatusMutation();

  const apply = (so: StoreOrderRow, next: OrderStatus) =>
    setStatus({ id: so.id, status: next }).unwrap()
      .then(() => toast(`Đơn #DU-${so.orderId}: ${ORDER_STATUS[next].label}`))
      .catch((e) => toast(errorMessage(e)));

  const change = (so: StoreOrderRow, next: OrderStatus) => {
    if (next !== 'cancelled') return apply(so, next);
    modal.confirm({
      title: `Huỷ phần đơn #DU-${so.orderId} của quán?`,
      content: 'Tồn kho các món được hoàn lại. Không thể hoàn tác.',
      okText: 'Huỷ đơn', cancelText: 'Giữ lại',
      okButtonProps: { danger: true },
      onOk: () => apply(so, next),
    });
  };

  return (
    <>
      <PageHead>
        <div>
          <h1>ĐƠN HÀNG</h1>
          <p>{data?.meta.total ?? '…'} đơn · mở một đơn để xem món và địa chỉ giao</p>
        </div>
      </PageHead>

      <Panel>
        <Toolbar>
          <Segmented<string>
            value={status ?? ''}
            onChange={(v) => list.setFilter('status', v || undefined)}
            options={[{ value: '', label: 'Tất cả' }, ...optionsOf(ORDER_STATUS)]}
          />
        </Toolbar>

        <Table<StoreOrderRow>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 820 }}
          expandable={{ expandedRowRender: (so) => <OrderDetail so={so} /> }}
          pagination={{ current: list.page, pageSize: PAGE_SIZE, total: data?.meta.total ?? 0, onChange: list.setPage, showSizeChanger: false }}
          columns={[
            { title: 'Mã', dataIndex: 'orderId', width: 100, render: (id: number) => <b>#DU-{id}</b> },
            {
              title: 'Khách',
              width: 180,
              render: (_, so) => <div><b>{customerName(so)}</b><br /><Muted>{so.order?.deliveryAddress?.phone ?? so.order?.user?.profile?.phone ?? ''}</Muted></div>,
            },
            {
              title: 'Món',
              render: (_, so) => {
                const items = so.items ?? [];
                const count = items.reduce((n, it) => n + it.quantity, 0);
                return <div><b>{count} phần</b><br /><Muted>{items.map((it) => it.productName).join(', ')}</Muted></div>;
              },
            },
            { title: 'Thời gian', dataIndex: 'createdAt', width: 150, render: (d: string) => <Muted>{dateVN(d)}</Muted> },
            {
              title: 'Trạng thái',
              width: 270,
              render: (_, so) => (
                <StatusStep<OrderStatus> value={so.status} map={ORDER_STATUS} next={STORE_ORDER_NEXT} onChange={(next) => change(so, next)} />
              ),
            },
            { title: 'Tiền món', dataIndex: 'subtotal', width: 110, align: 'right', render: (v: number) => <b>{fmt(v)}</b> },
          ]}
        />
      </Panel>
    </>
  );
}
