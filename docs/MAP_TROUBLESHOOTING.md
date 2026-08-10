# Map Management Troubleshooting Guide

## Problem: "Locations List tab not showing locations after JSON import"

### Root Causes Identified

1. **API Response Envelope Wrapping**
   - The backend may wrap responses in different envelope shapes:
     - Direct array: `[{...}, {...}]`
     - Envelope with data key: `{ data: [...] }`
     - Envelope with features key: `{ features: [...] }`
     - Success wrapper: `{ success: true, data: [...] }`
   
   - The original code only handled direct arrays with `Array.isArray(locs)`
   - Any nested/wrapped response would fall through to `[]` empty array

2. **Tab State Confusion**
   - After import succeeds, the code calls `loadSchoolData()` to refresh locations
   - But the user stays on the "import" tab and doesn't see the updated count
   - This creates confusion: "I imported but I don't see anything"

### Solutions Implemented

#### 1. Defensive Response Unwrapping

Added `extractArray()` helper that tries multiple common envelope keys:

```typescript
function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    // try common envelope keys
    for (const key of ["features", "entrances", "data", "items", "results", "locations"]) {
      if (Array.isArray(raw[key])) return raw[key];
    }
  }
  return [];
}
```

This handles all common response shapes from different backends.

#### 2. "View Locations" Button After Import

When import succeeds, show a green banner with:
- Success count: "✓ Import successful! 5 locations now on map."
- **"View Locations →"** button that switches to the Locations List tab

This provides immediate feedback and navigation.

#### 3. Enhanced Empty State with Troubleshooting

When Locations List shows zero items:
- Friendly message explaining what to do
- Inline **Refresh** button to retry the API call
- Collapsible **troubleshooting guide** with:
  - How to check Network tab in DevTools
  - Expected vs actual response shapes
  - Common mistakes (latitude/longitude as strings not numbers)

#### 4. Live Status Indicators

- **Interactive Map tab**: Shows pin count badge with pulsing dot
- **Locations List tab header**: Shows count + inline refresh button
- Import success banner shows the updated total count immediately

---

## How to Verify Your Import Worked

### Method 1: Visual Check (Fastest)
1. After import, look at the success banner
2. Click **"View Locations →"** button
3. You should see your locations listed with expand/collapse cards

### Method 2: Interactive Map
1. Go to **Interactive Map** tab
2. Look at the top-right badge showing location count
3. Green pins on the map = saved locations with coordinates

### Method 3: API Direct Check
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click Refresh on any tab
4. Look for request to `/super-admin/map/schools/{schoolId}/features`
5. Check the **Response** — you should see your JSON there

---

## Common Issues & Fixes

### Issue: "Import succeeds but Locations List shows 0"

**Diagnosis:**
- Your JSON may have missing or invalid `latitude`/`longitude` fields
- Or the API response shape changed

**Fix:**
1. Click the **Refresh** button in Locations List tab header
2. If still empty, expand the "🔍 Troubleshoot" section
3. Check the Network tab as described
4. Verify your JSON has numeric coords:
   ```json
   {
     "name": "Library",
     "latitude": 7.3775,      // ✓ number, not string
     "longitude": 4.5399,
     "category": "LIBRARY"
   }
   ```

### Issue: "Pins don't show on the map"

**Diagnosis:**
- Locations were saved but have no valid coordinates
- Or coordinates are far from the default map center

**Fix:**
1. Check **Locations List** tab — expand each item to see coords
2. If coords are missing, locations won't appear on map
3. If coords are present but pins don't show:
   - Zoom out on the map
   - Or scroll/drag to the expected area
   - The map defaults to Nigeria center (7.3775, 4.5399)

### Issue: "After import, nothing happens"

**Diagnosis:**
- Import actually failed but error was swallowed
- Or JSON was malformed

**Fix:**
1. Look for a red error banner below the import form
2. Check browser Console for errors
3. Common JSON mistakes:
   - Missing commas between objects
   - Trailing commas (not valid JSON)
   - Using single quotes instead of double quotes
   - Missing brackets `[` `]` around the array

---

## Valid Import JSON Format

### Minimal Example
```json
[
  {
    "name": "Main Library",
    "latitude": 7.3775,
    "longitude": 4.5399
  }
]
```

### Full Example with All Fields
```json
[
  {
    "name": "Main Library",
    "category": "LIBRARY",
    "type": "LIBRARY",
    "description": "Central campus library building",
    "latitude": 7.3775,
    "longitude": 4.5399,
    "tags": ["campus", "academics", "quiet-zone"]
  },
  {
    "name": "Student Hostel A",
    "category": "HOSTEL",
    "type": "HOSTEL",
    "latitude": 7.3780,
    "longitude": 4.5405
  }
]
```

### Required Fields
- `name` (string)
- `latitude` (number, not string)
- `longitude` (number, not string)

### Optional Fields
- `category` or `type` (string) — one of: BUILDING, HOSTEL, LIBRARY, CAFETERIA, LAB, CLINIC, SPORTS, GATE, PARKING, OFFICE, LECTURE_HALL, OTHER
- `description` (string)
- `tags` (array of strings)

---

## Backend API Contract

If you're building/debugging the backend, here's what the frontend expects:

### GET `/super-admin/map/schools/:schoolId/features`

**Expected response shapes (any of these work):**

Option 1: Direct array
```json
[
  { "id": "...", "name": "...", "latitude": 7.3775, "longitude": 4.5399 }
]
```

Option 2: Envelope with `data` key
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "...", "latitude": 7.3775, "longitude": 4.5399 }
  ]
}
```

Option 3: Envelope with `features` key
```json
{
  "success": true,
  "features": [
    { "id": "...", "name": "...", "latitude": 7.3775, "longitude": 4.5399 }
  ]
}
```

**Any of the keys checked:** `features`, `entrances`, `data`, `items`, `results`, `locations`

### POST `/super-admin/map/schools/:schoolId/import`

**Request body:**
```json
{
  "features": [
    { "name": "...", "latitude": 7.3775, "longitude": 4.5399 }
  ]
}
```

**Response:** Can return `{ success: true }` or empty 204. The frontend refetches via GET after import.

---

## UI/UX Improvements Made

1. ✅ Status indicator with live pin count
2. ✅ "View Locations →" button after successful import
3. ✅ Inline Refresh button in Locations List header
4. ✅ Empty state with helpful messaging
5. ✅ Collapsible troubleshooting guide in empty state
6. ✅ Format guide callout in import tab
7. ✅ Better import placeholder with multi-object example
8. ✅ Pulsing green dot on location count badges
9. ✅ Clear button for import textarea
10. ✅ Defensive API response unwrapping

---

## Developer Notes

### Code Location
- **Main page:** `app/super-admin/map/page.tsx`
- **Interactive map component:** `components/super-admin/InteractiveMapPicker.tsx`
- **Admin API client:** `lib/api/admin.ts`
- **Base API wrapper:** `lib/api/base.ts`

### Key Functions
- `loadSchoolData()` — fetches locations + entrances for selected school
- `handleImport()` — imports JSON, then calls loadSchoolData
- `extractArray()` — defensively unwraps API response envelopes

### Testing Checklist
- [ ] Import valid JSON → see success banner with count
- [ ] Click "View Locations →" → see list of locations
- [ ] Click Refresh on Locations List → data reloads
- [ ] Check Interactive Map → green pins appear at coords
- [ ] Expand location in list → see description, coords, image upload button
- [ ] Import JSON with string coords → see error or no pins (expected)
- [ ] Re-select school → data refreshes automatically
