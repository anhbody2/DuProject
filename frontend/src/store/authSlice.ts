import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from './types';

const KEY = 'du.auth';

interface AuthState {
  token: string | null;
  user: User | null;
  /** Keep the session in localStorage (survives restarts) instead of sessionStorage. */
  remember: boolean;
  /** False until the persisted session has been read on the client. */
  hydrated: boolean;
}

const initialState: AuthState = { token: null, user: null, remember: true, hydrated: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrate(state, { payload }: PayloadAction<Partial<AuthState> | null>) {
      Object.assign(state, payload ?? {}, { hydrated: true });
    },
    setCredentials(state, { payload }: PayloadAction<{ token: string; user: User; remember?: boolean }>) {
      state.token = payload.token;
      state.user = payload.user;
      if (payload.remember !== undefined) state.remember = payload.remember;
    },
    setUser(state, { payload }: PayloadAction<User>) {
      state.user = payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { hydrate, setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

// --- persistence (browser only) ---

export function readPersistedAuth(): Partial<AuthState> | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistAuth({ token, user, remember }: AuthState) {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ token, user, remember }));
  } catch {
    /* storage unavailable (private mode) - session just won't persist */
  }
}
