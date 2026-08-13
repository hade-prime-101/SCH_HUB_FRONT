# LOOPZ PHASE 2: TARGET FRONTEND ARCHITECTURE

**Status:** Architecture Design (Pre-Implementation)  
**Scope:** Student UX redesign preserving existing functionality  
**Destinations:** 5 primary + contextual navigation  
**Duration:** 3-4 weeks (implementation)  
**Team:** 2-3 frontend engineers  

---

# A. TARGET UX ARCHITECTURE

## Core Principle

Loopz is a **feature-rich mobile-first platform** accessed through **5 primary destinations** with **extensive contextual navigation** that connects related features.

### Navigation Layers

```
Layer 1: PRIMARY DESTINATIONS
├─ Home
├─ Campus
├─ Loop
├─ Study
└─ Me

Layer 2: SECTIONS (per destination)
├─ Timetable, Events, Announcements (Home)
├─ Map, Navigation, Locations (Campus)
├─ Listings, Shops, Jobs, Services (Loop)
├─ Materials, Quizzes, Summaries, CGPA (Study)
└─ Profile, Settings, Bookmarks (Me)

Layer 3: CONTEXTUAL NAVIGATION
├─ Tabs within sections
├─ Bottom sheets for actions
├─ Related content links
├─ Detail view actions
├─ Cross-feature connections
└─ Search & discovery

Layer 4: DETAIL & ACTIONS
├─ Item detail pages
├─ Inline actions
├─ Forms & workflows
└─ Contextual features
```

---

# B. FIVE-DESTINATION INFORMATION ARCHITECTURE

## 1. HOME (Dashboard)

**Purpose:** Daily overview, quick access, announcements

**Current Routes:**
- `/dashboard` → Home view
- `/dashboard/school` → School info

**Sections:**
- TODAY'S TIMETABLE
  - Current/upcoming classes
  - Venue navigation
  - Course links
  
- QUICK ACCESS
  - Study (materials, quizzes)
  - Campus (map to frequently visited)
  - Loop (recent listings)
  - Community (feeds)
  
- ANNOUNCEMENTS & NOTICES
  - Important notices
  - School/department announcements
  - Pinned posts
  
- UPCOMING EVENTS
  - Next 3-5 events
  - Registrations
  - Tickets

**Contextual Actions:**
- View full timetable → Campus
- Browse all materials → Study
- Post question → Community
- View notifications

**Desktop:** Cards grid + sidebar with pinned sections  
**Mobile:** Feed-based, scrollable sections

---

## 2. CAMPUS

**Purpose:** Location discovery, wayfinding, navigation

**Current Routes:**
- `/dashboard/campus-map` → Map view
- `/dashboard/campus-map/[id]` → Location detail
- `/dashboard/emergency` → Emergency info

**Sections:**
- MAP VIEW
  - Interactive map (MapLibre)
  - Location search
  - Category filtering
  - GPS location
  - Offline tiles
  
- LOCATIONS
  - Browse all points of interest
  - Categories (buildings, cafes, facilities)
  - Search/filter
  - Bookmarks
  
- NAVIGATION
  - Route to location
  - Directions
  - Travel time
  - Entrance finder
  
- EMERGENCY
  - Emergency contacts
  - Emergency alerts
  - Quick dial

**Contextual Actions:**
- Navigate to timetable venue (from Home)
- Save favorite locations
- Share location
- Get directions
- View location hours/info

**Desktop:** Map on left, sidebar on right  
**Mobile:** Full-screen map + bottom sheet for details

---

## 3. LOOP (Marketplace)

**Purpose:** Buy, sell, trade, find services

**Current Routes:**
- `/dashboard/marketplace` → Listings browse
- `/dashboard/marketplace/[id]` → Listing detail
- `/dashboard/marketplace/*` → Categories
- `/dashboard/marketplace/shops/[id]` → Shop detail
- `/dashboard/marketplace/saved` → Saved listings

**Sections:**
- BROWSE ALL
  - Grid/list view
  - Filter by category
  - Sort options
  - Search
  
- CATEGORIES
  - General Listings
  - Jobs
  - Services
  - Accommodation
  - Rooms/Roommates
  - Lost & Found
  
- SHOPS/VENDORS
  - Browse shops
  - Shop profiles
  - Shop products
  - Shop reviews
  
- SAVED
  - Bookmarked listings
  - Saved searches
  - Watchlist

**Contextual Actions:**
- Contact seller/service provider
- Share listing
- Mark as interested
- Save for later
- Report inappropriate
- Leave review

**Desktop:** Sidebar + grid/list  
**Mobile:** Tab-based sections, sheet for actions

---

## 4. STUDY

**Purpose:** Materials, learning resources, assessments, progress tracking

**Current Routes:**
- `/dashboard/study/materials` → Material list
- `/dashboard/study/materials/[id]` → Material detail
- `/dashboard/study/materials/upload` → Upload
- `/dashboard/study/quizzes` → Quiz list
- `/dashboard/study/quizzes/[id]` → Take quiz
- `/dashboard/study/cgpa` → GPA tracker
- `/dashboard/study/ai` → AI summaries
- `/dashboard/study/analytics` → Study stats
- `/dashboard/study/personal` → Personal study space
- `/dashboard/study/summaries` → Summary requests

**Sections:**
- MATERIALS
  - Browse materials by course
  - Filter/sort
  - Upload new
  - Download
  - Rate & review
  - Generate AI summary
  
- QUIZZES
  - Available quizzes
  - Attempt quiz
  - View results
  - Generate from material
  
- SUMMARIES
  - AI-generated summaries
  - Request new summary
  - Share summaries
  
- CGPA & GRADES
  - Current GPA
  - Grade calculator
  - Course breakdown
  - Semester history
  
- ANALYTICS
  - Study time
  - Material views
  - Quiz performance
  - Learning trends

**Contextual Actions:**
- By material: Summarize, Create quiz, Save bookmark, Find related, View in course
- By quiz: View course, Review answers, Share results
- By course: View materials, View timetable venue, View quizzes, View notes
- By summary: Download, Share, Use for study

**Desktop:** Sidebar sections, main content area  
**Mobile:** Tab-based navigation

---

## 5. ME (Profile & Account)

**Purpose:** Identity, preferences, account management, saved content

**Current Routes:**
- `/dashboard/profile` → View profile
- `/dashboard/profile/edit` → Edit profile
- `/dashboard/settings` → Settings
- `/dashboard/bookmarks` → Bookmarks
- `/dashboard/my-materials` → My uploads
- `/dashboard/notifications` → Notifications
- `/dashboard/users/[userId]` → View other user
- `/sessions` → Sessions & devices

**Sections:**
- PROFILE
  - Photo
  - Name, email, department
  - Bio/interests
  - Edit profile
  - Logout
  
- PREFERENCES & SETTINGS
  - Notifications settings
  - Privacy settings
  - Theme/language
  - Display preferences
  
- SAVED & BOOKMARKS
  - Saved materials
  - Bookmarked listings
  - Watchlist
  
- MY CONTRIBUTIONS
  - Materials uploaded
  - Posts created
  - Listings posted
  - Groups joined
  
- NOTIFICATIONS
  - Notification center
  - Notification history
  - Mark as read/unread
  
- ACCOUNT SECURITY
  - Sessions & devices
  - Change password
  - 2FA (UNKNOWN if supported)
  - Login history

**Contextual Actions:**
- View other user profiles
- Follow/unfollow
- Message
- Report

**Desktop:** Sidebar + main content  
**Mobile:** Tab-based or stacked sections

---

# C. COMPLETE STUDENT FEATURE MAPPING

| Existing Route | Primary Destination | Section | UX Entry Point | Contextual Parent | Related Features |
|---|---|---|---|---|---|
| `/dashboard` | HOME | Dashboard | App entry | — | Campus, Study, Loop |
| `/dashboard/school` | HOME | School Info | Home header | — | Emergency |
| `/dashboard/notifications` | ME | Notifications | Settings icon | — | — |
| `/dashboard/settings` | ME | Preferences | Profile section | — | — |
| `/dashboard/profile` | ME | Profile | Avatar tap | — | User discovery |
| `/dashboard/profile/edit` | ME | Profile | Profile view | — | — |
| `/dashboard/profile/[id]` | ME | User Profile | Search result | — | Message, Follow |
| `/dashboard/bookmarks` | ME | Saved | ME section tab | — | Study, Loop |
| `/dashboard/my-materials` | ME | Contributions | ME section | — | Study |
| `/sessions` | ME | Account Security | Settings | — | — |
| `/dashboard/campus-map` | CAMPUS | Map | App entry | — | Home (venue nav) |
| `/dashboard/campus-map/[id]` | CAMPUS | Location Detail | Map pin tap | Map | Navigation, Timetable |
| `/dashboard/emergency` | CAMPUS | Emergency | Campus section | — | — |
| `/dashboard/marketplace` | LOOP | Browse | App entry | — | Listings, Shops |
| `/dashboard/marketplace/[id]` | LOOP | Listing Detail | Grid/list tap | Browse | Shop, Contact |
| `/dashboard/marketplace/listings/create` | LOOP | Create Listing | FAB / + button | Browse | — |
| `/dashboard/marketplace/[id]/edit` | LOOP | Edit Listing | "My Listings" | Browse | — |
| `/dashboard/marketplace/saved` | LOOP | Saved | LOOP section tab | — | Browse |
| `/dashboard/marketplace/shops` | LOOP | Shops | LOOP section tab | — | Browse |
| `/dashboard/marketplace/shops/[id]` | LOOP | Shop Detail | Shops list | Shops | Listings |
| `/dashboard/marketplace/jobs` | LOOP | Jobs | LOOP category | Browse | — |
| `/dashboard/marketplace/services` | LOOP | Services | LOOP category | Browse | — |
| `/dashboard/marketplace/accommodation` | LOOP | Accommodation | LOOP category | Browse | Roommates |
| `/dashboard/marketplace/lost-found` | LOOP | Lost & Found | LOOP category | Browse | — |
| `/dashboard/marketplace/roommates` | LOOP | Roommates | LOOP category | Browse | Accommodation |
| `/dashboard/study` | STUDY | Overview | App entry | — | All study sections |
| `/dashboard/study/materials` | STUDY | Materials | Study section | Overview | Quizzes, Summaries |
| `/dashboard/study/materials/[id]` | STUDY | Material Detail | Materials list | Materials | Summarize, Quiz, Course |
| `/dashboard/study/materials/upload` | STUDY | Upload Material | FAB / + button | Materials | — |
| `/dashboard/study/quizzes` | STUDY | Quizzes | Study section | Overview | Materials, Analytics |
| `/dashboard/study/quizzes/[id]` | STUDY | Take Quiz | Quizzes list | Quizzes | Material source |
| `/dashboard/study/cgpa` | STUDY | CGPA Tracker | Study section | Overview | Analytics |
| `/dashboard/study/ai` | STUDY | AI Summaries | Study section | Overview | Materials |
| `/dashboard/study/analytics` | STUDY | Analytics | Study section | Overview | Quizzes, Materials |
| `/dashboard/study/personal` | STUDY | Personal Study | Study section | Overview | Notes, Bookmarks |
| `/dashboard/community/posts` | COMMUNITY (UNKNOWN) | Feed | Separate app section? | — | — |
| `/dashboard/community/posts/[id]` | COMMUNITY (UNKNOWN) | Post Detail | Feed tap | — | — |
| `/dashboard/community/posts/create` | COMMUNITY (UNKNOWN) | Create Post | FAB | — | — |
| `/dashboard/community/qa` | COMMUNITY (UNKNOWN) | Q&A | Separate section | — | — |
| `/dashboard/community/qa/ask` | COMMUNITY (UNKNOWN) | Ask Question | FAB | — | — |
| `/dashboard/community/groups` | COMMUNITY (UNKNOWN) | Groups | Separate section | — | — |
| `/dashboard/community/groups/[id]` | COMMUNITY (UNKNOWN) | Group Detail | Groups list | — | Messages |
| `/dashboard/community/mentors` | COMMUNITY (UNKNOWN) | Mentors | Separate section | — | User profiles |
| `/dashboard/community/notices` | COMMUNITY (UNKNOWN) | Notices | Separate section | — | — |
| `/dashboard/community/faqs` | COMMUNITY (UNKNOWN) | FAQs | Separate section | — | — |
| `/dashboard/planner` | STUDY (UNKNOWN) | Daily Planner | Separate? | — | Timetable |
| `/dashboard/planner/weekly` | STUDY (UNKNOWN) | Weekly Planner | Planner view | — | Timetable |
| `/dashboard/planner/reminders` | STUDY (UNKNOWN) | Reminders | Planner section | — | Notifications |

---

# D. CONTEXTUAL NAVIGATION ARCHITECTURE

## Navigation Patterns

### When to Use Each Pattern:

**1. Tabs (Segmented Control)**
- 2-5 related sections
- Equivalent priority
- Frequent switching
- Examples: Study (Materials | Quizzes | Summaries), Loop categories

```
┌─────────────────────────────┐
│ Materials │ Quizzes │ Summaries │
└─────────────────────────────┘
│ Content here                │
└─────────────────────────────┘
```

**2. Bottom Sheet**
- Actions that don't require full page
- Details, filtering, selection
- 2-3 options per action
- Examples: Sort, Filter, Share options, Contact seller

```
Content
      ┌──────────────────────┐
      │ Filter               │
      │ [Options]            │
      │ [Apply] [Cancel]     │
      └──────────────────────┘
```

**3. Horizontal Section Navigation**
- Related sections within destination
- Scrollable when 5+ items
- Lower priority than tabs
- Examples: Home sections (Timetable | Events | Notices)

```
┌───────────────────────────┐
│ Timetable › Events › Notices
└───────────────────────────┘
│ [Timetable content]       │
└───────────────────────────┘
```

**4. Back Navigation + Breadcrumb**
- Deep detail views
- User needs to understand path
- Preserve scroll position
- Examples: Material detail, Quiz attempt, Listing detail

```
← Back
Material: Advanced Calculus
─────────────────────────────
[Detail content]
```

**5. Related Content Cards**
- Cross-feature relationships
- Secondary discovery
- Contextual recommendations
- Examples: "Related materials", "More from this shop", "Same venue classes"

```
Material: Calculus
─────────────────
[Main content]

Related Materials:
┌──────────────┐
│ Differential │
│ Equations    │
└──────────────┘
```

**6. Inline Links**
- Navigation to related features
- Lightweight
- Contextual
- Examples: "View course" in material, "Navigate to venue" in timetable

```
Class: Calculus
Venue: Science Building
📍 Navigate | 📖 Course | 📚 Materials
```

**7. Floating Action Button (FAB)**
- Primary action per page
- Create, upload, post
- Consistent position
- Examples: Create post, Upload material, Create listing

```
              ┌───┐
              │ + │
              └───┘
```

**8. Action Menu (3-dots)**
- Secondary actions
- Share, report, delete, edit
- Scrollable in sheet
- Examples: Listing options, Material options

```
⋮ → [Share] [Report] [Delete] [Edit]
```

**9. Search & Discovery**
- Global search
- Destination search
- Advanced filters
- Examples: Search materials, Search listings, Find location

```
Search materials...
─────────────────
[Filters]
─────────────────
[Results]
```

**10. Breadcrumb (Text)**
- Show navigation path
- Allow go-back to ancestor
- Example: Study > Materials > Calculus

```
Study / Materials / Calculus 101
```

---

## Navigation State Management

**Using NavigationProvider (Adapted):**

Current NavigationProvider will represent:
- **activeDestination** (HOME | CAMPUS | LOOP | STUDY | ME)
- **activeSection** (within each destination)
- **expandedGroups** (for nested navigation, mobile drawer)
- **navigationConfig** (map of destinations → sections → routes)

**NOT managed by NavigationProvider:**
- Bottom sheet state (local component state)
- Tab selection within section (local component state)
- Form state (separate useForm hook)
- Detail view scroll position (ref)

---

# E. APPSHELL ARCHITECTURE

## Responsive Layout Model

### Mobile Layout (< 1024px)

```
┌─────────────────────┐
│ ContextualHeader    │  (0-56px: title, actions, filters)
├─────────────────────┤
│                     │
│  ContentArea        │  (responsive, scrollable)
│  (pb-24 for nav)    │
│                     │
├─────────────────────┤
│ BottomNav (5 dest)  │  (fixed, 56px, z-50)
└─────────────────────┘
```

**BottomNav Items:**
1. HOME (house icon)
2. CAMPUS (map icon)
3. LOOP (shopping icon)
4. STUDY (book icon)
5. ME (user icon)

**ContextualHeader:**
- Destination title (left)
- Search button (right, if applicable)
- Actions menu (right)
- Contextual breadcrumb (optional)

**Features:**
- Floating action button (FAB) for primary action
- Bottom sheets slide up from bottom
- No permanent sidebar
- Full-width content

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────┐
│ TopHeader (logo, search, avatar) │
├────────────┬─────────────────────┤
│ Sidebar    │ ContextualNav       │
│ (collaps)  ├─────────────────────┤
│ 5 dest +   │                     │
│ Sections   │  ContentArea        │
│            │                     │
│            │                     │
└────────────┴─────────────────────┘
```

**Sidebar:**
- 48px when collapsed
- 240px when expanded
- Sticky/fixed
- Shows 5 primary destinations
- Expandable sections (if needed)
- Toggle button (hamburger)

**ContextualNav:**
- Secondary navigation
- Tabs, filters, search
- Dynamic per destination
- Sticky header

**Features:**
- More whitespace
- Multi-column layouts
- Side-by-side detail views
- Desktop optimizations (keyboard nav, hover states)

---

## Component Hierarchy

```
LoopzAppShell
├─ TopHeader (desktop only)
│  ├─ Logo
│  ├─ Search
│  └─ Avatar + menu
│
├─ Sidebar (desktop) / HamburgerMenu (mobile)
│  ├─ Logo mark
│  ├─ PrimaryNavigation (5 destinations)
│  ├─ SectionNavigation (per destination)
│  └─ CollapseToggle
│
├─ MainContent
│  ├─ ContextualHeader
│  │  ├─ Breadcrumb (optional)
│  │  ├─ Title
│  │  ├─ Search (optional)
│  │  └─ Actions
│  │
│  ├─ ContextualNavigation (tabs, sections, filters)
│  │
│  └─ PageContent
│     ├─ Feed / Grid / List / Detail
│     └─ Related content links
│
├─ BottomNav (mobile)
│  └─ 5 destination links
│
├─ BottomSheets (modal)
│  └─ Filter, Sort, Actions, Forms
│
└─ FAB (floating action button)
   └─ Primary action per page
```

---

## Layout Responsibilities

**AppShell:**
- Global navigation state
- Responsive layout switching
- Top/bottom nav rendering
- Sheet overlay management

**ContextualHeader:**
- Page-specific title
- Contextual actions (search, filter, menu)
- Breadcrumb (optional)
- Loading state

**ContextualNavigation:**
- Tabs, section nav, filters
- Managed by page component
- Updates ContentArea

**ContentArea:**
- Route-specific content
- Scrollable (pb-24 on mobile)
- Detail views, lists, grids
- Related content integration

**BottomNav:**
- 5 primary destination links
- Active highlight
- No change on page nav

**FAB:**
- Primary action (create, upload, post)
- Always accessible
- Not on detail views (use inline actions instead)
- Mobile only (or secondary on desktop)

---

# F. NAVIGATIONPROVIDER ADAPTATION PLAN

## Current State

**Built:** Yes  
**Integrated:** No  
**Used:** Exists in `/components/navigation/NavigationProvider.tsx`

## Proposed Adaptation

### What Stays the Same

```typescript
NavigationProvider {
  ✅ isSidebarCollapsed     // desktop sidebar collapse
  ✅ isDrawerOpen            // mobile drawer open (rename to mobileMenuOpen)
  ✅ expandedGroups          // nested navigation expand/collapse
  ✅ userRoles              // role-based filtering
  ✅ featureFlags           // feature-based hiding
  ✅ filteredConfig         // computed filtered nav items
  ✅ localStorage/sessionStorage persistence
  ✅ usePathname sync
}
```

### What Changes

```typescript
OLD NavigationContextType {
  activeItemId: string | null              // ❌ Too granular
}

NEW NavigationContextType {
  activeDestination: 'HOME' | 'CAMPUS' | 'LOOP' | 'STUDY' | 'ME'  // ✅ Primary
  activeSection: string | null             // ✅ Section within destination
  navigationConfig: NavigationItem[]        // ✅ 5-destination structure
}
```

### New Responsibilities

```typescript
NavigationProvider will provide:

1. DESTINATION MANAGEMENT
   - activeDestination (HOME, CAMPUS, LOOP, STUDY, ME)
   - setActiveDestination(dest)
   - Synced with usePathname

2. SECTION MANAGEMENT
   - activeSection (within each destination)
   - setActiveSection(section)
   - Resets when destination changes

3. NAVIGATION CONFIG
   - navigationConfig: {
       HOME: { sections, routes },
       CAMPUS: { sections, routes },
       ...
     }
   - filteredConfig: filtered by roles/flags

4. SIDEBAR STATE (Desktop)
   - isSidebarCollapsed
   - toggleSidebar()

5. MOBILE MENU STATE
   - isMobileMenuOpen
   - setMobileMenuOpen(open)
   - Auto-closes on navigation

6. EXPANDED GROUPS
   - expandedGroups (for nested nav)
   - toggleGroup()
```

### Config Structure

```typescript
type NavigationItem = {
  id: string                    // 'HOME', 'CAMPUS', 'LOOP', 'STUDY', 'ME'
  label: string                 // 'Home', 'Campus', 'Loop', 'Study', 'Me'
  icon: LucideIcon             // Icon component
  path: string                 // '/dashboard', '/dashboard/campus-map', etc.
  
  sections?: {                 // Sub-sections per destination
    id: string                 // 'materials', 'quizzes', etc.
    label: string
    icon?: LucideIcon
    path: string               // '/dashboard/study/materials'
    routes?: string[]          // ['/dashboard/study/materials', '/dashboard/study/materials/[id]']
  }[]
  
  roles?: UserRole[]           // If present, only shown to these roles
  featureFlags?: FeatureFlagKey[] // If present, only shown if flags enabled
}
```

### Integration Points

**In `/app/dashboard/layout.tsx`:**
```typescript
<NavigationProvider navigationConfig={loopzNavConfig} userSession={userSession}>
  <LoopzAppShell>
    {children}
  </LoopzAppShell>
</NavigationProvider>
```

**In Components:**
```typescript
const { activeDestination, activeSection, isSidebarCollapsed } = useNavigation();
```

---

# G. DESIGN SYSTEM ARCHITECTURE

## Hierarchy

```
LAYER 1: TOKENS
├─ Colors (CSS variables)
├─ Typography
├─ Spacing
├─ Radius
├─ Shadows
└─ Z-index

LAYER 2: PRIMITIVES
├─ Button
├─ Input
├─ Card
├─ Badge
├─ Skeleton
├─ Text
└─ Divider

LAYER 3: COMPOSITES
├─ Modal/Dialog
├─ BottomSheet
├─ Tabs
├─ Toast/Snackbar
├─ Dropdown/Menu
├─ Breadcrumb
└─ Progress indicators

LAYER 4: LOOPZ COMPONENTS
├─ ContextualHeader
├─ ContextualNavigation
├─ BottomNav
├─ Sidebar
├─ FAB
├─ TopHeader
└─ AppShell

LAYER 5: FEATURE COMPONENTS
├─ TimetableCard
├─ MaterialCard
├─ ListingCard
├─ LocationCard
├─ QuizCard
└─ [Domain-specific]
```

## Component Organization

### `components/ui/` (Primitives - from shadcn)

```
components/ui/
├─ button.tsx              ✅ KEEP
├─ input.tsx               🔧 CREATE (if missing)
├─ card.tsx                🔧 CREATE (if missing)
├─ badge.tsx               🔧 CREATE (if missing)
├─ skeleton.tsx            ✅ KEEP (LoadingSkeleton)
├─ dialog.tsx              🆕 CREATE
├─ bottom-sheet.tsx        🆕 CREATE
├─ tabs.tsx                🆕 CREATE
├─ dropdown-menu.tsx       🆕 CREATE
├─ toast.tsx               🆕 CREATE
├─ breadcrumb.tsx          🆕 CREATE
├─ progress.tsx            🆕 CREATE
├─ select.tsx              🆕 CREATE
├─ text.tsx                🆕 CREATE (or use existing pattern)
└─ divider.tsx             🆕 CREATE
```

### `components/shared/` (App-level composites)

```
components/shared/
├─ BackButton.tsx          ✅ KEEP
├─ PasswordInput.tsx       ✅ KEEP
├─ ErrorMessage.tsx        ✅ KEEP
├─ LoadingSkeleton.tsx     ✅ KEEP (move to /ui or keep here)
├─ LoginForm.tsx           ✅ KEEP
├─ SearchInput.tsx         ✅ KEEP
├─ ProgressDots.tsx        ✅ KEEP
├─ SelectionList.tsx       ✅ KEEP
├─ PullToRefresh.tsx       ✅ KEEP (if used)
├─ ContextualHeader.tsx    🆕 CREATE
├─ ContextualNavigation.tsx 🆕 CREATE
└─ EmptyState.tsx          🆕 CREATE
```

### `components/navigation/` (Navigation - specialization)

```
components/navigation/
├─ NavigationProvider.tsx  ✅ KEEP (integrate)
├─ BottomNav.tsx           🔧 MODIFY (read from context)
├─ Sidebar.tsx             🆕 CREATE (merge + enhance)
├─ TopHeader.tsx           🆕 CREATE
├─ MobileMenu.tsx          🆕 CREATE (mobile drawer)
└─ useNavigation.ts        ✅ KEEP (hook already exists)
```

### `components/dashboard/` (Feature components)

```
components/dashboard/
├─ HomeSection.tsx         🆕 CREATE (HOME destination)
├─ CampusViewer.tsx        ✅ KEEP (existing map)
├─ LoopBrowser.tsx         🆕 CREATE (LOOP destination)
├─ StudySection.tsx        🆕 CREATE (STUDY destination)
├─ ProfileSection.tsx      🆕 CREATE (ME destination)
│
├─ cards/
│  ├─ TimetableCard.tsx    (existing pattern)
│  ├─ MaterialCard.tsx     (existing pattern)
│  ├─ ListingCard.tsx      (existing pattern)
│  ├─ LocationCard.tsx     (existing pattern)
│  └─ ...
│
├─ sheets/
│  ├─ FilterSheet.tsx      🆕 CREATE
│  ├─ SortSheet.tsx        🆕 CREATE
│  ├─ ActionSheet.tsx      🆕 CREATE
│  └─ ...
│
└─ navigation/
   ├─ SectionNav.tsx       🆕 CREATE
   ├─ DestinationTabs.tsx  🆕 CREATE
   └─ ...
```

### `components/admin/` & `components/super-admin/` (Role-specific - KEEP SEPARATE)

```
DO NOT merge admin navigation with Loopz student navigation.
Keep admin sidebars independent.
Share only primitives (Button, Input, Card, etc.).
```

---

# H. COMPONENT ARCHITECTURE

## Component Creation Order

**Phase 1: Foundational (Week 1)**
- [ ] Input component (from shadcn)
- [ ] Card component (from shadcn)
- [ ] Badge component (from shadcn)
- [ ] Dialog/Modal (from shadcn)
- [ ] Integrate NavigationProvider into dashboard layout
- [ ] Create TopHeader component
- [ ] Enhance Sidebar component
- [ ] Enhance BottomNav (read from NavigationProvider)

**Phase 2: Navigation & Shells (Week 1-2)**
- [ ] ContextualHeader component
- [ ] ContextualNavigation (tabs, section nav)
- [ ] LoopzAppShell (responsive layout)
- [ ] MobileMenu (mobile drawer)
- [ ] EmptyState component

**Phase 3: Interactive (Week 2)**
- [ ] BottomSheet component (from shadcn or custom)
- [ ] Toast/Snackbar (from shadcn)
- [ ] Breadcrumb (from shadcn)
- [ ] Dropdown/Menu (from shadcn)
- [ ] FAB (floating action button)

**Phase 4: Destination Shells (Week 2-3)**
- [ ] HomeSection wrapper
- [ ] CampusSection wrapper (enhance existing map)
- [ ] LoopSection wrapper (marketplace)
- [ ] StudySection wrapper
- [ ] ProfileSection wrapper

**Phase 5: Feature Components (Week 3-4)**
- [ ] Material cards, detail views
- [ ] Quiz cards, attempt interface
- [ ] Listing cards, detail views
- [ ] Location cards, detail views
- [ ] Timetable cards
- [ ] User cards

---

# I. DATA / QUERY ARCHITECTURE

## Current State

**API Layer:** ✅ Well-organized modules in `lib/api/`  
**Caching:** ❌ None - manual per-component state  
**Request Deduplication:** ❌ None  
**Invalidation:** ❌ None  
**Optimistic Updates:** ❌ None

## Proposed Data Architecture

### Data Flow

```
Component
    ↓
useQuery / useMutation hook (custom)
    ↓
Query cache (Map-based, in-memory)
    ↓
API module (lib/api/*)
    ↓
request<T>() (lib/api/base.ts)
    ↓
Backend
```

### Query Hook Pattern (Custom, Phase 2/3)

```typescript
// lib/hooks/useQuery.ts (custom, NOT TanStack Query)
function useQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    onError?: (error) => void
  }
): {
  data: T | undefined
  loading: boolean
  error: Error | null
  refetch: () => void
}

// Usage
const { data: materials, loading, error } = useQuery(
  ['materials', courseId],
  () => studyApi.listMaterials({ courseId }),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
)
```

### Mutation Hook Pattern (Custom)

```typescript
// lib/hooks/useMutation.ts (custom)
function useMutation<T, P>(
  mutationFn: (payload: P) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error) => void
  }
): {
  mutate: (payload: P) => Promise<T>
  loading: boolean
  error: Error | null
  reset: () => void
}

// Usage
const { mutate: uploadMaterial, loading } = useMutation(
  (file) => studyApi.uploadMaterial(file),
  { onSuccess: () => refetchMaterials() }
)
```

### Query Cache Manager

```typescript
// lib/query-cache.ts
class QueryCacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  
  set(key: string[], data: any, staleTime: number): void
  get(key: string[]): any | undefined
  invalidate(key: string[]): void
  invalidatePattern(pattern: string): void // Pattern-based, e.g., 'materials/*'
  clear(): void
}

// Usage
const cache = new QueryCacheManager()
cache.set(['materials', courseId], data, 5 * 60 * 1000)
cache.invalidatePattern('materials/*') // Invalidate all materials queries
```

### Deduplication Strategy

```typescript
// Automatically deduplicates in-flight requests
const results = await Promise.all([
  api1.listMaterials(),
  api2.listMaterials(), // Same query within 100ms window
])
// → Only 1 HTTP request made, both get same result
```

### When to Use Each

| Pattern | Use Case | Example |
|---------|----------|---------|
| useQuery | Fetch data on mount, auto-refetch | Get materials list |
| useMutation | Trigger action (create, update, delete) | Upload material |
| useLocalStorage | Persist UI state | Sidebar collapsed state |
| useForm | Form state + validation | Material upload form |

### Recommendation

**Do NOT install TanStack Query yet.**

Reasons:
1. Custom hooks sufficient for current scope
2. Learning curve for team
3. Can migrate later if needed
4. Phase 2/3 timing better

**Implementation Timeline:**
- Phase 1 (now): Keep existing manual state
- Phase 2: Implement custom useQuery/useMutation
- Phase 3 (optional): Consider TanStack Query if complexity grows

---

# J. STATE ARCHITECTURE

## State Categories

### 1. Server State (Remote Data)

**Belongs:** Query cache (useQuery)  
**Examples:** Materials list, user profile, timetable, listings

**Pattern:**
```typescript
const { data: materials } = useQuery(
  ['materials', courseId],
  () => studyApi.listMaterials({ courseId })
)
```

### 2. UI State (Local, Ephemeral)

**Belongs:** Component state (useState)  
**Examples:** Bottom sheet open, tab active, form focus

**Pattern:**
```typescript
const [isFilterOpen, setIsFilterOpen] = useState(false)
const [activeTab, setActiveTab] = useState('materials')
```

### 3. Navigation State (Route + Context)

**Belongs:** NavigationProvider + usePathname  
**Examples:** Active destination, active section, sidebar collapsed

**Pattern:**
```typescript
const { activeDestination, activeSection } = useNavigation()
```

### 4. Form State (User Input)

**Belongs:** Custom useForm hook (Phase 2)  
**Examples:** Material upload form, listing creation, profile edit

**Pattern:**
```typescript
const form = useForm({
  initialValues: { title: '', description: '' },
  validate: (values) => ({ /* errors */ }),
  onSubmit: (values) => studyApi.uploadMaterial(values)
})
```

### 5. Authentication State (App-wide)

**Belongs:** useAuth hook  
**Examples:** Current user, isAuthenticated, login/logout

**Pattern:**
```typescript
const { user, isAuthenticated, login, logout } = useAuth()
```

### 6. Persistent Preferences (Local Storage)

**Belongs:** useLocalStorage hook (Phase 2)  
**Examples:** Theme, sidebar collapsed, notification preferences

**Pattern:**
```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar_collapsed', false)
```

---

# K. STUDY ARCHITECTURE (Reference Implementation)

## Study Destination Structure

```
STUDY (Primary Destination)
├─ Overview Page (/dashboard/study)
│  ├─ Quick stats (GPA, materials, quizzes)
│  ├─ Section tabs (Materials | Quizzes | Summaries | CGPA | Analytics)
│  └─ FAB: Upload Material
│
├─ MATERIALS Section (/dashboard/study/materials)
│  ├─ List view (grid/list toggle)
│  ├─ Filters: Course, Type, Date, Rating
│  ├─ Sort: Recent, Title, Rating
│  ├─ Cards: Title, Course, Author, Rating, Downloads
│  ├─ FAB: Upload
│  └─ TAP MATERIAL → Material Detail
│
├─ MATERIAL DETAIL (/dashboard/study/materials/[id])
│  ├─ Document preview
│  ├─ Title, Course link, Author, Rating, Downloads
│  ├─ Actions: Download, Rate, Save, Share, Report
│  ├─ Related: Related materials, Course link
│  ├─ Related Contextual Actions:
│  │  ├─ "Generate Summary" → AI summary
│  │  ├─ "Create Quiz" → Quiz generation
│  │  ├─ "View Course" → Course detail (future)
│  │  └─ "Find Venue" → Campus (via timetable)
│  └─ Comments/Reviews section
│
├─ UPLOAD MATERIAL (/dashboard/study/materials/upload)
│  ├─ File picker
│  ├─ Title, Description inputs
│  ├─ Course select
│  ├─ Material type (PDF, DOC, VIDEO, IMAGE)
│  ├─ Tags input
│  ├─ Visibility (Public/Private)
│  └─ Submit button
│
├─ QUIZZES Section (/dashboard/study/quizzes)
│  ├─ List view (grid/list toggle)
│  ├─ Status indicators: Not started, In progress, Completed
│  ├─ Filters: Course, Difficulty, Status
│  ├─ Cards: Title, Course, Questions, Time limit, Your score
│  └─ TAP QUIZ → Quiz Detail
│
├─ QUIZ DETAIL (/dashboard/study/quizzes/[id])
│  ├─ Quiz metadata: Title, Course, Description, Time limit, Attempts allowed
│  ├─ "Start Quiz" button OR quiz interface
│  ├─ Related: Course link, Related quizzes, Material source
│  └─ If attempted: Results, Review answers, Retake button
│
├─ TAKE QUIZ (IN-PROGRESS)
│  ├─ Full-screen quiz interface
│  ├─ Progress: Question 3/10
│  ├─ Timer countdown
│  ├─ Question renderer (MCQ, short answer, essay)
│  ├─ Navigation: Previous, Next, Jump to question
│  ├─ Draft auto-save indicator
│  └─ Submit button (with warning)
│
├─ SUMMARIES Section (/dashboard/study/ai)
│  ├─ AI-generated summaries list
│  ├─ Status: Ready, Generating, Failed
│  ├─ Cards: Title, Course, Generated date, Download
│  ├─ TAP SUMMARY → Summary detail
│  └─ FAB: Request New Summary
│
├─ SUMMARY DETAIL
│  ├─ AI summary content (markdown)
│  ├─ Actions: Download, Share, Use for study
│  ├─ Related: Source material, Course
│  └─ Feedback: Was this helpful? [Yes/No]
│
├─ CGPA TRACKER (/dashboard/study/cgpa)
│  ├─ Current GPA display (large)
│  ├─ Target GPA input + calculator
│  ├─ Grade breakdown table (course, grade, credit hours, GPA)
│  ├─ Add grade form (modal)
│  ├─ GPA trend chart (semesters)
│  └─ Semester selector
│
└─ ANALYTICS (/dashboard/study/analytics)
   ├─ Study time chart (weekly/monthly)
   ├─ Material views (top 10)
   ├─ Quiz performance (avg score, trend)
   ├─ Engagement metrics
   └─ Time period selector (This week, This month, etc.)
```

## Study Relationships & Connections

### Material → Course Relationship

**API Investigation:**
- Does `studyApi.getMaterial(id)` return courseId?
- Does `studyApi.listMaterials(courseId)` exist?
- Decision: If yes, link to course detail. If no, log as future API requirement.

### Material → Quiz Relationship

**Action:** "Create Quiz from Material"
- Pre-fill quiz with material's content
- API: `studyApi.generateQuizFromMaterial(materialId, numQuestions)`
- UI: Modal for number of questions, difficulty level

### Material → Summary Relationship

**Action:** "Generate AI Summary"
- Send material to AI service
- API: `studyApi.generateSummaryFromMaterial(materialId)`
- UI: Progress spinner, then download summary

### Quiz → Course Relationship

**Link:** Display course name in quiz card and detail view
- API Investigation: Does quiz response include courseId?

### Course → Timetable Relationship

**Future feature:** View timetable classes for a course
- Link: "View classes" on course detail
- API: `schoolApi.getTimetable({ courseId })`

### Course → Venue → Campus Relationship

**Future feature:** Navigate to venue from course/timetable
- Link: "Navigate to venue" on timetable card
- Destination: Campus > Navigate > [Venue]
- API: Get venue coordinates from timetable

---

# L. CAMPUS ARCHITECTURE (Reference Implementation)

## Campus Destination Structure

```
CAMPUS (Primary Destination)
├─ MAP VIEW (/dashboard/campus-map)
│  ├─ Full-screen MapLibre canvas
│  ├─ Location search bar (top)
│  ├─ Category filter chips (floating)
│  ├─ GPS button (floating)
│  ├─ TAP LOCATION PIN → Location detail sheet
│  └─ Offline indicator (when available)
│
├─ LOCATION DETAIL (Bottom Sheet)
│  ├─ Location image (hero)
│  ├─ Name, category, distance
│  ├─ Address, hours, contact
│  ├─ Actions: 
│  │  ├─ "Navigate" → Turn-by-turn
│  │  ├─ "Save" → Bookmarks
│  │  ├─ "Share"
│  │  └─ "View on map"
│  ├─ Related:
│  │  ├─ "Classes in this venue" → Timetable
│  │  ├─ "Nearby locations"
│  │  └─ "Open hours & info"
│  └─ Reviews/rating
│
├─ NAVIGATION (/dashboard/campus-map/navigate/[locationId])
│  ├─ Map view with route highlighted
│  ├─ Turn-by-turn directions (list or map overlay)
│  ├─ Distance, time estimate, walking time
│  ├─ Profile selector: Foot, Bike, Car (if supported)
│  ├─ Current location tracking (if GPS enabled)
│  └─ Arrival notification
│
├─ LOCATIONS BROWSE (/dashboard/campus-map/locations)
│  ├─ List or grid view of all locations
│  ├─ Filter: Category, search, distance
│  ├─ Cards: Image, name, category, distance, rating
│  ├─ TAP LOCATION → Location detail
│  └─ FAB: Add favorite location (saved locally)
│
├─ SAVED LOCATIONS
│  ├─ User's bookmarked locations
│  ├─ Recently visited
│  ├─ Quick-access list
│  └─ TAP → Location detail or Navigate
│
├─ EMERGENCY (/dashboard/emergency)
│  ├─ Emergency contacts list
│  ├─ Quick dial buttons
│  ├─ Emergency locations (medical, security, etc.)
│  ├─ Emergency info entry (manage your info)
│  └─ Contact school emergency number
│
└─ CATEGORY BROWSER
   ├─ Browse by category (cafes, libraries, gyms, etc.)
   ├─ Cards per category
   └─ TAP → Location detail
```

## Campus Relationships & Connections

### Timetable → Venue → Campus

**From HOME or STUDY:**
- Timetable card shows venue name
- "Navigate to venue" action
- Opens Campus > Navigate > [Venue]
- API: Get venue coordinates from timetable response

### Venue → Timetable

**From CAMPUS:**
- Location detail shows classes happening there
- "View schedule for this venue"
- API Investigation: Does `campusMap.getFeature(id)` return related timetable entries?
- If yes: Display nearby classes
- If no: Future API requirement

### Location → Course → Study

**From CAMPUS:**
- If location is academic (classroom, lab), show related courses
- "View materials for this course"
- API Investigation: Are courses tied to locations?

---

# M. CROSS-FEATURE RELATIONSHIP MODEL

## Identified Connections

### Study ↔ Campus

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Timetable | Navigate to venue | Campus | Study → [Class] → "Navigate" → Campus/[VenueId] | `getTimetable()` (has coordinates?) |
| Campus | View classes | Study | Campus → [Venue] → "View schedule" → Study/Timetable | `getFeature()` returns related classes? |

### Study ↔ Study (Internal)

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Material | Generate summary | Summaries | Study/Materials/[id] → "Summarize" → Study/AI/[summaryId] | `generateSummaryFromMaterial()` |
| Material | Create quiz | Quizzes | Study/Materials/[id] → "Create quiz" → Study/Quizzes/[quizId] | `generateQuizFromMaterial()` |
| Material | View related | Materials | Study/Materials/[id] → "Related materials" → Study/Materials?related=[id] | `getRelatedMaterials()` or embedded in response? |
| Quiz | View source | Materials | Study/Quizzes/[id] → "Source material" link → Study/Materials/[materialId] | Does quiz response include materialId? |
| Course | View materials | Materials | (Future) Study/[CourseId] → "Materials" → Study/Materials?course=[id] | `listMaterials({ courseId })` |
| Course | View quizzes | Quizzes | (Future) Study/[CourseId] → "Quizzes" → Study/Quizzes?course=[id] | `listQuizzes({ courseId })` |

### Study ↔ Me (Profile)

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Profile | View materials uploaded | Study | Me/Profile/[userId] → "Materials" → Study/Materials?author=[userId] | `getUserMaterials(userId)` |
| Profile | View quiz results | Study | Me/Profile → "Quiz results" → Study/Quizzes/results | `getMyQuizResults()` |
| Study/Analytics | View profile | Me | Study/Analytics → User name → Me/Profile/[userId] | `getProfile(userId)` |

### Loop ↔ Loop (Internal)

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Listing | View shop | Shops | Loop/Listings/[id] → "View shop" → Loop/Shops/[shopId] | Does listing include shopId? |
| Shop | View listings | Listings | Loop/Shops/[shopId] → "View all listings" → Loop/Listings?shop=[id] | `listListings({ shopId })` |
| Listing | Related | Listings | Loop/Listings/[id] → "Similar listings" → Loop/Listings?similar=[id] | Backend recommendation needed? |

### Loop ↔ Campus

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Accommodation | View location | Campus | Loop/Accommodation/[id] → "View on map" → Campus/[LocationId] | Does accommodation include coordinates? |
| Campus | View accommodations | Loop | Campus/[LocationId] → "Accommodations near here" → Loop/Accommodation?near=[coords] | Backend geospatial query needed? |

### Loop ↔ Me

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Listing | View seller | Me | Loop/Listings/[id] → "View seller" → Me/Profile/[userId] | Does listing include sellerId? |
| Profile | View listings | Loop | Me/Profile/[userId] → "Listings" → Loop/Listings?author=[userId] | `getMyListings()` |

### HOME ↔ All Destinations

| From | Action | To | Route | API |
|------|--------|----|----|-----|
| Dashboard | Class → Navigate | Campus | HOME → Timetable/[classId] → "Navigate" → Campus/Navigate/[venueId] | Embedded |
| Dashboard | Recent material | Study | HOME → "Recent" → Study/Materials/[id] | `getRecentMaterials()` |
| Dashboard | Recent listing | Loop | HOME → "Recent" → Loop/Listings/[id] | `getRecentListings()` |

### Community ↔ All (UNKNOWN - Not in current structure)

**Note:** Community routes exist (`/dashboard/community/*`) but are not mapped to any of the 5 destinations.

**Options:**
1. Integrate into HOME (Announcements, Feeds)
2. Integrate into ME (Groups, Mentors)
3. Create 6th destination (CONNECT)
4. Keep as ephemeral feature (not primary navigation)

**OPEN PRODUCT DECISION:** Where does Community belong in Loopz?

---

# N. ROUTE PRESERVATION STRATEGY

## All Existing Routes Remain Valid

### Routing Philosophy

**Current URL structure is LOCKED IN.**

Existing routes:
- `/dashboard/study/materials` ← PRESERVE
- `/dashboard/study/quizzes` ← PRESERVE
- `/dashboard/campus-map` ← PRESERVE
- `/dashboard/marketplace` ← PRESERVE
- All routes under `/admin/*` ← PRESERVE
- All routes under `/super-admin/*` ← PRESERVE

**NO URL changes.**

### URL to Destination Mapping

The AppShell will map URLs to destinations:

```typescript
// lib/navigation/route-to-destination.ts
const ROUTE_TO_DESTINATION_MAP = {
  '/dashboard': 'HOME',
  '/dashboard/school': 'HOME',
  '/dashboard/notifications': 'ME',
  '/dashboard/settings': 'ME',
  '/dashboard/profile': 'ME',
  '/dashboard/profile/[id]': 'ME',
  '/dashboard/profile/edit': 'ME',
  '/dashboard/bookmarks': 'ME',
  '/dashboard/my-materials': 'ME',
  '/sessions': 'ME',
  
  '/dashboard/campus-map': 'CAMPUS',
  '/dashboard/campus-map/[id]': 'CAMPUS',
  '/dashboard/emergency': 'CAMPUS',
  
  '/dashboard/marketplace': 'LOOP',
  '/dashboard/marketplace/[id]': 'LOOP',
  '/dashboard/marketplace/listings/create': 'LOOP',
  '/dashboard/marketplace/[id]/edit': 'LOOP',
  '/dashboard/marketplace/saved': 'LOOP',
  '/dashboard/marketplace/shops': 'LOOP',
  '/dashboard/marketplace/shops/[id]': 'LOOP',
  '/dashboard/marketplace/jobs': 'LOOP',
  '/dashboard/marketplace/services': 'LOOP',
  '/dashboard/marketplace/accommodation': 'LOOP',
  '/dashboard/marketplace/lost-found': 'LOOP',
  '/dashboard/marketplace/roommates': 'LOOP',
  
  '/dashboard/study': 'STUDY',
  '/dashboard/study/materials': 'STUDY',
  '/dashboard/study/materials/[id]': 'STUDY',
  '/dashboard/study/materials/upload': 'STUDY',
  '/dashboard/study/quizzes': 'STUDY',
  '/dashboard/study/quizzes/[id]': 'STUDY',
  '/dashboard/study/cgpa': 'STUDY',
  '/dashboard/study/ai': 'STUDY',
  '/dashboard/study/analytics': 'STUDY',
  '/dashboard/study/personal': 'STUDY',
  
  // Community routes - UNMAPPED (OPEN DECISION)
  '/dashboard/community/posts': 'UNKNOWN',
  '/dashboard/community/posts/[id]': 'UNKNOWN',
  '/dashboard/community/qa': 'UNKNOWN',
  '/dashboard/community/qa/[id]': 'UNKNOWN',
  '/dashboard/community/groups': 'UNKNOWN',
  '/dashboard/community/groups/[id]': 'UNKNOWN',
  '/dashboard/community/mentors': 'UNKNOWN',
  '/dashboard/community/notices': 'UNKNOWN',
  '/dashboard/community/faqs': 'UNKNOWN',
  
  // Planner routes - UNMAPPED (part of STUDY?)
  '/dashboard/planner': 'STUDY',
  '/dashboard/planner/weekly': 'STUDY',
  '/dashboard/planner/reminders': 'STUDY',
}
```

### Deep Linking

All routes are deep-linkable and will auto-navigate to correct destination:

```typescript
// User navigates to /dashboard/study/materials/[id]
// AppShell detects destination: STUDY
// Sets activeDestination = 'STUDY'
// Sets activeSection = 'materials'
// Renders STUDY > Materials section
// Shows material detail
```

---

# O. TARGET FOLDER STRUCTURE

## Evolution Strategy

**Principle:** Incremental evolution, not reorganization.

Prefer adding new folders over moving existing code.

### Current vs. Target

#### `/lib/` (Core utilities)

```
CURRENT                          TARGET                       REASON
/lib
├─ /api                    ✅ KEEP                    Well-organized
├─ /hooks
│  ├─ useAuth            ✅ KEEP                    Working
│  ├─ useForm            🚧 ADD (Phase 2)           Form state management
│  ├─ useLocalStorage    🚧 ADD (Phase 2)           Persistent preferences
│  ├─ useQuery           🚧 ADD (Phase 2/3)         Server state (custom)
│  ├─ useMutation        🚧 ADD (Phase 2/3)         Server mutations (custom)
│  └─ [existing]         ✅ KEEP
│
├─ /map
│  └─ [existing services] ✅ KEEP                   Map architecture locked in
│
├─ /navigation
│  ├─ navigation.config.ts      ✅ KEEP (update)    5-destination config
│  ├─ navigation.types.ts       ✅ KEEP (update)    Add destination types
│  ├─ route-to-destination.ts   🆕 ADD              URL → Destination mapping
│  ├─ navigation.utils.ts       ✅ KEEP
│  └─ [existing]                ✅ KEEP
│
├─ /query-cache.ts             🆕 ADD (Phase 2/3)  Query cache manager
├─ /storage
│  ├─ localStorage.ts           🚧 ADD (Phase 2)   Type-safe storage
│  ├─ sessionStorage.ts         🚧 ADD (Phase 2)   Type-safe session
│  └─ cookies.ts                🚧 ADD (Phase 2)   Cookie manager
│
└─ [existing]                  ✅ KEEP
```

#### `/components/` (UI & Layout)

```
CURRENT                          TARGET                       REASON
/components
├─ /ui                    ✅ KEEP all
│  └─ [shadcn components] ✅ KEEP
│     ├─ input.tsx        🔧 ADD (if missing)        Form input
│     ├─ card.tsx         🔧 ADD (if missing)        Card container
│     ├─ badge.tsx        🔧 ADD (if missing)        Badge component
│     ├─ dialog.tsx       🆕 ADD                     Modal/Dialog
│     ├─ bottom-sheet.tsx 🆕 ADD                     Bottom sheet
│     ├─ tabs.tsx         🆕 ADD                     Tabs/segmented control
│     ├─ dropdown.tsx     🆕 ADD                     Dropdown menu
│     ├─ toast.tsx        🆕 ADD                     Toast notification
│     ├─ breadcrumb.tsx   🆕 ADD                     Breadcrumb nav
│     ├─ select.tsx       🆕 ADD                     Select/combobox
│     ├─ progress.tsx     🆕 ADD                     Progress bar
│     ├─ text.tsx         🆕 ADD (optional)          Text components
│     └─ divider.tsx      🆕 ADD (optional)          Divider
│
├─ /shared
│  ├─ BackButton          ✅ KEEP
│  ├─ PasswordInput       ✅ KEEP
│  ├─ ErrorMessage        ✅ KEEP
│  ├─ LoadingSkeleton     ✅ KEEP or move to /ui
│  ├─ LoginForm           ✅ KEEP
│  ├─ [existing]          ✅ KEEP
│  ├─ ContextualHeader.tsx 🆕 ADD                    Destination-specific header
│  ├─ ContextualNavigation.tsx 🆕 ADD                Tabs, section nav
│  ├─ EmptyState.tsx      🆕 ADD                     Empty state UI
│  └─ FAB.tsx             🆕 ADD                     Floating action button
│
├─ /navigation
│  ├─ NavigationProvider  ✅ KEEP (integrate)
│  ├─ useNavigation       ✅ KEEP (hook)
│  ├─ BottomNav.tsx       🔧 MODIFY                  Read from context
│  ├─ Sidebar.tsx         🆕 CREATE                  Desktop sidebar
│  ├─ TopHeader.tsx       🆕 CREATE                  Desktop top bar
│  ├─ MobileMenu.tsx      🆕 CREATE                  Mobile drawer
│  └─ LoopzAppShell.tsx   🆕 CREATE                  Main layout wrapper
│
├─ /dashboard
│  ├─ /map [existing]     ✅ KEEP
│  ├─ /cards
│  │  ├─ TimetableCard.tsx
│  │  ├─ MaterialCard.tsx
│  │  ├─ ListingCard.tsx
│  │  ├─ LocationCard.tsx
│  │  ├─ QuizCard.tsx
│  │  └─ [domain-specific cards]
│  │
│  ├─ /sheets
│  │  ├─ FilterSheet.tsx  🆕 ADD
│  │  ├─ SortSheet.tsx    🆕 ADD
│  │  ├─ ActionSheet.tsx  🆕 ADD
│  │  └─ [domain-specific sheets]
│  │
│  ├─ /sections
│  │  ├─ HomeSection.tsx  🆕 ADD
│  │  ├─ CampusSection.tsx 🆕 ADD
│  │  ├─ LoopSection.tsx  🆕 ADD
│  │  ├─ StudySection.tsx 🆕 ADD
│  │  └─ ProfileSection.tsx 🆕 ADD
│  │
│  └─ [existing]          ✅ KEEP
│
├─ /admin               ✅ KEEP SEPARATE         Role-specific UI
├─ /super-admin         ✅ KEEP SEPARATE         Role-specific UI
└─ [existing]           ✅ KEEP
```

#### `/app/` (Routes)

```
CURRENT                          TARGET                       REASON
/app
├─ /dashboard
│  ├─ layout.tsx          🔧 MODIFY                  Wrap with LoopzAppShell
│  ├─ page.tsx            ✅ KEEP or refactor        HOME destination entry
│  ├─ /study              ✅ KEEP all routes         STUDY destination
│  ├─ /marketplace        ✅ KEEP all routes         LOOP destination
│  ├─ /campus-map         ✅ KEEP all routes         CAMPUS destination
│  ├─ /profile            ✅ KEEP all routes         ME destination
│  ├─ /settings           ✅ KEEP all routes         ME destination
│  ├─ /notifications      ✅ KEEP all routes         ME destination
│  ├─ /emergency          ✅ KEEP all routes         CAMPUS destination
│  ├─ /community          ⚠️ UNMAPPED               OPEN DECISION
│  ├─ /planner            ⚠️ UNMAPPED (→ STUDY?)    OPEN DECISION
│  └─ [existing]          ✅ KEEP all
│
├─ /admin                ✅ KEEP all separate      Admin interface unchanged
├─ /super-admin          ✅ KEEP all separate      Super admin interface unchanged
├─ /login                ✅ KEEP                   Auth flow unchanged
├─ /register             ✅ KEEP                   Auth flow unchanged
├─ [auth routes]         ✅ KEEP all
└─ [existing]            ✅ KEEP all
```

#### `/types/` (TypeScript)

```
CURRENT                          TARGET                       REASON
/types
├─ [all existing]        ✅ KEEP                    Well-organized by domain
├─ navigation.ts         🔧 ADD/UPDATE             Add destination types
└─ query.ts              🆕 ADD (Phase 2/3)        Query/mutation types
```

---

# P. IMPLEMENTATION ROADMAP

## Timeline: 4 Weeks (3-4 developers)

### Week 1: Foundation & Navigation Setup

**Goals:** Enable NavigationProvider integration, basic layout

- [ ] Create navigation config for 5-destination structure
- [ ] Create route-to-destination mapping
- [ ] Integrate NavigationProvider into `/app/dashboard/layout.tsx`
- [ ] Test destination detection from URL
- [ ] Create TopHeader component (desktop)
- [ ] Create Sidebar component (desktop)
- [ ] Enhance BottomNav to read from NavigationProvider
- [ ] Create LoopzAppShell wrapper layout
- [ ] Create MobileMenu component (mobile drawer)
- [ ] Responsive layout switching (desktop/mobile)
- [ ] Test on mobile device (or emulator)

**Deliverable:** Functional 5-destination navigation with responsive layout

### Week 2: Components & Interaction

**Goals:** Build interactive components, polish navigation

- [ ] Add Dialog/Modal component (shadcn)
- [ ] Create ContextualHeader component
- [ ] Create ContextualNavigation component (tabs)
- [ ] Create BottomSheet component (custom or shadcn)
- [ ] Create Toast/Snackbar component (shadcn)
- [ ] Create FAB (floating action button)
- [ ] Add missing primitives (Input, Card, Badge if not present)
- [ ] Create EmptyState component
- [ ] Update BottomNav styling to new design
- [ ] Test navigation state persistence
- [ ] Test active destination highlighting
- [ ] Create Search component (global)
- [ ] Create FilterSheet and SortSheet components

**Deliverable:** Full interactive navigation, reusable components

### Week 3: Destination Implementations

**Goals:** Implement 5 destination shells, integrate features

- [ ] Create HomeSection wrapper (integrate dashboard)
- [ ] Create StudySection wrapper (integrate study routes)
- [ ] Create CampusSection wrapper (integrate map)
- [ ] Create LoopSection wrapper (integrate marketplace)
- [ ] Create ProfileSection wrapper (integrate me routes)
- [ ] Add related content links (Material → Summary, Quiz, Course)
- [ ] Add contextual actions (navigate, save, share)
- [ ] Test deep-linking to all routes
- [ ] Implement query hooks (useQuery, useMutation)
- [ ] Implement query cache
- [ ] Begin migrating data fetching to hooks
- [ ] Test server state refresh
- [ ] Add error boundaries per section

**Deliverable:** 5 functional destinations with integrated features

### Week 4: Polish & Optimization

**Goals:** Refine UX, optimize performance, prepare for launch

- [ ] Add loading states to all data fetches
- [ ] Add error handling UI
- [ ] Add empty state UI for lists
- [ ] Responsive design pass (test on multiple devices)
- [ ] Performance audit (bundle size, render performance)
- [ ] Accessibility audit (keyboard nav, screen reader)
- [ ] A11y improvements (aria labels, focus management)
- [ ] Test on low-end devices/slow networks
- [ ] Create user guide / onboarding
- [ ] Document new architecture
- [ ] Code review (all)
- [ ] Testing (manual + automated)
- [ ] Fix bugs identified in review
- [ ] Prepare deployment

**Deliverable:** Production-ready Loopz UX

---

# Q. MIGRATION RISKS

## High Severity

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Breaking existing routes during refactor** | LOW | CRITICAL | Keep all existing routes untouched; add AppShell as wrapper only |
| **Navigation state desync (destination vs. URL)** | MEDIUM | HIGH | Implement route-to-destination mapping immediately; test thoroughly |
| **Mobile/desktop layout collapse** | MEDIUM | HIGH | Build responsive layout systematically; test on real devices early |
| **Admin navigation accidentally changed** | LOW | HIGH | Keep `/admin` and `/super-admin` completely separate; add comments |
| **Performance regression from new layout** | MEDIUM | MEDIUM | Monitor bundle size; profile rendering; optimize before launch |

## Medium Severity

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **NavigationProvider integration complexity** | MEDIUM | MEDIUM | Start integration early; test in isolation before full wrap |
| **Too many bottom sheets open simultaneously** | LOW | MEDIUM | Implement state management for sheets; prevent stacking |
| **Icon library inconsistency during migration** | MEDIUM | LOW | Keep React Icons until Phase 3; don't force Lucide migration |
| **ContextualNavigation tabs not visible on small screens** | MEDIUM | MEDIUM | Test on mobile; implement horizontal scroll or collapse pattern |
| **Query cache invalidation issues** | LOW | MEDIUM | Implement simple cache invalidation first; add logging |
| **Community features unmapped** | MEDIUM | MEDIUM | Make decision early; allocate owner to Community placement |

## Low Severity

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **New components have style drift** | MEDIUM | LOW | Use design system tokens; add lint rules |
| **Animation janky on low-end devices** | LOW | LOW | Use GPU-accelerated animations; avoid heavy JS |
| **Accessibility regressions** | MEDIUM | LOW | Test with screen reader; audit keyboard nav |
| **Dark mode not working on new components** | LOW | LOW | Use semantic tokens; test in dark mode before merge |

---

# R. OPEN PRODUCT QUESTIONS

## Critical Decisions Needed

### 1. Where Does Community Belong?

**Current:** Routes exist at `/dashboard/community/*` but not mapped to any destination

**Options:**
- **Option A:** Integrate into HOME (Feeds, Notices, Announcements)
  - Pro: Discovery from dashboard
  - Con: HOME becomes crowded
  - Requires: "Community" section tab on HOME
  
- **Option B:** Integrate into ME (Groups, Mentors)
  - Pro: User-centric
  - Con: "Mentors" doesn't fit ME conceptually
  - Requires: "Community" section in ME
  
- **Option C:** Create 6th destination (CONNECT)
  - Pro: Equal weight with other features
  - Con: BottomNav becomes 6 items (crowded mobile)
  - Requires: Complete redesign of bottom nav
  
- **Option D:** Keep Community separate (ephemeral/contextual)
  - Pro: Doesn't crowd the 5 destinations
  - Con: Less discoverable
  - Requires: Access via search or deep links only

**Recommendation:** Gather product team input; Option A or B likely

### 2. Planner / Reminders / Timetable Placement

**Current:** Routes at `/dashboard/planner/*` and `/dashboard/study/` (no timetable route visible)

**Are these part of STUDY or separate?**

**Current Assumption:** Integrated into STUDY
- Timetable as first tab in STUDY
- Reminders as section within STUDY
- Planner as alternative view

**But:** Planner could be its own feature or part of HOME

**Decision:** Clarify with product team

### 3. Dark Mode

**Current:** Tokens defined but no toggle

**Include in this release?**
- Option A: Wire up dark mode toggle in Phase 2
- Option B: Defer to Phase 3

**Recommendation:** Option B (defer). Foundation work done, can enable later.

### 4. Search Scope

**Current:** No global search component

**Should Loopz include:**
- Global search (across all destinations)?
- Per-destination search only?
- Advanced filters?

**Recommendation:** Start with per-destination search; add global search in Phase 3

### 5. API Relationship Discovery

Several proposed relationships depend on API changes:

**APIs to verify/confirm with backend team:**
- Does `getTimetable()` return venue coordinates for Campus navigation?
- Does `getMaterial()` return related materials list?
- Does `getQuiz()` return source material ID?
- Does `getFeature()` (campus location) return related classes/courses?
- Do listing responses include seller ID?
- Does accommodation include geospatial coordinates?

**Action:** Backend team to confirm API response structures for all relationship linking

### 6. Offline Capabilities

**Current:** Serwist service worker configured

**What should work offline?**
- Map view (tiles cached)?
- Material viewing (PDFs cached)?
- Planner (read-only)?

**Decision:** Define offline scope; currently undefined

### 7. Notification Delivery

**Current:** Notifications in ME section

**Should they also:**
- Show in a notification center (icon on TopHeader)?
- Show badges (unread count)?
- Show as toasts (real-time)?

**Recommendation:** Clarify notification strategy with product

---

# S. EXPLICIT CLASSIFICATION: KEEP / MODIFY / CREATE / DEFER / DO NOT TOUCH

## KEEP (No changes needed)

- ✅ **All API modules** (`lib/api/*.ts`) - Well-organized, working
- ✅ **All TypeScript types** (`types/*.ts`) - Comprehensive, working
- ✅ **Authentication flow** (`useAuth`, `/login`, `/register`) - Functional
- ✅ **Map architecture** (`lib/map/services/*`) - Specialized, working
- ✅ **Admin routes** (`/admin/*`) - Separate, unchanged
- ✅ **Super Admin routes** (`/super-admin/*`) - Separate, unchanged
- ✅ **Button component** (`components/ui/button.tsx`) - Complete
- ✅ **BackButton** (`components/shared/BackButton.tsx`) - Clean
- ✅ **PasswordInput** (`components/shared/PasswordInput.tsx`) - Functional
- ✅ **ErrorMessage** (`components/shared/ErrorMessage.tsx`) - Consistent
- ✅ **LoadingSkeleton** (`components/shared/LoadingSkeleton.tsx`) - Reusable
- ✅ **LoginForm** (`components/shared/LoginForm.tsx`) - Working
- ✅ **NavigationProvider** (exists, not integrated) - Good architecture
- ✅ **All existing routes** (`/dashboard/*`, `/admin/*`, `/super-admin/*`) - URL structure locked

## MODIFY (Update, don't rewrite)

- 🔧 **NavigationProvider integration** - Wrap dashboard layout, update config for 5 destinations
- 🔧 **BottomNav component** - Change to read from NavigationProvider context
- 🔧 **Dashboard layout** (`/app/dashboard/layout.tsx`) - Add AppShell wrapper
- 🔧 **Navigation config** - Create 5-destination structure, route-to-destination mapping
- 🔧 **Color tokens** - Migrate inline `slate-*` colors to semantic tokens (future phase)
- 🔧 **Icon strategy** - Plan migration from dual libraries to Lucide (future phase)
- 🔧 **Sidebar components** (`AdminSidebar`, `SuperAdminSidebar`) - Keep separate, don't merge

## CREATE (New components/utilities)

- 🆕 **LoopzAppShell** - Main responsive layout wrapper
- 🆕 **TopHeader** - Desktop top bar (logo, search, avatar)
- 🆕 **Sidebar** - Desktop primary navigation
- 🆕 **MobileMenu** - Mobile drawer navigation
- 🆕 **ContextualHeader** - Destination-specific header
- 🆕 **ContextualNavigation** - Tabs, section filters
- 🆕 **FAB** - Floating action button
- 🆕 **HomeSection** - HOME destination wrapper
- 🆕 **StudySection** - STUDY destination wrapper
- 🆕 **CampusSection** - CAMPUS destination wrapper
- 🆕 **LoopSection** - LOOP destination wrapper
- 🆕 **ProfileSection** - ME destination wrapper
- 🆕 **Dialog** (shadcn) - Modal/confirmation dialogs
- 🆕 **BottomSheet** (shadcn or custom) - Sheet overlays
- 🆕 **Tabs** (shadcn) - Segmented navigation
- 🆕 **Toast** (shadcn) - Notifications
- 🆕 **Breadcrumb** (shadcn) - Navigation path
- 🆕 **Dropdown** (shadcn) - Action menus
- 🆕 **Input** (shadcn) - Form inputs (if missing)
- 🆕 **Card** (shadcn) - Card container (if missing)
- 🆕 **Badge** (shadcn) - Badge tags (if missing)
- 🆕 **FilterSheet** - Reusable filter interface
- 🆕 **SortSheet** - Reusable sort interface
- 🆕 **EmptyState** - Empty list/section UI
- 🆕 **useQuery** - Custom query hook (Phase 2/3)
- 🆕 **useMutation** - Custom mutation hook (Phase 2/3)
- 🆕 **useLocalStorage** - Type-safe storage hook (Phase 2)
- 🆕 **QueryCacheManager** - In-memory cache (Phase 2/3)
- 🆕 **route-to-destination.ts** - URL mapping
- 🆕 **navigation.config.ts** - 5-destination configuration

## DEFER (Future phases)

- ⏳ **Icon library migration** (Lucide-only) - Phase 3
- ⏳ **Dark mode toggle** - Phase 3
- ⏳ **Global search** - Phase 3
- ⏳ **Query deduplication optimization** - Phase 3
- ⏳ **TanStack Query adoption** - If needed, Phase 3+
- ⏳ **Advanced filtering UI** - Phase 3+
- ⏳ **Service worker offline strategy** - Phase 3+
- ⏳ **Notification center redesign** - Phase 3+
- ⏳ **Community placement decision** - Needed before Phase 2 launch
- ⏳ **Planner/Timetable routing** - Clarify before Phase 2 launch
- ⏳ **API relationship confirmat** - Needed from backend before Phase 2 launch

## DO NOT TOUCH

- ❌ **Admin architecture** - Keep `/admin` completely separate
- ❌ **Super Admin architecture** - Keep `/super-admin` completely separate
- ❌ **Backend API design** - Don't change endpoints
- ❌ **Authentication types** - Keep as-is
- ❌ **Database schema** - Frontend only
- ❌ **Build system** (Turbopack) - Don't reconfigure
- ❌ **Existing route structure** - No URL changes
- ❌ **Phase 1 modular structure** - `lib/` organization is good
- ❌ **Map library** (MapLibre) - Architecture locked in

---

# FINAL SUMMARY

## What Has Been Designed

✅ **A complete 5-destination student UX architecture** that:
- Preserves all existing routes and functionality
- Organizes 50+ features into 5 primary destinations
- Implements contextual navigation patterns
- Defines a responsive AppShell (mobile + desktop)
- Adapts NavigationProvider for new structure
- Plans component creation in priority order
- Maps data relationships across features
- Identifies integration points and dependencies
- Provides 4-week implementation timeline
- Flags product decisions needed upfront
- Classifies every component (KEEP/MODIFY/CREATE/DEFER/DO NOT TOUCH)

## What Has NOT Been Designed

❌ **Not designed (out of scope):**
- Backend API changes (only identified what's needed)
- Database schema changes
- Authentication redesign (keep current)
- Admin/super-admin navigation changes (keep separate)
- Implementation code (architecture only)
- Icon migration (future phase)
- Dark mode implementation (future phase)

## Status

**READY FOR REVIEW** → **THEN IMPLEMENTATION**

This document is the definitive architecture specification for Loopz Phase 2.

Before implementation begins:
1. Product team review and approve 5-destination structure
2. Community placement decision
3. Planner/Timetable routing clarification
4. Backend team confirm API response structures
5. Design team review component specifications
6. Engineering team assign Phase 1 tasks

---

**Document Version:** 1.0  
**Status:** Architecture Review Ready  
**Next Step:** Present to stakeholders for approval before implementation begins
