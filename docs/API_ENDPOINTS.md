# SCH Hub Backend — Full API Documentation

> **Base URL:** `http://localhost:3000/api/v1`
>
> **Auth:** All protected endpoints require `Authorization: Bearer <accessToken>` in the request header.
>
> **Standard Response Shape:**
> ```json
> { "success": true, "data": {}, "meta": {} }
> ```
>
> **Error Response Shape:**
> ```json
> { "success": false, "message": "Error description", "code": 400 }
> ```
>
> **Paginated responses** include:
> ```json
> { "items": [], "total": 0, "page": 1, "limit": 20, "pages": 1 }
> ```

---

## Table of Contents

1. [Health](#1-health)
2. [Auth](#2-auth)
3. [Users](#3-users)
4. [School — Public Lookup](#4-school--public-lookup)
5. [School — Timetable](#5-school--timetable)
6. [School — Events](#6-school--events)
7. [School — Emergency Contacts](#7-school--emergency-contacts)
8. [School — Map Locations (Legacy)](#8-school--map-locations-legacy)
9. [Campus Map (PostGIS)](#9-campus-map-postgis)
10. [Study — Materials](#10-study--materials)
11. [Study — Quizzes](#11-study--quizzes)
12. [Study — Analytics](#12-study--analytics)
13. [AI Summaries](#13-ai-summaries)
14. [CGPA](#14-cgpa)
15. [Community — Posts & Feed](#15-community--posts--feed)
16. [Community — Q&A](#16-community--qa)
17. [Community — Mentors](#17-community--mentors)
18. [Community — Freshers FAQ](#18-community--freshers-faq)
19. [Community — Reports](#19-community--reports)
20. [Study Groups](#20-study-groups)
21. [Marketplace — Listings](#21-marketplace--listings)
22. [Marketplace — Shops](#22-marketplace--shops)
23. [Marketplace — Lost & Found](#23-marketplace--lost--found)
24. [Marketplace — Accommodation](#24-marketplace--accommodation)
25. [Marketplace — Roommates](#25-marketplace--roommates)
26. [Marketplace — Services](#26-marketplace--services)
27. [Marketplace — Jobs & Internships](#27-marketplace--jobs--internships)
28. [Reminders](#28-reminders)
29. [Notifications](#29-notifications)
30. [Planner](#30-planner)
31. [Super Admin](#31-super-admin)

---

## 1. Health

### `GET /health`
Public. Returns API and database status.
psql
**Response:**
```json
{ "success": true, "data": { "status": "ok", "db": "ok" } }
```

---

## 2. Auth

> Rate-limited endpoints are marked 🔒. All others are public.

### `POST /auth/register` 🔒
Register a new student account. Sends email verification OTP.

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "matricNumber": "CSC/2021/001",
  "level": "300",
  "schoolId": "<cuid>",
  "facultyId": "<cuid>",
  "departmentId": "<cuid>",
  "phone": "+2348012345678"
}
```

**Response `201`:**
```json
{
  "user": { "id": "", "fullName": "", "email": "", "role": "STUDENT", "level": "300", "schoolId": "", "departmentId": "" },
  "tokens": { "accessToken": "", "refreshToken": "" }
}
```

---

### `POST /auth/login` 🔒
Login with email and password.

**Body:**
```json
{ "email": "john@example.com", "password": "Password123!" }
```

**Response `200`:**
```json
{
  "user": { "id": "", "fullName": "", "email": "", "role": "STUDENT", "level": "300", "schoolId": "", "departmentId": "", "isVerified": true },
  "accessToken": "",
  "refreshToken": "",
  "role": "STUDENT",
  "dashboardRedirect": "mobile_app"
}
```
> `dashboardRedirect` values: `mobile_app` | `course_rep_dashboard` | `event_orchestrator_dashboard` | `admin_dashboard` | `super_admin_dashboard`

---

### `POST /auth/refresh`
Exchange a refresh token for a new access token.

**Body:**
```json
{ "refreshToken": "<token>" }
```

**Response `200`:**
```json
{ "accessToken": "", "refreshToken": "" }
```

---

### `POST /auth/logout` 🔐
Invalidate the current refresh token.

**Body:**
```json
{ "refreshToken": "<token>" }
```

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

### `GET /auth/me` 🔐
Get the currently authenticated user's full profile.

**Response `200`:** Full user object.

---

### `POST /auth/forgot-password` 🔒
Send a password reset OTP to the given email.

**Body:**
```json
{ "email": "john@example.com" }
```

**Response `200`:**
```json
{ "message": "If that email exists, an OTP has been sent." }
```

---

### `POST /auth/verify-otp` 🔒
Verify an OTP for email verification or password reset.

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "type": "EMAIL_VERIFICATION"
}
```
> `type`: `EMAIL_VERIFICATION` | `PASSWORD_RESET`

**Response `200`:**
```json
{ "verified": true }
```

---

### `POST /auth/reset-password` 🔒
Reset password after verifying the OTP.

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response `200`:**
```json
{ "message": "Password reset successful. Please log in." }
```

---

### `POST /auth/resend-otp` 🔒
Resend an OTP.

**Body:**
```json
{ "email": "john@example.com", "type": "EMAIL_VERIFICATION" }
```

**Response `200`:**
```json
{ "message": "OTP resent successfully." }
```

---

## 3. Users

All endpoints require authentication 🔐.

### `GET /users/me`
Get full profile of the logged-in user.

---

### `GET /users/:id`
Get public profile of any user.

---

### `PATCH /users/me/profile`
Update own profile.

**Body (all optional):**
```json
{
  "fullName": "John Doe",
  "phone": "+2348012345678",
  "bio": "CS Student",
  "level": "400"
}
```

---

### `POST /users/me/avatar`
Upload profile picture. Multipart form data.

**Form field:** `avatar` (JPEG / PNG / WebP, max 5MB)

**Response:** `{ "profilePictureUrl": "https://..." }`

---

### `PATCH /users/me/settings`
Update notification and app preferences.

**Body (all optional):**
```json
{
  "darkMode": false,
  "lowDataMode": false,
  "notificationsEnabled": true,
  "emailNotifications": true,
  "pushNotifications": true,
  "reminderPush": true,
  "eventPush": true,
  "whatsappOptIn": false,
  "announcementPush": true,
  "quietHoursEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

---

### `POST /users/me/fcm-token`
Register a Firebase Cloud Messaging token for push notifications.

**Body:**
```json
{ "token": "<fcm_device_token>" }
```

---

### `GET /users/me/bookmarks`
Get all bookmarked materials for the logged-in user.

---

### `GET /users/me/materials`
Get materials uploaded by the logged-in user.

---

### `GET /users/:id/materials`
Get materials uploaded by another user.

---

### `GET /users/me/sessions`
List all active login sessions (refresh tokens).

**Response:**
```json
[{ "id": "", "deviceInfo": "", "createdAt": "", "expiresAt": "" }]
```

---

### `DELETE /users/me/sessions/:sessionId`
Revoke a specific session.

---

### `DELETE /users/me/sessions`
Revoke all sessions (logout everywhere).

---

### `GET /users/search` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Search users by name, email, or matric number.

**Query params:** `q` (search string), `page`, `limit`

---

### `GET /users` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
List all users in the school.

**Query params:** `page`, `limit`, `role`, `level`, `departmentId`

---

### `PATCH /users/nominate-course-rep` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Nominate a student as course rep.

**Body:**
```json
{ "userId": "<cuid>" }
```

---

### `PATCH /users/assign-role` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Assign a role to a user.

**Body:**
```json
{ "userId": "<cuid>", "role": "AUTHORIZED_UPLOADER" }
```
> Assignable roles: `AUTHORIZED_UPLOADER` | `EVENT_ORCHESTRATOR` | `SCHOOL_ADMIN`

---

## 4. School — Public Lookup

No authentication required.

### `GET /school/schools`
List active schools. Returns only UNILESA when `SCHOOL_ID` env var is set.

**Response:**
```json
[{ "id": "", "name": "University of Ilesa", "shortCode": "UNILESA", "location": "Ilesa, Osun State", "logoUrl": null }]
```

---

### `GET /school/schools/:id/faculties`
List faculties for a school.

---

### `GET /school/faculties/:id/departments`
List departments for a faculty.

---

## 5. School — Timetable

All endpoints 🔐.

### `GET /school/timetable`
Get timetable entries.

**Query params:**
| Param | Values | Description |
|---|---|---|
| `type` | `PERSONAL` \| `DEPARTMENTAL` \| `GENERAL` | Defaults to `PERSONAL` |

---

### `POST /school/timetable`
Create a timetable entry.

**Body:**
```json
{
  "timetableType": "PERSONAL",
  "courseCode": "CSC301",
  "courseTitle": "Data Structures",
  "venue": "LT1",
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "10:00",
  "type": "LECTURE",
  "isRecurring": true,
  "level": "300",
  "departmentId": "<cuid>",
  "schoolId": "<cuid>"
}
```
> `dayOfWeek`: 0=Sunday … 6=Saturday
> `type`: `LECTURE` | `PRACTICAL` | `SEMINAR` | `EXAM` | `TEST`
> `timetableType` DEPARTMENTAL requires `level` + `departmentId`. GENERAL requires `schoolId`. Admins/Course Reps only for DEPARTMENTAL/GENERAL.

---

### `PUT /school/timetable/:id`
Update a timetable entry. Same body as create (all fields optional).

---

### `DELETE /school/timetable/:id`
Delete a timetable entry.

---

## 6. School — Events

All endpoints 🔐.

### `GET /school/events`
List upcoming events for the user's school.

**Query params:** `upcoming` (default `true`), `departmentId`, `level`

---

### `GET /school/events/:id`
Get a single event's details.

---

### `POST /school/events` 🛡️ `COURSE_REP` `EVENT_ORCHESTRATOR` `SCHOOL_ADMIN` `SUPER_ADMIN`
Create an event. All events are `INFO_ONLY` — no ticketing.

**Body:**
```json
{
  "title": "Fresher's Week",
  "description": "Welcome event for new students",
  "startDate": "2026-09-01T09:00:00.000Z",
  "endDate": "2026-09-05T17:00:00.000Z",
  "venue": "Main Auditorium",
  "departmentId": "<cuid>",
  "level": "100"
}
```
> Course Reps can only create events for their own department. Event Orchestrators and Admins can set any `departmentId`.

---

### `PATCH /school/events/:id` 🛡️ `COURSE_REP` `EVENT_ORCHESTRATOR` `SCHOOL_ADMIN` `SUPER_ADMIN`
Update an event. Same body as create (all fields optional).

---

### `POST /school/events/:id/image` 🛡️ `COURSE_REP` `EVENT_ORCHESTRATOR` `SCHOOL_ADMIN` `SUPER_ADMIN`
Upload event cover image. Multipart form data.

**Form field:** `image` (JPEG / PNG / WebP, max 5MB)

---

### `DELETE /school/events/:id` 🛡️ `COURSE_REP` `EVENT_ORCHESTRATOR` `SCHOOL_ADMIN` `SUPER_ADMIN`
Soft-delete an event (`isActive = false`).

---

### `POST /school/events/:id/remind` 🔐
Set a personal reminder for an event.

**Body:**
```json
{ "notifyAt": "2026-09-01T08:00:00.000Z" }
```
> `notifyAt` must be before the event's `startDate`.

---

## 7. School — Emergency Contacts

All endpoints 🔐.

### `GET /school/emergency-contacts`
Get all emergency contacts for the user's school, ordered by `order` asc.

**Response:**
```json
[
  {
    "id": "",
    "name": "Campus Security",
    "role": "Security Officer",
    "phone": "+2348000000001",
    "whatsappNumber": null,
    "extension": null,
    "category": "SECURITY",
    "order": 0
  }
]
```
> `category`: `SECURITY` | `CLINIC` | `STUDENT_AFFAIRS` | `OTHER`
> Frontend: use `whatsappNumber ?? phone` to build the `https://wa.me/<number>` deep link.

---

### `POST /school/emergency-contacts` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Create an emergency contact.

**Body:**
```json
{
  "name": "Campus Security",
  "role": "Security Officer",
  "phone": "+2348000000001",
  "whatsappNumber": "+2348000000001",
  "extension": "101",
  "category": "SECURITY",
  "order": 0
}
```

---

### `PATCH /school/emergency-contacts/:id` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Update an emergency contact. All body fields optional.

---

### `DELETE /school/emergency-contacts/:id` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Delete an emergency contact.

---

## 8. School — Map Locations (Legacy)

Simple lat/lng table. For full spatial features use [Campus Map](#9-campus-map-postgis). All 🔐.

### `GET /school/map-config`
Returns MapTiler API key for the frontend map renderer.

**Response:** `{ "maptilerApiKey": "<key>" }`

---

### `GET /school/map-locations`
List campus map locations.

**Query params:** `type` (MapLocationType), `search` (string)

---

### `GET /school/map-locations/route`
Get a walking route between two coordinates (OpenRouteService or straight-line fallback).

**Query params:** `fromLat`, `fromLng`, `toLat`, `toLng`

**Response:** GeoJSON `FeatureCollection`

---

### `GET /school/map-locations/:id`
Get a single map location.

---

### `POST /school/map-locations` 🛡️ `SUPER_ADMIN`
Create a map location.

**Body:**
```json
{
  "name": "Main Library",
  "type": "LIBRARY",
  "description": "Central university library",
  "latitude": 7.6031,
  "longitude": 4.7071,
  "floor": "G",
  "tags": ["library", "study"],
  "imageUrl": "https://..."
}
```
> `type`: `BUILDING` | `HOSTEL` | `CAFETERIA` | `LIBRARY` | `CLINIC` | `SPORTS` | `GATE` | `PARKING` | `OFFICE` | `LAB` | `LECTURE_HALL` | `OTHER` | `UNKNOWN`

---

### `PATCH /school/map-locations/bulk` 🛡️ `SUPER_ADMIN`
Bulk update map locations.

**Body:**
```json
{
  "updates": [
    { "id": "<cuid>", "name": "New Name", "type": "BUILDING" }
  ]
}
```

---

### `PATCH /school/map-locations/:id` 🛡️ `SUPER_ADMIN`
Update a single map location. All fields optional.

---

### `DELETE /school/map-locations/:id` 🛡️ `SUPER_ADMIN`
Delete a map location.

---

## 9. Campus Map (PostGIS)

Mounted at `/campus-map`. All endpoints 🔐.

### `GET /campus-map/features`
Get campus features as GeoJSON `FeatureCollection`.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `bbox` | `minLng,minLat,maxLng,maxLat` | Viewport filter |
| `category` | string | Filter by category e.g. `BUILDING` |

---

### `GET /campus-map/features/:id`
Get a single campus feature as GeoJSON.

---

### `GET /campus-map/features/:id/entrances`
Get all entrances for a campus feature.

---

### `GET /campus-map/categories`
Get all available feature categories and their counts for the user's school.

---

### `GET /campus-map/search`
Ranked search across names, aliases, tags, and categories.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Search query |
| `category` | string | Optional category filter |
| `near` | `lat,lng` | Optional proximity boost |

---

### `GET /campus-map/nearest`
Find nearest campus features to a coordinate.

**Query params:** `lat`, `lng`, `category` (optional)

---

### `POST /campus-map/route`
Compute a campus walking route.

**Body:**
```json
{
  "from": { "lat": 7.6031, "lng": 4.7071 },
  "to": { "featureId": "campus_library" },
  "mode": "walking"
}
```
> `to` can be `{ "featureId": "" }` or `{ "lat": 0, "lng": 0 }`
> `mode`: `walking` | `accessible`

**Response:** GeoJSON route with `steps`, `distanceMeters`, `estimatedSeconds`

---

### `POST /campus-map/route/progress`
Check live route progress and off-route detection.

**Body:**
```json
{ "lat": 7.6031, "lng": 4.7071, "routeId": "<id>" }
```

---

### `GET /campus-map/tiles/metadata`
Returns rendering capability metadata for the GIS backend.

---

## 10. Study — Materials

All endpoints 🔐.

### `GET /study/materials`
List materials with filters.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `courseCode` | string | Filter by course code |
| `type` | string | `PAST_QUESTION` \| `NOTE` \| `HANDOUT` \| `ASSIGNMENT` \| `SUMMARY` \| `SLIDES` \| `OTHER` |
| `level` | string | e.g. `300` |
| `visibility` | string | `PUBLIC` \| `DEPARTMENT` \| `LEVEL` \| `STUDY_GROUP` \| `PRIVATE` |
| `search` | string | Search title/description |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `50` |

---

### `POST /study/materials` 🛡️ `COURSE_REP` `AUTHORIZED_UPLOADER` `SCHOOL_ADMIN` `SUPER_ADMIN`
Upload a material file. Multipart form data.

**Form fields:**
| Field | Type | Required |
|---|---|---|
| `file` | File (PDF/DOCX/PPTX/TXT/image, max 20MB) | ✅ |
| `title` | string | ✅ |
| `type` | MaterialType | ✅ |
| `courseCode` | string | ✅ |
| `courseTitle` | string | ✅ |
| `year` | number | ❌ |
| `level` | string | ❌ |
| `description` | string | ❌ |
| `visibility` | MaterialVisibility | ❌ (default `PUBLIC`) |
| `studyGroupId` | string | ❌ (required if visibility = `STUDY_GROUP`) |

---

### `POST /study/materials/bulk` 🛡️ `COURSE_REP` `AUTHORIZED_UPLOADER` `SCHOOL_ADMIN` `SUPER_ADMIN`
Upload up to 10 materials at once. Multipart form data.

**Form field:** `files` (array, max 10 files, same constraints as single upload)

---

### `POST /study/materials/extract-preview` 🛡️ `COURSE_REP` `AUTHORIZED_UPLOADER` `SCHOOL_ADMIN` `SUPER_ADMIN`
Preview text extraction from a file before upload. Multipart form data.

**Form field:** `file`

**Response:** `{ "preview": "First 500 chars of extracted text..." }`

---

### `GET /study/materials/:id`
Get material details including AI summary status.

---

### `PATCH /study/materials/:id/visibility`
Update visibility of own material.

**Body:**
```json
{ "visibility": "DEPARTMENT", "studyGroupId": null }
```

---

### `DELETE /study/materials/:id`
Soft-delete own material.

---

### `DELETE /study/materials/:id/admin` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Admin force-delete any material.

---

### `PATCH /study/materials/:id/verify` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Mark a material as verified.

---

### `POST /study/materials/:id/download`
Increment the download count.

---

### `GET /study/materials/:id/download-url`
Get a signed download URL from R2 storage (expires in 1 hour).

**Response:** `{ "url": "https://..." }`

---

### `POST /study/materials/:id/rate`
Rate a material.

**Body:**
```json
{ "rating": 4 }
```
> `rating`: integer 1–5

---

### `POST /study/materials/:id/bookmark`
Toggle bookmark on a material. Returns current state.

**Response:** `{ "bookmarked": true }`

---

## 11. Study — Quizzes

All endpoints 🔐.

### `GET /study/quizzes`
List quizzes visible to the user.

**Query params:** `courseCode`, `departmentId`, `studyGroupId`, `page`, `limit`

---

### `POST /study/quizzes` 🛡️ `COURSE_REP` `AUTHORIZED_UPLOADER` `SCHOOL_ADMIN` `SUPER_ADMIN`
Create a quiz manually.

**Body:**
```json
{
  "title": "CSC301 Mid-Semester Quiz",
  "courseCode": "CSC301",
  "description": "Covers data structures",
  "level": "300",
  "timeLimit": 30,
  "visibility": "DEPARTMENT",
  "studyGroupId": null,
  "questions": [
    {
      "question": "What is a stack?",
      "options": ["LIFO structure", "FIFO structure", "Tree", "Graph"],
      "correctAnswer": 0,
      "explanation": "Stack is Last In First Out",
      "order": 1
    }
  ]
}
```
> `visibility`: `PUBLIC` | `DEPARTMENT` | `LEVEL` | `STUDY_GROUP` | `PRIVATE`
> `timeLimit`: in minutes

---

### `POST /study/quizzes/generate`
Generate a quiz from an AI summary of a material.

**Body:**
```json
{ "materialId": "<cuid>" }
```

**Response:** Draft quiz object (not yet published).

---

### `GET /study/quizzes/:id`
Get quiz details and questions.

---

### `PATCH /study/quizzes/:id` 🛡️ `COURSE_REP` `AUTHORIZED_UPLOADER` `SCHOOL_ADMIN` `SUPER_ADMIN`
Update a quiz. All fields optional.

---

### `PATCH /study/quizzes/:id/publish`
Publish a draft quiz (set `isDraft = false`).

---

### `PATCH /study/quizzes/:id/approve` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Approve an AI-generated quiz for public availability.

---

### `DELETE /study/quizzes/:id` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Delete a quiz.

---

### `POST /study/quizzes/:id/attempt`
Submit a quiz attempt.

**Body:**
```json
{
  "answers": [
    { "questionId": "<cuid>", "selected": 0 }
  ],
  "timeTaken": 420
}
```
> `timeTaken`: in seconds

**Response:** `{ "score": 8, "totalQuestions": 10, "percentage": 80, "weakTopics": ["Recursion"] }`

---

### `GET /study/quizzes/:id/attempts`
Get all attempts for a quiz by the current user.

---

## 12. Study — Analytics

All endpoints 🔐.

### `GET /study/analytics/me`
Get the logged-in user's quiz analytics profile.

**Response:**
```json
{
  "totalAttempts": 25,
  "totalCorrect": 180,
  "totalQuestions": 250,
  "weakTopics": ["Recursion", "Sorting"],
  "topicAttempts": { "Recursion": { "attempts": 10, "wrong": 7 } }
}
```

---

### `GET /study/analytics/admin` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Get platform-wide quiz analytics.

**Response:**
```json
{
  "participationRate": 0.72,
  "hardTopics": ["Recursion"],
  "questionStats": [{ "questionId": "", "topic": "Sorting", "totalAttempts": 100, "totalWrong": 70 }]
}
```

---

## 13. AI Summaries

All endpoints 🔐.

### `POST /ai/summarize`
Request an AI summary for a material. Queued as a background job.

**Body:**
```json
{ "materialId": "<cuid>" }
```

**Response `202`:**
```json
{ "summaryId": "<cuid>", "status": "PENDING" }
```

---

### `GET /ai/summaries`
Get all AI summary requests made by the current user.

---

### `GET /ai/summaries/:materialId`
Get the AI summary for a specific material.

**Response:**
```json
{
  "id": "",
  "status": "COMPLETED",
  "progress": 100,
  "shortSummary": "...",
  "keyPoints": ["...", "..."],
  "likelyExamTopics": ["...", "..."],
  "simplifiedExplanation": "...",
  "finalSummary": "...",
  "revisionSheet": "...",
  "revisionRoadmap": [
    { "step": 1, "topic": "Intro", "description": "...", "estimatedMinutes": 10 }
  ]
}
```
> Poll this endpoint until `status` is `COMPLETED` or `FAILED`. Use `progress` (0–100) to show a progress bar.

---

## 14. CGPA

All endpoints 🔐.

### `GET /cgpa/courses`
List all courses the user has added for CGPA tracking.

**Query params:** `semester` (`FIRST` | `SECOND`), `session` (e.g. `2024/2025`)

---

### `POST /cgpa/courses`
Add a course grade.

**Body:**
```json
{
  "courseCode": "CSC301",
  "courseTitle": "Data Structures",
  "creditUnit": 3,
  "score": 78.5,
  "passmark": 40,
  "semester": "FIRST",
  "session": "2024/2025"
}
```
> `score` is optional — add later when result is out.

---

### `PATCH /cgpa/courses/:id`
Update a course. All fields optional.

---

### `DELETE /cgpa/courses/:id`
Delete a course.

---

### `POST /cgpa/calculate`
Calculate GPA/CGPA for a semester.

**Body:**
```json
{ "semester": "FIRST", "session": "2024/2025" }
```

**Response:**
```json
{ "gpa": 4.17, "cgpa": 3.95, "totalUnits": 18, "classification": "First Class" }
```

---

### `GET /cgpa/records`
Get all saved CGPA records (history).

---

### `GET /cgpa/records/current`
Get the most recent CGPA summary.

---

## 15. Community — Posts & Feed

All endpoints 🔐.

### `GET /community/feed`
Get the community feed (same as `/community/posts`).

**Query params:**
| Param | Type | Description |
|---|---|---|
| `section` | string | Filter by section type |
| `scope` | `DEPARTMENT` \| `UNIVERSITY` | |
| `page` | number | Default `1` |
| `limit` | number | Default `20` |

> `section` values: `NOTICE_BOARD` | `QNA` | `STUDY_GROUPS` | `DEPT_UPDATES` | `CROSS_LEVEL` | `FRESHERS_CORNER` | `ANONYMOUS` | `CAMPUS_CULTURE` | `LOUNGE`

---

### `GET /community/posts`
Same as `/community/feed`.

---

### `POST /community/posts`
Create a community post.

**Body:**
```json
{
  "content": "Anyone have notes for CSC301?",
  "section": "DEPT_UPDATES",
  "scope": "DEPARTMENT",
  "priority": "GENERAL",
  "isAnonymous": false,
  "courseTag": "CSC301",
  "attachments": [],
  "targetLevel": "300"
}
```
> `priority`: `URGENT` | `ACADEMIC` | `GENERAL`
> `LOUNGE` requires at least 50 academic posts (`academicPostCount >= 50`).

---

### `GET /community/posts/:id`
Get a post with comments and reactions.

---

### `DELETE /community/posts/:id`
Delete own post (or admin/course rep can delete any).

---

### `PATCH /community/posts/:id/pin` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Pin or unpin a post.

---

### `POST /community/posts/:id/upvote`
Toggle upvote on a post.

---

### `POST /community/posts/:id/react`
React to a post.

**Body:**
```json
{ "type": "HELPFUL" }
```
> `type`: `LIKE` | `HELPFUL` | `INSIGHTFUL` | `FUNNY` | `SUPPORT`

---

### `POST /community/posts/:id/report`
Report a post.

**Body:**
```json
{ "reason": "SPAM", "details": "Optional details" }
```
> `reason`: `SPAM` | `INAPPROPRIATE` | `HARASSMENT` | `MISINFORMATION` | `OTHER`

---

### `POST /community/posts/:id/comments`
Add a comment to a post.

**Body:**
```json
{ "content": "Try the library!", "parentId": null }
```
> `parentId`: pass a comment id to reply to a comment.

---

### `POST /community/comments/:commentId/upvote`
Toggle upvote on a comment.

---

### `GET /community/notices`
Get notice board posts. Same filters as `/community/posts`.

---

### `POST /community/notices` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Create a notice board post. Same body as `/community/posts`.

---

### `PATCH /community/notices/:id/pin` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Pin or unpin a notice.

---

## 16. Community — Q&A

All endpoints 🔐.

### `GET /community/questions`
List questions.

**Query params:** `type`, `courseTag`, `isSolved`, `isMentorQuestion`, `page`, `limit`

> `type`: `COURSE_HELP` | `ASSIGNMENT_HELP` | `CONCEPT_EXPLANATION` | `EXAM_PREP` | `PROJECT_GUIDANCE`

---

### `POST /community/questions`
Post a question.

**Body:**
```json
{
  "title": "What is dynamic programming?",
  "content": "Explain with examples",
  "type": "CONCEPT_EXPLANATION",
  "courseTag": "CSC401",
  "isAnonymous": false,
  "isMentorQuestion": false,
  "attachments": []
}
```

---

### `GET /community/questions/:id`
Get a question with all answers.

---

### `DELETE /community/questions/:id`
Delete own question.

---

### `POST /community/questions/:id/upvote`
Toggle upvote on a question.

---

### `POST /community/questions/:id/answers`
Post an answer to a question.

**Body:**
```json
{ "content": "Dynamic programming is...", "attachments": [] }
```

---

### `PATCH /community/questions/:id/answers/:answerId/accept`
Accept an answer as the best answer (question author only).

---

### `PATCH /community/questions/:id/answers/:answerId/pin` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Pin an answer.

---

### `POST /community/answers/:answerId/upvote`
Toggle upvote on an answer.

---

### `POST /community/answers/:answerId/react`
React to an answer. Same body as post react.

---

### `DELETE /community/answers/:answerId`
Delete own answer.

---

## 17. Community — Mentors

All endpoints 🔐.

### `GET /community/mentors`
List active mentors.

**Query params:** `courseCode`, `departmentId`

---

### `GET /community/mentors/me`
Get own mentor registrations.

---

### `POST /community/mentors/register`
Register as a mentor for a course.

**Body:**
```json
{ "courseCode": "CSC301" }
```
> Only available to students in level 200 and above.

---

## 18. Community — Freshers FAQ

All endpoints 🔐.

### `GET /community/faqs`
Get freshers FAQ entries for the school.

**Query params:** `category`

---

### `POST /community/faqs` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Create a FAQ entry.

**Body:**
```json
{
  "question": "How do I register my courses?",
  "answer": "Go to the student portal at...",
  "category": "registration",
  "order": 1
}
```

---

### `DELETE /community/faqs/:id` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Delete a FAQ entry.

---

## 19. Community — Reports

All endpoints 🔐.

### `GET /community/reports` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
List unresolved reports.

**Query params:** `page`, `limit`

---

### `PATCH /community/reports/:reportId/resolve` 🛡️ `COURSE_REP` `SCHOOL_ADMIN` `SUPER_ADMIN`
Mark a report as resolved.

---

## 20. Study Groups

Mounted at `/community/groups`. All endpoints 🔐.

### `GET /community/groups`
List study groups the current user is a member of or public groups in their department.

**Query params:** `type`, `courseTag`, `page`, `limit`

> `type`: `EXAM_PREP` | `ASSIGNMENT` | `TUTORIAL` | `PROJECT` | `GENERAL`

---

### `GET /community/groups/all` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
List all study groups in the school.

---

### `POST /community/groups`
Create a study group.

**Body:**
```json
{
  "name": "CSC301 Study Crew",
  "description": "Preparing for finals",
  "type": "EXAM_PREP",
  "isPrivate": false,
  "courseTag": "CSC301"
}
```

---

### `GET /community/groups/:id`
Get group details, members, and recent messages.

---

### `PATCH /community/groups/:id`
Update group info (group admin only).

**Body:** Same as create, all fields optional.

---

### `DELETE /community/groups/:id`
Delete a group (group admin or school admin).

---

### `POST /community/groups/:id/join`
Join a public group.

---

### `DELETE /community/groups/:id/leave`
Leave a group.

---

### `PATCH /community/groups/:id/members/:userId/role`
Change a member's role (group admin only).

**Body:**
```json
{ "role": "ADMIN" }
```
> `role`: `ADMIN` | `MEMBER`

---

### `DELETE /community/groups/:id/members/:userId`
Kick a member (group admin only).

---

### `POST /community/groups/:id/invites`
Create an invite link for a private group (group admin only).

**Body:**
```json
{ "maxUses": 5, "expiresAt": "2026-12-31T23:59:59.000Z" }
```

**Response:** `{ "token": "<invite_token>", "link": "/community/groups/join/<token>" }`

---

### `GET /community/groups/:id/invites`
List all invite links for a group (group admin only).

---

### `DELETE /community/groups/:id/invites/:inviteId`
Revoke an invite link (group admin only).

---

### `POST /community/groups/join/:token`
Join a group using an invite token.

---

### `GET /community/groups/:id/messages`
Get message history for a group.

**Query params:** `page`, `limit`, `before` (ISO datetime cursor)

---

### `POST /community/groups/:id/messages`
Send a message to the group chat. Also available via WebSocket.

**Body:**
```json
{ "content": "Has anyone started the assignment?", "attachments": [] }
```

---

### `GET /community/groups/:id/quizzes/:quizId/leaderboard`
Get the quiz leaderboard for the group.

---

### `POST /community/groups/:id/ai/summary`
Share an AI summary of a material with the group.

**Body:**
```json
{ "materialId": "<cuid>" }
```

---

### `POST /community/groups/:id/ai/ask`
Ask a question answered by AI using the group's uploaded materials (RAG).

**Body:**
```json
{ "question": "Explain the concept of recursion from our notes" }
```

**Response:** `{ "answer": "...", "context": "based on file X by member Y" }`

---

### `GET /community/groups/:id/challenges`
List group quiz challenges.

---

### `POST /community/groups/:id/challenges`
Initiate a quiz challenge against another group (group admin only).

**Body:**
```json
{
  "receiverGroupId": "<cuid>",
  "quizId": "<cuid>",
  "expiresAt": "2026-09-10T23:59:59.000Z"
}
```

---

### `PATCH /community/groups/:id/challenges/:challengeId/accept`
Accept a challenge (receiving group admin only).

---

### `PATCH /community/groups/:id/challenges/:challengeId/decline`
Decline a challenge (receiving group admin only).

---

### `GET /community/groups/:id/challenges/:challengeId/result`
Get the result of a completed challenge.

---

## 21. Marketplace — Listings

All endpoints 🔐.

### `GET /marketplace/listings`
List available item listings scoped to the user's school.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `category` | string | `BOOKS` \| `ELECTRONICS` \| `CLOTHING` \| `FOOD` \| `FURNITURE` \| `HANDOUTS` \| `SERVICES` \| `OTHER` |
| `condition` | string | `NEW` \| `LIKE_NEW` \| `GOOD` \| `FAIR` |
| `minPrice` | number | |
| `maxPrice` | number | |
| `search` | string | Search title/description |
| `sellerId` | string | Filter by seller |
| `shopId` | string | Filter by shop |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `50` |

---

### `GET /marketplace/listings/saved`
Get the current user's saved listings.

---

### `GET /marketplace/listings/:id`
Get listing details. Increments view count.

**Response includes:** `saved` (boolean — whether current user saved it)

---

### `POST /marketplace/listings`
Create a listing.

**Body:**
```json
{
  "title": "Engineering Mathematics Textbook",
  "description": "Very good condition, used for one semester",
  "price": 3500,
  "category": "BOOKS",
  "condition": "GOOD",
  "images": ["https://..."],
  "location": "Hostel Block A",
  "whatsapp": "+2348012345678",
  "shopId": null
}
```

---

### `PATCH /marketplace/listings/:id`
Update own listing. All fields optional.

**Extra field:** `"isAvailable": false` to mark as sold.

---

### `DELETE /marketplace/listings/:id`
Soft-delete own listing. Admins can delete any listing.

---

### `POST /marketplace/listings/:id/save`
Toggle save/unsave a listing.

**Response:** `{ "saved": true }`

---

## 22. Marketplace — Shops

All endpoints 🔐.

### `GET /marketplace/shops/:id`
Get a shop profile with owner info and follower/listing counts.

---

### `POST /marketplace/shops`
Create a shop (one shop per user).

**Body:**
```json
{
  "name": "Ade's Bookstore",
  "description": "Selling affordable textbooks"
}
```

---

### `PATCH /marketplace/shops/me`
Update own shop.

**Body (all optional):**
```json
{
  "name": "Ade's Bookstore",
  "description": "...",
  "logoUrl": "https://...",
  "isActive": true
}
```

---

### `DELETE /marketplace/shops/:id` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Admin deactivate a shop.

---

### `POST /marketplace/shops/:id/follow`
Toggle follow/unfollow a shop.

**Response:** `{ "following": true }`

---

### `POST /marketplace/sellers/:id/rate`
Rate a seller (cannot rate yourself).

**Body:**
```json
{ "rating": 5, "comment": "Fast delivery and honest" }
```
> `rating`: integer 1–5

---

## 23. Marketplace — Lost & Found

All endpoints 🔐.

### `GET /marketplace/lost-found`
List unresolved lost/found items for the user's school.

**Query params:** `type` (`LOST` | `FOUND`), `search`, `page`, `limit`

---

### `POST /marketplace/lost-found`
Report a lost or found item.

**Body:**
```json
{
  "type": "LOST",
  "title": "Blue HP Laptop",
  "description": "Lost near the library on Monday",
  "location": "Main Library",
  "contactInfo": "+2348012345678",
  "imageUrl": "https://..."
}
```

---

### `PATCH /marketplace/lost-found/:id/resolve`
Mark own item as resolved (found/returned).

---

## 24. Marketplace — Accommodation

All endpoints 🔐.

### `GET /marketplace/accommodation`
List available accommodation posts for the user's school.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `type` | string | `SELF_CONTAIN` \| `ROOM_AND_PARLOUR` \| `SINGLE_ROOM` \| `SHARED_ROOM` \| `HOSTEL` \| `FLAT` \| `OTHER` |
| `minPrice` | number | |
| `maxPrice` | number | |
| `search` | string | Search title/location |
| `page` | number | |
| `limit` | number | |

---

### `GET /marketplace/accommodation/:id`
Get full accommodation details including poster's contact.

---

### `POST /marketplace/accommodation`
Post an accommodation listing.

**Body:**
```json
{
  "title": "Self-contain for rent",
  "description": "Fully furnished, 5 mins from campus",
  "type": "SELF_CONTAIN",
  "price": 250000,
  "period": "year",
  "location": "Ilesa Road, off campus",
  "images": ["https://..."],
  "whatsapp": "+2348012345678"
}
```
> `period`: `year` | `month` | `semester`

---

### `PATCH /marketplace/accommodation/:id`
Update own accommodation post. All fields optional.

**Extra field:** `"isAvailable": false` to mark as taken.

---

### `DELETE /marketplace/accommodation/:id`
Delete own accommodation post. Admins can delete any.

---

## 25. Marketplace — Roommates

All endpoints 🔐.

### `GET /marketplace/roommates`
List active roommate requests for the user's school.

**Query params:** `page`, `limit`

---

### `POST /marketplace/roommates`
Post a roommate request.

**Body:**
```json
{
  "description": "Looking for a clean, quiet roommate",
  "budget": 80000,
  "preferredArea": "Near campus",
  "gender": "male",
  "level": "300",
  "whatsapp": "+2348012345678"
}
```
> `gender`: `male` | `female` | `any`

---

### `PATCH /marketplace/roommates/:id`
Update own roommate request. All fields optional.

**Extra field:** `"isActive": false` to deactivate.

---

### `DELETE /marketplace/roommates/:id`
Deactivate own roommate request.

---

## 26. Marketplace — Services

All endpoints 🔐.

### `GET /marketplace/services`
List active service listings for the user's school.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `category` | string | `TUTORING` \| `GRAPHICS` \| `CODING` \| `PHOTOGRAPHY` \| `PRINTING` \| `LAUNDRY` \| `FOOD` \| `DELIVERY` \| `OTHER` |
| `search` | string | |
| `page` | number | |
| `limit` | number | |

---

### `GET /marketplace/services/:id`
Get full service listing details.

---

### `POST /marketplace/services`
Create a service listing.

**Body:**
```json
{
  "title": "Graphic Design Services",
  "description": "Logos, flyers, and banners",
  "category": "GRAPHICS",
  "price": 2000,
  "priceNote": "from ₦2,000",
  "images": ["https://..."],
  "whatsapp": "+2348012345678"
}
```

---

### `PATCH /marketplace/services/:id`
Update own service listing. All fields optional.

**Extra field:** `"isActive": false` to deactivate.

---

### `DELETE /marketplace/services/:id`
Delete own service listing.

---

## 27. Marketplace — Jobs & Internships

All endpoints 🔐.

### `GET /marketplace/jobs`
List approved job listings for the user's school.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `type` | string | `INTERNSHIP` \| `PART_TIME` \| `CAMPUS_JOB` \| `FREELANCE` |
| `search` | string | Search title/description |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `50` |

---

### `GET /marketplace/jobs/pending` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
List all job listings pending admin approval.

---

### `GET /marketplace/jobs/:id`
Get a single approved job listing.

---

### `POST /marketplace/jobs`
Post a job listing. Submitted for admin approval before becoming visible.

**Body:**
```json
{
  "title": "Software Engineering Intern",
  "description": "3-month internship at a Lagos tech company",
  "type": "INTERNSHIP",
  "pay": "₦50,000/month",
  "location": "Lagos (Remote-friendly)",
  "whatsapp": "+2348012345678"
}
```
> `type`: `INTERNSHIP` | `PART_TIME` | `CAMPUS_JOB` | `FREELANCE`
> Listing is `PENDING` until an admin approves it.

---

### `PATCH /marketplace/jobs/:id`
Update own job listing. All fields optional. Resets `approvalStatus` to `PENDING` for re-review.

---

### `DELETE /marketplace/jobs/:id`
Delete own job listing. Admins can delete any.

---

### `PATCH /marketplace/jobs/:id/approve` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Approve a pending job listing. Makes it visible to all students.

---

### `PATCH /marketplace/jobs/:id/reject` 🛡️ `SCHOOL_ADMIN` `SUPER_ADMIN`
Reject a job listing.

**Body:**
```json
{ "rejectionReason": "This appears to be a scam listing." }
```

---

## 28. Reminders

All endpoints 🔐.

### `GET /reminders`
List the current user's reminders.

**Query params:** `isCompleted` (boolean), `category`, `page`, `limit`

> `category`: `ASSIGNMENT` | `TEST` | `EXAM` | `PROJECT` | `PRACTICAL` | `OTHER`

---

### `POST /reminders`
Create a personal reminder.

**Body:**
```json
{
  "title": "Submit CSC301 Assignment",
  "description": "Upload to Google Classroom",
  "dueDate": "2026-10-15T23:59:00.000Z",
  "notifyAt": "2026-10-15T08:00:00.000Z",
  "priority": "HIGH",
  "category": "ASSIGNMENT",
  "isRecurring": false,
  "recurringDays": []
}
```
> `priority`: `HIGH` | `MEDIUM` | `LOW`
> `recurringDays`: array of integers 0–6 (0=Sun … 6=Sat) for weekly recurrence

---

### `PATCH /reminders/:id`
Update a reminder. All fields optional.

---

### `DELETE /reminders/:id`
Delete a reminder.

---

### `PATCH /reminders/:id/complete`
Mark a reminder as complete.

---

## 29. Notifications

All endpoints 🔐.

### `GET /notifications`
List the current user's notifications.

**Query params:** `isRead` (boolean), `page`, `limit`

---

### `PATCH /notifications/read-all`
Mark all notifications as read.

---

### `PATCH /notifications/:id/read`
Mark a single notification as read.

---

### `DELETE /notifications/:id`
Delete a notification.

---

### `GET /notifications/settings`
Get the current user's notification preferences (same as user settings).

---

### `PATCH /notifications/settings`
Update notification preferences. Same body as `PATCH /users/me/settings`.

---

## 30. Planner

All endpoints 🔐.

### `GET /planner/today`
Get today's agenda — aggregates timetable, reminders, and events into a single list.

**Response:**
```json
[
  {
    "id": "",
    "title": "CSC301 Lecture",
    "sourceType": "TIMETABLE",
    "sourceId": "",
    "date": "2026-09-15",
    "startTime": "08:00",
    "endTime": "10:00",
    "isAllDay": false,
    "isDone": false
  }
]
```
> `sourceType`: `TIMETABLE` | `REMINDER` | `EVENT` | `DEPT_REMINDER`

---

### `GET /planner/weekly`
Get the weekly agenda.

**Query params:** `weekOffset` (integer, default `0` = current week, `-1` = last week, `1` = next week)

---

## 31. Super Admin

All endpoints require 🔐 + `SUPER_ADMIN` role.

### `POST /super-admin/admins`
Create a new school admin account.

**Body:**
```json
{
  "fullName": "Admin User",
  "email": "admin@unilesa.edu.ng",
  "password": "SecurePass123!",
  "schoolId": "<cuid>"
}
```

---

### `GET /super-admin/admins`
List all school admins. Optionally filter by school.

**Query params:** `schoolId`

---

### `DELETE /super-admin/admins/:adminId`
Soft-delete a school admin account.

---

### `PATCH /super-admin/admins/:adminId/deactivate`
Deactivate a school admin (cannot login).

---

### `PATCH /super-admin/admins/:adminId/reactivate`
Reactivate a school admin.

---

### `PATCH /super-admin/admins/:adminId/reset-password`
Force-reset an admin's password.

**Body:**
```json
{ "newPassword": "NewSecurePass123!" }
```

---

### `PATCH /super-admin/users/:userId/block`
Block a student account.

---

### `PATCH /super-admin/users/:userId/unblock`
Unblock a student account.

---

### `GET /super-admin/schools`
List all schools on the platform with user and faculty counts.

---

### `POST /super-admin/schools`
Create a new school.

**Body:**
```json
{
  "name": "University of Lagos",
  "shortCode": "UNILAG",
  "location": "Lagos",
  "country": "Nigeria"
}
```

---

### `PATCH /super-admin/schools/:schoolId`
Update a school's details. All fields optional.

---

### `GET /super-admin/schools/:schoolId/faculties`
List faculties in a school.

---

### `POST /super-admin/schools/:schoolId/faculties`
Create a faculty in a school.

**Body:**
```json
{ "name": "Faculty of Science" }
```

---

### `DELETE /super-admin/faculties/:facultyId`
Delete a faculty (only if it has no active users).

---

### `GET /super-admin/faculties/:facultyId/departments`
List departments in a faculty.

---

### `POST /super-admin/faculties/:facultyId/departments`
Create a department in a faculty.

**Body:**
```json
{ "name": "Computer Science", "shortCode": "CSC" }
```

---

### `DELETE /super-admin/departments/:departmentId`
Delete a department (only if it has no active users).

---

### `GET /super-admin/audit-logs`
Get platform audit logs.

**Query params:** `action`, `performedById`, `page`, `limit`

> `action` values: `ADMIN_CREATED` | `ADMIN_DELETED` | `ADMIN_DEACTIVATED` | `ADMIN_REACTIVATED` | `ADMIN_PASSWORD_RESET` | `ROLE_ASSIGNED` | `COURSE_REP_NOMINATED` | `USER_BLOCKED` | `USER_UNBLOCKED` | `MATERIAL_UPLOADED` | `MATERIAL_DELETED` | `MATERIAL_VERIFIED` | `MATERIAL_VISIBILITY_CHANGED` | `QUIZ_DELETED` | `QUIZ_APPROVED` | `QUIZ_REJECTED` | `POST_DELETED` | `LISTING_DELETED` | `SHOP_DELETED` | `STUDY_GROUP_DELETED` | `GROUP_MEMBER_KICKED` | `GROUP_ROLE_CHANGED` | `GROUP_CHALLENGE_CREATED` | `GROUP_CHALLENGE_COMPLETED` | `SCHOOL_CREATED` | `SCHOOL_UPDATED`

---

### `GET /super-admin/stats`
Get platform-wide analytics.

**Response:**
```json
{
  "totalUsers": 1500,
  "totalAdmins": 3,
  "totalSchools": 1,
  "totalMaterials": 320,
  "totalListings": 85,
  "totalPosts": 410,
  "totalQuizzes": 60,
  "recentAuditLogs": []
}
```

---

## WebSocket

Connect to `ws://localhost:3000` with `Authorization: Bearer <accessToken>` in the handshake headers (or as a query param `?token=<accessToken>`).

### Study Group Chat
Join a group room:
```json
{ "event": "join-group", "data": { "groupId": "<cuid>" } }
```

Send a message:
```json
{ "event": "group-message", "data": { "groupId": "<cuid>", "content": "Hello team!" } }
```

Receive a message:
```json
{ "event": "new-message", "data": { "id": "", "senderId": "", "content": "", "createdAt": "", "isAiReply": false } }
```

Leave a group room:
```json
{ "event": "leave-group", "data": { "groupId": "<cuid>" } }
```

---

## Role Reference

| Role | Description |
|---|---|
| `STUDENT` | Default role. Access to all student features. |
| `COURSE_REP` | Can upload materials, create quizzes, post notices, manage community content for their department. |
| `AUTHORIZED_UPLOADER` | Can upload materials and create quizzes. Same as course rep upload rights. |
| `EVENT_ORCHESTRATOR` | Can create and manage events for any department. |
| `SCHOOL_ADMIN` | Full admin for their school. Can manage users, events, emergency contacts, jobs, and community. |
| `SUPER_ADMIN` | Platform-level admin. Manages schools, faculties, departments, and other admins. |

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `202` | Accepted (background job queued) |
| `400` | Bad request / validation error |
| `401` | Unauthenticated — token missing or expired |
| `403` | Forbidden — insufficient role |
| `404` | Resource not found |
| `409` | Conflict — duplicate resource |
| `410` | Gone — feature disabled (e.g. ticketing) |
| `429` | Rate limited |
| `500` | Internal server error |
| `502` | Upstream service error (routing, AI) |
