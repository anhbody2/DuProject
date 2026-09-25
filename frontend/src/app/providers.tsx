'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { makeStore, useAppDispatch, useAuth, type AppStore } from '@/store';
import { hydrate, readPersistedAuth, setUser } from '@/store/authSlice';
import { closeOverlays } from '@/store/uiSlice';
import { useMeQuery } from '@/store/api';

// Restores the saved session, then refreshes the user from /me so a stale
// profile (or a suspended account, which answers 401) is picked up.
function SessionSync() {
  const dispatch = useAppDispatch();
  const { token, hydrated } = useAuth();
  const { data } = useMeQuery(undefined, { skip: !hydrated || !token });

  useEffect(() => { dispatch(hydrate(readPersistedAuth())); }, [dispatch]);
  useEffect(() => { if (data) dispatch(setUser(data)); }, [data, dispatch]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch(closeOverlays()); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const store = useRef<AppStore | null>(null);
  if (!store.current) store.current = makeStore();
  return (
    <Provider store={store.current}>
      <SessionSync />
      {children}
      <Toaster
        position="bottom-center"
        style={{ zIndex: 100 }}
        toastOptions={{
          unstyled: true,
          style: {
            background: 'var(--ink)', color: 'var(--gold)', fontWeight: 800, fontSize: 14, padding: '12px 20px',
            boxShadow: '0 6px 0 var(--green)', fontFamily: 'var(--font)', maxWidth: '90vw', textAlign: 'center',
          },
        }}
      />
    </Provider>
  );
}
