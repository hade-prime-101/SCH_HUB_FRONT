# Feature Token Migration Guide

**Status:** Ready for Implementation  
**Date:** August 13, 2026  
**Scope:** Replace 200+ inline Tailwind color classes with semantic feature tokens

---

## Token Mapping Reference

### 1. Feature Category Tokens (Existing in globals.css)

These tokens represent the feature visual identity:

| Feature | Primary Token | Background Token | Use Case |
|---------|---------------|-----------------|----------|
| **Timetable** | `text-category-timetable` / `text-[color-category-timetable]` | `bg-category-timetable-bg` / `bg-[color-category-timetable-bg]` | Schedule, sessions |
| **Community** | `text-category-community` / `text-[color-category-community]` | `bg-category-community-bg` / `bg-[color-category-community-bg]` | Posts, discussions (same as timetable) |
| **Planner** | `text-category-planner` / `text-[color-category-planner]` | `bg-category-planner-bg` / `bg-[color-category-planner-bg]` | Tasks, planning |
| **Quizzes** | `text-category-planner` | `bg-category-planner-bg` | Educational assessments |
| **Events** | `text-category-events` / `text-[color-category-events]` | `bg-category-events-bg` / `bg-[color-category-events-bg]` | Campus events, tickets |
| **Campus Map** | `text-category-campus` / `text-[color-category-campus]` | `bg-category-campus-bg` / `bg-[color-category-campus-bg]` | Map features, routes |
| **AI Tools** | `text-category-ai` / `text-[color-category-ai]` | `bg-category-ai-bg` / `bg-[color-category-ai-bg]` | AI summaries, assistants |
| **Marketplace** | `text-category-marketplace` / `text-[color-category-marketplace]` | `bg-category-marketplace-bg` / `bg-[color-category-marketplace-bg]` | Products, jobs, services |
| **Emergency** | `text-category-emergency` / `text-[color-category-emergency]` | `bg-category-emergency-bg` / `bg-[color-category-emergency-bg]` | Alerts, critical info |

### 2. Semantic State Tokens (Existing in globals.css)

| State | Text Token | Background Token | Use Case |
|-------|-----------|-----------------|----------|
| **Success** | `text-success` | `bg-[color-success]` | Approval, completion, valid |
| **Warning** | `text-warning` | `bg-[color-warning]` | Pending, draft, caution |
| **Error** | `text-destructive` / `text-error` | `bg-destructive` | Errors, rejections, invalid |
| **Info** | `text-info` | `bg-[color-info]` | Information, neutral alerts |
| **Muted** | `text-muted-foreground` | `bg-muted` | Disabled, secondary, subtle |
| **Primary** | `text-primary-foreground` | `bg-primary` | Primary actions, accents |

### 3. Inline Class to Token Mapping

#### A. Primary Action Buttons

| Old Inline | New Token Class | Context |
|-----------|-----------------|---------|
| `bg-blue-600 text-white` | `bg-primary text-primary-foreground` | Primary buttons (Create, Save, etc.) |
| `bg-green-600 text-white` | `bg-success text-white` | Success/approval buttons |
| `bg-red-600 text-white` | `bg-destructive text-white` | Destructive/delete buttons |

#### B. Accent/Badge Backgrounds (Light variant)

| Old Inline | New Token Class | Feature | Context |
|-----------|-----------------|---------|---------|
| `bg-blue-100 text-blue-700` | `bg-category-timetable-bg text-category-timetable` | Timetable | Quick links, accents |
| `bg-blue-100 text-blue-600` | `bg-category-timetable-bg text-category-timetable` | Timetable/Nav | Active nav, badges |
| `bg-violet-100 text-violet-700` | `bg-category-planner-bg text-category-planner` | Planner | Badges, accents |
| `bg-amber-100 text-amber-700` | `bg-warning text-warning` | Warning/pending | Status badges |
| `bg-emerald-100 text-emerald-700` | `bg-success text-success` | Success/active | Status badges |
| `bg-pink-100 text-pink-700` | `bg-category-ai-bg text-category-ai` | AI Tools | Feature accent |
| `bg-orange-100 text-orange-700` | `bg-category-marketplace-bg text-category-marketplace` | Marketplace | Feature accent |
| `bg-sky-100 text-sky-600` | `bg-category-campus-bg text-category-campus` | Campus Map | Feature accent |
| `bg-red-100 text-red-700` | `bg-destructive/10 text-destructive` | Error/alert | Error containers |
| `bg-indigo-100 text-indigo-700` | `bg-primary/10 text-primary` | Study/primary | Feature accent |

#### C. Error/Alert Containers

| Old Inline | New Token Class | Context |
|-----------|-----------------|---------|
| `bg-red-50 border border-red-200` | `bg-destructive/5 border border-destructive/20` | Error alert boxes |
| `bg-red-50 border-red-200 text-red-700` | `bg-destructive/5 border-destructive/20 text-destructive` | Error messages |
| `bg-yellow-50` | `bg-warning/5` | Warning/info boxes |
| `bg-amber-50 border border-amber-200 text-amber-700` | `bg-warning/5 border-warning/20 text-warning` | Pending/draft notices |
| `bg-green-50` | `bg-success/5` | Success result containers |

#### C. Loading Spinners

| Old Inline | New Token Class | Context |
|-----------|-----------------|---------|
| `border-4 border-blue-200 border-t-blue-600` | `border-4 border-primary/30 border-t-primary` | Loading spinner |
| `border-2 border-red-300 border-t-red-600` | `border-2 border-destructive/50 border-t-destructive` | Loading spinner (error state) |

#### D. Text Links & Actions

| Old Inline | New Token Class | Context |
|-----------|-----------------|---------|
| `text-blue-600` | `text-primary` | Links, secondary actions |
| `text-red-600` | `text-destructive` | Destructive links (delete, revoke) |
| `text-green-600` | `text-success` | Success links (accept, approve) |
| `text-yellow-600` | `text-warning` | Warning links |

#### E. Category Badges (Marketplace)

| Old Inline | New Token Class | Category | Context |
|-----------|-----------------|----------|---------|
| `bg-blue-100 text-blue-700` | `bg-[color-chart-1]/10 text-[color-chart-1]` | Books | Marketplace category |
| `bg-violet-100 text-violet-700` | `bg-[color-chart-2]/10 text-[color-chart-2]` | Electronics | Marketplace category |
| `bg-pink-100 text-pink-700` | `bg-category-ai-bg text-category-ai` | Clothing | Marketplace category |
| `bg-amber-100 text-amber-700` | `bg-warning text-warning` | Food | Marketplace category |
| `bg-orange-100 text-orange-700` | `bg-category-marketplace-bg text-category-marketplace` | Furniture | Marketplace category |
| `bg-indigo-100 text-indigo-700` | `bg-primary/10 text-primary` | Handouts | Marketplace category |
| `bg-emerald-100 text-emerald-700` | `bg-success text-success` | Services | Marketplace category |

#### F. Status Badges & Indicators

| Old Inline | New Semantic | Context |
|-----------|--------------|---------|
| `bg-amber-100 text-amber-700` | `bg-warning/10 text-warning` | Draft, Pending |
| `bg-emerald-100 text-emerald-700` | `bg-success/10 text-success` | Active, Available, Approved |
| `bg-red-100 text-red-700` | `bg-destructive/10 text-destructive` | Error, Rejected |
| `bg-blue-50 border-blue-200` | `bg-primary/5 border-primary/20` | Highlight, Unread |

---

## Migration Strategy

### Phase 1: Quick Links & Feature Accents (Dashboard)
Replace all feature-specific quick link colors with category tokens

### Phase 2: Status Badges
Replace all status badge colors (pending, approved, active, error) with semantic tokens

### Phase 3: Buttons & Actions
Replace button colors with semantic action tokens

### Phase 4: Error/Alert Containers
Replace alert box colors with semantic error/warning tokens

### Phase 5: Links & Text Colors
Replace text color classes with semantic tokens

### Phase 6: Spinners & Loading States
Replace loading spinner colors with semantic tokens

---

## Token Class Syntax

Loopz uses Tailwind CSS with custom CSS variables. Access tokens via:

### Option 1: Direct CSS Variables (Preferred for unique colors)
```tsx
className="bg-[var(--category-timetable-bg)] text-[var(--category-timetable)]"
```

### Option 2: Arbitrary Values (For opacity variants)
```tsx
className="bg-[color-category-ai/10] text-category-ai"
```

### Option 3: Tailwind Config Classes (If configured)
```tsx
className="bg-category-timetable text-category-timetable"
```

**Recommendation:** Use arbitrary values with `/` opacity where possible for consistency with existing codebase patterns.

---

## Implementation Rules

1. **Preserve Semantic Meaning** - Don't lose the original intent
   - Blue buttons stay prominent (use `bg-primary`)
   - Red stays destructive (use `bg-destructive`)
   - Green stays success (use `bg-success`)

2. **Preserve Feature Identity**
   - Timetable blue → `bg-category-timetable-bg text-category-timetable`
   - Marketplace orange → `bg-category-marketplace-bg text-category-marketplace`
   - Emergency red → `bg-category-emergency-bg text-category-emergency`

3. **Preserve Visual Hierarchy**
   - Saturated colors for primary actions → `bg-primary`
   - Light tints for accents → `bg-[color-category-*/10]` or `-bg` variants
   - Disabled/muted → `bg-muted text-muted-foreground`

4. **Use Opacity for Variants** instead of separate color shades
   - Instead of: `bg-blue-50 border border-blue-200`
   - Use: `bg-primary/5 border-primary/20`

5. **Keep Loading Spinners Semantic**
   - Active loading: `border-t-primary` (indigo)
   - Error loading: `border-t-destructive` (red)

---

## Files to Migrate (Priority Order)

### High Impact (Most instances)
1. `app/dashboard/page.tsx` - 9 quick links, notices (9 classes)
2. `app/admin/stats/page.tsx` - 5 stat cards (5 classes)
3. `app/admin/marketplace/page.tsx` - 12 category badges + shortcuts (12 classes)
4. `app/dashboard/study-groups/[id]/page.tsx` - 12 buttons + links (12 classes)
5. `app/dashboard/study-groups/layout.tsx` - Nav links (2 classes)

### Medium Impact (5-10 instances each)
- Dashboard study section (2 cards)
- Dashboard notifications (5 instances)
- Admin school events (6 instances)
- Super-admin layout (2 nav links)
- Study materials/quizzes/summaries (5-8 instances each)

### Low Impact (1-4 instances each)
- Individual page buttons
- Small badge components
- Text color overrides

---

## Testing After Migration

1. ✅ All feature quick links display correct colors
2. ✅ All status badges show correct state colors
3. ✅ All buttons maintain semantic meaning
4. ✅ Dark mode works correctly
5. ✅ No broken color references
6. ✅ Hover/active states still work

---

## Rollback Plan

All changes use standard Tailwind classes and CSS variables defined in globals.css.
Simply revert the JSX changes - no build config changes needed.

---

## Notes

- **No new CSS tokens needed** - all required tokens already exist
- **No build changes needed** - uses existing Tailwind setup
- **Light/dark mode automatic** - tokens update via CSS variable overrides
- **TypeScript safe** - className strings, no type issues
- **No runtime impact** - compile-time class transformation
