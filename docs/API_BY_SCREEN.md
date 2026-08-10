# SCH Hub — Frontend API Reference (By Screen)

> **Base URL:** `http://localhost:3000/api/v1`
> **Auth Header:** `Authorization: Bearer <accessToken>`
> All responses follow `{ success, data, meta }` or `{ success, message, code }` on error.

---

## 📁 Table of Contents

1. [Auth Screens](#1-auth-screens)
   - [Register](#11-register-screen)
   - [Login](#12-login-screen)
   - [Forgot Password / OTP / Reset](#13-forgot-password--otp--reset-password)
2. [Dashboard (Home Tab)](#2-dashboard-home-tab)
3. [Timetable Tab](#3-timetable-tab)
4. [Study Tab](#4-study-tab)
   - [Materials](#41-materials)
   - [Quizzes](#42-quizzes)
   - [AI Summaries](#43-ai-summaries)
   - [CGPA](#44-cgpa)
5. [Community Tab](#5-community-tab)
   - [Feed / Posts](#51-feed--posts)
   - [Q&A](#52-qa)
   - [Study Groups](#53-study-groups)
   - [Mentors](#54-mentors)
   - [Freshers FAQ](#55-freshers-faq)
6. [Marketplace Tab](#6-marketplace-tab)
7. [Campus Map Tab](#7-campus-map-tab)
8. [Notifications](#8-notifications)
9. [Reminders & Planner](#9-reminders--planner)
10. [Profile / Settings](#10-profile--settings)
11. [School Admin Dashboard](#11-school-admin-dashboard)
    - [Dashboard Overview](#111-dashboard-overview)
    - [User Management](#112-user-management)
    - [Events Management](#113-events-management)
    - [Emergency Contacts](#114-emergency-contacts)
    - [Materials Moderation](#115-materials-moderation)
    - [Community Moderation](#116-community-moderation)
    - [Study Groups Moderation](#117-study-groups-moderation)
    - [Marketplace Moderation](#118-marketplace-moderation)
    - [Jobs Moderation](#119-jobs-moderation)
12. [Super Admin Panel](#12-super-admin-panel)
    - [Dashboard Overview](#121-dashboard-overview)
    - [Schools Management](#122-schools-management)
    - [Faculties & Departments](#123-faculties--departments)
    - [Admins Management](#124-admins-management)
    - [User Controls](#125-user-controls)
    - [Audit Logs](#126-audit-logs)
    - [Platform Stats](#127-platform-stats)

---

## 1. Auth Screens

### 1.1 Register Screen
**File:** `src/features/auth/screens/`

#### Step 1 — Load school list (populate the school dropdown)
```
GET /school/schools
```
**Response:**
```json
[{ "id": "<cuid>", "name": "University of Ilesa", "shortCode": "UNILESA" }]
```

#### Step 2 — Load faculties after school is selected
```
GET /school/schools/:schoolId/faculties
```

#### Step 3 — Load departments after faculty is selected
```
GET /school/faculties/:facultyId/departments
```

#### Step 4 — Submit registration
```
POST /auth/register
```
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
**Success `201`:** Returns `{ user, tokens }` → save `accessToken` + `refreshToken` to secure storage → redirect to OTP verification screen.

#### Step 5 — Verify email OTP (after registration)
```
POST /auth/verify-otp
```
**Body:**
```json
{ "email": "john@example.com", "otp": "123456", "type": "EMAIL_VERIFICATION" }
```

#### Resend OTP
```
POST /auth/resend-otp
```
**Body:**
```json
{ "email": "john@example.com", "type": "EMAIL_VERIFICATION" }
```

---

### 1.2 Login Screen
**File:** `src/features/auth/screens/`

```
POST /auth/login
```
**Body:**
```json
{ "email": "john@example.com", "password": "Password123!" }
```
**Success `200`:**
```json
{
  "user": { "id": "", "fullName": "", "email": "", "role": "STUDENT", "isVerified": true },
  "accessToken": "",
  "refreshToken": "",
  "dashboardRedirect": "mobile_app"
}
```
> Use `dashboardRedirect` to decide where to send the user:
> - `mobile_app` → Student home
> - `course_rep_dashboard` → Course rep home
> - `event_orchestrator_dashboard` → Event orchestrator home
> - `admin_dashboard` → Admin panel
> - `super_admin_dashboard` → Super admin panel

#### Refresh access token (call this silently when a 401 is received)
```
POST /auth/refresh
```
**Body:** `{ "refreshToken": "<token>" }`
**Response:** `{ "accessToken": "", "refreshToken": "" }` → update stored tokens.

#### Logout
```
POST /auth/logout
```
**Body:** `{ "refreshToken": "<token>" }` → clear local storage after success.

---

### 1.3 Forgot Password / OTP / Reset Password

#### Step 1 — Request OTP
```
POST /auth/forgot-password
```
**Body:** `{ "email": "john@example.com" }`

#### Step 2 — Verify OTP
```
POST /auth/verify-otp
```
**Body:**
```json
{ "email": "john@example.com", "otp": "123456", "type": "PASSWORD_RESET" }
```

#### Step 3 — Set new password
```
POST /auth/reset-password
```
**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

#### Resend OTP (from OTP screen)
```
POST /auth/resend-otp
```
**Body:** `{ "email": "john@example.com", "type": "PASSWORD_RESET" }`

---

## 2. Dashboard (Home Tab)
**File:** `src/features/dashboard/`

The dashboard aggregates data from multiple endpoints. Call these in parallel on mount.

| What to show | Endpoint |
|---|---|
| Greeting / user info | `GET /auth/me` or cached user from store |
| Today's agenda (timetable + reminders + events) | `GET /planner/today` |
| Upcoming events | `GET /school/events?upcoming=true` |
| Unread notifications count | `GET /notifications?isRead=false&limit=1` → use `meta.total` |
| Recent community feed preview | `GET /community/feed?limit=5` |
| Recent materials | `GET /study/materials?limit=5` |
| Active reminders | `GET /reminders?isCompleted=false&limit=3` |
| CGPA summary | `GET /cgpa/records/current` |

### Planner Today Response shape
```json
[
  {
    "id": "",
    "title": "CSC301 Lecture",
    "sourceType": "TIMETABLE",
    "startTime": "08:00",
    "endTime": "10:00",
    "isDone": false
  }
]
```
> `sourceType`: `TIMETABLE` | `REMINDER` | `EVENT` | `DEPT_REMINDER`

---

## 3. Timetable Tab
**File:** `src/features/academic/timetable/`

| Action | Endpoint |
|---|---|
| Load personal timetable | `GET /school/timetable?type=PERSONAL` |
| Load departmental timetable | `GET /school/timetable?type=DEPARTMENTAL` |
| Load general timetable | `GET /school/timetable?type=GENERAL` |
| Add entry | `POST /school/timetable` |
| Edit entry | `PUT /school/timetable/:id` |
| Delete entry | `DELETE /school/timetable/:id` |

**POST body:**
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
  "isRecurring": true
}
```
> `dayOfWeek`: 0=Sun … 6=Sat | `type`: `LECTURE` | `PRACTICAL` | `SEMINAR` | `EXAM` | `TEST`

---

## 4. Study Tab
**File:** `src/features/academic/study/`

### 4.1 Materials

| Action | Endpoint |
|---|---|
| List materials | `GET /study/materials` |
| Filter by course | `GET /study/materials?courseCode=CSC301` |
| Filter by type | `GET /study/materials?type=PAST_QUESTION` |
| Search | `GET /study/materials?search=data+structures` |
| View material detail | `GET /study/materials/:id` |
| Get download URL | `GET /study/materials/:id/download-url` |
| Track download | `POST /study/materials/:id/download` |
| Bookmark / unbookmark | `POST /study/materials/:id/bookmark` → `{ "bookmarked": true }` |
| Rate material | `POST /study/materials/:id/rate` — body: `{ "rating": 4 }` |
| Upload material 🛡️ | `POST /study/materials` (multipart) |
| Bulk upload 🛡️ | `POST /study/materials/bulk` (multipart) |
| Preview text extraction 🛡️ | `POST /study/materials/extract-preview` (multipart) |
| Update visibility | `PATCH /study/materials/:id/visibility` |
| Delete own material | `DELETE /study/materials/:id` |
| User's bookmarks | `GET /users/me/bookmarks` |
| User's uploads | `GET /users/me/materials` |

**Material types:** `PAST_QUESTION` | `NOTE` | `HANDOUT` | `ASSIGNMENT` | `SUMMARY` | `SLIDES` | `OTHER`
**Visibility:** `PUBLIC` | `DEPARTMENT` | `LEVEL` | `STUDY_GROUP` | `PRIVATE`

---

### 4.2 Quizzes

| Action | Endpoint |
|---|---|
| List quizzes | `GET /study/quizzes` |
| Filter by course | `GET /study/quizzes?courseCode=CSC301` |
| View quiz | `GET /study/quizzes/:id` |
| Submit attempt | `POST /study/quizzes/:id/attempt` |
| View past attempts | `GET /study/quizzes/:id/attempts` |
| View my analytics | `GET /study/analytics/me` |
| Generate from AI 🛡️ | `POST /study/quizzes/generate` — body: `{ "materialId": "<cuid>" }` |
| Create quiz 🛡️ | `POST /study/quizzes` |
| Publish quiz | `PATCH /study/quizzes/:id/publish` |

**Submit attempt body:**
```json
{
  "answers": [{ "questionId": "<cuid>", "selected": 0 }],
  "timeTaken": 420
}
```
**Response:** `{ "score": 8, "totalQuestions": 10, "percentage": 80, "weakTopics": ["Recursion"] }`

---

### 4.3 AI Summaries
**File:** `src/features/academic/ai/`

| Action | Endpoint |
|---|---|
| Request summary | `POST /ai/summarize` — body: `{ "materialId": "<cuid>" }` → `202` response |
| Poll summary status | `GET /ai/summaries/:materialId` |
| List my summaries | `GET /ai/summaries` |

> Poll `GET /ai/summaries/:materialId` until `status` is `COMPLETED` or `FAILED`.
> Use `progress` (0–100) to render a progress bar.

---

### 4.4 CGPA
**File:** `src/features/academic/cgpa/`

| Action | Endpoint |
|---|---|
| List courses | `GET /cgpa/courses` |
| Filter by semester | `GET /cgpa/courses?semester=FIRST&session=2024/2025` |
| Add course | `POST /cgpa/courses` |
| Update course | `PATCH /cgpa/courses/:id` |
| Delete course | `DELETE /cgpa/courses/:id` |
| Calculate GPA | `POST /cgpa/calculate` — body: `{ "semester": "FIRST", "session": "2024/2025" }` |
| CGPA history | `GET /cgpa/records` |
| Current CGPA | `GET /cgpa/records/current` |

**Calculate response:**
```json
{ "gpa": 4.17, "cgpa": 3.95, "totalUnits": 18, "classification": "First Class" }
```

---

## 5. Community Tab
**File:** `src/features/social/community/`

### 5.1 Feed / Posts

| Action | Endpoint |
|---|---|
| Load feed | `GET /community/feed?page=1&limit=20` |
| Filter by section | `GET /community/feed?section=DEPT_UPDATES` |
| Filter by scope | `GET /community/feed?scope=DEPARTMENT` |
| Create post | `POST /community/posts` |
| View post detail | `GET /community/posts/:id` |
| Delete own post | `DELETE /community/posts/:id` |
| Upvote post | `POST /community/posts/:id/upvote` |
| React to post | `POST /community/posts/:id/react` — body: `{ "type": "HELPFUL" }` |
| Add comment | `POST /community/posts/:id/comments` — body: `{ "content": "...", "parentId": null }` |
| Upvote comment | `POST /community/comments/:commentId/upvote` |
| Report post | `POST /community/posts/:id/report` — body: `{ "reason": "SPAM" }` |
| Notice board | `GET /community/notices` |
| Create notice 🛡️ | `POST /community/notices` |

**Create post body:**
```json
{
  "content": "Anyone have notes for CSC301?",
  "section": "DEPT_UPDATES",
  "scope": "DEPARTMENT",
  "priority": "GENERAL",
  "isAnonymous": false,
  "courseTag": "CSC301"
}
```
> `section`: `NOTICE_BOARD` | `QNA` | `DEPT_UPDATES` | `CROSS_LEVEL` | `FRESHERS_CORNER` | `ANONYMOUS` | `CAMPUS_CULTURE` | `LOUNGE`
> `priority`: `URGENT` | `ACADEMIC` | `GENERAL`

---

### 5.2 Q&A

| Action | Endpoint |
|---|---|
| List questions | `GET /community/questions` |
| Filter unsolved | `GET /community/questions?isSolved=false` |
| Ask question | `POST /community/questions` |
| View question + answers | `GET /community/questions/:id` |
| Upvote question | `POST /community/questions/:id/upvote` |
| Post answer | `POST /community/questions/:id/answers` — body: `{ "content": "..." }` |
| Accept answer | `PATCH /community/questions/:id/answers/:answerId/accept` |
| Upvote answer | `POST /community/answers/:answerId/upvote` |
| Delete own answer | `DELETE /community/answers/:answerId` |

---

### 5.3 Study Groups
**File:** `src/features/social/groups/`

| Action | Endpoint |
|---|---|
| My groups | `GET /community/groups` |
| Create group | `POST /community/groups` |
| Group detail + members | `GET /community/groups/:id` |
| Join public group | `POST /community/groups/:id/join` |
| Leave group | `DELETE /community/groups/:id/leave` |
| Group chat history | `GET /community/groups/:id/messages` |
| Send message (REST) | `POST /community/groups/:id/messages` |
| Send message (WS) | emit `group-message` → `{ groupId, content }` |
| Group AI summary | `POST /community/groups/:id/ai/summary` — body: `{ "materialId": "<cuid>" }` |
| Group AI ask | `POST /community/groups/:id/ai/ask` — body: `{ "question": "..." }` |
| Join via invite token | `POST /community/groups/join/:token` |
| Create invite 🛡️ | `POST /community/groups/:id/invites` |
| Kick member 🛡️ | `DELETE /community/groups/:id/members/:userId` |

**WebSocket — Connect:**
```
ws://localhost:3000  →  headers: { Authorization: "Bearer <token>" }
```
```json
// Join room
{ "event": "join-group", "data": { "groupId": "<cuid>" } }

// Receive message
{ "event": "new-message", "data": { "id": "", "senderId": "", "content": "", "createdAt": "", "isAiReply": false } }
```

---

### 5.4 Mentors

| Action | Endpoint |
|---|---|
| Browse mentors | `GET /community/mentors` |
| Filter by course | `GET /community/mentors?courseCode=CSC301` |
| My mentor registrations | `GET /community/mentors/me` |
| Register as mentor | `POST /community/mentors/register` — body: `{ "courseCode": "CSC301" }` |

> Only available to students in level 200+.

---

### 5.5 Freshers FAQ

| Action | Endpoint |
|---|---|
| Get FAQ list | `GET /community/faqs` |
| Filter by category | `GET /community/faqs?category=registration` |

---

## 6. Marketplace Tab
**File:** `src/features/marketplace/`

### Listings

| Action | Endpoint |
|---|---|
| Browse listings | `GET /marketplace/listings` |
| Filter | `GET /marketplace/listings?category=BOOKS&condition=GOOD&minPrice=500&maxPrice=5000` |
| Search | `GET /marketplace/listings?search=engineering+maths` |
| View listing | `GET /marketplace/listings/:id` |
| My saved listings | `GET /marketplace/listings/saved` |
| Save / unsave | `POST /marketplace/listings/:id/save` → `{ "saved": true }` |
| Create listing | `POST /marketplace/listings` |
| Update listing | `PATCH /marketplace/listings/:id` |
| Delete listing | `DELETE /marketplace/listings/:id` |

**Categories:** `BOOKS` | `ELECTRONICS` | `CLOTHING` | `FOOD` | `FURNITURE` | `HANDOUTS` | `SERVICES` | `OTHER`
**Condition:** `NEW` | `LIKE_NEW` | `GOOD` | `FAIR`

---

### Shops

| Action | Endpoint |
|---|---|
| View shop | `GET /marketplace/shops/:id` |
| Create my shop | `POST /marketplace/shops` |
| Update my shop | `PATCH /marketplace/shops/me` |
| Follow / unfollow | `POST /marketplace/shops/:id/follow` → `{ "following": true }` |
| Rate seller | `POST /marketplace/sellers/:id/rate` — body: `{ "rating": 5, "comment": "..." }` |

---

### Lost & Found

| Action | Endpoint |
|---|---|
| Browse items | `GET /marketplace/lost-found` |
| Filter by type | `GET /marketplace/lost-found?type=LOST` |
| Report item | `POST /marketplace/lost-found` — body: `{ "type": "LOST", "title": "...", "location": "..." }` |
| Mark resolved | `PATCH /marketplace/lost-found/:id/resolve` |

---

### Accommodation

| Action | Endpoint |
|---|---|
| Browse listings | `GET /marketplace/accommodation` |
| View detail | `GET /marketplace/accommodation/:id` |
| Post listing | `POST /marketplace/accommodation` |
| Update listing | `PATCH /marketplace/accommodation/:id` |
| Delete listing | `DELETE /marketplace/accommodation/:id` |

**Types:** `SELF_CONTAIN` | `ROOM_AND_PARLOUR` | `SINGLE_ROOM` | `SHARED_ROOM` | `HOSTEL` | `FLAT` | `OTHER`

---

### Roommates

| Action | Endpoint |
|---|---|
| Browse requests | `GET /marketplace/roommates` |
| Post request | `POST /marketplace/roommates` |
| Update request | `PATCH /marketplace/roommates/:id` |
| Delete request | `DELETE /marketplace/roommates/:id` |

---

### Services

| Action | Endpoint |
|---|---|
| Browse services | `GET /marketplace/services` |
| Filter by category | `GET /marketplace/services?category=TUTORING` |
| View service | `GET /marketplace/services/:id` |
| Create listing | `POST /marketplace/services` |
| Update listing | `PATCH /marketplace/services/:id` |
| Delete listing | `DELETE /marketplace/services/:id` |

**Categories:** `TUTORING` | `GRAPHICS` | `CODING` | `PHOTOGRAPHY` | `PRINTING` | `LAUNDRY` | `FOOD` | `DELIVERY` | `OTHER`

---

### Jobs & Internships

| Action | Endpoint |
|---|---|
| Browse approved jobs | `GET /marketplace/jobs` |
| Filter by type | `GET /marketplace/jobs?type=INTERNSHIP` |
| View job | `GET /marketplace/jobs/:id` |
| Post job | `POST /marketplace/jobs` — submitted for admin review |
| Update job | `PATCH /marketplace/jobs/:id` |
| Delete job | `DELETE /marketplace/jobs/:id` |

**Types:** `INTERNSHIP` | `PART_TIME` | `CAMPUS_JOB` | `FREELANCE`

---

## 7. Campus Map Tab
**File:** `src/features/campus-map/`

| Action | Endpoint |
|---|---|
| Get MapTiler API key | `GET /school/map-config` → `{ maptilerApiKey }` |
| Load all features (GeoJSON) | `GET /campus-map/features` |
| Filter by viewport | `GET /campus-map/features?bbox=minLng,minLat,maxLng,maxLat` |
| Filter by category | `GET /campus-map/features?category=BUILDING` |
| Get feature detail | `GET /campus-map/features/:id` |
| Get feature entrances | `GET /campus-map/features/:id/entrances` |
| Get all categories | `GET /campus-map/categories` |
| Search places | `GET /campus-map/search?q=library&near=7.6031,4.7071` |
| Find nearest | `GET /campus-map/nearest?lat=7.6031&lng=4.7071&category=CLINIC` |
| Get route | `POST /campus-map/route` |
| Check route progress | `POST /campus-map/route/progress` |

**Route body:**
```json
{
  "from": { "lat": 7.6031, "lng": 4.7071 },
  "to": { "featureId": "campus_library" },
  "mode": "walking"
}
```
> `to` can also be `{ "lat": 0, "lng": 0 }` | `mode`: `walking` | `accessible`

---

## 8. Notifications
**File:** `src/features/social/notifications/`

| Action | Endpoint |
|---|---|
| List notifications | `GET /notifications?page=1&limit=20` |
| Unread only | `GET /notifications?isRead=false` |
| Mark one as read | `PATCH /notifications/:id/read` |
| Mark all as read | `PATCH /notifications/read-all` |
| Delete notification | `DELETE /notifications/:id` |
| Get preferences | `GET /notifications/settings` |
| Update preferences | `PATCH /notifications/settings` |
| Register FCM token | `POST /users/me/fcm-token` — body: `{ "token": "<fcm_token>" }` |

---

## 9. Reminders & Planner
**File:** `src/features/social/reminders/`

### Reminders

| Action | Endpoint |
|---|---|
| List reminders | `GET /reminders` |
| Active only | `GET /reminders?isCompleted=false` |
| Filter by category | `GET /reminders?category=ASSIGNMENT` |
| Create reminder | `POST /reminders` |
| Update reminder | `PATCH /reminders/:id` |
| Mark complete | `PATCH /reminders/:id/complete` |
| Delete reminder | `DELETE /reminders/:id` |

**Create body:**
```json
{
  "title": "Submit CSC301 Assignment",
  "dueDate": "2026-10-15T23:59:00.000Z",
  "notifyAt": "2026-10-15T08:00:00.000Z",
  "priority": "HIGH",
  "category": "ASSIGNMENT",
  "isRecurring": false
}
```
> `priority`: `HIGH` | `MEDIUM` | `LOW`
> `category`: `ASSIGNMENT` | `TEST` | `EXAM` | `PROJECT` | `PRACTICAL` | `OTHER`

### Planner

| Action | Endpoint |
|---|---|
| Today's agenda | `GET /planner/today` |
| Weekly agenda | `GET /planner/weekly?weekOffset=0` |

> `weekOffset`: `0` = this week, `-1` = last week, `1` = next week

---

## 10. Profile / Settings
**File:** `src/features/profile/`

| Action | Endpoint |
|---|---|
| Get my profile | `GET /users/me` |
| Update profile | `PATCH /users/me/profile` — body: `{ fullName, phone, bio, level }` |
| Upload avatar | `POST /users/me/avatar` (multipart, field: `avatar`, max 5MB) |
| Update settings | `PATCH /users/me/settings` |
| Get my sessions | `GET /users/me/sessions` |
| Revoke session | `DELETE /users/me/sessions/:sessionId` |
| Revoke all sessions | `DELETE /users/me/sessions` |
| My bookmarks | `GET /users/me/bookmarks` |
| My uploaded materials | `GET /users/me/materials` |
| View other user profile | `GET /users/:id` |
| View other user's materials | `GET /users/:id/materials` |

**Settings body (all optional):**
```json
{
  "darkMode": false,
  "notificationsEnabled": true,
  "pushNotifications": true,
  "emailNotifications": true,
  "reminderPush": true,
  "eventPush": true,
  "whatsappOptIn": false,
  "quietHoursEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

---

---

## 11. School Admin Dashboard
**File:** `src/features/admin/`
**Access:** `user.role === 'SCHOOL_ADMIN'` → redirect from `dashboardRedirect: "admin_dashboard"`

> All endpoints below require `Authorization: Bearer <accessToken>` with `SCHOOL_ADMIN` or `SUPER_ADMIN` role.

---

### 11.1 Dashboard Overview

Call these in parallel on admin dashboard mount.

| What to show | Endpoint |
|---|---|
| Platform stats summary | `GET /super-admin/stats` |
| Recent audit logs | `GET /super-admin/audit-logs?limit=10` |
| Pending job approvals count | `GET /marketplace/jobs/pending` → use response length |
| Unresolved community reports | `GET /community/reports?limit=5` |
| Upcoming events | `GET /school/events?upcoming=true` |

---

### 11.2 User Management
**File:** `src/features/admin/users/`

| Action | Endpoint |
|---|---|
| List all users | `GET /users?page=1&limit=20` |
| Filter by role | `GET /users?role=STUDENT` |
| Filter by level | `GET /users?level=300` |
| Filter by department | `GET /users?departmentId=<cuid>` |
| Search users | `GET /users/search?q=john` |
| View user profile | `GET /users/:id` |
| Assign role | `PATCH /users/assign-role` |
| Nominate course rep | `PATCH /users/nominate-course-rep` |
| Block user | `PATCH /super-admin/users/:userId/block` |
| Unblock user | `PATCH /super-admin/users/:userId/unblock` |

**Assign role body:**
```json
{ "userId": "<cuid>", "role": "AUTHORIZED_UPLOADER" }
```
> Assignable roles: `AUTHORIZED_UPLOADER` | `EVENT_ORCHESTRATOR` | `SCHOOL_ADMIN`

**Nominate course rep body:**
```json
{ "userId": "<cuid>" }
```

---

### 11.3 Events Management
**File:** `src/features/admin/events/`

| Action | Endpoint |
|---|---|
| List all events | `GET /school/events` |
| View event detail | `GET /school/events/:id` |
| Create event | `POST /school/events` |
| Update event | `PATCH /school/events/:id` |
| Upload event cover image | `POST /school/events/:id/image` (multipart, field: `image`, max 5MB) |
| Delete event | `DELETE /school/events/:id` |

**Create/update body:**
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
> `departmentId` and `level` are optional — omit for school-wide events.

---

### 11.4 Emergency Contacts
**File:** `src/features/admin/emergency/`

| Action | Endpoint |
|---|---|
| List contacts | `GET /school/emergency-contacts` |
| Add contact | `POST /school/emergency-contacts` |
| Update contact | `PATCH /school/emergency-contacts/:id` |
| Delete contact | `DELETE /school/emergency-contacts/:id` |

**Create body:**
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
> `category`: `SECURITY` | `CLINIC` | `STUDENT_AFFAIRS` | `OTHER`
> `order` controls display order (0 = top).

---

### 11.5 Materials Moderation
**File:** `src/features/admin/materials/`

| Action | Endpoint |
|---|---|
| List all materials | `GET /study/materials?page=1&limit=20` |
| Filter unverified | `GET /study/materials?verified=false` |
| View material detail | `GET /study/materials/:id` |
| Verify material | `PATCH /study/materials/:id/verify` |
| Force-delete material | `DELETE /study/materials/:id/admin` |
| View quiz list | `GET /study/quizzes` |
| Approve AI quiz | `PATCH /study/quizzes/:id/approve` |
| Delete quiz | `DELETE /study/quizzes/:id` |
| Platform quiz analytics | `GET /study/analytics/admin` |

**Analytics response:**
```json
{
  "participationRate": 0.72,
  "hardTopics": ["Recursion"],
  "questionStats": [{ "questionId": "", "topic": "Sorting", "totalAttempts": 100, "totalWrong": 70 }]
}
```

---

### 11.6 Community Moderation
**File:** `src/features/admin/`

| Action | Endpoint |
|---|---|
| List unresolved reports | `GET /community/reports?page=1&limit=20` |
| Resolve a report | `PATCH /community/reports/:reportId/resolve` |
| Delete any post | `DELETE /community/posts/:id` |
| Pin / unpin post | `PATCH /community/posts/:id/pin` |
| Pin / unpin notice | `PATCH /community/notices/:id/pin` |
| Create FAQ | `POST /community/faqs` |
| Delete FAQ | `DELETE /community/faqs/:id` |
| Pin answer | `PATCH /community/questions/:id/answers/:answerId/pin` |

**Create FAQ body:**
```json
{
  "question": "How do I register my courses?",
  "answer": "Go to the student portal at...",
  "category": "registration",
  "order": 1
}
```

---

### 11.7 Study Groups Moderation

| Action | Endpoint |
|---|---|
| List all groups in school | `GET /community/groups/all` |
| View group detail | `GET /community/groups/:id` |
| Delete any group | `DELETE /community/groups/:id` |
| Kick member from group | `DELETE /community/groups/:id/members/:userId` |
| Change member role | `PATCH /community/groups/:id/members/:userId/role` — body: `{ "role": "ADMIN" }` |

---

### 11.8 Marketplace Moderation

| Action | Endpoint |
|---|---|
| Delete any listing | `DELETE /marketplace/listings/:id` |
| Delete any accommodation post | `DELETE /marketplace/accommodation/:id` |
| Deactivate a shop | `DELETE /marketplace/shops/:id` |

---

### 11.9 Jobs Moderation

| Action | Endpoint |
|---|---|
| List pending jobs | `GET /marketplace/jobs/pending` |
| View job detail | `GET /marketplace/jobs/:id` |
| Approve job | `PATCH /marketplace/jobs/:id/approve` |
| Reject job | `PATCH /marketplace/jobs/:id/reject` |
| Delete any job | `DELETE /marketplace/jobs/:id` |

**Reject body:**
```json
{ "rejectionReason": "This appears to be a scam listing." }
```

---

## 12. Super Admin Panel
**File:** `src/features/super-admin/`
**Access:** `user.role === 'SUPER_ADMIN'` → redirect from `dashboardRedirect: "super_admin_dashboard"`

> All endpoints below require `SUPER_ADMIN` role.

---

### 12.1 Dashboard Overview

Call these in parallel on super admin dashboard mount.

| What to show | Endpoint |
|---|---|
| Platform-wide stats | `GET /super-admin/stats` |
| Recent audit logs | `GET /super-admin/audit-logs?limit=10` |
| All schools list | `GET /super-admin/schools` |

**Stats response:**
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

### 12.2 Schools Management
**File:** `src/features/super-admin/schools/`

| Action | Endpoint |
|---|---|
| List all schools | `GET /super-admin/schools` |
| Create school | `POST /super-admin/schools` |
| Update school | `PATCH /super-admin/schools/:schoolId` |

**Create body:**
```json
{
  "name": "University of Lagos",
  "shortCode": "UNILAG",
  "location": "Lagos",
  "country": "Nigeria"
}
```

---

### 12.3 Faculties & Departments
**File:** `src/features/super-admin/faculties/` + `src/features/super-admin/departments/`

| Action | Endpoint |
|---|---|
| List faculties in a school | `GET /super-admin/schools/:schoolId/faculties` |
| Create faculty | `POST /super-admin/schools/:schoolId/faculties` — body: `{ "name": "Faculty of Science" }` |
| Delete faculty | `DELETE /super-admin/faculties/:facultyId` |
| List departments in faculty | `GET /super-admin/faculties/:facultyId/departments` |
| Create department | `POST /super-admin/faculties/:facultyId/departments` |
| Delete department | `DELETE /super-admin/departments/:departmentId` |

**Create department body:**
```json
{ "name": "Computer Science", "shortCode": "CSC" }
```
> Delete faculty/department will fail if active users exist — show the error message from the response.

---

### 12.4 Admins Management
**File:** `src/features/super-admin/admins/`

| Action | Endpoint |
|---|---|
| List all school admins | `GET /super-admin/admins` |
| Filter by school | `GET /super-admin/admins?schoolId=<cuid>` |
| Create admin | `POST /super-admin/admins` |
| Deactivate admin | `PATCH /super-admin/admins/:adminId/deactivate` |
| Reactivate admin | `PATCH /super-admin/admins/:adminId/reactivate` |
| Force reset password | `PATCH /super-admin/admins/:adminId/reset-password` |
| Delete admin | `DELETE /super-admin/admins/:adminId` |

**Create admin body:**
```json
{
  "fullName": "Admin User",
  "email": "admin@unilesa.edu.ng",
  "password": "SecurePass123!",
  "schoolId": "<cuid>"
}
```

**Force reset password body:**
```json
{ "newPassword": "NewSecurePass123!" }
```

---

### 12.5 User Controls

| Action | Endpoint |
|---|---|
| Block a student | `PATCH /super-admin/users/:userId/block` |
| Unblock a student | `PATCH /super-admin/users/:userId/unblock` |

> These are also available to `SCHOOL_ADMIN`. Block prevents the user from logging in.

---

### 12.6 Audit Logs
**File:** `src/features/super-admin/audit-logs/`

| Action | Endpoint |
|---|---|
| List all logs | `GET /super-admin/audit-logs?page=1&limit=20` |
| Filter by action | `GET /super-admin/audit-logs?action=MATERIAL_DELETED` |
| Filter by admin | `GET /super-admin/audit-logs?performedById=<cuid>` |

**Available `action` filter values:**
```
ADMIN_CREATED | ADMIN_DELETED | ADMIN_DEACTIVATED | ADMIN_REACTIVATED
ADMIN_PASSWORD_RESET | ROLE_ASSIGNED | COURSE_REP_NOMINATED
USER_BLOCKED | USER_UNBLOCKED
MATERIAL_UPLOADED | MATERIAL_DELETED | MATERIAL_VERIFIED | MATERIAL_VISIBILITY_CHANGED
QUIZ_DELETED | QUIZ_APPROVED | QUIZ_REJECTED
POST_DELETED | LISTING_DELETED | SHOP_DELETED
STUDY_GROUP_DELETED | GROUP_MEMBER_KICKED | GROUP_ROLE_CHANGED
GROUP_CHALLENGE_CREATED | GROUP_CHALLENGE_COMPLETED
SCHOOL_CREATED | SCHOOL_UPDATED
```

---

### 12.7 Platform Stats
**File:** `src/features/super-admin/analytics/`

| Action | Endpoint |
|---|---|
| Full platform stats | `GET /super-admin/stats` |

> Use this to build charts/cards on the super admin dashboard:
> - Total users, admins, schools
> - Total materials, quizzes, posts, listings
> - Recent audit activity feed

---

## Role-Gated UI Notes

| Role | Extra capabilities to show in UI |
|---|---|
| `COURSE_REP` | Upload materials, create quizzes, post notices, manage dept events |
| `AUTHORIZED_UPLOADER` | Upload materials, create quizzes |
| `EVENT_ORCHESTRATOR` | Create/manage events for any department |
| `SCHOOL_ADMIN` | Full admin panel — users, events, emergency contacts, jobs |
| `SUPER_ADMIN` | Super admin panel — schools, faculties, departments, platform stats |

> Check `user.role` from the login/`/auth/me` response to conditionally render admin controls.

---

## HTTP Errors Quick Reference

| Code | Meaning | What to show |
|---|---|---|
| `400` | Validation error | Show field errors from response `message` |
| `401` | Token expired | Silently refresh token, retry request |
| `403` | No permission | Show "Access denied" toast |
| `404` | Not found | Show empty state |
| `409` | Conflict / duplicate | Show specific message (e.g. "Email already registered") |
| `429` | Rate limited | Show "Too many attempts, please wait" |
| `500` | Server error | Show generic error toast |
