import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Alert, Button, Modal, Result, Select } from 'antd';
import { LayoutDashboard, Package, Plus, Receipt, Settings } from 'lucide-react';
import { useAuth } from '@/redux';
import { useMyStoresQuery } from '@/redux/api';
import type { Store, StoreMemberRole } from '@/redux/types';
import { Spinner } from '@/components/ui';
import AddStoreForm from '@/components/AddStoreForm';
import ConsoleShell, { type ConsoleNavItem } from '@/pages/AdminPage/ConsoleShell';
import { STORE_STATUS } from '@/pages/AdminPage/labels';
import DashboardView from './DashboardView';
import OrdersView from './OrdersView';
import ProductsView from './ProductsView';
import SettingsView from './SettingsView';

export interface StoreViewProps {
  store: Store;
  /** Owners and managers see revenue and edit the catalogue; staff only handle orders. */
  canManage: boolean;
  /** Only the owner may delete the store. */
  role: StoreMemberRole;
  base: string;
}

/** The shared add-store form in a modal. `onCreated` gets the new (pending) store. */
function NewStoreModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (store: Store) => void }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      centered
      destroyOnHidden
      styles={{ container: { padding: 0, background: 'transparent', boxShadow: 'none' } }}
    >
      <AddStoreForm onCreated={onCreated} />
    </Modal>
  );
}

const STATUS_NOTE: Partial<Record<Store['status'], string>> = {
  pending: 'Quán đang chờ quản trị viên duyệt, khách chưa thấy quán trên chợ.',
  inactive: 'Quán đang tạm nghỉ, khách không đặt món được.',
  suspended: 'Quán đã bị đình chỉ. Liên hệ quản trị viên để biết thêm.',
};

/** One store's console at /my-store/:storeId/*, reusing the admin shell, charts and labels. */
function StoreConsole({ memberships, fetching }: { memberships: { role: StoreMemberRole; store: Store }[]; fetching: boolean }) {
  const { storeId, '*': rest = '' } = useParams();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const current = memberships.find((m) => String(m.store.id) === storeId);
  // A just-created store shows up once /me/stores finishes refetching.
  if (!current) return fetching ? <Spinner /> : <Navigate to="/my-store" replace />;

  const { store, role } = current;
  const canManage = role !== 'staff';
  const base = `/my-store/${store.id}`;
  const nav: ConsoleNavItem[] = [
    ...(canManage ? [{ to: base, label: 'Tổng quan', icon: LayoutDashboard, end: true }] : []),
    { to: `${base}/orders`, label: 'Đơn hàng', icon: Receipt },
    { to: `${base}/products`, label: 'Món ăn', icon: Package },
    ...(canManage ? [{ to: `${base}/settings`, label: 'Thông tin quán', icon: Settings }] : []),
  ];

  const side = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 4px 12px' }}>
      {memberships.length > 1 && (
        <Select
          value={store.id}
          onChange={(id) => navigate(`/my-store/${id}/${rest}`)}
          options={memberships.map((m) => ({ value: m.store.id, label: m.store.name }))}
          style={{ minWidth: 180 }}
          aria-label="Chọn quán"
        />
      )}
      <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Mở quán mới</Button>
    </div>
  );
  const note = STATUS_NOTE[store.status];
  const props: StoreViewProps = { store, canManage, role, base };

  return (
    <ConsoleShell title="QUÁN CỦA TÔI" nav={nav} sideExtra={side}>
      {note && <Alert type={STORE_STATUS[store.status].color === 'error' ? 'error' : 'warning'} showIcon title={note} />}
      <Routes>
        <Route index element={canManage ? <DashboardView {...props} /> : <Navigate to="orders" replace />} />
        <Route path="orders" element={<OrdersView {...props} />} />
        <Route path="products" element={<ProductsView {...props} />} />
        {canManage && <Route path="settings" element={<SettingsView {...props} />} />}
        <Route path="*" element={<Navigate to={base} replace />} />
      </Routes>
      <NewStoreModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(s) => { setAdding(false); navigate(`/my-store/${s.id}`); }}
      />
    </ConsoleShell>
  );
}

/** Store owner console. Anyone listed in store_members gets in; the store list comes from /me/stores. */
export default function StoreDashboardPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { data: memberships, isLoading, isFetching } = useMyStoresQuery(undefined, { skip: !token });
  // No store yet: open the add-store form right here instead of sending the owner away.
  const [adding, setAdding] = useState(true);

  useEffect(() => { if (!token) navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true }); }, [token, pathname, navigate]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!token || !user || isLoading || !memberships) return <Spinner />;
  if (!memberships.length) {
    return (
      <>
        <Result
          status="404"
          title="Bạn chưa có quán nào"
          subTitle="Thêm quán đầu tiên để bắt đầu nhận đơn. Quán sẽ lên chợ khi được quản trị viên duyệt."
          extra={[
            <Button key="add" type="primary" onClick={() => setAdding(true)}>Mở quán</Button>,
            <Link key="home" to="/"><Button>Về trang chủ</Button></Link>,
          ]}
        />
        {/* Once created, /me/stores refetches and the console takes over with the new (pending) store. */}
        <NewStoreModal open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  return (
    <Routes>
      <Route index element={<Navigate to={`${memberships[0].store.id}`} replace />} />
      <Route path=":storeId/*" element={<StoreConsole memberships={memberships} fetching={isFetching} />} />
    </Routes>
  );
}
