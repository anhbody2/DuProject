import { useState } from 'react';
import { Link } from 'react-router';
import { Segmented, Switch, Table, Tag } from 'antd';
import { fmt, dateVN } from '@/lib/format';
import { useAdminOrdersQuery, useAdminStatsQuery } from '@/redux/api';
import type { OrderStatus, Role } from '@/redux/types';
import { Spinner } from '@/components/ui';
import { BarList, OrdersChart, RevenueChart, ShareBar } from './charts';
import { ORDER_STATUS, PAYMENT_METHOD, ROLE, STORE_STATUS, compactVND } from './labels';
import { Cell, Grid, Muted, PageHead, Panel, PanelHead, Tile, Tiles } from './styles';

const RANGES = [7, 30, 90] as const;
const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
const ROLES: Role[] = ['customer', 'member', 'store_owner', 'admin'];

export default function DashboardView() {
  const [days, setDays] = useState<number>(30);
  const [asTable, setAsTable] = useState(false);
  const { data: s, isLoading, isFetching } = useAdminStatsQuery(days, { pollingInterval: 60_000 });
  const { data: recent } = useAdminOrdersQuery({ limit: 6 });

  if (isLoading || !s) return <Spinner />;

  const t = s.totals;
  const periodRevenue = s.daily.reduce((sum, d) => sum + d.revenue, 0);
  const periodOrders = s.daily.reduce((sum, d) => sum + d.orders, 0);
  const pendingStores = s.storesByStatus.pending ?? 0;
  const waitingOrders = s.ordersByStatus.pending ?? 0;

  return (
    <>
      <PageHead>
        <div>
          <h1>TỔNG QUAN</h1>
          <p>Số liệu toàn sàn, tự làm mới mỗi phút{isFetching && ' · đang cập nhật…'}</p>
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
          <span className="hint">Hoa hồng sàn {fmt(t.commission)} · đang xử lý {fmt(t.pendingRevenue)}</span>
        </Tile>
        <Tile>
          <span className="label">Đơn hàng</span>
          <span className="value">{t.orders.toLocaleString('vi-VN')}</span>
          <span className="hint">{waitingOrders ? <Link to="/admin/orders?status=pending">{waitingOrders} đơn chờ xác nhận</Link> : 'Không có đơn chờ'}</span>
        </Tile>
        <Tile>
          <span className="label">Người dùng</span>
          <span className="value">{t.users.toLocaleString('vi-VN')}</span>
          <span className="hint">+{t.newUsers} trong 30 ngày qua</span>
        </Tile>
        <Tile>
          <span className="label">Cửa hàng</span>
          <span className="value">{t.stores.toLocaleString('vi-VN')}</span>
          <span className="hint">{pendingStores ? <Link to="/admin/stores?status=pending">{pendingStores} quán chờ duyệt</Link> : 'Không có quán chờ duyệt'}</span>
        </Tile>
        <Tile>
          <span className="label">Sản phẩm</span>
          <span className="value">{t.products.toLocaleString('vi-VN')}</span>
          <span className="hint">{s.productsByStatus.out_of_stock ?? 0} món hết hàng</span>
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
          <PanelHead><h2>NGƯỜI DÙNG THEO VAI TRÒ</h2></PanelHead>
          <ShareBar parts={ROLES.map((r) => ({ key: r, label: ROLE[r].label, value: s.usersByRole[r] ?? 0 }))} />
          <PanelHead style={{ marginTop: 10 }}><h2>CỬA HÀNG THEO TRẠNG THÁI</h2></PanelHead>
          <BarList rows={(['active', 'pending', 'inactive', 'suspended'] as const).map((k) => ({ key: k, label: STORE_STATUS[k].label, value: s.storesByStatus[k] ?? 0 }))} />
        </Panel>
      </Grid>

      <Grid>
        <Panel>
          <PanelHead><h2>TOP CỬA HÀNG</h2><small>theo doanh thu đã hoàn tất</small></PanelHead>
          {s.topStores.length ? (
            <BarList format={compactVND} rows={s.topStores.map((x) => ({ key: String(x.id), label: x.name, value: x.revenue, hint: `${x.orders} đơn · ${fmt(x.revenue)}` }))} />
          ) : <Muted>Chưa có đơn nào</Muted>}
        </Panel>
        <Panel>
          <PanelHead><h2>MÓN BÁN CHẠY</h2><small>theo số lượng đã giao</small></PanelHead>
          {s.topProducts.length ? (
            <BarList format={(v) => `${v} phần`} rows={s.topProducts.map((x, i) => ({ key: `${x.productId ?? 'x'}-${i}`, label: x.name, value: x.quantity, hint: `${x.storeName} · ${fmt(x.revenue)}` }))} />
          ) : <Muted>Chưa có đơn nào</Muted>}
        </Panel>
      </Grid>

      <Grid $cols="minmax(0, 1fr) minmax(0, 2fr)">
        <Panel>
          <PanelHead><h2>THANH TOÁN</h2><small>theo phương thức</small></PanelHead>
          {s.payments.length ? (
            <BarList format={compactVND} rows={s.payments.map((p) => ({ key: p.method, label: PAYMENT_METHOD[p.method] ?? p.method, value: p.amount, hint: `${p.count} giao dịch` }))} />
          ) : <Muted>Chưa có giao dịch</Muted>}
        </Panel>
        <Panel>
          <PanelHead><h2>ĐƠN GẦN ĐÂY</h2><Link to="/admin/orders" style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--green-text)' }}>Xem tất cả →</Link></PanelHead>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            scroll={{ x: 520 }}
            dataSource={recent?.items ?? []}
            columns={[
              { title: 'Mã', dataIndex: 'id', render: (id: number) => <b>#DU-{id}</b> },
              { title: 'Khách', render: (_, o) => <Cell><span>{o.user?.username ?? '—'}</span></Cell> },
              { title: 'Thời gian', dataIndex: 'createdAt', render: (d: string) => <Muted>{dateVN(d)}</Muted> },
              { title: 'Trạng thái', dataIndex: 'status', render: (st: OrderStatus) => <Tag color={ORDER_STATUS[st].color}>{ORDER_STATUS[st].label}</Tag> },
              { title: 'Tổng', dataIndex: 'total', align: 'right', render: fmt },
            ]}
          />
        </Panel>
      </Grid>
    </>
  );
}
