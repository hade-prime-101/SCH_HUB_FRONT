# 11 — Frontend Architecture

## Stack Recommendation

**Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui** — no backend constraint prevents this. Backend is a REST API on `/api/v1` with a Socket.IO server; it places **no** constraint on the frontend framework. Next.js App Router is chosen for: file-based routing (large app), RSC/SSR for public pages, middleware for auth redirects, and a strong ecosystem.

Supporting libraries:
- **Data fetching/caching:** TanStack Query (server state) + native fetch with Next.js cache where appropriate.
- **Forms:** React Hook Form + Zod (schema validation mirrors backend validators).
- **Realtime:** `socket.io-client` (backend uses Socket.IO per `src/socket/socket.ts`).
- **Maps:** MapLibre GL JS (campus map with GeoJSON).
- **Tables:** TanStack Table for admin/moderation tables.
- **Markdown/poor rendering:** `react-markdown` for AI summaries/study plans.

---

## Route Structure (App Router)

```
app/
  (auth)/                 # Public auth pages
    login/
    register/
    forgot-password/      # only if backend supports
  (app)/                  # Authenticated app shell (sidebar/header)
    layout.tsx            # root shell: nav, notification bell, socket provider
    page.tsx              # role-based dashboard (redirect per dashboardRedirect)
    profile/
    settings/
    materials/
      page.tsx            # browse all
      upload/             # upload flow
      my-uploads/
      [id]/               # material detail
    quizzes/
      page.tsx
      [id]/               # attempt screen
      [id]/results/
    ai/
      summarize/
      study-plan/
    cgpa/
    planner/
      timetable/
      events/
    reminders/
    notifications/
    community/
      page.tsx
      [id]/               # post detail w/ comments
    study-groups/
      page.tsx
      [id]/               # group chat
    marketplace/
      page.tsx
      listings/[id]/
      my-listings/
      favorites/
      chat/[threadId]/
    campus-map/
  (admin)/                # Role-gated admin surfaces
    school/               # school-admin
      dashboard/
      materials/moderation/
      quizzes/moderation/
      faculties/
      departments/
      courses/
      students/
      moderation/community/
      moderation/marketplace/
      announcements/
    super/                # super-admin
      dashboard/
      schools/
      users/
      audit-logs/
      moderation/all/
```

**Layout hierarchy:**
- Root layout → AuthProvider (hydration, token restore).
- `(app)` layout → AppShell (sidebar, header, notification bell), guarded by middleware + client guard.
- `(admin)` layout → AdminShell (admin nav), nested guard for role.

---

## Feature/Module Structure

```
src/
  app/                    # Next.js routes (thin — composition only)
  components/
    ui/                   # shadcn/ui primitives
    shared/               # DataTable, FileUploader, EmptyState, StatusBadge, Toast, ConfirmDialog
    layout/               # Sidebar, Header, BottomNav, NotificationBell
    feature/              # one folder per domain:
      materials/          # MaterialCard, UploadForm, MaterialDetail
      quizzes/            # QuizCard, QuizAttemptView, QuizBuilder
      ai/                 # SummaryPanel, StudyPlanTimeline, AIComposer
      cgpa/               # GpaHero, CourseTable, AddCourseModal
      planner/            # TimetableGrid, EventModal
      reminders/          # ReminderList, ReminderForm
      community/          # PostCard, PostComposer, CommentThread, ReportModal
      study-groups/       # GroupCard, ChatFeed, GroupMembersSidebar
      marketplace/        # ListingCard, ListingForm, ChatThread, ReviewForm
      campus-map/         # MapView, CategoryFilter, PlacePopup
      admin/              # ModerationTable, AuditLogViewer, SchoolForm
  lib/
    api/                  # API client (see 12-API-CLIENT.md)
      client.ts
      endpoints/          # typed functions per domain
      types/              # generated/manually-typed DTOs
    auth/                 # AuthProvider, token storage, useAuth hook, guards
    socket/               # socket provider + typed event hooks
    validation/           # zod schemas (client mirror of backend)
    utils/                # formatting ($, dates, CGPA)
  hooks/
    useSocketEvent, useInfiniteQuery, useDebouncedSearch, useUpload...
  stores/                 # zustand only for UI state (toasts, drawers, filters) + auth session cache
```

---

## Component Architecture

- **Atomic-ish, feature-split:** primitives (`ui/`) → composed shared components (`shared/`) → feature components (`feature/<domain>/`) → pages.
- Pages are thin: fetch with TanStack Query hooks (encapsulated in `hooks/` or `lib/api`), render feature components, no business logic.
- **Data components** (server components where possible) fetch initial data; **client components** (the `"use client"`) handle interactivity. Prefer server components for lists that need no instant mutation, client components for forms/chats/maps.
- **Composition patterns:** each feature exposes a `components` folder with a barrel export (`index.ts`). Navigation items are data-driven (`navConfig.ts`) so role filtering is declarative.
- **Modals:** central `ModalProvider` + `useModal()` for confirm dialogs and form modals (e.g., AddCourseModal, ReportModal, CreateListingModal).

---

## API Client Architecture

See **12-API-CLIENT.md**. Summary:
- `lib/api/client.ts`: fetch wrapper with `Authorization: Bearer <accessToken>`, base URL from `NEXT_PUBLIC_API_BASE_URL`, JSON envelope unwrap (`res.data`), error normalization to `ApiError`, automatic 401 → refresh → retry (single-flight).
- `lib/api/endpoints/*.ts`: typed functions per domain (`getMaterials(params)`, `createMaterial(payload)`, ...) returning `ApiResult<T>`.
- Typed DTOs in `lib/api/types/` derived from backend responses (hand-written from controllers/services; do **not** auto-generate from incomplete OpenAPI).

---

## Authentication Architecture

- **Token storage:** `localStorage` (access + refresh). Access token ~short-lived; refresh token used by interceptor. (Verify server-side refresh endpoint: `POST /auth/refresh` exists per auth.routes.ts.)
- **AuthProvider:** on mount, restore tokens → call `/auth/me` to validate session → hydrate user context; if refresh fails → redirect to `/login`.
- **Session expiry handling:** interceptor catches `401` → single-flight refresh → retry original request. If refresh fails → purge tokens → redirect to login with `?redirect=` preserved.
- **Guard layers:**
  1. **Next.js middleware** — redirects unauthenticated users away from `(app)` routes based on cookie presence of `loopz_access` (if cookies are used for SSR) — otherwise guard client-side only.
  2. **Client route guard** (`<RequireAuth>` / `<RequireRole roles={['SCHOOL_ADMIN']}>`) wraps layouts.
  3. **Realtime auth:** socket `auth: { token }` on connect (per socket.ts).
- **Role maps:** `role → dashboardRedirect` mirroring backend (see backend `auth.service.ts`), `role → nav items`, `role → allowed routes`.

---

## State Management

- **Server state (data from API):** TanStack Query. Keys per domain: `['materials', filters]`, `['quizzes', id]`, `['marketplace', 'listings', page]`, `['notifications', 'unread-count']`. Invalidation after mutations (`invalidateQueries` on key prefix).
- **Auth/session:** AuthProvider context (user, tokens, actions).
- **UI state:** Zustand — toasts, drawer state, active filter state, map view state, notification-unread badge cache, optimistic UI pending maps.
- **Realtime state:** socket events write into TanStack Query cache (via `queryClient.setQueryData`) — e.g., new chat message appends to chat query; unread-count bump via socket → zustand + query.
- **Forms:** React Hook Form local state with zod resolver.

---

## Caching Strategy

- **TanStack Query defaults:** `staleTime: 30s` for dashboard aggregates, `5m` for lists (materials, listings, posts), `Infinity` for reference data (faculties, departments, courses until cache-busted by admin mutation).
- **Infinite queries:** community feed, marketplace listings, notifications — `useInfiniteQuery` with cursor/page param; append pages.
- **Optimistic updates:** reminders complete/snooze, post like toggle, listing favorite toggle, chat message send (append + rollback on error).
- **SSR caching:** public pages only (login/register); app pages are client-fetched to keep permissions fresh per user. `revalidatePath` not needed for CSR data.
- **Upload cache:** signed URLs stored as returned; regenerate when expired (backend provides download URL per material).

---

## Form Handling & Validation

- **React Hook Form + zod** for every form. Zod schemas live in `lib/validation/` mirroring backend validator constraints (e.g., email format, required credits, grade enum `A|B|C|D|E|F`).
- Server validation errors (`400`) surface field-level: `ApiError.fields` → map to `form.setError`.
- Multi-step forms (material upload, onboarding) use a step state machine preserving values in RHF `useFieldArray`/session.

---

## Error Handling

- **Global error boundary** (`components/shared/ErrorBoundary.tsx`) wraps each route group: catches render errors, shows fallback + retry button + dev-mode error details.
- **API error normalization** (`lib/api/client.ts`): every API error is normalized to `ApiError { status, message, requestId, fields?, retryAfter? }`. TanStack Query `onError` handlers surface toasts for non-field errors; field errors go to `form.setError`.
- **Route-level error.tsx** files in App Router for per-segment error UI.
- **Network-offline detection:** navigator.onLine check before API calls; show offline banner via zustand `connectionStore`.
- **Retry logic:** TanStack Query `retry: 2` for idempotent GETs; `retry: false` for mutations. Refresh token retry is handled by the interceptor (not TanStack Query).
- **404 / 403 handling:** API client throws `ApiError` with status; specific status-based redirects for `403` (unauthorized → redirect to login) and `404` (show not-found UI).

---

## Loading States

- **Skeleton loaders:** `DataTable.Skeleton`, `CardSkeleton`, `ListSkeleton` components per feature. Use `Suspense` boundary with fallback at route segment level.
- **Initial load:** TanStack Query `isLoading` → skeleton. `isFetching` (background refetch) → subtle spinner overlay (no content flash).
- **Mutations:** button loading spinner + disabled state during mutation; optimistic UI skips spinner entirely.
- **Infinite scroll loading:** `InfiniteScroll` component with bottom spinner + "Load more" fallback.
- **File upload:** per-file progress bar; aggregate progress indicator for multi-file uploads.
- **Page transitions:** App Router loading.tsx files per segment for route-level loading state.

---

## Optimistic Updates

Applied where UX impact is high:
- **Reminder complete/snooze:** immediately toggle state, rollback on error.
- **Post like/unlike:** immediately update count + active state.
- **Listing favorite:** immediately update heart icon + count.
- **Chat message send:** immediately append to message list with `pending` status, replace with server response on success, remove on error.
- **Study group join/leave:** immediately update membership count + button state.

Not applied (too risky): quiz submission, material upload, listing creation, any mutation that triggers server-side processing (AI, CGPA calculation).

---

## Realtime Architecture

- **Socket.IO client** (`lib/socket/provider.tsx`): connects on auth mount, disconnects on logout. Namespace: default `/`. Auth: `{ token: accessToken }` per handshake.
- **Event bus pattern:** typed socket event map → hook per domain:
  - `useNotificationSocket()` → listens for `notification:new` → updates TanStack Query `['notifications']` cache + bumps zustand unread badge.
  - `useStudyGroupChat()` → listens for `group:message` → appends to `['study-groups', groupId, 'messages']`.
  - `usePresenceSocket()` → listens for `group:presence` → updates member online status in zustand.
- **Reconnection:** socket.io-client auto-reconnect with exponential backoff; on reconnect, re-auth with token and re-subscribe to room events.
- **Fallback:** if socket is unavailable, fall back to HTTP polling (study group messages: poll every 30s; notifications: poll every 60s).

---

## File Handling

- **Upload component** (`components/shared/FileUploader.tsx`):
  - Drag-and-drop zone + click-to-browse.
  - File type validation (PDF allowed for materials; images for marketplace/community posts).
  - File size validation (configurable via `NEXT_PUBLIC_MAX_FILE_SIZE_MB`).
  - Progress bar per file using `axios` with `onUploadProgress` (or XMLHttpRequest).
  - Multi-file support for marketplace listings.
  - Returns `{ url: string, key: string }` from signed upload response.
- **Download/Preview:**
  - PDF: `react-pdf` or `<iframe>` for preview; download button triggers `window.open(signedUrl)`.
  - Images: optimized `<Image>` with placeholder blur.
  - Signed URLs: cache and re-fetch if expired (backend returns `downloadUrl` per material response).

---

## Permission System

- **Frontend permission map** (`lib/auth/permissions.ts`): declarative map of `{ role: { can: { feature: string[], action: string[] } } }` — derived from backend guards (e.g., `SCHOOL_ADMIN` can `moderate:materials`, `moderate:marketplace`).
- **Component-level guards:** `<Can permission="moderate:materials">` renders admin-only UI.
- **Route-level guards:** `<RequireRole roles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>` wraps admin layouts.
- **Nav item filtering:** `navConfig.ts` exports arrays per role; sidebar renders only allowed items.
- **API-level:** backend enforces authorization; frontend guards are UX-only (not security).

---

## Responsive Strategy

- **Mobile-first** with Tailwind breakpoints (`sm/md/lg/xl`).
- **Layout:**
  - `<768px`: bottom navigation bar, full-width content, reduced sidebar to drawer.
  - `768px-1024px`: collapsible sidebar, standard content.
  - `>1024px`: persistent sidebar, max-width content container.
- **Data tables** (`<768px`): collapse to card list with sort/filter drawer.
- **Forms:** single-column on mobile, multi-column on desktop.
- **Map:** full-screen on mobile (hides shell), embedded panel on desktop.
- **Modal:** full-screen sheet on mobile, centered dialog on desktop.
- **Chat:** full-screen on mobile, side panel on desktop.

---

## Accessibility Strategy

- **Keyboard navigation:** all interactive elements focusable, visible focus rings, `Enter`/`Space` activation for custom controls.
- **ARIA:** labels on icon-only buttons (`aria-label="Close"`), `role="dialog"` on modals, `aria-live="polite"` for toast notifications, `aria-busy` during loading states.
- **Focus management:** trap focus in modals/drawers, return focus to trigger on close.
- **Color contrast:** all status badges (PENDING/VERIFIED/APPROVED) meet AA contrast; error states use icon + text (not color alone).
- **Reduced motion:** `prefers-reduced-motion` disables transitions, animations, skeleton shimmer.
- **Form accessibility:** labels associated with inputs, error messages via `aria-describedby`, required indicators via `aria-required`.
- **Screen reader support:** table row actions via `aria-label`; image upload alt text; chat message timestamps via `aria-hidden`.
- **Skip-link:** skip-to-content link at top of every page.
