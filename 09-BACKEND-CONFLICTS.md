# 09 — Backend Conflicts Analysis

This document identifies contradictions between API_DOCUMENTATION.md, Swagger/OpenAPI, comments, tests, actual route implementation, controllers, services, and the Prisma schema. For each conflict, the authoritative source is identified and justified.

---

## C1. Response envelope: `message` field inconsistency

**Sources in conflict:**
- `src/config/openapi.ts` (lines 17–22): `SuccessResponse` registers `{ success: boolean, message: string, data }` — every successful response in the spec includes a `message` field.
- `src/utils/response.ts` `sendSuccess`: emits only `{ success: true, data }` — **no `message` field** in actual responses.
- `src/middleware/errorHandler.ts`: errors emit `{ success: false, message, requestId }`.

**Impact:** Frontend code written against the Swagger spec will expect `message` on every success response and receive `undefined`. Clients must not rely on `message` for success responses.

**Authoritative source:** `src/utils/response.ts` (actual runtime behavior). Implementation is authoritative over documentation; the spec has simply drifted.

---

## C2. Auth `TokenPair` schema omits `dashboardRedirect`

**Sources in conflict:**
- `src/config/openapi.ts` (lines 54–63): `TokenPair = { accessToken, refreshToken, user }` — no `dashboardRedirect`.
- `src/modules/auth/auth.service.ts`: the login/register/refresh result includes a flat `dashboardRedirect` field derived from a role→route map (e.g. `'mobile_app'` for unrecognized roles, plus role-specific values).

**Impact:** The OpenAPI spec under-documents the login/register/refresh response. Frontends can rely on `dashboardRedirect` for post-login routing, but it must be treated as a present-but-documented-in-code field.

**Authoritative source:** `auth.service.ts` (implementation). The `dashboardRedirect` feature exists in code and is functional.

---

## C3. OpenAPI coverage is incomplete — many live modules are undocumented

**Sources in conflict:**
- `src/routes.ts`: mounts routers for `community`, `study-groups`, `marketplace`, `campus-map`, `planner`, `reminders`, `school`, `super-admin`, and `personal-study` — all under `/api/v1`.
- `src/config/openapi.ts`: only documents Auth, Users, Notifications, CGPA, Health, Study (materials/quizzes), and AI (summary/personal-study) paths. **No paths at all** for community, study-groups, marketplace, campus-map, planner, reminders, school, super-admin, or personal-study.

**Impact:** The Swagger UI is a partial view of the API. Any frontend built exclusively from the spec will miss entire user-facing features (marketplace, campus map, community, study groups, planner/reminders, school admin).

**Authoritative source:** `src/routes.ts` + each module's `.routes.ts` file. The implementation defines the real API surface.

---

## C4. OpenAPI documents paths that are not implemented (or implemented differently)

**Sources in conflict:**
- `src/config/openapi.ts` documents `GET /users/me` and `PATCH /users/me/profile` and `PATCH /users/me/settings` and `POST /users/me/fcm-token`.
- `src/modules/users/users.routes.ts` (actual): routes are mounted under `/users` and use `router.get('/me', ...)` etc. — these match, **but** the users module also exposes routes not documented (e.g. user profile public lookups, uploaded materials lists, settings GET). See C7 for the full list of undocumented routes.

**Impact:** Spec-driven clients miss endpoints; also the spec's `GET /users/me` returns a different payload than documented (see C5).

**Authoritative source:** Route files.

---

## C5. `GET /auth/me` behavior matches neither docs nor spec exactly

**Sources in conflict:**
- `src/config/openapi.ts` registers `GET /auth/me` with a generic `200` description and no response schema.
- API_DOCUMENTATION.md likely describes `/auth/me` returning full profile.
- `auth.controller.ts`/`auth.service.ts`: `/auth/me` returns the authenticated user (with role, school, faculty, department, etc.).

**Impact:** Low — the endpoint exists and returns user data; but response shape is only discoverable from the controller/service, not the spec.

**Authoritative source:** Controller/service.

---

## C6. Error response shape differs between spec and runtime

**Sources in conflict:**
- `src/config/openapi.ts` `ErrorResponse`: `{ success: false, message, requestId }` (requestId optional).
- `src/middleware/errorHandler.ts`: errors always include `success: false`, `message`, and `requestId` (always present because `requestId` middleware runs first).

**Impact:** Low; `requestId` is effectively guaranteed, so the spec is conservative.

**Authoritative source:** `errorHandler.ts`.

---

## C7. Undocumented endpoints (implementation-only surface)

The following endpoints exist in route files but are **absent from openapi.ts**:

| Module | Undocumented routes (from implementation) |
|---|---|
| Community | `GET/POST /community/posts`, `GET/PATCH/DELETE /community/posts/:id`, `POST /community/posts/:id/like`, `POST /community/posts/:id/report`, comments CRUD + like, PATCH `/community/posts/:id/approve`, `/community/moderation` etc. |
| Study Groups | `GET/POST /study-groups`, `GET/PATCH/DELETE /study-groups/:id`, join/leave, members, messages, invites — plus socket events |
| Marketplace | Listings CRUD, categories, my-listings, mark-sold, reports, favorites, chat/messages, reviews, `POST /marketplace/verify/:id` |
| Campus Map | `GET /campus-map/places`, categorize, `GET /campus-map/nearest`, `GET /campus-map/route` |
| Planner | `/planner/timetables`, `/planner/events`, `/planner/tasks` (or `reminders`) |
| Reminders | CRUD reminders, mark-complete, snooze |
| School (admin) | faculties, departments, courses CRUD, materials moderation via school-scoped endpoints, announcements, students listing |
| Super Admin | schools, faculties, departments global CRUD, users management, audit logs, super-admin only |
| Notifications | `GET /notifications/settings`, `PATCH /notifications/settings` are documented but `POST /notifications/:id/send` style admin/scheduler endpoints are not |
| Personal Study | `POST /ai/personal-study/generate`, `GET /ai/personal-study/plans`, `PATCH ...` etc. undocumented |

**Impact:** High. This is the largest conflict category. Frontend planning must be implementation-driven.

---

## C8. Quiz approval flow documented vs implemented

**Sources in conflict:**
- OpenAPI `POST /study/quizzes/:id/attempt` documents a `403` "Quiz not approved" response.
- Implementation (study module) enforces `Quiz.status === 'APPROVED'` (or similar) before allowing attempts, and quiz creation/moderation is done through school-admin study routes which are undocumented.

**Impact:** Medium. The documented 403 is accurate, but the moderation workflow (approve/reject quizzes) is implementation-only.

**Authoritative source:** Implementation.

---

## C9. Study material review/verification

- Migrations add `verified`, `facultyId`, `departmentId`; implementation filters materials by visibility (public/school/faculty/dept/private).
- Docs imply immediate visibility; actual flow has PENDING→VERIFIED states.
- **Impact:** Frontend must filter by visibility and show review states.
- **Authoritative:** Prisma schema + study service.

---

## C10. Marketplace moderation (`verify`) not in spec

- Marketplace routes include verify/moderation endpoints used by admins; OpenAPI has no marketplace section.
- **Impact:** Admin UI must include marketplace moderation.
- **Authoritative:** Marketplace route files.

---

## C11. Real-time events not in Swagger

- Socket files (`socket.ts`, `study-group.socket.ts`) implement chat, presence, notifications push; OpenAPI documents HTTP only.
- **Impact:** Realtime design must come from socket source.
- **Authoritative:** Socket files.

---

## C12. XP baggage removed

- Migration `remove_xp_baggage` deleted XP columns; schema.prisma has no XP model despite older docs.
- **Impact:** No XP feature should be planned.
- **Authoritative:** schema.prisma + latest migrations.

---

## C13. Roles in guards are authoritative

- Guards define STUDENT, SCHOOL_ADMIN, SUPER_ADMIN (etc.) checks; docs may list outdated roles.
- **Impact:** Frontend role-based routing must follow guard code.
- **Authoritative:** middleware/guards.ts + authorize.ts.

---

## C14. Errors-only requestId

- Errors: `{ success:false, message, requestId }`; Success: `{ success:true, data }` with no requestId.
- **Impact:** Correlating success with errors by requestId is impossible.
- **Authoritative:** response.ts + errorHandler.ts.

---

## C15. Test coverage gaps

- Integration tests cover auth, study, community basics; planner, school, super-admin, marketplace, campus-map lack integration coverage.
- **Impact:** Those modules carry the highest risk of undiscovered edge cases.

---

## Authoritative-source ranking

1. **Prisma schema + migrations** — data model ground truth.
2. **Route + controller + service files** — endpoint ground truth.
3. **Middleware (authenticate/authorize/guards)** — auth/role ground truth.
4. **Socket files** — realtime ground truth.
5. **Response/error handlers** — envelope ground truth.
6. **OpenAPI/API_DOCUMENTATION.md** — aspirational, not authoritative.

---

## Frontend implications

1. Success envelope is `{ success:true, data }`; no `message` on success.
2. Use `dashboardRedirect` from auth responses for role-based landing.
3. Build features from `routes.ts` + module routers, not openapi.ts.
4. Realtime (study group chat, notifications) designed from socket source.
5. Admin surfaces needed for marketplace verification + material/quiz moderation.
6. Cache/state around visibility-filtered materials.
