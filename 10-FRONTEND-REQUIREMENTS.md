# 10 — Frontend Requirements (from Actual Backend Capabilities)

Reverse-engineered from route files, controllers, services, socket handlers, and the Prisma schema — **not** from OpenAPI (which is incomplete). Requirements are expressed as user workflows, not per-endpoint pages.

---

## Roles

| Role | Backend guard evidence | Drives these UI surfaces |
|---|---|---|
| Student (`STUDENT`) | guards.ts / authorize.ts | All self-service features: study, quizzes, AI, CGPA, planner, reminders, community, study groups, marketplace, campus map, notifications |
| School Admin (`SCHOOL_ADMIN`) | school routes + authorize | School-scoped admin: materials/quizzes moderation, faculty/dept/course mgmt, listings verification, user lookup, announcements |
| Super Admin (`SUPER_ADMIN`) | super-admin routes | Global: schools CRUD, platform-wide users, all moderations, audit logs |

---

## 1. Authentication & Profile

**Workflows**
- Register with email/password (+ school selection at onboarding).
- Log in → receive `accessToken`, `refreshToken`, `user`, `dashboardRedirect` → land on role-appropriate dashboard.
- Refresh session silently on token expiry.
- View own profile (`GET /auth/me`, `/users/me`).
- Edit profile, settings, update FCM token.
- Log out (client-side token purge; confirm backend behavior for revocation).
- First-time onboarding: select/confirm school, faculty, department (drives visibility of school/faculty/department-scoped materials).

**Pages/UI**
- `Login` page, `Register` page, `Forgot/Reset` password (if backend supports — verify).
- `Profile` page (view/edit), `Settings` page (notification prefs, FCM token registration).
- Onboarding wizard (school/faculty/department).
- Auth layout (public, centered card) distinct from app shell.

**Role routing**
- Use `dashboardRedirect` from auth response as the primary post-login redirect source.

---

## 2. Dashboard (Home)

**Workflows**
- Student sees: CGPA snapshot, next timetable/event, due reminders, recent materials, active study group invitations, recent notifications, marketplace highlights.
- School Admin sees: pending material/quiz verifications, reported posts/listings counts, school stats.
- Super Admin sees: platform-wide school counts, active users, pending verification queues across schools.

**Pages/UI**
- Role-based dashboard widgets (composable cards).
- Quick actions: "Add CGPA", "Create study group", "Upload material", "New reminder", "Create listing".

---

## 3. Study Materials

**Backend capabilities (verified)**
- Materials CRUD with file upload; visibility scoping `PUBLIC | SCHOOL | FACULTY | DEPARTMENT | PRIVATE`; `verified`/review state; faculty/department association; shared/uploaded-to-school flows; slides support; download URL; audit actions on materials.

**Workflows**
- Browse/search materials (filter by school, faculty, department, course, verified-only toggle).
- View material detail (must respect visibility: only show items the user is entitled to).
- Upload material (file upload UI, select course/faculty/department, choose visibility scope, submit for review).
- Track "My uploads" and their review status (PENDING/VERIFIED/REJECTED).
- School Admin: moderation queue — approve/reject/flag materials; view audit trail.
- Download materials (signed URL handling).

**Pages/UI**
- `Materials` list page (search + filters + table/grid).
- `Material detail` page (metadata, file preview/embed for PDFs, download, related materials).
- Upload form (multi-step: file → metadata → visibility).
- `My uploads` page with status badges.
- Admin moderation table with approve/reject row actions + detail drawer.
- File upload area shared component (drag-drop, progress, error states).

---

## 4. Quizzes

**Backend capabilities (verified)**
- Quiz CRUD; attempt/answer tracking; scoring; approval status (`APPROVED` enforced for attempts); school-admin moderation of quizzes.

**Workflows**
- Browse quizzes (filter by course/difficulty, only approved ones shown to students by default).
- Attempt quiz: one question at a time, submit, immediate/on-submit score, review answers.
- Resume/review past attempts.
- School Admin: create quizzes, submit for approval (or directly approved), moderate student-submitted quizzes, view attempt stats.

**Pages/UI**
- `Quizzes` list (filters, status badges).
- Quiz attempt screen (stepper, timer if backend provides timing, submit).
- Quiz results/review screen (score, per-question breakdown).
- Admin quiz builder (question editor: MCQ/text, options, answer key).
- Quiz moderation table (approve/reject).

---

## 5. AI Study Assistance

**Backend capabilities (verified)**
- `/ai/summarize` (or similar) for study material summarization via Groq; personal-study plan generation, plan listing/retrieval/update; AI chat/prompt endpoints.

**Workflows**
- Select a material or paste text → generate AI summary → view/save result.
- Generate a personalized study plan (based on courses/CGPA/timeline) → view plan → track progress through plan items.
- Possibly contextual AI Q&A on a material (verify exact endpoints: `personal-study.routes.ts`, `ai.routes.ts`).

**Pages/UI**
- `AI Summary` panel/page (input → loading shimmer → markdown result).
- `Study Plan` page (timeline view, check-off plan items, regenerate).
- AI chat widget (if supported) — streaming response UI.
- Progress indicators and "regenerate" actions.

---

## 6. CGPA

**Backend capabilities (verified)**
- CGPA calculation service (cumulative + semester GPAs); course/grade input; per-semester breakdown.

**Workflows**
- Add courses with credit units + grades → compute semester GPA.
- View cumulative CGPA over semesters.
- Edit/delete course entries; recalculate.
- "What-if" calculator is a frontend-only enhancement (no backend endpoint needed).

**Pages/UI**
- `CGPA` page: current CGPA hero, semester list, course table.
- Add-course modal/form (course, units, grade).
- Edit course row, delete confirmation.
- Progress bars / trend chart (client-computed from returned data).

---

## 7. Planner (Timetables & Events)

**Backend capabilities (verified)**
- Timetables CRUD (per-school/admin or per-user), events CRUD (`simplified_events`, `event_up` migrations), reminders trigger from timetable events.

**Workflows**
- View weekly timetable (day/time grid).
- Add/edit timetable entries (course, day, time, venue).
- School Admin: manage school-level timetables.
- View upcoming events (list/calendar); create events; RSVP if backend supports (verify).
- Timetable reminders fire via jobs (`timetable-reminder.job.ts`) → notifications.

**Pages/UI**
- Weekly timetable grid (responsive — stack on mobile).
- Event list/calendar view.
- Add/edit event modal (title, date, time, location).
- Conflict warnings (frontend-checked against existing entries).

---

## 8. Reminders & Notifications

**Backend capabilities (verified)**
- Reminders CRUD with types, due times, completion state, snooze; notifications list + mark-read, notification settings (preferences), FCM push registration; event-reminder and generic reminder jobs.

**Workflows**
- Create a reminder (type, title, due date/time) → receive push/in-app notification at due time.
- Mark reminder complete; snooze.
- View notifications feed (unread count, mark all read).
- Manage notification preferences (per-category toggles).
- Realtime notification push (socket) updates the feed automatically.

**Pages/UI**
- `Reminders` page: list grouped by status, add/edit/delete, complete/snooze actions.
- Notification bell in app shell header with unread badge + dropdown feed.
- `All notifications` page.
- Notification settings form (per-type toggles).
- Realtime badge updates via socket listener.

---

## 9. Community

**Backend capabilities (verified)**
- Community posts with categories, images; likes, comments; reports; moderation (approve/reject); community upgrades migration.

**Workflows**
- Browse community feed (filter by category).
- Create a post (text + optionally image upload).
- Like/unlike posts and comments.
- Comment on posts; like comments.
- Report abusive content.
- School Admin: moderation queue for reported/unapproved posts (approve/reject/remove).

**Pages/UI**
- Community feed page (infinite scroll, category tabs).
- Post composer (modal or inline; image picker).
- Post detail view with comments thread.
- Report modal (reason picker).
- Admin moderation table (pending/reported posts).

---

## 10. Study Groups

**Backend capabilities (verified)**
- Study groups CRUD; join/leave; membership roles; group messages (realtime via socket); invites; study-group upgrade migration.

**Workflows**
- Create a study group (name, course/subject, description).
- Browse/search groups; join or request invite.
- Group detail: member list, send/read messages in realtime, presence indicators.
- Leave/delete group (owner).
- Send invites to classmates (if backend supports).

**Pages/UI**
- Study groups list (my groups, discover).
- Create-group form (modal).
- Group chat page (realtime message feed, composer, member sidebar, presence avatars).
- Invite flow (email/username picker if endpoint exists).

---

## 11. Marketplace

**Backend capabilities (verified)**
- Listings CRUD (title, price, condition, category, images); categories; favorites; reports; mark-sold; chat/messages between buyer-seller (verify endpoint shape); reviews; moderation verification endpoints.

**Workflows**
- Browse listings (category filter, search, price sort).
- View listing detail (images, seller info, contact via in-app chat).
- Create listing (multi-image upload, category, price, condition).
- Edit/deactivate/mark-sold own listings.
- Favorite/unfavorite listings; view favorites list.
- Report a listing.
- Chat with seller (realtime if socket-based, else HTTP polling).
- Leave a review after purchase (if backend supports).
- School Admin: verify/approve listings; remove reported listings.

**Pages/UI**
- Marketplace home (grid/list toggle, filters).
- Listing detail page (image gallery, seller card, chat button, report).
- Create/edit listing form (image uploader with previews).
- My listings page (status: active/sold/pending verification).
- Favorites page.
- Chat thread page (message bubbles, input).
- Admin verification table + report queue.

---

## 12. Campus Map

**Backend capabilities (verified)**
- Campus places (locations with categories, coordinates); PostGIS-enabled; route finding; nearest place queries; search; ingestion scripts.

**Workflows**
- View campus map (interactive) with place markers by category.
- Search for a place by name.
- Get route/directions between two points (walking).
- Find nearest place of a category (e.g., nearest restroom, library, cafeteria).
- Place detail card (name, category, coordinates, maybe hours).

**Pages/UI**
- Full-screen interactive map page (MapLibre/Leaflet).
- Category filter chips + legend.
- Search box with autocomplete.
- Place detail popup/drawer.
- Route overlay between selected points.
- "Nearest..." quick action buttons.

---

## 13. School Administration

**Backend capabilities (verified)**
- School-scoped CRUD for faculties, departments, courses; students listing; materials/quizzes moderation within school; announcements; school admin user management.

**Workflows**
- Manage faculties → departments → courses (hierarchical CRUD).
- View/approve/reject pending student uploads and quizzes.
- Review reported community posts and marketplace listings.
- Publish announcements to school (verify endpoint).
- List/search students within school.

**Pages/UI**
- School Admin dashboard (pending counts).
- Faculty/Department/Course management pages (CRUD tables).
- Material moderation queue + quiz moderation queue.
- Community/marketplace moderation tabs.
- Announcements composer + list.
- Students directory (searchable table).

---

## 14. Super Administration

**Backend capabilities (verified)**
- Global schools CRUD; platform-wide users; super-admin audit logs; manage all facets across schools.

**Workflows**
- Create/edit/disable schools (name, domain, settings).
- View all schools with stats.
- Browse/manage users platform-wide (search, role changes if supported).
- View audit logs (who did what, when).
- Cross-school moderation oversight.

**Pages/UI**
- Super Admin dashboard (platform KPIs).
- Schools management table (create/edit/disable).
- Users directory (global search, filters, actions).
- Audit log viewer (filterable, timestamped).
- Platform settings (if endpoints exist).

---

## 15. Cross-Cutting Concerns

**Shared UI**
- App shell (sidebar nav, header with notification bell, role-aware menu).
- Data table (sort, filter, pagination, row actions, empty/loading states).
- Modal/drawer system, toast system, confirm dialogs.
- Form primitives (inputs, selects, date pickers, file uploader).
- Skeleton loaders, error boundaries, empty state illustrations.

**Realtime interfaces**
- Study group chat (socket).
- Notification feed updates (socket).
- Marketplace chat (socket if implemented, else polling).
- Presence indicators in study groups.

**File handling**
- Upload: drag-drop, progress bar, multi-file (marketplace images), type/size validation, signed URL responses.
- Download/preview: PDF viewer for materials.

**Role-specific routing**
- Route guards per role; hide unauthorized nav items; `dashboardRedirect` for landing.

**Responsive behavior**
- Mobile-first: bottom nav on mobile, sidebar on desktop; tables collapse to cards on mobile; map fullscreen on mobile.

**Accessibility**
- Keyboard navigation for tables/forms; ARIA labels on icon buttons; focus management in modals; color-contrast-safe status badges; reduced-motion support.
