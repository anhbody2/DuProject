import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux';
import { toggleTheme } from '@/redux/slices/uiSlice';
import { Brand, Main, Shell, Side, SideButton, SideFoot, SideLink } from './styles';

export interface ConsoleNavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

/** Back-office layout shared by the admin and store consoles: red sidebar nav plus a content column. */
export default function ConsoleShell({ title, nav, sideExtra, children }: {
  title: string;
  nav: ConsoleNavItem[];
  /** Rendered under the brand, above the nav (e.g. a store picker). */
  sideExtra?: ReactNode;
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const dark = useAppSelector((s) => s.ui.theme) === 'dark';
  const ThemeIcon = dark ? Sun : Moon;

  return (
    <Shell>
      <Side>
        <Brand><img src="/assets/logo.png" alt="Dủ" /><span>{title}</span></Brand>
        {sideExtra}
        {nav.map(({ to, label, icon: Icon, end }) => (
          <SideLink key={to} to={to} end={end}><Icon size={18} strokeWidth={2.4} /> {label}</SideLink>
        ))}
        <SideFoot>
          <SideButton type="button" onClick={() => dispatch(toggleTheme())}>
            <ThemeIcon size={18} /> {dark ? 'Chế độ sáng' : 'Chế độ tối'}
          </SideButton>
          <SideLink to="/" end><ArrowLeft size={18} /> Về cửa hàng</SideLink>
        </SideFoot>
      </Side>
      <Main>{children}</Main>
    </Shell>
  );
}
