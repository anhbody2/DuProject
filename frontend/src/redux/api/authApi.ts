import { baseApi } from './baseApi';
import type { AuthResponse, Role, User } from '../types';

export interface LoginBody {
  /** Email or username. */
  login: string;
  password: string;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
  role?: Extract<Role, 'customer' | 'store_owner'>;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ResetCodeBody {
  email: string;
  code: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResponse, LoginBody>({
      query: (data) => ({ url: '/auth/login', method: 'POST', data }),
    }),
    register: b.mutation<AuthResponse, RegisterBody>({
      query: (data) => ({ url: '/auth/register', method: 'POST', data }),
    }),
    /** Public ids for the provider SDKs; null means that provider is disabled on the server. */
    socialConfig: b.query<{ google: string | null; facebook: string | null }, void>({
      query: () => '/auth/social/config',
    }),
    /** Creates the account on first use, like register. */
    googleLogin: b.mutation<AuthResponse, { idToken: string }>({
      query: (data) => ({ url: '/auth/google', method: 'POST', data }),
    }),
    facebookLogin: b.mutation<AuthResponse, { accessToken: string }>({
      query: (data) => ({ url: '/auth/facebook', method: 'POST', data }),
    }),
    /** Always succeeds (the API hides whether the email exists). */
    forgotPassword: b.mutation<{ message: string }, { email: string }>({
      query: (data) => ({ url: '/auth/forgot-password', method: 'POST', data }),
    }),
    verifyResetCode: b.mutation<{ valid: true }, ResetCodeBody>({
      query: (data) => ({ url: '/auth/verify-reset-code', method: 'POST', data }),
    }),
    /** Logs the user in, like login. */
    resetPassword: b.mutation<AuthResponse, ResetCodeBody & { newPassword: string }>({
      query: (data) => ({ url: '/auth/reset-password', method: 'POST', data }),
    }),
    me: b.query<User, void>({
      query: () => '/me',
      providesTags: ['Me'],
    }),
    /** Returns the updated user; the caller stores it with setUser. */
    uploadAvatar: b.mutation<User, File>({
      query: (file) => {
        const data = new FormData();
        data.append('file', file);
        // Overrides the client's JSON default, which would make axios serialise the FormData as JSON.
        return { url: '/me/avatar', method: 'POST', data, headers: { 'Content-Type': 'multipart/form-data' } };
      },
      invalidatesTags: ['Me'],
    }),
    removeAvatar: b.mutation<User, void>({
      query: () => ({ url: '/me/avatar', method: 'DELETE' }),
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useSocialConfigQuery, useGoogleLoginMutation, useFacebookLoginMutation,useForgotPasswordMutation, useVerifyResetCodeMutation, useResetPasswordMutation, useMeQuery, useLazyMeQuery, useUploadAvatarMutation, useRemoveAvatarMutation,
} = authApi;
