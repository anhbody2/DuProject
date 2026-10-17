import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig, type Method } from 'axios';
import { http } from './axiosClient';

export interface AxiosArgs {
  url: string;
  method?: Method;
  /** Request body. */
  data?: unknown;
  /** Query string. Undefined and empty values are dropped (the API rejects unknown or blank fields). */
  params?: Record<string, unknown>;
  headers?: AxiosRequestConfig['headers'];
}

/**
 * Error shape handed to components. `status` is the HTTP code, or 'FETCH_ERROR'
 * when the backend could not be reached. `data` is the NestJS error body.
 */
export interface ApiQueryError {
  status: number | 'FETCH_ERROR' | 'TIMEOUT_ERROR';
  data?: unknown;
}

const clean = (p?: Record<string, unknown>) =>
  p && Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));

/** RTK Query base query that sends every request through the shared axios instance. */
export const axiosBaseQuery: BaseQueryFn<AxiosArgs | string, unknown, ApiQueryError> = async (args, { signal }) => {
  const { url, method = 'GET', data, params, headers } = typeof args === 'string' ? { url: args } : args;
  try {
    const res = await http.request({ url, method, data, params: clean(params), headers, signal });
    return { data: res.data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response) return { error: { status: err.response.status, data: err.response.data } };
      return { error: { status: err.code === 'ECONNABORTED' ? 'TIMEOUT_ERROR' : 'FETCH_ERROR', data: err.message } };
    }
    return { error: { status: 'FETCH_ERROR', data: String(err) } };
  }
};
