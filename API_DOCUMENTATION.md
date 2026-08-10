# SCH_HUB API Documentation

## Table of Contents
1. [Global Conventions](#global-conventions)
2. [Authentication Flow](#authentication-flow)
3. [Standard Error Format](#standard-error-format)
4. [Rate Limits](#rate-limits)
5. [Real-time (Socket.IO)](#real-time)
6. [Auth](#auth)
7. [Users](#users)
8. [School & Lookup](#school--lookup)
9. [Study Materials & Quizzes](#study-materials--quizzes)
10. [CGPA Calculator](#cgpa-calculator)
11. [Community](#community)
12. [Study Groups](#study-groups)
13. [Marketplace](#marketplace)
14. [Notifications](#notifications)
15. [Reminders](#reminders)
16. [Planner](#planner)
17. [AI Features](#ai-features)
18. [Campus Map](#campus-map)
19. [School Admin](#school-admin)
20. [Super Admin](#super-admin)
21. [Health](#health)
22. [Known Gaps](#known-gaps)

---

## Global Conventions

**Base URL:** `https://<host>/api/v1`

**Auth header:** `Authorization: Bearer <accessToken>`

**Request body:** `Content-Type: application/json` (except file uploads which use `multipart/form-data`)

**Success envelope:**
```json
{ "success": true, "data": <payload> }
```
Paginated:
```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5, "hasMore": true }
}
```

**Roles (enum):** `STUDENT`, `COURSE_REP`, `AUTHORIZED_UPLOADER`, `EVENT_ORCHESTRATOR`, `HOUSE_AGENT`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Academic levels (enum):** `"100"`, `"200"`, `"300"`, `"400"`, `"500"`, `"600"`

---

## Authentication Flow

1. `POST /auth/register` → returns `accessToken` + `refreshToken`
2. `POST /auth/verify-otp` with `type: "EMAIL_VERIFICATION"` → account becomes active
3. `POST /auth/login` → returns tokens + `dashboardRedirect` hint
4. Access token TTL: `15m` (default). Refresh token TTL: `30 days`.
5. On expiry: `POST /auth/refresh` with `refreshToken` → new token pair (old token deleted)
6. `POST /auth/logout` → deletes refresh token server-side

---

## Standard Error Format

```json
{
  "success": false,
  "message": "Human-readable error",
  "requestId": "uuid"
}
```
In development only, `stack` field is also included.

| Status | Cause |
|--------|-------|
| 400 | Validation error (Zod), bad request |
| 401 | Missing/expired/invalid token |
| 403 | Insufficient role, account suspended/unverified |
| 404 | Resource not found |
| 409 | Duplicate (email, matric number, unique constraint) |
| 413 | File or request too large |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limits

| Limiter | Window | Limit (prod) | Applied to |
|---------|--------|--------------|------------|
| `apiRateLimiter` | 1 min | 100 req | All `/api/v1/*` routes |
| `authRateLimiter` | 15 min | 5 req | `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`, `/auth/resend-otp` |

Rate limit headers: `RateLimit-*` (standard), no `X-RateLimit-*` legacy headers.
On limit: `429 { "success": false, "message": "Too many requests, please try again later.", "requestId": "..." }`

---

## Real-time

**Socket.IO path:** `/socket.io`

**Authentication:** Pass JWT in handshake auth:
```js
io.connect(URL, { auth: { token: accessToken } })
```
Invalid/missing token → socket disconnected immediately.

### Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client→Server | `group:join` | `groupId: string` | Join a group room (must be a member) |
| Client→Server | `group:leave` | `groupId: string` | Leave room |
| Client→Server | `group:message` | `{ groupId, content, attachments? }` | Send chat message |
| Client→Server | `group:ask` | `{ groupId, question }` | Ask AI a question in group |
| Client→Server | `group:challenge:watch` | `challengeId: string` | Subscribe to challenge updates |
| Server→Client | `group:message` | message object | New message broadcast to room |
| Server→Client | `group:joined` | `{ groupId }` | Confirmation of join |
| Server→Client | `group:ask:thinking` | `{ groupId }` | AI processing indicator |
| Server→Client | `error` | `{ message }` | Error during socket operation |

---

## Auth

### POST /auth/register
Register a new student account. Sends email verification OTP.

**Auth:** No

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| fullName | string | yes | min 2 chars |
| email | string | yes | valid email |
| password | string | yes | min 8 chars |
| confirmPassword | string | yes | must match password |
| matricNumber | string | yes | min 3 chars |
| level | string | yes | enum: `100`–`600` |
| schoolId | string | yes | |
| facultyId | string | yes | must belong to school |
| departmentId | string | yes | must belong to faculty |
| phone | string | no | |

**Success:** `201`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "fullName": "Ada Obi", "email": "ada@uni.edu", "role": "STUDENT", "level": "200", "schoolId": "...", "departmentId": "..." },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

**Errors:** `400` validation, `404` department not found, `409` email/matric already registered

**Side effects:** Sends OTP email for verification.

---

### POST /auth/login
**Auth:** No

**Body:**
```json
{ "email": "ada@uni.edu", "password": "secret123" }
```

**Success:** `200`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "fullName": "Ada Obi", "email": "...", "role": "STUDENT", "level": "200", "schoolId": "...", "departmentId": "...", "isVerified": true },
    "accessToken": "...",
    "refreshToken": "...",
    "role": "STUDENT",
    "dashboardRedirect": "mobile_app"
  }
}
```

`dashboardRedirect` values: `mobile_app`, `course_rep_dashboard`, `event_orchestrator_dashboard`, `house_agent_dashboard`, `admin_dashboard`, `super_admin_dashboard`

**Errors:** `401` invalid credentials, `403` unverified/suspended/deactivated, `404` deleted account

**Side effects:** If unverified STUDENT logs in, a new OTP is sent and `403` is returned.

---

### POST /auth/refresh
**Auth:** No

**Body:** `{ "refreshToken": "..." }`

**Success:** `200` `{ "accessToken": "...", "refreshToken": "..." }` (token rotation — old token invalidated)

**Errors:** `401` invalid or expired refresh token

---

### POST /auth/logout
**Auth:** Yes

**Body:** `{ "refreshToken": "..." }`

**Success:** `200` `{ "loggedOut": true }`

---

### GET /auth/me
**Auth:** Yes

**Success:** `200` `{ "user": { id, email, role, schoolId, departmentId, level } }` (decoded JWT payload)

---

### POST /auth/forgot-password
**Auth:** No

**Body:** `{ "email": "ada@uni.edu" }`

**Success:** `200` `{ "message": "If that email exists, an OTP has been sent." }` (always same response to prevent enumeration)

**Side effects:** Sends PASSWORD_RESET OTP email.

---

### POST /auth/verify-otp
**Auth:** No

**Body:**
```json
{ "email": "ada@uni.edu", "otp": "123456", "type": "EMAIL_VERIFICATION" }
```
`type` enum: `EMAIL_VERIFICATION` | `PASSWORD_RESET`

OTP is 6 numeric digits, valid for 10 minutes.

**Success:** `200` `{ "verified": true }`

**Errors:** `400` invalid/expired OTP

---

### POST /auth/reset-password
**Auth:** No

**Body:**
```json
{ "email": "ada@uni.edu", "otp": "123456", "password": "newpass123", "confirmPassword": "newpass123" }
```

**Success:** `200` `{ "message": "Password reset successful. Please log in." }`

**Side effects:** Invalidates ALL refresh tokens for the user.

---

### POST /auth/resend-otp
**Auth:** No

**Body:** `{ "email": "ada@uni.edu", "type": "EMAIL_VERIFICATION" }`

**Success:** `200` `{ "message": "OTP resent successfully." }`

**Errors:** `400` if email already verified and type is EMAIL_VERIFICATION

---

## Users

All routes require `Authorization: Bearer <token>`.

### GET /users/me
Get own full profile.

**Success:** `200`
```json
{
  "success": true,
  "data": {
    "id": "...", "fullName": "Ada Obi", "email": "...", "phone": null,
    "matricNumber": "...", "profilePictureUrl": null, "bio": null,
    "role": "STUDENT", "level": "200", "isVerified": true,
    "createdAt": "...", "updatedAt": "...",
    "school": { "id": "...", "name": "...", "shortCode": "..." },
    "faculty": { "id": "...", "name": "..." },
    "department": { "id": "...", "name": "...", "shortCode": "..." },
    "shop": null,
    "settings": { ... },
    "_count": { "materials": 5, "listings": 2 },
    "sellerRating": 4.5
  }
}
```

---

### GET /users/:id
Get another user's profile. `:id` must be a UUID v4.

**Success:** `200` — same shape as `/users/me`

**Errors:** `400` invalid UUID, `404` not found

---

### PATCH /users/me/profile
Update own profile.

**Body (all optional):**
| Field | Type | Rules |
|-------|------|-------|
| fullName | string | min 2, max 100 |
| phone | string\|null | min 7, max 20 |
| bio | string\|null | max 500 |
| level | string | enum `100`–`600` |

**Success:** `200` — updated user object

---

### POST /users/me/avatar
Upload avatar image. `multipart/form-data`, field name `avatar`.

**Limits:** 5 MB max, JPEG/PNG/WebP only, 1 file

**Success:** `200` `{ "id": "...", "profilePictureUrl": "https://..." }`

**Errors:** `400` wrong MIME type, `413` too large

---

### PATCH /users/me/settings
**Body (all optional):**
`darkMode`, `lowDataMode`, `notificationsEnabled`, `emailNotifications`, `pushNotifications` — all booleans

**Success:** `200` — settings object

---

### POST /users/me/fcm-token
Register Firebase Cloud Messaging token for push notifications.

**Body:** `{ "fcmToken": "string (min 10 chars)" }`

**Success:** `200`

---

### GET /users/me/bookmarks
Get bookmarked study materials.

**Success:** `200` `{ "data": [material objects] }`

---

### GET /users/me/materials
Get materials uploaded by the current user.

**Success:** `200`

---

### GET /users/:id/materials
Get materials uploaded by another user.

**Success:** `200`

---

### GET /users/me/sessions
List active refresh token sessions.

**Success:** `200` array of `{ id, createdAt, expiresAt }`

---

### DELETE /users/me/sessions/:sessionId
Revoke a single session (refresh token). `:sessionId` must be UUID v4.

**Success:** `200`

---

### DELETE /users/me/sessions
Revoke all sessions (log out everywhere).

**Success:** `200`

---

### GET /users/search
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query params:**
| Param | Type | Required | Default |
|-------|------|----------|---------|
| search | string | yes | — |
| departmentId | string | no | — |
| level | string | no | — |
| page | number | no | 1 |
| limit | number | no | 20 (max 50) |

**Success:** `200` paginated list

---

### GET /users/
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query params:** `role`, `departmentId`, `search`, `page` (default 1), `limit` (default 50, max 100)

**Success:** `200` paginated list

---

### PATCH /users/nominate-course-rep
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "userId": "..." }`

**Success:** `200`

---

### PATCH /users/assign-role
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "userId": "...", "role": "COURSE_REP" }`
`role` enum: all roles except cannot set SUPER_ADMIN via this endpoint in practice (validator allows it but business logic may differ — see Known Gaps).

**Success:** `200`

---

## School & Lookup

### GET /school/schools
**Auth:** No

Returns active schools. If `SCHOOL_ID` env is set, returns only that school.

**Success:** `200` `[{ "id", "name", "shortCode", "location", "logoUrl" }]`

---

### GET /school/schools/:id/faculties
**Auth:** No

**Success:** `200` `[{ "id", "name" }]`

---

### GET /school/faculties/:id/departments
**Auth:** No

**Success:** `200` `[{ "id", "name", "shortCode" }]`

---

### GET /school/timetable
**Auth:** Yes

**Query:** `type` — `PERSONAL` | `DEPARTMENTAL` | `GENERAL` (optional, returns all if omitted)

**Success:** `200` array of timetable entries

---

### POST /school/timetable
**Auth:** Yes. Creating `DEPARTMENTAL` requires `COURSE_REP`/`SCHOOL_ADMIN`/`SUPER_ADMIN`. Creating `GENERAL` requires `SCHOOL_ADMIN`/`SUPER_ADMIN`.

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| timetableType | string | no | enum `PERSONAL`\|`DEPARTMENTAL`\|`GENERAL`, default `PERSONAL` |
| courseCode | string | yes | min 2, max 20, uppercased |
| courseTitle | string | yes | min 3, max 200 |
| venue | string | no | max 200 |
| dayOfWeek | number | yes | 0–6 (0=Sunday) |
| startTime | string | yes | format `HH:MM` |
| endTime | string | yes | format `HH:MM` |
| type | string | no | enum `LECTURE`\|`PRACTICAL`\|`SEMINAR`\|`EXAM`\|`TEST`, default `LECTURE` |
| isRecurring | boolean | no | default `true` |
| level | string | cond. | required when `timetableType=DEPARTMENTAL` |
| departmentId | string | cond. | required when `timetableType=DEPARTMENTAL` |
| schoolId | string | cond. | required when `timetableType=GENERAL` |

**Success:** `201`

---

### PUT /school/timetable/:id
**Auth:** Yes. Partial update, same fields.

**Success:** `200`

---

### DELETE /school/timetable/:id
**Auth:** Yes (owner or admin)

**Success:** `200`

---

### GET /school/events
**Auth:** Yes

**Query:** `upcoming` (boolean, default `true`), `departmentId`, `level`

**Success:** `200` array of events for user's school

---

### GET /school/events/:id
**Auth:** Yes

**Success:** `200` event object

---

### POST /school/events
**Auth:** `COURSE_REP`, `EVENT_ORCHESTRATOR`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| title | string | yes | min 3, max 200 |
| description | string | no | max 2000 |
| datetime | string | cond. | ISO datetime — required if `startDate` not set |
| startDate | string | no | ISO datetime |
| endDate | string | no | ISO datetime |
| location / venue | string | no | max 200 (both accepted, aliased) |
| imageUrl | string | no | valid URL |
| departmentId | string | no | |
| level | string | no | |

**Success:** `201`

---

### PATCH /school/events/:id
**Auth:** `COURSE_REP`, `EVENT_ORCHESTRATOR`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

Same fields as POST, all optional. `departmentId` and `level` accept `null`.

**Success:** `200`

---

### POST /school/events/:id/image
**Auth:** `COURSE_REP`, `EVENT_ORCHESTRATOR`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

`multipart/form-data`, field `image`. JPEG/PNG/WebP, max 5 MB.

**Success:** `200`

---

### DELETE /school/events/:id
**Auth:** `COURSE_REP`, `EVENT_ORCHESTRATOR`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### POST /school/events/:id/remind
**Auth:** Yes

**Body:** `{ "notifyAt": "2026-09-01T08:00:00.000Z" }` (ISO datetime)

**Success:** `201`

---

### POST /school/events/:id/tickets
Submit a payment receipt for a ticketed event.

**Auth:** Yes

**Body:** `{ "receiptUrl": "https://...", "receiptKey": "string" }`

**Success:** `201`

---

### GET /school/events/:id/tickets/mine
**Auth:** Yes

**Success:** `200` own ticket object or `null`

---

### GET /school/events/:id/tickets
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200` all tickets for event

---

### PATCH /school/events/:id/tickets/:ticketId/approve
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### PATCH /school/events/:id/tickets/:ticketId/reject
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "rejectionReason": "string (min 5, max 500)" }`

**Success:** `200`

---

### GET /school/map-config
**Auth:** Yes

Returns MapTiler API key for frontend map rendering.

**Success:** `200` `{ "maptilerApiKey": "string|null" }`

---

### GET /school/map-locations
**Auth:** Yes

**Query:** `type` (enum below), `search` (string)

Location types: `BUILDING`, `HOSTEL`, `CAFETERIA`, `LIBRARY`, `CLINIC`, `SPORTS`, `GATE`, `PARKING`, `OFFICE`, `LAB`, `LECTURE_HALL`, `OTHER`, `UNKNOWN`

**Success:** `200`

---

### GET /school/map-locations/route
**Auth:** Yes

**Query:** `fromLat`, `fromLng`, `toLat`, `toLng` (all numbers, required)

**Success:** `200` route data

---

### GET /school/map-locations/:id
**Auth:** Yes

**Success:** `200`

---

### POST /school/map-locations
**Auth:** `SUPER_ADMIN`

**Body:** `name` (min 2), `type`, `latitude` (-90 to 90), `longitude` (-180 to 180), `description` (max 500, opt), `floor` (max 20, opt), `tags` (array max 10, opt), `imageUrl` (URL, opt)

**Success:** `201`

---

### PATCH /school/map-locations/:id
**Auth:** `SUPER_ADMIN`. All fields optional.

**Success:** `200`

---

### PATCH /school/map-locations/bulk
**Auth:** `SUPER_ADMIN`

**Body:** `{ "updates": [{ "id", "name"?, "type"?, "description"?, "floor"?, "tags"? }] }` — 1 to 200 items

**Success:** `200`

---

### DELETE /school/map-locations/:id
**Auth:** `SUPER_ADMIN`

**Success:** `200`

---

### GET /school/emergency-contacts
**Auth:** Yes

Returns contacts for user's school.

**Success:** `200` array of `{ id, name, role, phone, whatsappNumber, extension, category, order }`

---

### POST /school/emergency-contacts
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `name` (min 2), `role` (min 2), `phone` (min 7), `whatsappNumber` (opt), `extension` (opt), `category` (`SECURITY`|`CLINIC`|`STUDENT_AFFAIRS`|`OTHER`, default `OTHER`), `order` (int, default 0)

**Success:** `201`

---

### PATCH /school/emergency-contacts/:id
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`. All fields optional.

**Success:** `200`

---

### DELETE /school/emergency-contacts/:id
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

## Study Materials & Quizzes

All routes require auth.

**Material types:** `PAST_QUESTION`, `NOTE`, `HANDOUT`, `ASSIGNMENT`, `SUMMARY`, `SLIDES`, `OTHER`

**Visibility:** `PUBLIC`, `DEPARTMENT`, `LEVEL`, `STUDY_GROUP`, `PRIVATE`

### POST /study/materials/extract-preview
Preview text extraction before uploading. `multipart/form-data`, field `file`.

**Accepted:** PDF, DOCX, DOC, PPTX, PPT, TXT, JPEG, PNG, WebP. Max 20 MB.

**Success:** `200`
```json
{ "status": "READABLE", "charCount": 4200, "preview": "First 500 chars...", "readable": true }
```

---

### GET /study/materials
**Query:**
| Param | Type | Default |
|-------|------|---------|
| type | string | — |
| courseCode | string | — |
| level | string | — |
| departmentId | string | — |
| visibility | string | — |
| studyGroupId | string | — |
| search | string | — |
| page | number | 1 |
| limit | number | 20 (max 50) |

**Success:** `200` paginated list

---

### POST /study/materials
Upload a material. `multipart/form-data`, field `file`. Max 20 MB.

**Body fields:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| title | string | yes | min 3, max 200 |
| type | string | yes | material type enum |
| courseCode | string | yes | min 2, max 20 |
| courseTitle | string | yes | min 3, max 200 |
| departmentId | string | yes | |
| year | number | no | 2000 to current year |
| level | string | no | `100`–`600` |
| description | string | no | max 1000 |
| visibility | string | no | default `PUBLIC` |
| studyGroupId | string | no | required if visibility=`STUDY_GROUP` |

**Success:** `201`

**Side effects:** Triggers async AI summary job.

---

### POST /study/materials/bulk
Bulk upload up to 10 files. `multipart/form-data`, field `files[]`. Max 20 MB/file.

**Body:** `materials` — JSON string array, each item same shape as single upload.

**Success:** `207` (partial success possible)

---

### GET /study/materials/:id
**Success:** `200` material detail (access controlled by visibility)

**Errors:** `403` if no access, `404` not found

---

### PATCH /study/materials/:id/visibility
**Body:** `{ "visibility": "DEPARTMENT", "studyGroupId": "optional" }`

**Success:** `200`

---

### DELETE /study/materials/:id
Owner can delete own material.

**Success:** `200`

---

### DELETE /study/materials/:id/admin
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### PATCH /study/materials/:id/verify
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

Marks material as faculty-verified.

**Success:** `200`

---

### POST /study/materials/:id/download
Increment download counter.

**Success:** `200`

---

### GET /study/materials/:id/download-url
Get a signed/direct download URL.

**Success:** `200` `{ "url": "https://..." }`

---

### POST /study/materials/:id/rate
**Body:** `{ "rating": 4 }` — integer 1–5

**Success:** `200`

---

### POST /study/materials/:id/bookmark
Toggle bookmark. Returns new state.

**Success:** `200` `{ "bookmarked": true }`

---

### GET /study/materials/review/pending
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query:** `page`, `limit`

**Success:** `200` paginated list

---

### PATCH /study/materials/:id/review
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "decision": "APPROVED", "note": "optional string max 500" }`

**Success:** `200`

---

### GET /study/quizzes
**Query:** `departmentId`, `studyGroupId`, `courseCode`, `level`, `visibility`, `isDraft` (boolean), `page` (default 1), `limit` (default 20, max 50)

**Success:** `200` paginated list

---

### POST /study/quizzes
**Auth:** `COURSE_REP`, `AUTHORIZED_UPLOADER`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| title | string | yes | min 3, max 200 |
| courseCode | string | yes | min 2, max 20 |
| departmentId | string | yes | |
| timeLimit | number | yes | 60–7200 seconds |
| visibility | string | no | default `DEPARTMENT` |
| isDraft | boolean | no | default `false` |
| description | string | no | max 1000 |
| level | string | no | |
| studyGroupId | string | no | |
| questions | array | yes | min 1 item |
| questions[].question | string | yes | min 5 |
| questions[].options | array | yes | 2–6 strings |
| questions[].correctAnswer | number | yes | index into options |
| questions[].explanation | string | no | |
| questions[].topic | string | no | max 100 |
| questions[].order | number | yes | int >= 0 |

**Success:** `201`

---

### POST /study/quizzes/generate
AI-generate quiz from an existing material.

**Body:** `{ "materialId": "...", "questionCount": 15, "departmentId": "...", "visibility": "DEPARTMENT", "studyGroupId": null }`

`questionCount`: 5–30, default 15

**Success:** `201`

---

### GET /study/quizzes/:id
**Success:** `200`

---

### PATCH /study/quizzes/:id
**Auth:** `COURSE_REP`, `AUTHORIZED_UPLOADER`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

Same fields as POST, all optional.

**Success:** `200`

---

### PATCH /study/quizzes/:id/publish
**Body:** `{ "isDraft": false }`

**Success:** `200`

---

### PATCH /study/quizzes/:id/approve
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "approvals": [{ "questionId": "...", "approved": true }] }`

**Success:** `200`

---

### POST /study/quizzes/:id/attempt
Submit quiz answers.

**Body:**
```json
{
  "answers": [{ "questionId": "...", "selected": 2 }],
  "timeTaken": 300
}
```

**Success:** `200` result with score, correct answers

---

### GET /study/quizzes/:id/attempts
Get own attempts for a quiz.

**Success:** `200`

---

### DELETE /study/quizzes/:id
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### GET /study/analytics/me
**Success:** `200` personal study stats

---

### GET /study/analytics/admin
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query:** `departmentId`, `courseCode`, `from` (date), `to` (date)

**Success:** `200`

---

## CGPA Calculator

All routes require auth.

### GET /cgpa/courses
**Query:** `semester` (`FIRST`|`SECOND`, opt), `session` (string, opt)

**Success:** `200`

---

### POST /cgpa/courses
**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| courseCode | string | yes | min 2, max 20 |
| courseTitle | string | yes | min 2, max 200 |
| creditUnit | number | yes | int 1–6 |
| score | number | no | 0–100 |
| passmark | number | no | default 40, 0–100 |
| semester | string | yes | `FIRST`\|`SECOND` |
| session | string | yes | format `YYYY/YYYY` e.g. `2023/2024` |

**Success:** `201`

---

### PATCH /cgpa/courses/:id
All fields optional.

**Success:** `200`

---

### DELETE /cgpa/courses/:id
**Success:** `200`

---

### POST /cgpa/calculate
Calculate GPA for a semester.

**Body:** `{ "semester": "FIRST", "session": "2024/2025" }`

**Success:** `200` `{ "gpa": 4.5, "totalCreditUnits": 18, ... }`

---

### GET /cgpa/records
All past CGPA records.

**Success:** `200`

---

### GET /cgpa/records/current
Current cumulative GPA.

**Success:** `200`

---

## Community

All routes require auth.

**Sections:** `NOTICE_BOARD`, `QNA`, `DEPT_UPDATES`, `CROSS_LEVEL`, `FRESHERS_CORNER`, `ANONYMOUS`, `CAMPUS_CULTURE`, `LOUNGE`

### GET /community/feed  ·  GET /community/posts
List posts (both paths identical).

**Query:** `section`, `departmentId`, `courseTag`, `targetLevel`, `page` (default 1), `limit` (default 20, max 50)

**Success:** `200` paginated

---

### POST /community/posts
**Body:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| content | string | yes | min 1, max 5000 |
| section | string | yes | section enum |
| priority | string | no | `URGENT`\|`ACADEMIC`\|`GENERAL`, default `GENERAL` |
| isAnonymous | boolean | no | default `false` |
| courseTag | string | no | max 20 |
| expiresAt | string | no | ISO datetime |
| attachments | array | no | max 5, each `{ url, name, size?, mimeType? }` |
| departmentId | string | no | |
| targetLevel | string | no | |

**Success:** `201`

---

### GET /community/posts/:id
**Success:** `200`

---

### DELETE /community/posts/:id
Owner or admin only.

**Success:** `200`

---

### PATCH /community/posts/:id/pin
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "isPinned": true }`

**Success:** `200`

---

### POST /community/posts/:id/upvote
**Success:** `200`

---

### POST /community/posts/:id/react
**Body:** `{ "type": "LIKE", "targetType": "post" }`

`type` enum: `LIKE`, `HELPFUL`, `INSIGHTFUL`, `FUNNY`, `SUPPORT`

**Success:** `200`

---

### POST /community/posts/:id/report
**Body:** `{ "reason": "SPAM", "targetType": "post", "details": "optional" }`

`reason` enum: `SPAM`, `INAPPROPRIATE`, `HARASSMENT`, `MISINFORMATION`, `OTHER`

**Success:** `200`

---

### POST /community/posts/:id/comments
**Body:** `{ "content": "string (min 1, max 2000)", "parentId": "optional for replies" }`

**Success:** `201`

---

### POST /community/comments/:commentId/upvote
**Success:** `200`

---

### GET /community/questions
**Query:** `type`, `courseTag`, `isSolved`, `isMentorQuestion`, `departmentId`, `page`, `limit`

Question types: `COURSE_HELP`, `ASSIGNMENT_HELP`, `CONCEPT_EXPLANATION`, `EXAM_PREP`, `PROJECT_GUIDANCE`

**Success:** `200` paginated

---

### POST /community/questions
**Body:** `title` (min 5, max 300), `content` (min 10, max 5000), `type`, `courseTag` (required, min 2), `isAnonymous` (default false), `attachments` (max 5, opt), `departmentId` (opt), `isMentorQuestion` (bool, opt)

**Success:** `201`

---

### GET /community/questions/:id · DELETE /community/questions/:id · POST /community/questions/:id/upvote
Standard get/delete/upvote.

---

### POST /community/questions/:id/answers
**Body:** `{ "content": "string (min 5, max 5000)", "attachments": [] }`

**Success:** `201`

---

### PATCH /community/questions/:id/answers/:answerId/accept
Question author accepts an answer.

**Success:** `200`

---

### PATCH /community/questions/:id/answers/:answerId/pin
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### POST /community/answers/:answerId/upvote · POST /community/answers/:answerId/react · DELETE /community/answers/:answerId
Standard upvote/react/delete on answers.

---

### GET /community/mentors
**Query:** `courseCode`, `departmentId`

**Success:** `200`

---

### GET /community/mentors/me
Own mentorships.

**Success:** `200`

---

### POST /community/mentors/register
**Body:** `{ "courseCode": "CSC201", "departmentId": "optional" }`

**Success:** `200`

---

### GET /community/faqs
**Query:** `category` (string, opt)

**Success:** `200`

---

### POST /community/faqs
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `question` (min 5, max 300), `answer` (min 5, max 2000), `category` (max 50, default `general`), `order` (int, default 0)

**Success:** `201`

---

### DELETE /community/faqs/:id
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### GET /community/reports
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query:** `resolved` (`true`/`false`), `page`, `limit`

---

### PATCH /community/reports/:reportId/resolve
**Auth:** `COURSE_REP`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### GET /community/notices · POST /community/notices · PATCH /community/notices/:id/pin
Alias routes for `NOTICE_BOARD` section. Same behaviour as posts.

---

## Study Groups

All routes require auth. Base: `/community/groups`

### GET /community/groups
**Query:** `type`, `courseTag`, `departmentId`, `page`, `limit`

Group types: `EXAM_PREP`, `ASSIGNMENT`, `TUTORIAL`, `PROJECT`, `GENERAL`

**Success:** `200` paginated (shows groups user is a member of or public groups)

---

### GET /community/groups/all
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Query:** `page`, `limit` (max 100)

---

### POST /community/groups
**Body:** `name` (min 3, max 100), `type`, `isPrivate` (default false), `description` (max 500, opt), `courseTag` (max 20, opt), `departmentId` (opt)

**Success:** `201`

---

### GET /community/groups/:id · PATCH /community/groups/:id · DELETE /community/groups/:id
Get, update (name/description/courseTag/isPrivate), delete group.

---

### POST /community/groups/:id/join · DELETE /community/groups/:id/leave
Join or leave a group.

---

### PATCH /community/groups/:id/members/:userId/role
**Body:** `{ "role": "ADMIN" }` — `ADMIN` or `MEMBER`

---

### DELETE /community/groups/:id/members/:userId
Kick a member (group admin only).

---

### POST /community/groups/:id/invites
**Body:** `{ "maxUses": 1, "expiresInHours": 24 }` — maxUses 1–100, expiresInHours 1–168

**Success:** `201` `{ "token": "...", "url": "..." }`

---

### GET /community/groups/:id/invites · DELETE /community/groups/:id/invites/:inviteId
List or revoke invites.

---

### POST /community/groups/join/:token
Accept an invite by token.

**Success:** `200`

---

### GET /community/groups/:id/messages
**Query:** `before` (cursor, message ID), `limit` (default 50, max 100)

**Success:** `200`

---

### POST /community/groups/:id/messages
**Body:** `{ "content": "string (min 1, max 2000)", "attachments": [] }`

**Success:** `201`

**Side effects:** Broadcasts `group:message` Socket.IO event to room.

---

### GET /community/groups/:id/quizzes/:quizId/leaderboard
**Success:** `200`

---

### POST /community/groups/:id/ai/summary
Share an AI-generated material summary to the group.

**Body:** `{ "materialId": "..." }`

**Success:** `200`

---

### POST /community/groups/:id/ai/ask
Ask AI a question, answer is shared to the group.

**Body:** `{ "question": "string (min 3, max 500)" }`

**Success:** `200`

---

### GET /community/groups/:id/challenges
**Success:** `200`

---

### POST /community/groups/:id/challenges
**Body:** `{ "receiverGroupId": "...", "quizId": "...", "expiresInHours": 24 }` — expiresInHours 1–24

**Success:** `201`

---

### PATCH /community/groups/:id/challenges/:challengeId/accept · /decline
Accept or decline a challenge.

---

### GET /community/groups/:id/challenges/:challengeId/result
**Success:** `200`

---

## Marketplace

All routes require auth.

### GET /marketplace/listings
**Query:** `category`, `condition`, `minPrice`, `maxPrice`, `search`, `sellerId`, `shopId`, `page` (default 1), `limit` (default 20, max 50)

Categories: `BOOKS`, `ELECTRONICS`, `CLOTHING`, `FOOD`, `FURNITURE`, `HANDOUTS`, `SERVICES`, `OTHER`

Conditions: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`

**Success:** `200` paginated

---

### GET /marketplace/listings/saved
**Success:** `200` saved listings

---

### GET /marketplace/listings/pending
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### GET /marketplace/listings/:id
**Success:** `200`

---

### POST /marketplace/listings
**Body:** `title` (min 3, max 200), `description` (min 10, max 2000), `price` (0–10,000,000), `category`, `condition`, `images` (array of URLs, min 1, max 5), `location` (max 200, opt), `whatsapp` (max 20, opt), `shopId` (opt)

**Success:** `201`

---

### PATCH /marketplace/listings/:id
All fields optional + `isAvailable` (boolean).

**Success:** `200`

---

### DELETE /marketplace/listings/:id
Owner or admin.

**Success:** `200`

---

### POST /marketplace/listings/:id/save
Toggle save/unsave.

**Success:** `200`

---

### PATCH /marketplace/listings/:id/moderate
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "decision": "APPROVED", "note": "optional" }`

**Success:** `200`

---

### GET /marketplace/shops/:id
**Success:** `200`

---

### POST /marketplace/shops
One shop per user.

**Body:** `{ "name": "string (min 2, max 100)", "description": "optional max 1000" }`

**Success:** `201`

---

### PATCH /marketplace/shops/me
**Body:** `name`, `description`, `logoUrl` (URL, opt), `isActive` (bool, opt)

**Success:** `200`

---

### DELETE /marketplace/shops/:id
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### POST /marketplace/shops/:id/follow
Toggle follow/unfollow.

**Success:** `200`

---

### POST /marketplace/sellers/:id/rate
**Body:** `{ "rating": 5, "comment": "optional max 500" }`

**Success:** `200`

---

### GET /marketplace/lost-found
**Query:** `type` (`LOST`|`FOUND`), `search`, `page`, `limit`

**Success:** `200` paginated

---

### POST /marketplace/lost-found
**Body:** `type` (`LOST`|`FOUND`), `title` (min 3, max 200), `description` (min 10, max 1000), `contactInfo` (min 5, max 200), `location` (max 200, opt), `imageUrl` (URL, opt)

**Success:** `201`

---

### PATCH /marketplace/lost-found/:id/resolve
Mark as resolved (owner only).

**Success:** `200`

---

### GET /marketplace/accommodation
**Query:** `type`, `minPrice`, `maxPrice`, `search`, `page`, `limit`

Types: `SELF_CONTAIN`, `ROOM_AND_PARLOUR`, `SINGLE_ROOM`, `SHARED_ROOM`, `HOSTEL`, `FLAT`, `OTHER`

---

### GET /marketplace/accommodation/:id
---

### POST /marketplace/accommodation
Note: The route has no explicit role check — any authenticated user can post, but `HOUSE_AGENT` is the intended role. See Known Gaps.

**Body:** `title`, `description`, `type`, `price` (0–100,000,000), `period` (`year`|`month`|`semester`, default `year`), `location` (min 3, max 200), `images` (URLs, max 5), `whatsapp` (min 7, max 20)

**Success:** `201`

---

### PATCH /marketplace/accommodation/:id
All fields optional + `isAvailable` (bool).

---

### DELETE /marketplace/accommodation/:id
Owner or admin.

---

### PATCH /marketplace/accommodation/:id/moderate
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "decision": "APPROVED", "note": "opt" }`

---

### POST /marketplace/agents/apply
Apply to become a verified house agent.

**Body:** `businessName` (min 2, max 200), `businessAddress` (min 5, max 500), `phoneNumber` (min 7, max 20), `studentIdUrl` (valid URL)

**Success:** `200`

---

### GET /marketplace/agents/me
Own agent profile/application status.

**Success:** `200`

---

### GET /marketplace/agents/pending
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### PATCH /marketplace/agents/:userId/review
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "decision": "APPROVED", "note": "opt max 500" }`

**Success:** `200`

---

### GET /marketplace/roommates
**Success:** `200`

---

### POST /marketplace/roommates
**Body:** `description` (min 10, max 1000), `preferredArea` (min 3, max 200), `gender` (`male`|`female`|`any`), `level` (min 1, max 10), `whatsapp` (min 7, max 20), `budget` (number, opt)

**Success:** `201`

---

### PATCH /marketplace/roommates/:id
All fields optional + `isActive` (bool).

---

### DELETE /marketplace/roommates/:id
---

### GET /marketplace/services
**Query:** `category`, `search`, `page`, `limit`

Service categories: `TUTORING`, `GRAPHICS`, `CODING`, `PHOTOGRAPHY`, `PRINTING`, `LAUNDRY`, `FOOD`, `DELIVERY`, `OTHER`

---

### GET /marketplace/services/pending
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### GET /marketplace/services/:id
---

### POST /marketplace/services
**Body:** `title`, `description`, `category`, `images` (URLs, max 5), `whatsapp` (min 7, max 20), `price` (number, opt), `priceNote` (max 100, opt)

**Success:** `201`

---

### PATCH /marketplace/services/:id
All fields optional + `isActive` (bool).

---

### DELETE /marketplace/services/:id
---

### PATCH /marketplace/services/:id/moderate
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "decision": "APPROVED", "note": "opt" }`

---

### GET /marketplace/jobs
**Query:** `type`, `search`, `page`, `limit`

Job types: `INTERNSHIP`, `PART_TIME`, `CAMPUS_JOB`, `FREELANCE`

---

### GET /marketplace/jobs/pending
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### GET /marketplace/jobs/:id
---

### POST /marketplace/jobs
**Body:** `title`, `description`, `type`, `location` (min 3, max 200), `whatsapp` (min 7, max 20), `pay` (string max 100, opt)

**Success:** `201`

---

### PATCH /marketplace/jobs/:id
All fields optional.

---

### DELETE /marketplace/jobs/:id
---

### PATCH /marketplace/jobs/:id/approve
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Success:** `200`

---

### PATCH /marketplace/jobs/:id/reject
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

**Body:** `{ "rejectionReason": "string min 5, max 500" }`

**Success:** `200`

---

### POST /marketplace/report
**Body:** `targetType` (`listing`|`accommodation`|`service`), `targetId`, `reason` (`SPAM`|`FAKE_LISTING`|`INAPPROPRIATE_CONTENT`|`SCAM`|`WRONG_CATEGORY`|`OTHER`), `details` (max 500, opt)

**Success:** `200`

---

### GET /marketplace/reports
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

### PATCH /marketplace/reports/:id/resolve
**Auth:** `SCHOOL_ADMIN`, `SUPER_ADMIN`

---

## Notifications

All routes require auth.

### GET /notifications
**Query:** `page` (default 1), `limit` (default 30, max 100)

**Success:** `200`
```json
{
  "success": true,
  "data": [{ "id": "...", "title": "...", "body": "...", "isRead": false, "createdAt": "..." }],
  "meta": { "total": 50, "unreadCount": 12, "page": 1, "limit": 30 }
}
```

---

### PATCH /notifications/:id/read
**Success:** `200` updated notification

---

### PATCH /notifications/read-all
**Success:** `200`

---

### DELETE /notifications/:id
**Success:** `200`

---

### GET /notifications/settings
**Success:** `200`

---

### PATCH /notifications/settings
**Body (all optional):** `pushNotifications`, `reminderPush`, `eventPush`, `whatsappOptIn`, `announcementPush`, `quietHoursEnabled` — booleans; `quietHoursStart`, `quietHoursEnd` — `HH:MM` format; `lowDataMode`, `darkMode` — booleans

**Success:** `200`

---

## Reminders

All routes require auth.

### GET /reminders
**Query:** `isCompleted` (`true`/`false`), `category`, `priority`, `page` (default 1), `limit` (default 50, max 100)

Categories: `ASSIGNMENT`, `TEST`, `EXAM`, `PROJECT`, `PRACTICAL`, `OTHER`

Priorities: `HIGH`, `MEDIUM`, `LOW`

**Success:** `200` with meta `{ total, page, limit }`

---

### POST /reminders
**Body:**
| Field | Type | Required |
|-------|------|----------|
| title | string | yes (min 2, max 200) |
| dueDate | string | yes (ISO datetime) |
| notifyAt | string | yes (ISO datetime) |
| category | string | yes |
| priority | string | no (default `MEDIUM`) |
| description | string | no (max 1000) |
| isRecurring | boolean | no (default false) |
| recurringDays | number[] | no (0–6, max 7 items) |

**Success:** `201`

**Side effects:** Queues push notification at `notifyAt`.

---

### PATCH /reminders/:id
All fields optional + `isCompleted` (bool).

**Success:** `200`

---

### DELETE /reminders/:id
**Success:** `200`

---

### PATCH /reminders/:id/complete
Mark as complete.

**Success:** `200`

---

## Planner

All routes require auth.

### GET /planner/today
Aggregated view: today's timetable + due reminders + upcoming events.

**Success:** `200`

---

### GET /planner/weekly
**Query:** `weekOffset` (integer -52 to 52, default 0)

`weekOffset=0` = current week, `1` = next week, `-1` = last week.

**Success:** `200`

---

## AI Features

All routes require auth.

### POST /ai/summarize
Request AI summary for a study material.

**Body:** `{ "materialId": "..." }`

**Success:** `200` if cached, `202` if queued for processing

```json
{ "cached": true, "summary": "...", "materialId": "..." }
```

**Side effects:** If not cached, queues async summary job (Groq AI).

---

### GET /ai/summaries
List own AI summaries.

**Success:** `200`

---

### GET /ai/summaries/:materialId
Get summary for a specific material.

**Success:** `200` or `404`

---

### GET /ai/personal-study/sessions
List own personal study sessions.

**Success:** `200`

---

### POST /ai/personal-study/sessions
Create a session by uploading a file OR linking an existing material.

`multipart/form-data` or JSON.

**Body fields:**
| Field | Type | Required |
|-------|------|----------|
| title | string | yes (min 2, max 200) |
| courseCode | string | yes (min 2, max 20) |
| materialId | string | no (use existing material) |
| file | file | no (upload new file) |

Either `materialId` or a `file` must be provided.

Accepted files: PDF, DOCX, DOC, PPTX, PPT, TXT, JPEG, PNG, WebP. Max 20 MB.

**Success:** `201`

---

### GET /ai/personal-study/sessions/:sessionId
**Success:** `200`

---

### DELETE /ai/personal-study/sessions/:sessionId
**Success:** `200`

---

### POST /ai/personal-study/sessions/:sessionId/quiz/generate
AI-generate a personalised quiz from session material.

**Body:** `{ "questionCount": 10, "focusTopics": "optional string max 300", "replaceExisting": false }`

`questionCount`: 3–30, default 10

**Success:** `200`

---

### POST /ai/personal-study/sessions/:sessionId/quiz/submit
**Body:**
```json
{ "answers": [{ "questionId": "...", "selected": 1 }] }
```

**Success:** `200` with score breakdown

---

### POST /ai/personal-study/sessions/:sessionId/ask
Ask AI a question about session material.

**Body:** `{ "question": "string (min 3, max 1000)" }`

**Success:** `200` `{ "answer": "..." }`

---

## Campus Map

All routes require auth. Scoped to user's `schoolId` automatically.

### GET /campus-map/features
**Query:** `bbox` (`minLng,minLat,maxLng,maxLat`), `category`, `limit` (default 500, max 1000)

Categories: `BUILDING`, `HOSTEL`, `LECTURE_HALL`, `LIBRARY`, `CLINIC`, `CAFETERIA`, `ATM`, `SPORTS`, `SHUTTLE_STOP`, `GATE`, `PARKING`, `LANDMARK`, `OFFICE`, `LAB`, `ROAD`, `PATH`, `OTHER`

**Success:** `200` GeoJSON features array

---

### GET /campus-map/features/:id
**Success:** `200`

---

### GET /campus-map/features/:id/entrances
**Success:** `200`

---

### GET /campus-map/search
**Query:** `q` (required, min 1, max 120), `category` (opt), `near` (`lat,lng` string, opt), `limit` (default 12, max 50)

**Success:** `200`

---

### GET /campus-map/nearest
**Query:** `lat`, `lng` (both required), `category` (opt), `limit` (default 8, max 25)

**Success:** `200`

---

### POST /campus-map/route
**Body:**
```json
{
  "from": { "lat": 6.5, "lng": 3.3 },
  "to": { "featureId": "...", "lat": 6.51, "lng": 3.31 },
  "mode": "walking"
}
```
`mode`: `walking` | `accessible`

`to` requires at least one of: `featureId`, `entranceId`, or `lat`+`lng`.

**Success:** `200` route with geometry, distance, duration

---

### POST /campus-map/route/progress
Check navigation progress.

**Body:** `{ "routeId": "...", "user": { "lat": ..., "lng": ... }, "route": { "type": "LineString", "coordinates": [[lng,lat], ...] } }`

**Success:** `200`

---

### GET /campus-map/categories
**Success:** `200` categories with feature counts

---

### GET /campus-map/tiles/metadata
**Success:** `200` tile metadata

---

## School Admin

All routes require `SCHOOL_ADMIN` or `SUPER_ADMIN`.

### GET /school-admin/stats
School-scoped dashboard counts.

**Success:** `200`

---

### GET /school-admin/audit-logs
**Success:** `200`

---

### GET /school-admin/users
**Query:** `search`, `role`, `departmentId`, `page`, `limit`

**Success:** `200`

---

### PATCH /school-admin/users/:userId/block · /unblock
**Success:** `200`

---

### GET /school-admin/agents
**Query:** `status` (`PENDING`|`APPROVED`|`REJECTED`)

**Success:** `200`

---

### PATCH /school-admin/agents/:userId/revoke
Demote approved agent back to `STUDENT`.

**Success:** `200`

---

### GET /school-admin/faculties · GET /school-admin/departments
**Query (departments):** `facultyId`

**Success:** `200`

---

### GET /school-admin/faqs · POST /school-admin/faqs
List or create FAQs for the school.

POST **Body:** same as `POST /community/faqs`

---

### PATCH /school-admin/faqs/:faqId · DELETE /school-admin/faqs/:faqId
---

## Super Admin

All routes require `SUPER_ADMIN`.

### POST /super-admin/admins
Create a school admin account.

**Body:** `fullName`, `email`, `password` (min 8), `schoolId`, `role` (default `SCHOOL_ADMIN`)

**Success:** `201`

---

### GET /super-admin/admins
**Success:** `200`

---

### DELETE /super-admin/admins/:adminId
### PATCH /super-admin/admins/:adminId/deactivate · /reactivate
### PATCH /super-admin/admins/:adminId/reset-password
**Body:** `{ "newPassword": "string min 8" }`

---

### PATCH /super-admin/users/:userId/block · /unblock
**Success:** `200`

---

### GET /super-admin/schools
**Success:** `200`

---

### POST /super-admin/schools
**Body:** `name` (min 2, max 200), `shortCode` (min 2, max 20, uppercased), `location` (min 2, max 200), `country` (default `Nigeria`), `logoUrl` (URL, opt)

**Success:** `201`

---

### PATCH /super-admin/schools/:schoolId
All fields optional.

**Success:** `200`

---

### GET /super-admin/schools/:schoolId/faculties · POST
GET returns faculties. POST **Body:** `{ "name": "string min 2" }`

---

### DELETE /super-admin/faculties/:facultyId
---

### GET /super-admin/faculties/:facultyId/departments · POST
POST **Body:** `{ "name": "string min 2", "shortCode": "uppercase min 2" }`

---

### DELETE /super-admin/departments/:departmentId
---

### GET /super-admin/audit-logs
**Query:** `action`, `performedById`, `targetUserId`, `from` (ISO datetime), `to` (ISO datetime), `page` (default 1), `limit` (default 50, max 100)

**Success:** `200`

---

### GET /super-admin/stats
Platform-wide analytics.

**Success:** `200`

---

### PUT /super-admin/map/schools/:schoolId/features
Upsert a map feature (GeoJSON).

**Body:** `id`, `name`, `category`, `geometry` (GeoJSON), plus optional `description`, `aliases`, `tags`, `images`, `metadata`, `routing`, `accessibility`, `importance`, `isActive`

Feature categories: `BUILDING`, `HOSTEL`, `LECTURE_HALL`, `LIBRARY`, `CLINIC`, `CAFETERIA`, `ATM`, `SPORTS`, `SHUTTLE_STOP`, `GATE`, `PARKING`, `LANDMARK`, `OFFICE`, `LAB`, `ROAD`, `PATH`, `OTHER`

**Success:** `200`

---

### DELETE /super-admin/map/schools/:schoolId/features/:featureId
---

### POST /super-admin/map/schools/:schoolId/features/:featureId/images
Upload image for a map feature. `multipart/form-data`, field `image`. JPEG/PNG/WebP, max 10 MB.

**Success:** `200`

---

### DELETE /super-admin/map/schools/:schoolId/features/:featureId/images
**Body:** `{ "imageUrl": "optional — omit to delete all" }`

---

### PUT /super-admin/map/schools/:schoolId/entrances
**Body:** `id`, `geometry`, `kind` (`MAIN`|`SECONDARY`|`ACCESSIBLE`|`SERVICE`|`EMERGENCY`, default `SECONDARY`), `featureId` (opt), `name` (opt), `priority` (opt), `isAccessible` (opt), `metadata` (opt)

---

### DELETE /super-admin/map/schools/:schoolId/entrances/:entranceId
---

### POST /super-admin/map/schools/:schoolId/import
Import map data from GeoJSON FeatureCollection.

**Body:** `{ "features": [{ "type": "Feature", "geometry": {...}, "properties": {...} }] }`

---

## Health

### GET /health
No auth required.

**Success:** `200`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600,
    "timestamp": "2026-08-01T14:00:00.000Z",
    "services": { "database": "ok" }
  }
}
```

**Degraded:** `503` with `status: "degraded"` if DB is unreachable.

---

## Environment / Base URLs

From `.env.example`:

| Env | Default |
|-----|---------|
| `NODE_ENV=development` | Port `3000` |
| `PORT` | `3000` |

Swagger UI (non-production only): `GET /api/docs`

OpenAPI JSON (non-production only): `GET /api/docs.json`

Static file uploads (non-production): `GET /uploads/<filename>`

No staging/production URLs are committed to the repo. Confirm with backend team.

---

## Known Gaps / Inconsistencies

1. **Accommodation posting — no role guard.** The route comment says "Only HOUSE_AGENT / SCHOOL_ADMIN / SUPER_ADMIN can post" but `authorize()` is not applied. Any authenticated user can currently create accommodation listings.

2. **`assignRole` allows SUPER_ADMIN.** The validator's role enum includes `SUPER_ADMIN`, meaning a `SCHOOL_ADMIN` could technically promote someone to `SUPER_ADMIN`. Likely unintended — no business-layer guard was seen.

3. **`POST /community/notices` — no section enforcement.** The notices route calls the same `createPost` handler without forcing `section: "NOTICE_BOARD"` in the body. A caller can omit the section or use any section value.

4. **`group:message` socket event — `groupId` source.** The handler reads `groupId` from `data.groupId` after already calling `sendMessageSchema.parse(data)`, but `groupId` is not part of `sendMessageSchema`. If the client doesn't include it, it will be `undefined` and the message will fail silently. The route-based REST equivalent (`POST /community/groups/:id/messages`) does not have this issue.

5. **Ticket system — `requiresTicket` hardcoded to `false`.** The `createEventSchema` transform always sets `requiresTicket: false`. Ticketed events appear to only be creatable via direct DB seeding or super-admin tooling.

6. **No response schema for many service/delete endpoints.** Endpoints like `DELETE /reminders/:id`, `DELETE /study/materials/:id`, etc. return `200` with a `data` payload but the exact shape is not specified in validators (determined by service layer). The shape is typically `{ deleted: true }` or the deleted object but this wasn't verified for every route.

7. **`POST /study/materials/bulk` — `materials` field must be JSON string.** Unlike regular form fields, the `materials` array must be sent as a JSON-serialized string when using `multipart/form-data`. This is non-standard and may surprise frontend developers.

8. **Pagination inconsistency.** Most paginated endpoints use `sendPaginated` (wraps in `meta`). Some admin list endpoints (e.g. `GET /users/search`, `GET /users/`) use `sendSuccess` with a manual `meta` object — the shape is the same but the call path differs. Verify field names match in your client.

9. **AI features require `GROQ_API_KEY`.** If not configured, AI summary/quiz generation endpoints will fail. The failure mode (error vs. silent degradation) is not documented in the route layer.

10. **`moduleStubRoutes` registered but not documented.** `src/modules/moduleStub.routes.ts` is imported and registered but was a minimal stub file — treat any routes there as unstable/undocumented.
