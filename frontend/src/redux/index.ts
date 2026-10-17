import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './api';
import authReducer, { logout, persistAuth, setCredentials, setUser } from './authSlice';
import uiReducer from './uiSlice';

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
    dispatch(api.util.resetApiState());
  },
});

export const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Logged-in user, or null. False-y until the stored session is read. */
export const useAuth = () => useAppSelector((s) => s.auth);
