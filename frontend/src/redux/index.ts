import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { baseApi } from './api/baseApi';
import { setupInterceptors } from './api/axiosClient';
import authReducer, { logout, persistAuth, setCredentials, setUser } from './slices/authSlice';
import uiReducer, { persistTheme, toggleTheme } from './slices/uiSlice';

const listener = createListenerMiddleware();

// Keep the persisted session in step with the auth slice.
listener.startListening({
  matcher: isAnyOf(setCredentials, setUser, logout),
  effect: (_action, { getState }) => persistAuth((getState() as RootState).auth),
});

// A different user (or none) must not see the previous user's cart/orders cache.
listener.startListening({
  matcher: isAnyOf(setCredentials, logout),
  effect: (_action, { dispatch }) => {
    dispatch(baseApi.util.resetApiState());
  },
});

// Remember an explicit light/dark choice.
listener.startListening({
  actionCreator: toggleTheme,
  effect: (_action, { getState }) => persistTheme((getState() as RootState).ui.theme),
});

export const store = configureStore({
  reducer: { auth: authReducer, ui: uiReducer, [baseApi.reducerPath]: baseApi.reducer },
  middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(baseApi.middleware),
});

// axios reads the token from the store and logs out on 401.
setupInterceptors(store, () => store.dispatch(logout()));

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Current session: `token` and `user` are null when logged out. */
export const useAuth = () => useAppSelector((s) => s.auth);
