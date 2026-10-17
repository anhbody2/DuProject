import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { useAppDispatch } from '@/redux';
import { setNavOpen } from '@/redux/slices/uiSlice';
import Header from '@/components/Header';
import SearchPanel from '@/components/SearchPanel';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollProgress from '@/components/ScrollProgress';
import ChatWidget, { ChatSocketSync } from '@/components/ChatWidget';
import { Spinner } from '@/components/ui';
import LandingPage from '@/pages/LandingPage';

// The landing page ships in the main bundle; the rest load on demand.
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const MarketPage = lazy(() => import('@/pages/MarketPage'));
const StorePage = lazy(() => import('@/pages/StorePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const StoreDashboardPage = lazy(() => import('@/pages/StoreDashboardPage'));

function Layout() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  // Page changes start at the top and close the mobile menu.
  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(setNavOpen(false));
  }, [pathname, dispatch]);

  return (
    <>
      <Header />
      <SearchPanel />
      <main>
        <Suspense fallback={<Spinner />}><Outlet /></Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <ScrollProgress />
    </>
  );
}

export default function App() {
  return (
    <>
      <AppRoutes />
      {/* Chat lives outside the routes so it stays open across pages, admin console included. */}
      <ChatSocketSync />
      <ChatWidget />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="admin/*" element={<Suspense fallback={<Spinner />}><AdminPage /></Suspense>} />
      <Route path="my-store/*" element={<Suspense fallback={<Spinner />}><StoreDashboardPage /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="store/:id" element={<StorePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
