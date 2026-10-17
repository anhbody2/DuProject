import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode } from '@/theme/tokens';
import { logout } from './authSlice';

const THEME_KEY = 'du.theme';

/** The theme the user picked, or null when they never toggled it (follow the system). */
export function readStoredTheme(): ThemeMode | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' || t === 'light' ? t : null;
  } catch {
    return null;
  }
}

export function persistTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* storage unavailable - the choice lasts for this visit only */
  }
}

export const systemTheme = (): ThemeMode => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

interface UiState {
  cartOpen: boolean;
  searchOpen: boolean;
  /** Mobile navigation drawer. */
  navOpen: boolean;
  /** Floating chat panel, and the conversation shown in it (null = the list). */
  chatOpen: boolean;
  chatId: number | null;
  theme: ThemeMode;
}

const initialState: UiState = { cartOpen: false, searchOpen: false, navOpen: false, chatOpen: false, chatId: null, theme: readStoredTheme() ?? systemTheme() };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartOpen(state, { payload }: PayloadAction<boolean>) {
      state.cartOpen = payload;
      if (payload) state.searchOpen = state.navOpen = state.chatOpen = false;
    },
    toggleSearch(state) {
      state.searchOpen = !state.searchOpen;
      state.navOpen = false;
    },
    setNavOpen(state, { payload }: PayloadAction<boolean>) {
      state.navOpen = payload;
    },
    /** Opens the chat panel, on a conversation when given one (null = the list). */
    openChat(state, { payload }: PayloadAction<number | null | undefined>) {
      state.chatOpen = true;
      if (payload !== undefined) state.chatId = payload;
      state.cartOpen = state.searchOpen = state.navOpen = false;
    },
    setChatOpen(state, { payload }: PayloadAction<boolean>) {
      state.chatOpen = payload;
    },
    closeOverlays(state) {
      state.cartOpen = state.searchOpen = state.navOpen = state.chatOpen = false;
    },
    /** Follows the OS setting; not persisted. */
    setTheme(state, { payload }: PayloadAction<ThemeMode>) {
      state.theme = payload;
    },
    /** Explicit user choice; persisted by the store listener. */
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
  extraReducers: (b) => {
    // The next user must not land in the previous user's conversation.
    b.addCase(logout, (state) => {
      state.chatOpen = false;
      state.chatId = null;
    });
  },
});

export const { setCartOpen, toggleSearch, setNavOpen, openChat, setChatOpen, closeOverlays, setTheme, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
