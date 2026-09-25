'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User } from 'lucide-react';
import { sx } from '@/lib/sx';
import { useAppDispatch, useAuth } from '@/store';
import { useCartQuery } from '@/store/api';
import { setCartOpen, toggleSearch } from '@/store/uiSlice';

const navLink = 'cursor:pointer;font-weight:800;font-size:14px;letter-spacing:.05em;color:var(--gold);padding:6px 0;border-bottom:2px solid transparent';
const iconBtn = 'all:unset;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;color:#1a0f10;position:relative';

export default function Header() {
  const path = usePathname();
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const { data: cart } = useCartQuery(undefined, { skip: !token });
  const account = token ? '/account' : '/login';
  const count = cart?.itemCount ?? 0;

  const nav = (label: string, href: string) => (
    <Link href={href} className="hv-white" style={{ ...sx(navLink), borderBottomColor: path === href ? 'var(--gold)' : 'transparent' }}>{label}</Link>
  );

  return (
    <header className="red-texture" style={sx('padding:18px clamp(16px,4vw,56px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;position:relative;z-index:5')}>
      <nav style={sx('display:flex;align-items:center;flex-wrap:wrap;gap:6px clamp(14px,2.6vw,36px)')}>
        {nav('MENU', '/menu')}
        {nav('CHỢ XÓM', '/market')}
        <Link href="/" title="Dủ" className="hv-logo" style={{ display: 'block', lineHeight: 0 }}>
          <Image src="/assets/logo.png" alt="Dủ" width={68} height={54} priority />
        </Link>
        {nav('ABOUT', '/')}
        {nav('JOIN IN', account)}
      </nav>
      <div style={sx('display:flex;align-items:center;gap:14px')}>
        <Link href={account} title="Tài khoản" className="hv-pop-gold" style={sx(iconBtn)}><User size={22} strokeWidth={2.4} /></Link>
        <button onClick={() => dispatch(toggleSearch())} title="Tìm món" className="hv-wiggle-gold" style={sx(iconBtn)}><Search size={22} strokeWidth={2.4} /></button>
        <button onClick={() => dispatch(setCartOpen(true))} title="Giỏ hàng" className="hv-roll-gold" style={sx(iconBtn)}>
          <ShoppingCart size={24} strokeWidth={2.4} />
          {count > 0 && <span style={sx('position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;border-radius:10px;background:var(--gold);color:var(--ink);font-size:11px;font-weight:900;display:grid;place-items:center;padding:0 5px;border:2px solid var(--red)')}>{count}</span>}
        </button>
      </div>
    </header>
  );
}
