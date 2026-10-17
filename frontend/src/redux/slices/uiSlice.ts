import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  cartOpen: boolean;
  searchOpen: boolean;
}

const initialState: UiState = { cartOpen: false, searchOpen: false };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartOpen(state, { payload }: PayloadAction<boolean>) {
      state.cartOpen = payload;
      if (payload) state.searchOpen = false;
    },
    toggleSearch(state) {
      state.searchOpen = !state.searchOpen;
    },
    closeOverlays(state) {
      state.cartOpen = false;
      state.searchOpen = false;
    },
  },
});

export const { setCartOpen, toggleSearch, closeOverlays } = uiSlice.actions;
export default uiSlice.reducer;
