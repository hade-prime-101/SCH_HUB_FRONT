# 13 — Implementation Plan

Frontend implementation phases, ordered by dependency, with complexity estimates and inter-phase dependencies.

**Complexity scale:** S = small (1-2 days), M = medium (3-5 days), L = large (1-2 weeks), XL = extra large (2+ weeks)

**Assumes:** team of 2-3 frontend developers, or solo with longer calendar time.

---

## Phase 0 — Project Foundation

**Goal:** Working Next.js + TS + Tailwind + shadcn/ui skeleton with CI-ready setup.

**Tasks:**
- Initialize Next.js App Router project (latest stable), TypeScript strict mode.
- Install + configure Tailwind CSS, shadcn/ui (Button, Input, Card, Dialog, Table, Tabs, Badge, Toast, DropdownMenu, Sheet, Skeleton, Form primitives).
- Configure path aliases (`@/*`), ESLint + Prettier, Husky pre-commit hooks.
- Set up env handling (`NEXT_PUBLIC_API_BASE_URL`, etc.) via `.env.local.example`.
- CI pipeline (GitHub Actions): lint, typecheck, build, unit tests.
- Error boundary + not-found/global-error defaults.

**Complexity:** M (~3 days)

**Dependencies:** none (start of project)

---

## Phase 1 — Authentication

**Goal:** Login/register/refresh/logout working end-to-end with role-aware redirects.

**Tasks:**
- `lib/api/config.ts` + `lib/api/client.ts` (fetch wrapper, envelope unwrap, ApiError normalization).
- `lib/auth/AuthProvider.tsx` (token restore, /auth/me on mount, logout).
- Token refresh single-flight interceptor.
- Login page, Register page (with school/faculty/department selection if backend requires at registration).
- Route guard (`RequireAuth`) + `dashboardRedirect` mapping.
- Letoken cleanup on 401/refresh-fail.

**Complexity:** M (~4 days)

**Dependencies:** Phase 0

---

## Phase 2 — Application Shell

**Goal:** Persistent authenticated layout with nav, header, notification bell, responsive sidebar/bottom-nav.

**Tasks:**
- `(app)/layout.tsx` — AppShell with responsive sidebar (desktop) + bottom nav (mobile).
- Role-aware `navConfig.ts` (student / school-admin / super-admin menus).
- Header: search placeholder, notification bell (badge from `GET /notifications` unread-count — verify endpoint), user dropdown (profile, settings, logout).
- `(admin)/layout.tsx` — AdminShell with admin-specific nav.
- Loading skeletons per segment (loading.tsx files).

**Complexity:** L (~5-7 days)

**Dependencies:** Phase 1 (needs auth for guard + user context)

---

## Phase 3 — Shared UI System

**Goal:** Reusable component library covering data display, forms, modals, toasts, empty/loading states.

**Tasks:**
- `DataTable` (TanStack Table wrapper: sort, filter, pagination, row actions, responsive card collapse).
- `FileUploader` (drag-drop, progress, multi-file, type/size validation).
- `StatusBadge` (PENDING/VERIFIED/REJECTED/APPROVED color mapping).
- `ConfirmDialog`, `EmptyState`, `Skeleton` variants, `ErrorBoundary` variant per feature.
- `ModalProvider` + `useModal(ConfirmDialog, AddCourseModal, ...)`.
- Form primitives on shadcn (Input, Select, Textarea, DatePicker, Form with RHF+zod integration).
- `Pagination` shared component + `InfiniteScroll` wrapper.

**Complexity:** L (~5-7 days)

**Dependencies:** Phase 0, 1 (some components need auth guard for admin-only visibility)

---

## Phase 4 — API Client Realization

**Goal:** All typed API functions + DTO types per backend domain.

**Tasks:**
- Endpoint files per domain (`auth`, `users`, `study`, `ai`, `cgpa`, `planner`, `reminders`, `notifications`, `community`, `studyGroups`, `marketplace`, `campusMap`, `school`, `superAdmin`).
- DTO types hand-written from verified backend responses (controllers/services/validators).
- Pagination helper types (page/cursor variants).
- Socket client wrapper + typed event map.
- Upload utility (direct-presigned vs multipart — decided after Phase 14 verification task).

**Complexity:** M (~4 days) — blocked on Phase 14 verification tasks for exact endpoint shapes, but core shape can start now.

**Dependencies:** Phase 0-3; Phase 14 (verification) for final shape

---

## Phase 5 — Core Student Experience

**Goal:** The "day-1" features students use most: dashboard, profile/settings, CGPA, reminders, notifications.

**Tasks:**
- Dashboard page (role-based widget grid) — CGPA snapshot, next reminders, recent notifications.
- Profile page (view/edit via `/users/me` endpoints).
- Settings page (notification prefs, FCM token registration).
- CGPA module: hero, semester course tables, add/edit/delete course modal.
- Reminders module: list, create/edit/delete, complete/snooze, due-time display.
- Notifications: bell dropdown with unread badge, all-notifications page, mark-read.

**Complexity:** L (~6-8 days)

**Dependencies:** Phase 2, 3, 4

---

## Phase 6 — Major Feature Modules (Study + AI)

**Goal:** Materials browsing/upload and quiz attempt + AI summaries/study plans.

**Materials:**
- Materials list w/ search + filters (school/faculty/department/course, verified-only).
- Material detail w/ PDF viewer/preview + download.
- Upload flow (multi-step: file → metadata → visibility scope).
- My-uploads page w/ status badges.

**Quizzes:**
- Quiz list (filters, approved-only default).
- Quiz attempt stepper (question-by-question, submit, results screen).
- Past attempt review.

**AI Study:**
- Summary page (material selection or paste → loading shimmer → markdown result).
- Personal study plan page (generate, view timeline, check-off items).

**Complexity:** XL (~12-16 days — materials+quizzes+AI together)

**Dependencies:** Phase 2, 3, 4

---

## Phase 7 — Realtime Features (Chat + Presence)

**Goal:** Study group chat + notification push via Socket.IO.

**Tasks:**
- Socket provider (connect on auth, disconnect on logout, reconnection).
- Study group chat page (real-time message list, composer, pending-state messages, presence indicator).
- Notification socket listener → unread badge live updates + feed append.
- Fallback polling for both when socket unavailable.

**Complexity:** M (~4-5 days)

**Dependencies:** Phase 4 (socket client), Phase 5 (notifications shell), Phase 6 (study groups exist for chat; study group CRUD may be in Phase 8)

---

## Phase 8 — Community + Study Groups

**Goal:** Community feed/posts and study group management (CRUD, membership).

**Community:**
- Feed page (infinite scroll, category tabs).
- Post composer (text + image upload).
- Post detail + comments thread, like/report actions.
- Report modal.

**Study Groups:**
- My groups / discover list.
- Create-group form (modal).
- Group detail: members, join/leave, invites (if endpoint exists).
- Group chat (wired into Phase 7 realtime).

**Complexity:** L (~7-9 days)

**Dependencies:** Phase 3, 4, 7 (realtime for chat)

---

## Phase 9 — Marketplace

**Goal:** Listings browse/create/manage + chat + moderation queue.

**Tasks:**
- Marketplace home (grid/list, filters, category chips).
- Listing detail (image gallery, seller card, chat CTA, report, favorite).
- Create/edit listing form (multi-image upload, price, condition, category).
- My listings (status badges: active/sold/pending).
- Favorites page/tab.
- Chat threads (list + thread view — realtime if socket-backed, else polling).
- Reviews (if backend supports).
- Admin verification table (listings pending verify) + report queue.

**Complexity:** XL (~12-15 days)

**Dependencies:** Phase 3, 4, 7 (if chat realtime)

---

## Phase 10 — Planner + Campus Map

**Goal:** Timetable/events and the interactive map.

**Planner:**
- Weekly timetable grid (responsive).
- Add/edit timetable entry (course, day, time, venue) w/ conflict warning.
- Events list + create/edit modal.

**Campus Map:**
- MapLibre full-screen map page w/ place markers.
- Category filter chips + legend.
- Search box w/ autocomplete.
- Place detail popup/drawer.
- Route overlay (two-point walking route) + "nearest" quick actions.

**Complexity:** XL (~12-14 days) — map + planner both significant

**Dependencies:** Phase 2, 3, 4

---

## Phase 11 — Admin Interfaces

**Goal:** School Admin + Super Admin surfaces.

**School Admin:**
- Dashboard w/ pending counts.
- Material moderation queue (approve/reject/flag).
- Quiz moderation queue.
- Faculty/Department/Course CRUD pages.
- Students directory (searchable table).
- Community moderation tab.
- Marketplace moderation tab.
- Announcements composer (verify endpoint).

**Super Admin:**
- Platform dashboard (schools stats, users).
- Schools management (create/edit/disable).
- Users directory (global).
- Audit logs viewer (filterable).
- Cross-school moderation oversight.

**Complexity:** XL (~12-15 days)

**Dependencies:** Phase 5 (dashboard widget system reused), Phase 3 (DataTable), Phase 6 (materials/quiz moderation queue shape), Phase 9 (marketplace moderation)

---

## Phase 12 — Error/Loading/Empty States Polish

**Goal:** Consistent UX across failure, loading, empty, offline scenarios.

**Tasks:**
- Global error toast system wired to all TanStack Query mutations.
- Route-level error.tsx per segment (typed per feature).
- Empty states w/ illustrations per feature (no materials, no listings, no notifications, etc.).
- Offline banner + reconnect detection.
- Skeletons for every list/detail view.
- Retry buttons + "try again in Xs" for rate limits.

**Complexity:** M (~4 days) — partially built in Phases 2-11; this phase formalizes system-wide.

**Dependencies:** Phase 3 (shared components), all feature phases

---

## Phase 13 — Responsive & Mobile Behavior

**Goal:** Full mobile parity: bottom nav, card-collapsed tables, sheet modals, mobile-friendly map, touch targets.

**Tasks:**
- Audit every page at 375px / 768px / 1024px breakpoints.
- Bottom nav (home, materials, marketplace, community, more).
- Collapse tables to cards on mobile.
- Sheet-modals (full-screen on mobile).
- Map full-screen mode; chat full-screen mode.
- Touch target sizing (≥44px), safe-area insets.

**Complexity:** M (~4-5 days)

**Dependencies:** Phase 2 (shell), all feature phases

---

## Phase 14 — Backend Verification Sprint

**Goal:** Resolve all "verify" items before R&D on dependent features.

**Tasks (documented in 12-API-CLIENT.md checklist):**
- Read `auth.routes.ts`/`validators.ts` → refresh payload shape.
- Read `upload.ts`, `r2.ts`, study/marketplace controllers → upload model.
- Read `socket.ts`, `study-group.socket.ts` → handshake + events.
- Read each controller's pagination parsing → page vs cursor.
- Read `health.routes.ts` → path/prefixed.
- Read `rateLimiter.ts` → 429 headers.
- Confirm existence of: forgot-password, study-group invites, marketplace reviews, announcements, RSVP endpoints, FCM token registration endpoint.

**Complexity:** S-M (~2-3 days) but **blocking** for Phase 4 final shape + several feature details.

**Dependencies:** none (can run parallel with early phases)

---

## Phase 15 — Testing

**Goal:** Component tests, integration tests (RTL), E2E smoke (Playwright), and a11y checks.

**Tasks:**
- Unit tests (Vitest): utils, validation schemas, auth provider, API client interceptors/mocks.
- Component tests (RTL): DataTable, forms, modals, chat composer, optimistic updates.
- E2E (Playwright): login/register → dashboard → core workflows (upload material, attempt quiz, create listing, post to community, create reminder, generate AI summary).
- A11y: axe-core in CI.

**Complexity:** XL (~10-12 days) — incremental testing through phases; this phase formalizes coverage.

**Dependencies:** feature phases

---

## Phase 16 — Final Integration

**Goal:** Production-hardening pass: env config, error monitoring (Sentry), performance, SEO, deployment, docs.

**Tasks:**
- Sentry integration (error tracking + performance traces).
- Env hardening (NEXT_PUBLIC_* exposure audit).
- Lighthouse/CLS/TTI pass.
- SEO: metadata, OG tags on public pages, sitemap.
- Deploy config (Vercel/Render — note backend render.yaml exists).
- README + onboarding docs for dev team.
- Final cross-browser pass.

**Complexity:** M (~5 days)

**Dependencies:** all phases

---

## Execution Order (Recommended)

```
Audit/verify Sprint (14) — can run immediately in parallel
Phase 0 → 1 → 2 → 3 → 4
  └─ Phase 5 → Phase 6
  └─ Phase 7 (once study groups exist in 8; or start notifications socket earlier)
  └─ Phase 8 → Phase 9
  └─ Phase 10
  └─ Phase 11
Phase 12 → 13 → 15 → 16
```

Canonical path: 0 → 1 → 2 → 3 → 4 → 5 → 6 → (7+8) → 9 → 10 → 11 → 12 → 13 → 15 → 16, with Phase 14 running early and in parallel with 0-4.

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Backend endpoints undocumented/underdocumented (C7) | Wrong API contracts | Phase 14 verification sprint before dependent features; hand-written DTOs from source, never OpenAPI |
| Upload model unknown (presigned vs multipart) | File features blocked | Phase 14 item; design FileUploader with pluggable backend adapter |
| Pagination varies by module | Wrong infinite-scroll | Phase 14 per-module pagination audit |
| Socket handshake/events unverified | Realtime broken | Phase 14 socket audit; fallback polling implemented |
| No market/community chat on socket (HTTP-only) | Extra polling work | Fallback polling already in architecture |
| Marketplace reviews/invites/announcements may not exist | Feature gap | Mark as "verify"; don't build until confirmed |
| Backend role model may have more roles | Role nav incomplete | Phase 14: read guards.ts + authorize.ts role enums |
| Rate limits not header-standard | 429 UX inaccurate | Phase 14: read rateLimiter.ts |