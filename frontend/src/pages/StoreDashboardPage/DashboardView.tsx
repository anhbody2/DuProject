import { useState } from 'react';
import { Link } from 'react-router';
import { Segmented, Switch, Table, Tag } from 'antd';
import { Star } from 'lucide-react';
import { dateVN, fmt } from '@/lib/format';
import { useStoreOrdersQuery, useStoreStatsQuery } from '@/redux/api';
import type { OrderStatus, StoreOrderRow } from '@/redux/types';
import { Spinner } from '@/components/ui';
import { BarList, OrdersChart, RevenueChart } from '@/pages/AdminPage/charts';
import { ORDER_STATUS, PRODUCT_STATUS, compactVND } from '@/pages/AdminPage/labels';
import { Grid, Muted, PageHead, Panel, PanelHead, Tile, Tiles } from '@/pages/AdminPage/styles';
import type { StoreViewProps } from '.';

const RANGES = [7, 30, 90] as const;
const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
const LINK_STYLE = { fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--green-text)' };

export default function DashboardView({ store, base }: StoreViewProps) {
  const [days, setDays] = useState<number>(30);
  const [asTable, setAsTable] = useState(false);
  const { data: s, isLoading, isFetching } = useStoreStatsQuery({ storeId: store.id, days }, { pollingInterval: 60_000 });
  const { data: recent } = useStoreOrdersQuery({ storeId: store.id, limit: 6 });

  if (isLoading || !s) return <Spinner />;

  const t = s.totals;
  const periodRevenue = s.daily.reduce((sum, d) => sum + d.revenue, 0);
  const periodOrders = s.daily.reduce((sum, d) => sum + d.orders, 0);
  const waiting = s.ordersByStatus.pending ?? 0;
  const inKitchen = (s.ordersByStatus.confirmed ?? 0) + (s.ordersByStatus.preparing ?? 0);

  return (
    <>
      <PageHead>
        <div>
          <h1>{store.name.toUpperCase()}</h1>
          <p>Số liệu của quán, tự làm mới mỗi phút{isFetching && ' · đang cập nhật…'}</p>
        </div>
        <Segmented<number>
          value={days}
          onChange={setDays}
          options={RANGES.map((d) => ({ value: d, label: `${d} ngày` }))}
        />
      </PageHead>

      <Tiles>
        <Tile $hero>
          <span className="label">Doanh thu đã hoàn tất</span>
          <span className="value">{fmt(t.revenue)}</span>
          <span className="hint">Thực nhận {fmt(t.revenue - t.commission)} · phí sàn {fmt(t.commission)}</span>
        </Tile>
        <Tile>
          <span className="label">Đơn hàng</span>
          <span className="value">{t.orders.toLocaleString('vi-VN')}</span>
          <span className="hint">
            {waiting ? <Link to={`${base}/orders?status=pending`}>{waiting} đơn chờ xác nhận</Link> : 'Không có đơn chờ'}
            {inKitchen > 0 && ` · ${inKitchen} đang làm`}
          </span>
        </Tile>
        <Tile>
          <span className="label">Đang xử lý</span>
          <span className="value">{compactVND(t.pendingRevenue)}</span>
          <span className="hint">Tiền món của các đơn chưa hoàn tất</span>
        </Tile>
        <Tile>
          <span className="label">Khách hàng</span>
          <span className="value">{t.customers.toLocaleString('vi-VN')}</span>
          <span className="hint">Đã đặt ít nhất một đơn</span>
        </Tile>
        <Tile>
          <span className="label">Đánh giá</span>
          <span className="value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.reviews ? t.rating.toLocaleString('vi-VN') : '—'} <Star size={22} fill="var(--gold)" color="var(--gold)" />
          </span>
          <span className="hint">{t.reviews} lượt đánh giá</span>
        </Tile>
      </Tiles>

      <Panel>
        <PanelHead>
          <div>
            <h2>DOANH THU {days} NGÀY</h2>
            <Muted>{fmt(periodRevenue)} từ đơn đã hoàn tất · {periodOrders} đơn đã đặt</Muted>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontFamily: 'var(--font-body)' }}>
            <Switch size="small" checked={asTable} onChange={setAsTable} /> Xem dạng bảng
          </label>
        </PanelHead>
        {asTable ? (
          <Table
            size="small"
            rowKey="date"
            dataSource={[...s.daily].reverse()}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            columns={[
              { title: 'Ngày', dataIndex: 'date', render: (d: string) => d.split('-').reverse().join('/') },
              { title: 'Số đơn', dataIndex: 'orders', align: 'right' },
              { title: 'Doanh thu', dataIndex: 'revenue', align: 'right', render: fmt },
            ]}
          />
        ) : (
          <>
            <RevenueChart data={s.daily} />
            <h2 style={{ marginTop: 8 }}>SỐ ĐƠN MỖI NGÀY</h2>
            <OrdersChart data={s.daily} />
          </>
        )}
      </Panel>

      <Grid>
        <Panel>
          <PanelHead><h2>ĐƠN THEO TRẠNG THÁI</h2><small>tất cả thời gian</small></PanelHead>
          <BarList rows={ORDER_FLOW.map((k) => ({ key: k, label: ORDER_STATUS[k].label, value: s.ordersByStatus[k] ?? 0 }))} />
        </Panel>
        <Panel>
          <PanelHead><h2>MÓN BÁN CHẠY</h2><small>theo số lượng đã giao</small></PanelHead>
          {s.topProducts.length ? (
            <BarList format={(v) => `${v} phần`} rows={s.topProducts.map((x, i) => ({ key: `${x.productId ?? 'x'}-${i}`, label: x.name, value: x.quantity, hint: fmt(x.revenue) }))} />
          ) : <Muted>Chưa có đơn nào</Muted>}
        </Panel>
      </Grid>

      <Grid $cols="minmax(0, 1fr) minmax(0, 2fr)">
        <Panel>
          <PanelHead>
            <h2>SẮP HẾT HÀNG</h2>
            <Link to={`${base}/products`} style={LINK_STYLE}>Chỉnh tồn kho →</Link>
          </PanelHead>
          {s.lowStock.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
              {s.lowStock.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  {p.stock > 0 ? <b>còn {p.stock}</b> : <Tag color={PRODUCT_STATUS.out_of_stock.color}>{PRODUCT_STATUS.out_of_stock.label}</Tag>}
                </div>
              ))}
            </div>
          ) : <Muted>Món nào cũng còn đủ hàng</Muted>}
          <Muted>{t.products} món · {s.productsByStatus.inactive ?? 0} đang ẩn</Muted>
        </Panel>
        <Panel>
          <PanelHead><h2>ĐƠN GẦN ĐÂY</h2><Link to={`${base}/orders`} style={LINK_STYLE}>Xem tất cả →</Link></PanelHead>
          <Table<StoreOrderRow>
            size="small"
            rowKey="id"
            pagination={false}
            scroll={{ x: 520 }}
            dataSource={recent?.items ?? []}
            columns={[
              { title: 'Mã', dataIndex: 'orderId', render: (id: number) => <b>#DU-{id}</b> },
              { title: 'Khách', render: (_, so) => so.order?.user?.username ?? '—' },
              { title: 'Thời gian', dataIndex: 'createdAt', render: (d: string) => <Muted>{dateVN(d)}</Muted> },
              { title: 'Trạng thái', dataIndex: 'status', render: (st: OrderStatus) => <Tag color={ORDER_STATUS[st].color}>{ORDER_STATUS[st].label}</Tag> },
              { title: 'Tiền món', dataIndex: 'subtotal', align: 'right', render: fmt },
            ]}
          />
        </Panel>
      </Grid>
    </>
  );
}
