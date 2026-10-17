# Dủ storefront

React 19 + Vite SPA for the food marketplace. Ant Design 6 and styled-components 6 for UI, Redux Toolkit / RTK Query for state, with light and dark themes.

```bash
npm install
npm run dev       # http://localhost:5173, proxies /api to BACKEND_URL (default http://localhost:3000)
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/ with the same /api proxy
```

Optional env (see `.env.example`): `BACKEND_URL` (dev proxy target), `VITE_API_URL` (axios base URL, defaults to `/api`), `VITE_DELIVERY_FEE_PER_STORE` (display-only; defaults to 15000).

Layout: `src/pages/<Name>Page/` (one folder per route: `index.tsx` for the component, `styles.ts` for its styled-components), `src/components` (Header, SearchPanel, CartDrawer, DishCard, StoreMap, Footer, shared `ui.tsx`), `src/redux` (store in `index.ts`, `slices/`, and `api/`: axios client + one RTK Query file per backend module), `src/theme` (tokens, antd theme, global CSS variables), `src/styles/base.css` (fonts, keyframes, Leaflet/antd overrides).
