import { useEffect, useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ThemeProvider } from 'styled-components';
import { store, useAppDispatch, useAppSelector, useAuth } from '@/redux';
import { setUser } from '@/redux/slices/authSlice';
import { closeOverlays, readStoredTheme, setTheme } from '@/redux/slices/uiSlice';
import { useMeQuery } from '@/redux/api';
import { bindToast } from '@/lib/toast';
import { antdTheme } from '@/theme/antdTheme';
import { GlobalStyle } from '@/theme/GlobalStyle';
import { palettes } from '@/theme/tokens';

// Refreshes the user from /me so a stale profile (or a suspended account,
// which answers 403 "Account is suspended" and logs out) is picked up. Escape closes overlays.
function SessionSync() {
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const { data } = useMeQuery(undefined, { skip: !token });

  useEffect(() => { if (data) dispatch(setUser(data)); }, [data, dispatch]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch(closeOverlays()); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
  return null;
}

// Until the user picks a theme, follow the OS setting live.
function SystemThemeSync() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => { if (!readStoredTheme()) dispatch(setTheme(e.matches ? 'dark' : 'light')); };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [dispatch]);
  return null;
}

function ToastBridge() {
  const { message } = AntApp.useApp();
  useEffect(() => bindToast(message), [message]);
  return null;
}

/** One theme source for both styled-components (CSS vars) and Ant Design (tokens). */
function Themed({ children }: { children: ReactNode }) {
  const mode = useAppSelector((s) => s.ui.theme);
  const theme = useMemo(() => ({ mode, c: palettes[mode] }), [mode]);
  const antd = useMemo(() => antdTheme(mode), [mode]);
  useEffect(() => { document.documentElement.dataset.theme = mode; }, [mode]);

  return (
    <ConfigProvider locale={viVN} theme={antd}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AntApp component={false} message={{ maxCount: 3 }}>
          <ToastBridge />
          {children}
        </AntApp>
      </ThemeProvider>
    </ConfigProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionSync />
      <SystemThemeSync />
      <Themed>{children}</Themed>
    </Provider>
  );
}
