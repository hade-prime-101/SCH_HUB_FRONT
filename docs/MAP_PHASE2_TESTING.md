# Campus Map Phase 2 - Testing Guide

## Overview
This document covers testing for the rebuilt campus map with new architecture (services, state management, UI components).

## Test Scenarios

### 1. Initial Load & Data Fetching

**Expected Behavior:**
- Page loads with spinner
- Map configuration loads (API keys, defaults)
- Locations load from `/campus-map/features`
- Categories load from `/campus-map/categories`
- Filter pills populate with available categories
- First location auto-selects (if it has coordinates)

**How to Test:**
1. Navigate to `/dashboard/map`
2. Observe loading spinner
3. Verify map appears with locations
4. Verify filter pills show available categories
5. Check browser console for any errors

**Regression Check:**
- ✓ Map page still accessible from dashboard
- ✓ Locations render without crashes
- ✓ No console errors

---

### 2. Search & Filtering

**Expected Behavior:**
- Search query debounces (300ms)
- Results filter by search term
- Category pills update results
- Distance shown (if user location available)
- Results sorted by proximity when user location is known

**How to Test:**
1. Type "library" in search bar
2. Observe debounce delay (~300ms)
3. Verify only library locations show
4. Click category filter (e.g., "Buildings")
5. Verify results update immediately
6. Click "All" to reset filter
7. Search for partial term (e.g., "caf")
8. Verify fuzzy matching works

**Regression Check:**
- ✓ Search results match old map
- ✓ Categories filter correctly
- ✓ Distance calculations accurate

---

### 3. Location Selection & Details

**Expected Behavior:**
- Click location marker or list item → LocationPanel opens
- Panel shows: name, type, distance, description, entrances, images
- Accessible entrances marked with ♿ icon
- Map animates to location (zoom level 17)
- Selection persists when toggling views

**How to Test:**
1. Click a location on map
2. Verify LocationPanel opens with details
3. Check all fields populate correctly
4. Verify images gallery displays (if available)
5. Check entrances list (if any)
6. Close panel by clicking X
7. Reopen same location
8. Verify state restored

**Regression Check:**
- ✓ Location details match previous implementation
- ✓ No missing metadata
- ✓ Images load correctly

---

### 4. Navigation (GPS & Directions)

**Expected Behavior:**
- First visit shows GPS permission modal
- "Navigate Here" button initiates navigation
- GPS tracking starts automatically
- Route calculates and shows on map (blue line)
- NavigationPanel shows turn-by-turn directions
- Current turn highlighted with large instruction
- Distance and ETA update as you move
- "Stop Navigation" returns to map view

**How to Test:**
1. Navigate to map
2. Observe permission modal (if first visit)
3. Grant location permission
4. Select a location
5. Click "Navigate Here"
6. Observe route line on map
7. Check NavigationPanel shows first turn
8. Verify distance/ETA display
9. Expand turn list (swipe up on mobile)
10. Click different turn to jump
11. Click "Stop Navigation"

**Regression Check:**
- ✓ Navigation doesn't crash
- ✓ Routes calculate correctly
- ✓ GPS updates are smooth

---

### 5. GPS Tracking & Permissions

**Expected Behavior:**
- First visit: modal prompts for permission
- Granted: user dot shows on map, FloatingControls available
- Denied: banner shows "Location blocked"
- Permission changes in browser → app updates automatically
- "Recenter" button animates to user location
- "Follow Mode" keeps user centered as they move
- Pulse animation on follow button when active

**How to Test:**
1. First visit: grant permission → modal closes
2. Observe user dot on map
3. Click "Recenter" → map animates to you
4. Click "Follow Mode" button → pulse starts
5. Move slightly → map follows
6. Click "Follow Mode" again → pulse stops
7. Deny permission → banner appears
8. Change permission in browser settings → app updates

**Regression Check:**
- ✓ Permission flow smooth
- ✓ GPS tracking responsive
- ✓ No battery drain (tracking off when not navigating)

---

### 6. Responsive Design

**Expected Behavior (Desktop >768px):**
- LocationPanel appears as right sidebar
- LocationPanel stays visible while browsing map
- Header search bar takes full width

**Expected Behavior (Mobile <768px):**
- LocationPanel appears as bottom sheet
- Can swipe/drag to resize
- Search bar stays compact
- FloatingControls easily accessible
- NavigationPanel takes full screen

**How to Test:**
1. Test on desktop (Chrome DevTools: Desktop view)
2. Verify LocationPanel on right
3. Verify both map and panel visible
4. Test on mobile (Chrome DevTools: iPhone/Pixel)
5. Verify LocationPanel at bottom
6. Verify can scroll panel content
7. Resize browser window to test breakpoint (768px)

**Regression Check:**
- ✓ Layout adapts correctly
- ✓ No overlapping elements
- ✓ Touch targets appropriately sized

---

### 7. Layer Management & Visibility

**Expected Behavior:**
- Map shows location markers (colored circles)
- Route shows as blue line when navigating
- User dot shows with accuracy circle
- Markers scale up when selected
- Labels visible at medium+ zoom levels
- Layer toggles in FloatingControls work

**How to Test:**
1. Zoom in/out → verify marker visibility changes
2. Select location → marker grows and changes color
3. Click "Layers" button → menu appears
4. Toggle "Labels" off → labels disappear
5. Toggle "Buildings" off → building layer hides
6. Toggle back on → verify restoration

**Regression Check:**
- ✓ Layers render without artifacts
- ✓ Performance acceptable when zoomed in
- ✓ No flickering or jank

---

### 8. Error Handling

**Expected Behavior:**
- Network error → error banner shows, user can retry
- Location not found → empty state message
- Permission denied gracefully → banner, no crashes
- Invalid route → error message, no hang
- Missing location data → falls back gracefully

**How to Test:**
1. Simulate network error: DevTools → Offline
2. Try search → error banner appears
3. DevTools → Online
4. Search again → works
5. Search for impossible location → "No locations found"
6. Enter invalid coordinates → graceful handling
7. Check console for errors

**Regression Check:**
- ✓ No unhandled errors
- ✓ User can recover from errors
- ✓ Error messages helpful

---

### 9. State Persistence & Navigation

**Expected Behavior:**
- Selected location persists when switching views
- Search query persists when filtering
- Map camera position maintained
- GPS position continuously updated
- Back button works correctly
- Route state cleared when leaving navigation

**How to Test:**
1. Select location → switch to navigation
2. Stop navigation → location still selected
3. Go back → map page loads with location selected
4. Perform search
5. Refresh page → search clears (by design)
6. Navigate to a location
7. Use browser back button → returns to map

**Regression Check:**
- ✓ State synced correctly
- ✓ No lost data on navigation
- ✓ Back button functional

---

### 10. Performance

**Expected Behavior:**
- Initial load: < 2 seconds to map visible
- Search: < 500ms to results
- Location selection: instant
- Navigation: smooth 60fps scrolling
- No memory leaks on component unmount

**How to Test:**
1. Chrome DevTools → Network tab
2. Load map page
3. Check Time to Interactive (< 3s target)
4. Check map rendering performance (60 FPS)
5. Open DevTools → Performance tab
6. Record page load
7. Check for jank/stuttering

**Regression Check:**
- ✓ Performance similar to old map
- ✓ No lag when selecting locations
- ✓ Smooth navigation experience

---

## Regression Tests Against Old Map

| Feature | Old Map | New Map | Status |
|---------|---------|---------|--------|
| Location display | ✓ | ✓ | |
| Search functionality | ✓ | ✓ | |
| Category filtering | ✓ | ✓ | |
| Entrance display | ✓ | ✓ | |
| Navigation directions | ✓ | ✓ | |
| GPS tracking | ✓ | ✓ | |
| Mobile responsive | ✓ | ✓ | |
| Error handling | ✓ | ✓ | |
| Accessibility | ✓ | ✓ | |

---

## Integration Test Checklist

### Happy Path: "Find Library and Navigate There"
- [ ] Load map page
- [ ] Grant GPS permission
- [ ] Search "library"
- [ ] Click first result
- [ ] Verify LocationPanel shows details
- [ ] Click "Navigate Here"
- [ ] Observe route on map
- [ ] Check turn-by-turn directions
- [ ] Stop navigation
- [ ] Return to map

### Edge Case: "Offline Search"
- [ ] Go offline
- [ ] Try search
- [ ] Verify error message
- [ ] Go online
- [ ] Search works again

### Edge Case: "Location Denied"
- [ ] Deny GPS permission
- [ ] Banner shows "Location blocked"
- [ ] FloatingControls hidden
- [ ] Can still search and view map
- [ ] Enable location in settings
- [ ] Banner disappears
- [ ] FloatingControls appear

### Regression: "Admin Dashboard Still Works"
- [ ] Navigate to `/admin/map`
- [ ] Admin controls still functional
- [ ] No crashes or errors

---

## Browser Compatibility

Test on:
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & iOS)
- [ ] Edge (Desktop)

---

## Accessibility Testing

- [ ] Keyboard navigation works (Tab through buttons)
- [ ] Screen reader announces locations
- [ ] Color contrast adequate (WCAG AA)
- [ ] Text sizes readable
- [ ] Touch targets ≥ 44px²

---

## Load Testing

- [ ] 100+ locations load without freeze
- [ ] Search with 50 results responsive
- [ ] Map smooth when panning/zooming
- [ ] No OOM (out of memory) errors

---

## Sign-off Checklist

- [ ] All test scenarios passed
- [ ] No new console errors
- [ ] Regression tests passed
- [ ] Performance acceptable
- [ ] Mobile experience smooth
- [ ] Admin map unaffected
- [ ] Ready for production

---

## Known Limitations

1. **Outdoor Only**: Indoor mapping not yet implemented
2. **Server Routes**: Route calculation depends on backend `/campus-map/route` endpoint
3. **MapLibre GL**: Requires modern browser (ES6 support)
4. **GPS Accuracy**: Depends on device capabilities (±5-50m typical)

---

## Debugging Tips

**Map not loading?**
- Check `/campus-map/features` endpoint
- Check API key in `/school/map-config`
- Check browser console for errors

**Search returns nothing?**
- Check `/campus-map/search` endpoint
- Verify location names in backend
- Try simpler search terms

**GPS not working?**
- Check permission state
- Allow location access in browser settings
- Ensure device has GPS/location enabled

**Route not calculating?**
- Check `/campus-map/route` endpoint
- Verify route service returns valid GeoJSON
- Check for backend errors in console

**Performance issues?**
- Check number of locations (100+ may be slow)
- Reduce layer complexity
- Check for memory leaks in DevTools
