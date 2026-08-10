# Study Materials UI/UX Flow

## Overview
The materials feature allows students to browse, search, bookmark, rate, and download study materials (past questions, notes, handouts, etc.) uploaded by peers or tutors.

---

## User Journey

### 1. **Materials List Page** (`/dashboard/study/materials`)

#### Entry Point
- User navigates from Study Dashboard
- Page loads materials with filters

#### Components & Features

**Search Bar**
- Real-time search input with debounce (400ms)
- Placeholder: "Search materials, course codes…"
- Clear (X) button when text entered
- Searches across title, course code

**Type Filter Chips** (horizontal scroll)
- "All" (default, shows all materials)
- "Past Questions", "Notes", "Handouts", "Assignments", "Slides", "Summaries"
- Toggleable — click to filter, click again to show all
- Visual feedback: selected = accent background, unselected = card background

**Material Cards** (grid of vertical cards)
Each card shows:
- **Title** (bold, clickable)
- **Download count** + stars rating + bookmark button (top-right)
- **Course code badge** (blue accent) + type badge (gray)
- **Uploader info** (avatar initials + name)
- **Hover state**: Shows chevron arrow
- **Tap/click**: Navigates to detail page

**Loading State**
- Spinner centered on page while fetching
- Skips if data already cached

**Empty State**
- BookOpen icon + message "No materials found"
- Suggests trying different filter/search

**Error Banner**
- Destructive background + AlertTriangle icon
- Message + Retry button

**Floating Action Button (FAB)**
- Fixed bottom-right (+icon)
- Navigates to `/dashboard/study/materials/upload`
- Only visible if user has upload permissions

**Bottom Navigation**
- Standard navigation bar (study, community, map, etc.)

#### State Management
```
materials: Material[]          // All fetched materials
bookmarked: Record<id, bool>   // Bookmark state per material
search: string                 // Search query
activeType: MaterialType | ""  // Current filter
loading: boolean
error: string | null
summariseMode: boolean         // If action=summarise in query params
```

#### API Calls
- `studyApi.getMaterials({ search?, type? })` — Fetch materials
- `studyApi.bookmarkMaterial(id)` — Toggle bookmark
- Debounced fetch on search/filter change (400ms)

#### Interactions
- **Search**: Debounced, triggers fetch with query
- **Filter**: Click chip to toggle filter, triggers fetch
- **Bookmark**: Optimistic update, reverts on error
- **Summarise**: If summariseMode, click "Summarise this material" → `/dashboard/study/ai/generating/{id}`
- **Card click**: Navigate to detail page

---

### 2. **Material Detail Page** (`/dashboard/study/materials/[materialId]`)

#### Entry Point
- User clicks material card from list
- Page loads single material details

#### Components & Features

**Header**
- Back button (← arrow icon)
- Title: "Material Detail" + subtitle "Study material overview"
- Edit button (pencil icon, opens edit sheet)

**Header Card (Info Section)**
Contains:
- **Badges**: Course code (blue), type (gray), level (gray)
- **Bookmark button** (top-right)
- **Verified badge** (if verified): Green "Verified" + shield icon
- **Title** (large, bold)
- **Subtitle**: Course code, department, year (separated by ·)
- **Uploader card**: Avatar + name + upload date
- **Stats grid** (2 columns):
  - Downloads (with icon + number)
  - Avg rating (with icon + stars + count)
- **Description** (if available, gray text)
- **File info**: Format + file size

**Primary Actions** (full-width buttons)
1. **Preview** button (blue, top)
   - Opens in-app viewer
2. **Download** button (white border, blue text)
   - Downloads file + increments download count
   - Shows loader while downloading
3. **Generate Quiz with AI** button (indigo border + background)
   - Navigates to quiz generation page with material ID

**Secondary Actions** (row of 3)
- **Bookmark button** (circular, toggles saved state)
- **Share button** (border + text, copies URL or uses native share)
- **Report link** (text only)

**Rating Section** (card)
- Title: "Rate this material"
- Subtitle: "Tap a star to submit your rating"
- 5 interactive stars (hover to preview, click to submit)
- Stars fill on hover, show user's submitted rating

**Description Card** (if description exists)
- Title + FileText icon
- Full description text

**Visibility Card**
- Title + visibility badge
- Shows visibility type (PUBLIC, DEPARTMENT, LEVEL, STUDY_GROUP)
- **Verify button** (if not verified)
  - Shows ShieldCheck icon
  - Only for verified moderators

**Edit Sheet** (bottom sheet, modal)
- Opens when pencil icon clicked
- Drag handle at top
- Form fields:
  - Title (text input)
  - Course code (text input)
  - Course title (text input)
  - Description (textarea, max 1000 chars)
  - Visibility (select dropdown)
- Save error banner (if save fails)
- Cancel + Save buttons (bottom)
- Save button disabled if title empty
- Only PATCH visibility to backend (other fields optimistic)

**File Viewer** (full-screen modal)
- Opens when Preview button clicked
- Toolbar at top:
  - File icon + material title
  - Open in new tab button (↗)
  - Close button (X)
- Body:
  - **For images**: Direct display with max-width/height + rounded corners
  - **For PDFs**: Native browser viewer (iframe with PDF)
  - **For Office files**: Google Docs viewer (iframe)
  - **Fallback**: Extracted text preview
  - Loading spinner while fetching URL
  - Error state with "Download instead" link

#### State Management
```
material: Material             // Single material details
loading: boolean
error: string | null
bookmarked: boolean            // Bookmarked by user
downloading: boolean           // Download in progress
rating: number                 // User's rating (0-5)
hoverRating: number            // Star hover preview
ratingSubmitting: boolean
verifying: boolean
// Edit sheet
editOpen: boolean
editForm: { title, courseCode, courseTitle, description, visibility }
saving: boolean
saveError: string | null
// Viewer
viewerOpen: boolean
viewerUrl: string | null       // Signed download URL
viewerLoading: boolean
viewerError: string | null
viewerFailed: boolean          // If iframe fails to load
```

#### API Calls
- `studyApi.getMaterial(materialId)` — Fetch single material
- `studyApi.bookmarkMaterial(materialId)` — Toggle bookmark
- `studyApi.getDownloadUrl(materialId)` — Get signed URL
- `studyApi.trackDownload(materialId)` — Increment download count
- `studyApi.rateMaterial(materialId, rating)` — Submit rating
- `studyApi.updateMaterialVisibility(materialId, visibility)` — Update visibility
- `studyApi.verifyMaterial(materialId)` — Verify material (admin only)

#### Interactions
- **Back**: Navigate back
- **Edit**: Open edit sheet
- **Bookmark**: Optimistic toggle
- **Preview**: Open in-app viewer with signed URL
- **Download**: Get signed URL, open in new tab, increment count
- **Generate Quiz**: Navigate to quiz generation
- **Share**: Copy URL or use native share
- **Rate**: Hover preview, click to submit
- **Save edits**: PATCH visibility, optimistic update for other fields
- **Verify**: POST verify endpoint

---

## Data Flow

### Material Object Structure
```typescript
interface Material {
  // Identity
  id: string
  title: string
  courseCode?: string
  courseTitle?: string
  type: "PAST_QUESTION" | "NOTE" | "HANDOUT" | "ASSIGNMENT" | "SLIDES" | "SUMMARY" | "OTHER"
  
  // Metadata
  description?: string
  department?: string
  level?: string
  year?: string
  
  // Engagement
  downloadCount: number
  avgRating: number
  averageRating: number (normalized)
  _count?: { ratings: number; bookmarks: number }
  ratingCount: number (normalized)
  isBookmarked: boolean
  userRating?: number | null
  
  // Visibility & Verification
  visibility: "PUBLIC" | "DEPARTMENT" | "LEVEL" | "STUDY_GROUP"
  isVerified: boolean
  
  // Uploader
  uploadedBy?: Uploader
  uploader?: Uploader
  createdAt?: string
  
  // File
  fileUrl?: string
  mimeType?: string
  fileSize?: number
  extractedTextPreview?: string
}

interface Uploader {
  id: string
  fullName: string
  profilePictureUrl?: string
  avatar?: string
}
```

---

## Key Features

### 1. **Search & Filtering**
- Debounced search (400ms) for performance
- Type-based filtering (Past Q, Notes, etc.)
- Filters combine: search + type
- Results show download count and rating

### 2. **Bookmarking**
- Optimistic updates (immediate visual feedback)
- Reverts on error
- Persisted to backend
- Aggregated in "Saved materials" section (future)

### 3. **Rating System**
- 5-star interactive rating
- Hover preview + click to submit
- Shows aggregate rating + count
- User's rating displayed

### 4. **In-App Viewer**
- Image support (direct display)
- PDF support (native browser viewer)
- Office files (Google Docs viewer)
- Extracted text fallback
- Full-screen modal
- Opens in new tab option

### 5. **Download Tracking**
- Signed URL generation (security)
- Opens in new tab (prevents page reload)
- Downloads incremented server-side
- Local UI count increment

### 6. **AI Integration**
- "Generate Quiz with AI" button
- Passes material ID to quiz generation
- Extracts text from material for context

### 7. **Material Editing**
- Owner can edit: title, course code, course title, description, visibility
- Other fields optimistically updated locally
- Visibility is the only PATCH endpoint
- Bottom sheet UI with drag handle

### 8. **Verification**
- Admin/moderator can verify materials
- Shows ShieldCheck badge when verified
- Increases trust/visibility

---

## Responsive Design

### Mobile (<768px)
- Full-width cards
- Touch-friendly buttons (min 44px)
- Bottom sheet for edit modal
- Horizontal scroll for type filters
- FAB bottom-right (avoids bottom nav)

### Desktop (≥768px)
- Same layout (single column)
- Hover states on cards
- Larger preview area for viewer
- Edit sheet takes bottom 50-70% of screen

---

## Loading & Error States

### Initial Load
- Spinner centered
- Falls back to cached/mock data if available

### Search/Filter
- Debounced 400ms
- Loading state on list (subtle)

### Bookmark/Rating
- Optimistic updates
- Silent failure with revert (no error banner)

### Download/Preview
- Shows loader on button
- Error banner with retry

### API Errors
- General error banner with retry button
- Specific error messages
- Graceful degradation (show mock data)

---

## Future Enhancements

1. **Comments/Reviews** on materials
2. **Saved Materials** collection
3. **Recommendations** (ML-based)
4. **Upload Analytics** for creators
5. **Material Versions** (updated notes, etc.)
6. **Offline Preview** (downloaded materials)
7. **Bulk Download** (zip file)
8. **Material Collections** (curated by departments)

---

## Files

- **List page**: `app/dashboard/study/materials/page.tsx`
- **Detail page**: `app/dashboard/study/materials/[materialId]/page.tsx`
- **Upload page**: `app/dashboard/study/materials/upload/page.tsx`
- **API**: `lib/api/study.ts` (studyApi client)

