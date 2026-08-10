I understand. You need a comprehensive audit and rebuild plan for the campus map. Let me systematically inspect the existing system before proposing architecture.I'll systematically explore the campus map implementation to understand the existing architecture, APIs, data structures, and components. Let me start by examining the current map pages and searching for related infrastructure.Let me continue searching for more details about the API structure, admin dashboard, and component architecture.Let me search for the main map page and super-admin map management, plus identify the component libraries and design system.Let me continue gathering critical information about the components, types, and configuration files.Let me gather the final pieces: the API base configuration and type definitions.Perfect! I have gathered comprehensive information about the campus map implementation. Let me compile this into a well-structured response.Perfect. Now I have the complete picture. Let me create a comprehensive audit and rebuild plan.Now I'll provide a comprehensive analysis and rebuild plan:

---

## COMPREHENSIVE CAMPUS MAP AUDIT & REBUILD PLAN

### PART 1: EXISTING SYSTEM ANALYSIS

#### ✅ **What Works Well**

1. **API layer is solid**
   - Clean separation: `schoolApi`, `campusMapApi`, `adminApi`
   - Endpoints exist for all core operations: features, search, nearest, categories, routing
   - Proper auth (Bearer token, refresh logic, cookie sync)
   - Smart response envelope unwrapping

2. **Data normalization exists**
   - Defensive functions handle 3 different response shapes (GeoJSON Feature, flat search result, flat nearest)
   - Client-side Haversine fallback for distance calculation
   - Robust coordinate extraction from Point or Polygon (via centroid)

3. **Admin system works**
   - Super-admin map management is comprehensive
   - Interactive Leaflet-based picker (SSR-disabled)
   - GeoJSON bulk import with validation
   - Image upload pipeline
   - Entrance management

4. **Modern tech stack**
   - MapLibre GL for 3D rendering (with OSM fallback)
   - MapTiler integration for vector tiles
   - Proper lazy-loading and SSR handling
   - Dark mode support

#### ⚠️ **What Needs Attention**

1. **Scattering of concerns**
   - `page.tsx` does too much: state management, data loading, normalization, UI rendering
   - API clients in `planner.ts` and `school.ts` — split responsibility unclear
   - Normalization logic embedded in components, not extracted

2. **No dedicated map data service layer**
   - Raw API calls scattered throughout
   - Normalization happens inline
   - No caching or deduplication
   - No single source of truth for data transformations

3. **Limited visual hierarchy**
   - Pin system is simple (colored circles)
   - No road/pathway layer styling (mentioned as "gradient placeholder")
   - Building selection barely visible
   - Entrance visibility not distinct enough
   - Label rendering not zoom-aware

4. **Navigation incomplete**
   - Route calculation works (POST `/campus-map/route`)
   - But navigation UI not implemented (`navigate` page referenced but not shown)
   - No live progress tracking during walk
   - No entrance selection UX

5. **Category system hardcoded**
   - 16 location types hardcoded in `TYPE_META`
   - No category configuration file
   - Adding new type requires code change
   - Color/icon mapping brittle

6. **Entrance handling basic**
   - Single list of entrances per building
   - No priority system (main vs. side vs. accessible)
   - No "nearest entrance" logic
   - Fallback to tags is a workaround, not a solution

7. **Search limited**
   - Only searches by name + distance
   - No suggestion/autocomplete
   - No category-aware ranking
   - No recent searches
   - No aliasing (e.g., "Main Hall" = "Main Building")

8. **Mobile UX not optimized**
   - No gesture support (swipe, pinch)
   - Bottom sheet exists but basic
   - No "follow me" mode
   - Floating controls not grouped

9. **Performance not measured**
   - No layer culling by zoom level
   - All locations loaded immediately
   - No pagination or lazy-loading
   - Map re-created on state changes (risk)

10. **Types are scattered**
    - No centralized type definitions
    - Duplicated interfaces across files
    - No type safety for API responses
    - LocationType union only in one file

---

### PART 2: PROPOSED STUDENT MAP ARCHITECTURE

```
Student Dashboard
    ↓
┌─────────────────────────────────────────┐
│         Map Route Handler                │
│     app/dashboard/map/page.tsx           │
│     app/dashboard/map/[id]/page.tsx      │
│     app/dashboard/map/navigate/page.tsx  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      Map UI Layer (React)                │
│  ┌──────────────────────────────────┐   │
│  │ MapContainer (Orchestration)     │   │
│  │ ├─ MapHeader (Search/Filter)     │   │
│  │ ├─ MapCanvas (MapLibre GL)       │   │
│  │ ├─ LocationPanel (Details)       │   │
│  │ ├─ NavigationPanel (Routes)      │   │
│  │ └─ FloatingControls (Actions)    │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│     Map State Layer (Zustand/Context)    │
│  ├─ mapState (center, zoom, pitch)      │
│  ├─ locationsState (features, filter)   │
│  ├─ uiState (selected, mode, panels)    │
│  ├─ routeState (current route, nav)     │
│  ├─ userState (location, tracking)      │
│  └─ configState (categories, settings)  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      Map Data Service Layer              │
│  ├─ MapLocationService                  │
│  ├─ MapEntranceService                  │
│  ├─ MapCategoryService                  │
│  ├─ MapRoutingService                   │
│  ├─ MapSearchService                    │
│  └─ MapConfigService                    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    Data Normalization Layer              │
│  ├─ normalizeLocation()                 │
│  ├─ normalizeEntrance()                 │
│  ├─ normalizeRoute()                    │
│  ├─ normalizeSearchResult()             │
│  └─ normalizeResponse()                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    API Client Layer                      │
│  ├─ campusMapApi (planner.ts)           │
│  ├─ schoolApi (school.ts)               │
│  └─ apiFetch (base.ts)                  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    Backend API                           │
│  ├─ /campus-map/features                │
│  ├─ /campus-map/search                  │
│  ├─ /campus-map/nearest                 │
│  ├─ /campus-map/categories              │
│  ├─ /campus-map/route                   │
│  └─ /school/map-config                  │
└─────────────────────────────────────────┘
```

---

### PART 3: COMPONENT STRUCTURE

**Directory Layout:**
```
src/
├─ app/dashboard/map/
│  ├─ page.tsx                 (Main map page)
│  ├─ layout.tsx               (Map layout wrapper)
│  ├─ [locationId]/page.tsx    (Location detail)
│  └─ navigate/
│     └─ page.tsx              (Live navigation)
│
├─ components/dashboard/map/
│  ├─ MapContainer.tsx         (Orchestration wrapper)
│  ├─ MapCanvas.tsx            (MapLibre GL wrapper)
│  ├─ MapHeader.tsx            (Search + filter bar)
│  ├─ LocationPanel.tsx        (Details + entrances)
│  ├─ NavigationPanel.tsx      (Route + live nav)
│  ├─ FloatingControls.tsx     (Follow, recenter, etc)
│  ├─ MapLayers.tsx            (Style/layer config)
│  └─ MapMarkers.tsx           (Pin rendering)
│
├─ lib/map/
│  ├─ services/
│  │  ├─ MapLocationService.ts
│  │  ├─ MapEntranceService.ts
│  │  ├─ MapCategoryService.ts
│  │  ├─ MapRoutingService.ts
│  │  ├─ MapSearchService.ts
│  │  └─ MapConfigService.ts
│  │
│  ├─ normalizers/
│  │  ├─ locationNormalizer.ts
│  │  ├─ entranceNormalizer.ts
│  │  ├─ routeNormalizer.ts
│  │  ├─ searchResultNormalizer.ts
│  │  └─ responseNormalizer.ts
│  │
│  ├─ state/
│  │  ├─ mapStore.ts           (Zustand store)
│  │  ├─ mapSlice.ts
│  │  ├─ locationsSlice.ts
│  │  ├─ routeSlice.ts
│  │  ├─ uiSlice.ts
│  │  └─ userSlice.ts
│  │
│  ├─ config/
│  │  ├─ categories.ts         (Category definitions)
│  │  ├─ colors.ts             (Type → color mapping)
│  │  ├─ icons.ts              (Type → icon mapping)
│  │  └─ styles.ts             (MapLibre layer styles)
│  │
│  ├─ types/
│  │  ├─ location.ts
│  │  ├─ entrance.ts
│  │  ├─ route.ts
│  │  ├─ map.ts
│  │  └─ geojson.ts
│  │
│  └─ utils/
│     ├─ distance.ts           (Haversine, etc)
│     ├─ bounds.ts             (Bbox calculations)
│     ├─ geometry.ts           (GeoJSON helpers)
│     └─ cache.ts              (Request dedup)
```

---

### PART 4: STATE MANAGEMENT

**Use Zustand** (lightweight, efficient) instead of scattered useState:

```typescript
// lib/map/state/mapStore.ts
interface MapState {
  // Map view state
  map: { center: [lng, lat]; zoom: number; pitch: number; bearing: number };
  
  // Locations state
  locations: Location[];
  filteredLocations: Location[];
  selectedLocation: Location | null;
  selectedEntrance: Entrance | null;
  
  // Route state
  currentRoute: Route | null;
  routeProgress: number;
  isNavigating: boolean;
  navigationMode: 'overview' | 'turn-by-turn' | 'live';
  
  // UI state
  searchQuery: string;
  activeFilter: string;
  viewMode: 'map' | 'list';
  showLocationPanel: boolean;
  showNavigationPanel: boolean;
  
  // User state
  userLocation: { lat: number; lng: number } | null;
  userLocationAccuracy: number | null;
  isFollowingUser: boolean;
  locationPermission: 'unknown' | 'prompt' | 'granted' | 'denied';
  
  // Config state
  categories: Category[];
  mapConfig: MapConfig;
  
  // Loading/error state
  isLoading: boolean;
  error: string | null;
  
  // Actions...
}
```

---

### PART 5: DATA FLOW STRUCTURE

**Example: Search Flow**

```
User types "library"
  ↓
searchQuery state update
  ↓
350ms debounce
  ↓
MapSearchService.search({query, category, userLocation})
  ↓
campusMapApi.search() [GET /campus-map/search]
  ↓
Raw API response (flat array + centroid)
  ↓
searchResultNormalizer.normalize(rawResult)
  ↓
Normalized Location[] (with coordinates, images, type)
  ↓
filteredLocations state update
  ↓
MapCanvas layer update
  ↓
Pins render on map
```

---

### PART 6: MAP LAYER STRUCTURE (MapLibre)

**Layering Strategy (bottom to top):**

```
1. Base Tiles (MapTiler or OSM)
2. Roads & Pathways (custom style)
   - Roads: warm amber/yellow with glow
   - Pathways: lighter, less prominent
3. Water & Terrain (from base style)
4. 3D Buildings (extrusion, MapTiler only)
   - Base color: neutral gray
   - Selected building: brighter, highlighted
5. Campus Zones (optional, fill overlay)
6. POI Clustering (at lower zoom, before zoom 14)
7. Individual POI Pins (at zoom 14+)
   - Colors per category
   - Size: 24px normal, 36px selected
8. Selected Building Outline (if polygon)
9. Route Polyline (dashed indigo + white casing)
10. User Location Dot (blue circle with ring)
11. Entrances (small glowing markers, distinct from POIs)
12. Labels (place names, building names, zoom-aware)
13. UI Controls (zoom, compass, attribution)
```

---

### PART 7: VISUAL DESIGN SYSTEM

**Roads & Pathways:**
- Roads: `#f59e0b` (amber-500) with 2-3px width + `0 0 4px rgba(245,158,11,0.6)` glow
- Pathways: `#cbd5e1` (slate-300) with 1.5px width, less prominent
- Layered white casing beneath for contrast

**Buildings:**
- Default: Light fill `#e2e8f0` (slate-200) + `#94a3b8` (slate-400) stroke
- 3D extrusion: Auto from MapTiler data
- Selected: Brighter fill `#fbbf24` (amber-400) + bold stroke
- Hover: Slight opacity change

**Locations (POI Pins):**
- **Per-type SVG circles** (not marker icons — simpler, faster)
- LIBRARY: `#0ea5e9` (sky-500)
- BUILDING: `#6366f1` (indigo-500)
- HOSTEL: `#10b981` (emerald-500)
- CAFETERIA: `#f59e0b` (amber-500)
- CLINIC: `#f43f5e` (rose-500)
- ...etc (see TYPE_META in current code)
- Normal: 24px, Selected: 36px with drop shadow
- Hover state: scale 1.2, slight glow

**Entrances:**
- Small glowing markers: 14px base size
- Icon: door/entrance symbol
- Color: Distinct from POIs (e.g., `#8b5cf6` purple)
- Main entrance: Filled, highlighted
- Accessible entrance: Green tint or symbol indicator

**Routes:**
- Polyline: `#6366f1` (indigo-500), 5px width
- Casing: `#ffffff` (white), 9px width underneath
- Dash pattern: [2, 1.5] for subtle animation feel
- Glow: Optional `0 0 8px rgba(99,102,241,0.5)`
- Destination marker: Flag icon at endpoint

**User Location:**
- Dot: 18px diameter, `#6366f1` (indigo-500)
- Border: 3px white
- Halo: `0 0 0 4px rgba(99,102,241,0.3)`
- Accuracy circle: Optional faint ring at accuracy radius

**Labels:**
- Building names: Display at zoom 15+
- Street/pathway names: Display at zoom 16+
- POI names: Display at zoom 14+, prioritize selected
- Font: Inherit from dashboard (system font)
- Color: `#1f2937` (gray-800) light mode, `#f3f4f6` (gray-100) dark mode

---

### PART 8: BUILDING INTERACTION FLOW

```
1. DISPLAY
   - Building renders as polygon or pin
   - Color: default neutral
   
2. HOVER
   - Fill brightens slightly
   - Outline becomes visible
   - Cursor changes to pointer
   
3. CLICK
   - Building highlights (brighter fill + bold outline)
   - setSelectedLocation(building)
   
4. LOCATION PANEL OPENS
   - Shows: name, type badge, description, image
   - Lists available entrances
   - "View entrance" or "Navigate" CTA
   
5. USER SELECTS ENTRANCE
   - setSelectedEntrance(entrance)
   - Entrance marker highlights on map
   - "Get directions" CTA updates
   
6. GET DIRECTIONS
   - Call MapRoutingService.getRoute(userLocation → entrance)
   - Route renders as polyline
   - Navigate to /dashboard/map/navigate page
   - Live navigation begins
```

---

### PART 9: ENTRANCE SYSTEM

**Data Structure:**
```typescript
interface Entrance {
  id: string;
  buildingId?: string;  // Implicit or explicit relationship
  name: string;
  tag?: 'MAIN' | 'SIDE' | 'SERVICE' | 'ACCESSIBLE';
  isAccessible?: boolean;
  latitude: number;
  longitude: number;
  description?: string;
  metadata?: {
    openingHours?: string;
    accessible?: { wheelchair?: boolean; visual?: boolean; hearing?: boolean };
  };
}
```

**Frontend Logic:**
- If building has explicit entrance relationship: use it
- If not: spatial fallback (find entrances within 50m of building)
- Always prefer backend relationship over frontend calculation
- Display entrance priority: MAIN → ACCESSIBLE → SIDE → SERVICE

---

### PART 10: SEARCH FLOW

```typescript
// MapSearchService
export interface SearchOptions {
  query: string;
  category?: string;
  userLocation?: { lat: number; lng: number };
  limit?: number;
  fuzzy?: boolean;
}

export async function search(options: SearchOptions): Promise<Location[]> {
  // Backend search: GET /campus-map/search?q=...&category=...&near=...
  // Returns: flat array with server-side ranking
  
  // Client-side post-processing:
  // 1. Normalize each result
  // 2. Calculate distance if not provided
  // 3. Boost score based on match type (name > description > tag)
  // 4. Return sorted by score
}
```

**Suggestions (phase 2):**
- Debounce search as user types
- Show top 5 results below input
- Category filter applies to suggestions
- Click suggestion → auto-search

---

### PART 11: EXISTING API VALIDATION

**What the backend ALREADY provides:**
- ✅ `/campus-map/features` — Browse all locations
- ✅ `/campus-map/search` — Full-text search
- ✅ `/campus-map/nearest` — Proximity search
- ✅ `/campus-map/categories` — Available categories
- ✅ `/campus-map/route` — Routing to destination
- ✅ `/campus-map/features/{id}/entrances` — Building entrances
- ✅ GPS support via browser geolocation API
- ✅ Images via feature.imageUrl

**What's NOT clearly documented (needs confirmation):**
- ❓ Building↔entrance explicit relationship (vs. spatial fallback)
- ❓ Entrance priority/type field structure
- ❓ Route progress tracking (POST `/campus-map/route/progress` exists but unclear payload)
- ❓ Accessibility info on entrances (does it exist in data?)
- ❓ Outdoor roads/pathways layer (separate layer type? or ROAD category?)
- ❓ Zoom-aware label visibility hints from backend
- ❓ POI clustering recommendations

---

### PART 12: MIGRATION & REBUILD PLAN

**Phase 1: Foundation (Week 1-2)**
1. Create type definitions in `lib/map/types/`
2. Extract normalization functions to `lib/map/normalizers/`
3. Create Zustand store in `lib/map/state/`
4. Create service layer in `lib/map/services/`
5. Create category/color config in `lib/map/config/`

**Phase 2: UI Components (Week 2-3)**
1. Extract MapHeader from page.tsx
2. Extract LocationPanel from bottom sheet
3. Create MapCanvas wrapper (thin MapLibre GL wrapper)
4. Create FloatingControls component
5. Create MapContainer orchestrator
6. Implement responsive mobile layout

**Phase 3: Map Rendering (Week 3-4)**
1. Enhance MapLibre layer styling (roads, pathways, buildings)
2. Implement proper building selection (outline + highlight)
3. Add entrance markers (distinct visual)
4. Implement route polyline rendering
5. Add user location dot + halo
6. Implement zoom-aware label visibility

**Phase 4: Interactions (Week 4-5)**
1. Building click → selection + panel open
2. Entrance selection flow
3. Map gesture support (swipe, pinch, long-press)
4. Hover states (building, entrance, POI)
5. Bottom sheet drag + dismiss
6. Follow me mode (camera tracking)

**Phase 5: Navigation (Week 5-6)**
1. Implement `/dashboard/map/navigate` page
2. Route progress tracking
3. Live turn-by-turn directions
4. Off-route detection
5. Route refresh
6. Exit navigation UI

**Phase 6: Search & Filter (Week 6-7)**
1. Enhanced search UI (suggestions, recent)
2. Category-aware filtering
3. Map layer toggle by category
4. Results pagination/lazy-load
5. Search result highlighting on map

**Phase 7: Polish & Performance (Week 7-8)**
1. Caching strategy (location data, search results)
2. Layer culling by zoom
3. Marker clustering at low zoom
4. Performance monitoring
5. Error boundary & fallback UI
6. Dark mode testing
7. Mobile device testing
8. Accessibility audit

---

### PART 13: WHAT TO KEEP VS. REPLACE

**KEEP:**
- ✅ API client architecture (`apiFetch`, auth handling)
- ✅ Existing endpoints (no backend changes needed)
- ✅ Admin dashboard (untouched)
- ✅ Tailwind + shadcn component patterns
- ✅ MapLibre GL (good choice for 3D)
- ✅ Dark mode support approach
- ✅ Dynamic imports for SSR safety

**REPLACE:**
- ❌ Monolithic `page.tsx` → split into services + components
- ❌ Inline normalization → dedicated normalizer functions
- ❌ useState scatter → Zustand store
- ❌ Simple pin circles → enhanced visual hierarchy
- ❌ Basic entrance list → smart entrance selection UI
- ❌ Static TYPE_META → configurable category system

---

### PART 14: RISK MITIGATION

1. **Map instance leaks** → Store ref safely, clean on unmount
2. **API response shape changes** → Defensive unwrapping + type guards
3. **GPS permissions** → Graceful degradation, banner UX
4. **Old browser support** → Polyfills for Promise, fetch (already in Next.js)
5. **Large campus data** → Implement clustering, pagination
6. **Entrance relationship missing** → Spatial fallback always available
7. **Navigation service unreliable** → Error boundary + retry UI

---

### PART 15: MISSING BACKEND CAPABILITIES TO IDENTIFY

**Before implementation, confirm with backend team:**

1. Do building records have explicit entrance relationships, or is spatial proximity the only way?
2. What structure do entrances have? Do they have `tag` or `type` field?
3. Does entrance data include accessibility metadata?
4. Are roads/pathways a separate layer, or just ROAD/PATH location types?
5. Does route progress tracking work? What's the expected payload/response format?
6. Are there any zoom-level hints for label visibility in the API?
7. For searching, does the API support fuzzy matching, or just exact/substring?
8. Can multiple images be stored per location (not just one imageUrl)?
9. Is there a categories endpoint or should we derive from the feature list?
10. What's the expected GeoJSON structure for multi-building complexes?

---

## RECOMMENDATION

**Start with Phase 1-2 (Types + Services + Components).** This creates the foundation without breaking the existing UI. Once the architecture is in place, UI refinement and advanced features become low-risk.

The rebuild preserves all working infrastructure (API, auth, admin system) while introducing:
- Clean separation of concerns
- Proper state management
- Enhanced UX (visual hierarchy, interactions, mobile optimization)
- Extensibility (easy to add indoor maps, real-time tracking, etc.)
- Testability (services + normalizers are pure functions)

Would you like me to start implementing Phase 1 (types + normalizers + services + store)?