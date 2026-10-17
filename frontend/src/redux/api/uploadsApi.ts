import { baseApi } from './baseApi';

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Stores the image on the server and returns its public path, to save in an image field. */
    uploadImage: b.mutation<{ url: string }, File>({
      query: (file) => {
        const data = new FormData();
        data.append('file', file);
        // Overrides the client's JSON default, which would make axios serialise the FormData as JSON.
        return { url: '/uploads/images', method: 'POST', data, headers: { 'Content-Type': 'multipart/form-data' } };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadsApi;
