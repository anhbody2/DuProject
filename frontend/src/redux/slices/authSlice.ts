import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

const KEY = 'du.auth';

interface AuthState {
  token: string | null;
  user: User | null;
  /** Keep the session in localStorage (survives restarts) instead of sessionStorage. */
  remember: boolean;
}

// --- persistence ---

function readPersistedAuth(): Partial<AuthState> | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { token, user, remember } = JSON.parse(raw) as AuthState;
    return { token, user, remember };
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

// The app is client-only, so the saved session is restored synchronously.
const initialState: AuthState = { token: null, user: null, remember: true, ...readPersistedAuth() };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
