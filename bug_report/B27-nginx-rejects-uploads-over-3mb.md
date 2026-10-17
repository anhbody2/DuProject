# B27 — nginx rejected image uploads between 3 MB and 5 MB

| | |
|---|---|
| Severity | Medium |
| Area | Uploads / Docker deployment |
| Status | Fixed — the nginx change was already in the working copy (`frontend/nginx.conf.template`, saved 2026-09-28 16:52). Verified, and a client-side message added on 2026-09-29 |
| Files changed | `frontend/nginx.conf.template` (already done), `frontend/src/redux/api/baseApi.ts` (this fix) |

## The bug

Three layers enforce an upload size, and they disagreed:

| Layer | Limit (before) |
|---|---|
| `ImageUpload` component (dish photos, store cover and logo) | 5 MB |
| API `POST /uploads/images` (multer `fileSize`) | 5 MB |
| nginx in the frontend container (`client_max_body_size`) | **3 MB** |

In Docker, every request goes through nginx, so a 3–5 MB photo passed the browser check and was
then refused by nginx with **413 Request Entity Too Large** before it reached the API. nginx
replies with an HTML page, not a Nest JSON error, so the SPA only showed the generic
"Có lỗi xảy ra, thử lại nhé". Local `npm run dev` (Vite proxy, no limit) worked fine, which made
the bug hard to spot.

## What changed

**1. nginx limit (already in your working copy):**

```nginx
location /api/ {
  # Image uploads are capped at 5 MB by the API (uploads.controller.ts) and ImageUpload;
  # leave room for the multipart envelope. Keep this above that limit or nginx answers 413.
  client_max_body_size 6m;
```

6 MB leaves about 1 MB for the multipart envelope (boundaries, headers, and other form fields)
above the 5 MB file limit.

**2. Clear message if it ever happens again (this fix):** `errorMessage()` in
`frontend/src/redux/api/baseApi.ts` now maps a bare 413 to a readable toast:

```ts
// nginx answers an oversized upload itself (HTML body, no Nest message).
if (e?.status === 413) return 'Tệp quá lớn, thử ảnh nhỏ hơn nhé';
```

The API's own 413 (multer `File too large`) carries a JSON `message`, so the existing branch above
this line still shows it first.

## Verification (the limits now line up)

| Layer | Limit |
|---|---|
| `ImageUpload` / `POST /uploads/images` | 5 MB |
| Account avatar / `POST /me/avatar` | 2 MB |
| nginx `/api/` | 6 MB ✅ above both |

## How to test

1. `docker compose up -d --build frontend` (the template is rendered when the container starts).
2. In the store console, upload a 4 MB JPEG as a dish photo. It should succeed.
3. Upload a 5.5 MB file. The browser blocks it with "Ảnh tối đa 5MB thôi nha".
4. Optional: `curl` a 7 MB body to `/api/uploads/images`. The SPA would now show
   "Tệp quá lớn, thử ảnh nhỏ hơn nhé" instead of the generic error.

## Follow-up

Keep the three numbers in one place. For example, add a comment in `uploads.controller.ts` that
points to `nginx.conf.template`, or read the limit from env in both.
