import { baseApi } from './baseApi';
import type { Address } from '../types';

export type NewAddressBody = Omit<Address, 'id' | 'isDefault' | 'label' | 'ward' | 'district' | 'city' | 'latitude' | 'longitude'> &
  Partial<Pick<Address, 'label' | 'ward' | 'district' | 'city' | 'latitude' | 'longitude' | 'isDefault'>>;

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    addresses: b.query<Address[], void>({
      query: () => '/addresses',
      providesTags: ['Addresses'],
    }),
    createAddress: b.mutation<Address, NewAddressBody>({
      query: (data) => ({ url: '/addresses', method: 'POST', data }),
      invalidatesTags: ['Addresses'],
    }),
    updateAddress: b.mutation<Address, { id: number } & Partial<NewAddressBody>>({
      query: ({ id, ...data }) => ({ url: `/addresses/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Addresses'],
    }),
    setDefaultAddress: b.mutation<Address, number>({
      query: (id) => ({ url: `/addresses/${id}/default`, method: 'PATCH' }),
      invalidatesTags: ['Addresses'],
    }),
    // Placed orders keep their own copy of the address, so deleting is always safe.
    deleteAddress: b.mutation<void, number>({
      query: (id) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),
  }),
});

export const {
  useAddressesQuery, useCreateAddressMutation, useUpdateAddressMutation, useSetDefaultAddressMutation, useDeleteAddressMutation,
} = addressesApi;
