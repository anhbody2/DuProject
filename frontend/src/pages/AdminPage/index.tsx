import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Button, Result } from 'antd';
import { FolderTree, LayoutDashboard, Package, Receipt, Store, Users } from 'lucide-react';
import { useAuth } from '@/redux';
import { Spinner } from '@/components/ui';
import ConsoleShell, { type ConsoleNavItem } from './ConsoleShell';
import DashboardView from './DashboardView';
import UsersView from './UsersView';
import StoresView from './StoresView';
import ProductsView from './ProductsView';
import OrdersView from './OrdersView';
import CategoriesView from './CategoriesView';

const NAV: ConsoleNavItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Đơn hàng', icon: Receipt },
  { to: '/admin/stores', label: 'Cửa hàng', icon: Store },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
];

/** Admin console at /admin/*. Has its own shell (no storefront header/footer); admins only. */
export default function AdminPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  useEffect(() => { if (!token) navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true }); }, [token, pathname, navigate]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!token || !user) return <Spinner />;
  if (user.role !== 'admin') {
    return (
      <Result
        status="403"
        title="Chỉ dành cho quản trị viên"
        subTitle="Tài khoản của bạn không có quyền vào trang này."
        extra={<Link to="/"><Button type="primary">Về trang chủ</Button></Link>}
      />
    );
  }

  return (
    <ConsoleShell title="QUẢN TRỊ" nav={NAV}>
      <Routes>
        <Route index element={<DashboardView />} />
        <Route path="orders" element={<OrdersView />} />
        <Route path="stores" element={<StoresView />} />
        <Route path="products" element={<ProductsView />} />
        <Route path="users" element={<UsersView />} />
        <Route path="categories" element={<CategoriesView />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </ConsoleShell>
  );
}
