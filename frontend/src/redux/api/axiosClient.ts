import axios, { AxiosHeaders } from 'axios';
import type { Store } from '@reduxjs/toolkit';

/**
 * Base URL of the NestJS API. Defaults to the relative `/api`, which the Vite dev
 * server (and nginx in Docker) proxies to the backend, so no CORS is involved.
 * Set VITE_API_URL (e.g. http://localhost:3000/api) to call the backend directly;
 * the backend's CORS_ORIGIN must then allow this origin.
 */
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Shared axios instance. Use it directly for one-off calls outside RTK Query (e.g. uploads). */
export const http = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

interface AuthSlice {
  auth: { token: string | null };
}

/**
 * Wires the store into axios: attaches the bearer token to every request and
 * drops the session on 401. Called once by the store (it can't be imported here
 * without a circular dependency).
 */
export function setupInterceptors(store: Store<AuthSlice>, onUnauthorized: () => void) {
  http.interceptors.request.use((config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  http.interceptors.response.use(
    (res) => res,
    (error) => {
      // The session is gone when the API answers 401 (missing, invalid or expired token) or
      // 403 "Account is suspended|inactive" (AuthMiddleware re-checks the account on every
      // request). Other 403s are ordinary "no permission" answers and must not log out, and
      // bad input from a logged-in user is a 400, so this never logs out on a typo.
      if (axios.isAxiosError(error) && store.getState().auth.token && isSessionLost(error.response?.status, error.response?.data)) {
        onUnauthorized();
      }
      return Promise.reject(error);
    },
  );
}

/** AuthMiddleware's 403 for an account that is no longer active: `Account is <status>`. */
const ACCOUNT_BLOCKED = /^Account is (suspended|inactive)\b/;

/** True when an API error means the stored session can no longer be used. */
export function isSessionLost(status: number | undefined, data: unknown): boolean {
  if (status === 401) return true;
  const message = data && typeof data === 'object' && 'message' in data ? (data as { message: unknown }).message : undefined;
  return status === 403 && typeof message === 'string' && ACCOUNT_BLOCKED.test(message);
}
