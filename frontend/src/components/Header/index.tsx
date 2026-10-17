import { Link, useLocation } from 'react-router';
import { Badge, Drawer, Tooltip } from 'antd';
import { LayoutDashboard, Menu, Moon, Search, ShoppingCart, Store, Sun, User, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, useAuth } from '@/redux';
import { useCartQuery } from '@/redux/api';
import { setCartOpen, setNavOpen, toggleSearch, toggleTheme } from '@/redux/slices/uiSlice';
import { IconButton } from '@/components/ui';
import { Bar, Nav, NavLink, Logo, Icons, OnlyMobile, HideXs, DrawerBody, DrawerLink, DrawerAction } from './styles';

export default function Header() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'store_owner';
  const { navOpen, theme } = useAppSelector((s) => s.ui);
  const { data: cart } = useCartQuery(undefined, { skip: !token });
  const account = token ? '/account' : '/login';
  const count = cart?.itemCount ?? 0;
  const dark = theme === 'dark';
  const closeNav = () => dispatch(setNavOpen(false));

  const links: [string, string][] = [['MENU', '/menu'], ['CHỢ XÓM', '/market'], ['ABOUT', '/'], ['JOIN IN', account]];
  const nav = ([label, href]: [string, string]) => <NavLink key={label} to={href} $active={pathname === href}>{label}</NavLink>;
  const ThemeIcon = dark ? Sun : Moon;
  const themeLabel = dark ? 'Chế độ sáng' : 'Chế độ tối';

  return (
    <>
      <Bar>
        <OnlyMobile>
          <IconButton onClick={() => dispatch(setNavOpen(true))} aria-label="Mở menu" $anim="wiggle" $hoverColor="var(--gold)">
            <Menu size={26} strokeWidth={2.6} />
          </IconButton>
        </OnlyMobile>

        <Nav>
          {links.slice(0, 2).map(nav)}
          <Logo to="/" title="Dủ"><img src="/assets/logo.png" alt="Dủ" /></Logo>
          {links.slice(2).map(nav)}
        </Nav>

        <Logo to="/" title="Dủ" $mobile><img src="/assets/logo.png" alt="Dủ" /></Logo>

        <Icons>
          {isAdmin && (
            <HideXs>
              <Tooltip title="Trang quản trị">
                <IconButton as={Link} to="/admin" aria-label="Trang quản trị" $anim="pop" $hoverColor="var(--gold)"><LayoutDashboard size={22} strokeWidth={2.4} /></IconButton>
              </Tooltip>
            </HideXs>
          )}
          {isOwner && (
            <HideXs>
              <Tooltip title="Quán của tôi">
                <IconButton as={Link} to="/my-store" aria-label="Quán của tôi" $anim="pop" $hoverColor="var(--gold)"><Store size={22} strokeWidth={2.4} /></IconButton>
              </Tooltip>
            </HideXs>
          )}
          <HideXs>
            <Tooltip title="Tài khoản">
              <IconButton as={Link} to={account} aria-label="Tài khoản" $anim="pop" $hoverColor="var(--gold)"><User size={22} strokeWidth={2.4} /></IconButton>
            </Tooltip>
          </HideXs>
          <Tooltip title="Tìm món">
            <IconButton onClick={() => dispatch(toggleSearch())} aria-label="Tìm món" $anim="wiggle" $hoverColor="var(--gold)"><Search size={22} strokeWidth={2.4} /></IconButton>
          </Tooltip>
          <Tooltip title={themeLabel}>
            <IconButton onClick={() => dispatch(toggleTheme())} aria-label={themeLabel} $anim="pop" $hoverColor="var(--gold)"><ThemeIcon size={22} strokeWidth={2.4} /></IconButton>
          </Tooltip>
          <Tooltip title="Giỏ hàng">
            <IconButton onClick={() => dispatch(setCartOpen(true))} aria-label="Giỏ hàng" $anim="roll" $hoverColor="var(--gold)">
              <Badge
                count={count}
                overflowCount={99}
                offset={[4, -4]}
                color="var(--gold)"
                styles={{ indicator: { color: 'var(--ink)', boxShadow: '0 0 0 2px var(--red)', fontFamily: 'var(--font)' } }}
              >
                <ShoppingCart size={24} strokeWidth={2.4} color="#1a0f10" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Icons>
      </Bar>

      <Drawer
        open={navOpen}
        onClose={closeNav}
        placement="left"
        size="min(340px, 86vw)"
        closable={false}
        styles={{ body: { padding: 0 }, section: { borderRight: '4px solid var(--edge)' } }}
      >
        <DrawerBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Link to="/" onClick={closeNav}><img src="/assets/logo.png" alt="Dủ" width={68} height={54} style={{ objectFit: 'contain' }} /></Link>
            <IconButton onClick={closeNav} aria-label="Đóng menu" $anim="wiggle" $hoverColor="#fff" style={{ color: 'var(--gold)' }}><X size={26} strokeWidth={2.8} /></IconButton>
          </div>
          {links.map(([label, href]) => <DrawerLink key={label} to={href} onClick={closeNav} $active={pathname === href}>{label}</DrawerLink>)}
          {isAdmin && <DrawerLink to="/admin" onClick={closeNav} $active={false}>QUẢN TRỊ</DrawerLink>}
          {isOwner && <DrawerLink to="/my-store" onClick={closeNav} $active={false}>QUÁN CỦA TÔI</DrawerLink>}
          <DrawerAction onClick={() => { closeNav(); dispatch(toggleSearch()); }}><Search size={20} /> Tìm món</DrawerAction>
          <DrawerAction onClick={() => dispatch(toggleTheme())}><ThemeIcon size={20} /> {themeLabel}</DrawerAction>
        </DrawerBody>
      </Drawer>
    </>
  );
}
