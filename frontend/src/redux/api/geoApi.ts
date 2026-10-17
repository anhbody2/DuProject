import { baseApi } from './baseApi';

/** A VietMap autocomplete hit; resolve it to coordinates with `place`. */
export interface GeoSuggestion { refId: string; name: string; address: string; display: string }

/** Address fields ready to drop into an Address / StoreLocation form (2-level: ward, province). */
export interface GeoPlace {
  addressLine: string;
  ward: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  display: string;
}

/** Proxied VietMap lookups (GET /geo/*); the server keeps the API key. */
export const geoApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** `tileKey` null = draw the default map; `geocoding` false = no address search. */
    geoConfig: b.query<{ tileKey: string | null; geocoding: boolean }, void>({
      query: () => '/geo/config',
      keepUnusedDataFor: 3600,
    }),
    geoAutocomplete: b.query<GeoSuggestion[], { text: string; lat?: number; lng?: number }>({
      query: (params) => ({ url: '/geo/autocomplete', params }),
    }),
    geoPlace: b.query<GeoPlace, string>({
      query: (refId) => ({ url: '/geo/place', params: { refId } }),
    }),
    geoReverse: b.query<GeoPlace, { lat: number; lng: number }>({
      query: (params) => ({ url: '/geo/reverse', params }),
    }),
  }),
});

export const { useGeoConfigQuery, useGeoAutocompleteQuery, useLazyGeoPlaceQuery, useLazyGeoReverseQuery } = geoApi;
