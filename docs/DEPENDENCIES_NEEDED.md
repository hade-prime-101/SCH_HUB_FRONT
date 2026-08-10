# Dependencies Needed for Phase 2

## Issue
Phase 2 components require `zustand` for state management, but it's not installed.

## Solution

Run this command to install the required dependency:

```bash
npm install zustand
```

## What Was Used from Phase 1
The following already exist from Phase 1 (no need to install):
- ✅ `maplibre-gl` (v4.7.1) — already in package.json
- ✅ `lucide-react` — already in package.json
- ✅ `next` (v16.2.9) — already in package.json
- ✅ `react` (v19.2.4) — already in package.json

## What's Missing (Phase 2)
- ❌ `zustand` — State management (NOT in package.json)

## Why Zustand?
- Lightweight (~2KB gzipped)
- No boilerplate
- Perfect for modular state slices
- Better DX than Context + useReducer
- Already used in Phase 1 store

## After Installing
1. Run: `npm install zustand`
2. Run: `npm run build` to verify compilation
3. Deploy or test locally

## Verification
After installing, you should be able to:
```bash
npm run build   # ✅ Should succeed
```

If build fails, check:
1. `zustand` is in `node_modules`
2. `lib/map/state/store.ts` can import `from 'zustand'`
3. No TypeScript errors in MapContainer/MapCanvas

## Note
All Phase 1 work (types, services, normalizers, state structure) is complete.
Phase 2 just needs Zustand installed to compile successfully.
