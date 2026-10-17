/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Defaults to the proxied relative `/api`. */
  readonly VITE_API_URL?: string;
  /** Mirrors the backend's DELIVERY_FEE_PER_STORE (display only). */
  readonly VITE_DELIVERY_FEE_PER_STORE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
