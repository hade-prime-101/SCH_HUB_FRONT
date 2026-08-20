# 12 — API Client Strategy

How the frontend communicates with the backend. Grounded strictly in backend implementation — no invented endpoints, fields, or permissions.

---

## 1. Base URL Handling

- **Env var:** `NEXT_PUBLIC_API_BASE_URL` — e.g. `https://api.loopz.app/api/v1` in production, `http://localhost:4000/api/v1` in dev (verify backend port from `src/config/env.ts`).
- All API calls prefix this base URL. The base URL is read once at module init (`lib/api/config.ts`).
- API versioning: backend mounts all routes under `/api/v1` (verified in `src/routes.ts`). The client includes `/api/v1` in the base URL; no per-call versioning.
- **Health check:** `GET /health` is outside `/api/v1`? Verify — health.routes.ts mounts at `/health` in routes.ts. Health check uses absolute path (unprefixed) if so.

---

## 2. Authentication Headers / Cookies

- **Primary auth:** `Authorization: Bearer <accessToken>` header on every authenticated request.
- **Token retrieval:** access + refresh tokens stored in `localStorage` (keys `loopz_access`, `loopz_refresh`). Backend accepts refresh token in body (`POST /auth/refresh` per auth.routes.ts — verify payload shape).
- **CSRF:** token-in-header approach means CSRF is not a concern for API calls; do not use cookies for auth unless SSR middleware needs them.
- **Optional SSR cookie mirror:** if Next.js middleware needs to guard routes server-side, set an httpOnly cookie (`loopz_session`) on login/refresh that only signals "authenticated" (no token payload). All actual API calls still use the Bearer header from localStorage.

---

## 3. Token Refresh

- **Trigger:** interceptor sees `401` on any request → pause retries → initiate refresh.
- **Single-flight:** a module-level promise ensures only one refresh runs at a time; concurrent 401s await the same refresh.
- **Refresh call:** `POST /auth/refresh` with `{ refreshToken }` (verify exact field name from auth.routes.ts/validators).
- **On success:** store new access + refresh tokens; replay all queued requests with new access token.
- **On failure (refresh also 401/400):** purge tokens; redirect to `/login?redirect=<currentPath>`; emit `auth:expired` event for socket disconnect.
- **Refresh request itself:** no `Authorization` header (it uses the refresh token in body).
- **Backoff guard:** if refresh fails with network error, do not loop infinitely — max 1 retry then force re-login.

---

## 4. Request Interceptors

Since the frontend uses native `fetch` (via Next.js), interceptors are implemented as an `ApiClient` class wrapping fetch:

1. **Auth header injection:** attach `Authorization: Bearer <accessToken>` if token exists and endpoint is not public.
2. **Request ID:** (optional) generate `X-Request-Id` header per request to correlate with backend `requestId` in errors.
3. **Content-Type:** `application/json` for JSON bodies; `multipart/form-data` for uploads (do not set Content-Type manually for FormData — browser sets boundary).
4. **Timeout:** AbortController with 30s default timeout (60s for uploads/AI calls — verify backend no strict timeout).
5. **Retry network errors:** retry idempotent (GET) requests once on network failure.

---

## 5. Response Handling

- **Success envelope (backend reality):** `{ success: true, data: T }` — no `message` field (see CONFLICTS C1). The client unwraps `data` and returns `T`.
- **Error envelope (backend reality):** `{ success: false, message: string, requestId: string }` — always present (errorHandler.ts).
- **Non-envelope responses:** e.g., `GET /health` may be plain `{ status: 'ok' }` — health check bypasses envelope unwrap.
- **Blob/stream responses:** for file downloads (signed URLs — `window.open` / `<a href>`; no client fetch needed if backend returns direct URL).

---

## 6. Error Normalization

```
interface ApiError extends Error {
  status: number;            // HTTP status
  message: string;           // backend-provided message
  requestId?: string;        // for support correlation
  fields?: Record<string, string>;  // field-level validation errors (if backend returns)
  retryAfter?: number;       // for 429 rate-limit responses
  isNetworkError?: boolean;  // fetch failed (offline/DNS)
}
```

- `client.request<T>()` throws `ApiError` for any non-2xx.
- Field errors (400 validation) are extracted and returned as `fields` for `form.setError`.
- 429 responses include `Retry-After` header → `retryAfter` → UI shows "try again in Xs".
- Network failure → `isNetworkError: true` → UI shows offline banner.

---

## 7. Typed API Functions

- **Location:** `lib/api/endpoints/*.ts`, one file per domain: `auth.ts`, `users.ts`, `study.ts`, `ai.ts`, `cgpa.ts`, `planner.ts`, `reminders.ts`, `notifications.ts`, `community.ts`, `studyGroups.ts`, `marketplace.ts`, `campusMap.ts`, `school.ts`, `superAdmin.ts`.
- **Pattern per function:**
  ```ts
  // lib/api/endpoints/study.ts
  export async function getMaterials(params: MaterialQuery): Promise<Paginated<Material>> {
    return client.get<Paginated<Material>>('/study/materials', { params });
  }
  export async function createMaterial(input: CreateMaterialInput): Promise<Material> {
    return client.post<Material>('/study/materials', input);
  }
  ```
- **Types** in `lib/api/types/*.ts` — hand-written from controllers/services/validators (NOT from OpenAPI, which is incomplete — see CONFLICTS C7).
- All functions throw `ApiError`; callers (TanStack Query hooks) handle it.

---

## 8. Pagination

- Backend pagination style varies by module (verify each): some use `?page=&limit=`, some use cursor.
- Client abstracts via a `PaginationOptions { page|cursor, limit }` type per endpoint that matches backend.
- **Infinite scroll:** `useInfiniteQuery` with `getNextPageParam` mapping backend's `nextCursor`/`nextPage` → next query param. Fallback to page increment if backend returns no cursor.
- **Tables (admin):** `page + limit` state + `onPaginationChange`; server-side sort/filter via query params where backend supports (verify).

---

## 9. File Uploads

Two models possible (verify from backend upload middleware + services):

**A. Direct upload to R2/S3 (likely — `src/config/r2.ts` exists):**
- `POST /upload/presign` (or similar — verify actual endpoint) → returns `{ uploadUrl, fileKey }`.
- Client PUTs file directly to `uploadUrl` (no auth header needed on presigned PUT).
- Then sends `{ fileKey }` in the create-mutation payload.

**B. Multipart upload to API:**
- `POST /study/materials` with `multipart/form-data` (`file` field + metadata) (backend upload middleware `src/middleware/upload.ts` suggests this).
- Progress via XMLHttpRequest `onprogress` (native fetch has no upload-progress API).

- **Implementation note:** use a small `uploadFile` util that abstracts either model after the actual backend upload route is confirmed. Marketplace images, community post images, material files all route through this util.
- **Validation client-side:** file type/size mirrors backend `upload.ts` limits (verify limits).

---

## 10. Realtime Connections

- **Transport:** Socket.IO (`socket.io-client`). Backend socket server verified in `src/socket/socket.ts` + `study-group.socket.ts`.
- **Connection lifecycle:**
  - Connect after auth success (or after `/auth/me` restores session).
  - `auth: { token: accessToken }` in handshake (verify backend reads this).
  - Disconnect on logout; emit `presence:offline` if backend supports.
  - Reconnect with backoff; re-subscribe to rooms on reconnect.
- **Namespaces/rooms:** study-group chat likely rooms per groupId (verify `study-group.socket.ts`). Marketplace chat may use per-thread rooms or be HTTP-only.
- **Events to listen for (from socket source):**
  - `notification:new` → update notification feed cache + unread badge.
  - `group:message` (or similar) → append to group chat query cache.
  - `group:presence` → update member online status.
  - Marketplace chat events (if implemented).
- **Fallback:** if socket fails, poll HTTP equivalents (e.g., `GET /study-groups/:id/messages` every 30s; `GET /notifications` every 60s).

---

## 11. Client Architecture Summary

```
lib/api/
  config.ts          # base URL, timeouts, env
  client.ts          # ApiClient class: fetch wrapper, interceptor, refresh, error normalization
  endpoints/         # typed functions per domain (one file per domain)
  types/             # hand-written DTOs matching backend responses
  upload.ts          # file upload utility (direct-presigned OR multipart — decided after backend confirm)
  socket.ts          # socket.io client wrapper + typed event map
```

---

## 12. Confirmed-Before-Implementation Checklist

| Item | Verify in backend | Decides |
|---|---|---|
| Refresh endpoint + payload | `auth.routes.ts`, `auth.validators.ts` | refresh call shape |
| Upload mechanism | `upload.ts`, `r2.ts`, study controller | upload util model |
| Socket handshake shape | `socket.ts`, `study-group.socket.ts` | auth token in connect |
| Pagination style | each module's controller query parsing | infinite scroll vs table paging |
| Health check path/prefixed | `routes.ts`, `health.routes.ts` | health URL |
| Rate-limit headers | `rateLimiter.ts` | 429 UX |