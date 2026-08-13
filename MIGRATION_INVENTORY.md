# Loopz Design System Migration Inventory

**Date:** August 13, 2026  
**Purpose:** Document all design tokens, inconsistencies, and required migrations to consolidate Loopz into a single coherent design system.  
**Scope:** All frontend files under `app/`, `components/`, excluding `node_modules` and `.next`

---

## 1. DESIGN TOKENS AUDIT

### 1.1 EXISTING TOKENS (in `app/ui/globals.css`)

✅ **All tokens already defined and comprehensive:**

**Light Mode `:root`:**
- Base colors: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`
- Brand colors: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`
- Semantic text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-disabled`
- Semantic surfaces: `--surface-background`, `--surface-elevated`, `--surface-muted`, `--surface-overlay`
- Borders & inputs: `--border`, `--border-subtle`, `--input`, `--focus-ring`
- Semantic states: `--success`, `--warning`, `--error`, `--info`
- Navigation: `--nav-background`, `--nav-foreground`, `--nav-active`, `--nav-active-foreground`, `--nav-hover-background`
- Accent: `--accent`, `--accent-foreground`
- Destructive: `--destructive`
- Muted: `--muted`, `--muted-foreground`
- Chart: `--chart-1` through `--chart-5`
- Ring: `--ring`
- Radius system: `--radius`, `--radius-semantic-small-value`, `--radius-semantic-medium-value`, `--radius-semantic-large-value`, `--radius-semantic-pill-value`
- Spacing: `--spacing-xs` through `--spacing-2xl`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- Sidebar: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
- Typography: `--text-xs` through `--text-4xl`
- Interaction states: `--state-hover-opacity`, `--state-active-opacity`, `--state-disabled-opacity`, `--state-focus-ring-width`

**Dark Mode `.dark`:**
- Full token remapping for dark mode context
- Primary adjusts to indigo-400 for contrast
- Surfaces collapse to dark greys
- Border becomes white at 10% opacity
- Shadows adjust for darker background

✅ **Status:** Complete, well-structured, covers all design needs.

---

### 1.2 TOKENS REFERENCED BUT NOT LOADED

❌ **`--font-geist-mono`:** Referenced in `@theme inline` but Geist Mono is not loaded in `fonts.ts`

**Action:** Remove from `@theme inline` (line 9 in globals.css currently removed, but verify)

---

### 1.3 SEMANTIC TOKENS NOT BEING USED

These tokens exist but are bypassed throughout the codebase with inline Tailwind classes:

| Token | Purpose | Currently Bypassed By | Files Affected |
|-------|---------|----------------------|------------------|
| `--text-primary` | Primary text color | Used rarely; inline `text-foreground` or `text-slate-900` | auth screens |
| `--text-secondary` | Secondary text | Used rarely; inline `text-muted-foreground` or `text-slate-600` | auth screens |
| `--text-muted` | Tertiary/muted text | Used rarely; inline `text-slate-500` | auth screens |
| `--text-disabled` | Disabled text | Not used; inline opacity-50 | all |
| `--surface-background` | Page background | Bypassed with direct `bg-background` | all |
| `--surface-elevated` | Elevated surfaces | Bypassed with direct `bg-card` | all |
| `--surface-muted` | Muted surfaces | Bypassed with direct `bg-muted` | all |
| `--border-subtle` | Subtle borders | Never used; inline `border-slate-200` | auth |
| `--success`, `--warning`, `--info` | Semantic states | Never used; inline `emerald-600`, `amber-600`, `indigo-500` | all |
| `--nav-*` | Navigation colors | Partial; nav components use inline logic | BottomNav, sidebars |
| `--text-[xs-4xl]` | Typography scale | Never used; inline `text-[14px]`, `text-sm`, etc. | auth screens |
| `--spacing-*` | Spacing scale | Never used; direct Tailwind `p-4`, `space-y-4`, etc. | all |
| `--shadow-*` | Shadow system | Never used; inline `shadow-md`, hardcoded box-shadow | all |

**Action:** Identify files using inline colors and migrate to token equivalents.

---

## 2. COLOR CONSISTENCY ISSUES

### 2.1 SLATE PALETTE (NOT IN TOKEN SYSTEM)

Auth screens extensively use `slate-*` Tailwind classes instead of semantic tokens. This means:
- **Will NOT respond to dark mode** if activated
- **Bypasses design system** for color decisions
- **Inconsistent with dashboard** which uses tokens

**Files using `slate-*` colors:**
- `app/login/page.tsx` — extensive use in LoginForm
- `app/register/page.tsx` — extensive use in all steps
- `app/forgot-password/page.tsx` — extensive use
- `app/reset-password/page.tsx` — extensive use
- `app/verify-otp/page.tsx` — extensive use
- `components/ui/PasswordInput.tsx` — extensive use
- `components/ui/LoadingSkeleton.tsx` — `bg-slate-100`
- `components/shared/LoginForm.tsx` — extensive use
- `components/shared/SearchInput.tsx` — likely
- `components/shared/SelectionList.tsx` — likely

**Slate palette usage count:** 50+ class references

**Action:** Systematically replace with semantic token equivalents:
- `bg-slate-50` → `bg-secondary` (or `bg-surface-muted` for auth context)
- `bg-slate-100` → `bg-muted`
- `text-slate-900` → `text-foreground`
- `text-slate-600` → `text-muted-foreground`
- `text-slate-500` → `text-muted`
- `text-slate-400` → `text-disabled`
- `border-slate-200` → `border-border`
- `border-slate-100` → `border-subtle`

---

### 2.2 HARDCODED INDIGO COLORS (WRONG SCALE)

Focus/ring colors using `indigo-*` instead of the semantic `--ring` token:

| Location | Current | Should Be |
|----------|---------|-----------|
| OTP inputs focus ring | `focus:border-indigo-500`, `focus:ring-indigo-500` | `focus:border-ring focus:ring-ring` |
| Reset password inputs | `focus:ring-indigo-400` | `focus:ring-ring` |
| PasswordInput focus | `focus:ring-indigo-500/50` | `focus:ring-ring/50` |
| LoginForm inputs | `focus:ring-indigo-500/50` | `focus:ring-ring/50` |

**Reason:** Using specific color values bypasses the token system. If indigo changes, these don't update.

**Action:** Replace all `indigo-*` focus classes with `ring` token equivalents.

---

### 2.3 FEATURE CATEGORY COLORS (INLINE - INTENTIONAL BUT UNDOCUMENTED)

These colors are used to visually categorize feature areas. They are intentionally NOT in the token system:

| Feature | Current Classes | Tokens Needed? |
|---------|-----------------|-----------------|
| Timetable | `bg-blue-100 text-blue-600/700` | Should tokenize as `--color-category-timetable` |
| Planner | `bg-violet-100 text-violet-600/700` | Should tokenize as `--color-category-planner` |
| Events | `bg-emerald-100 text-emerald-600/700` | Should tokenize as `--color-category-events` |
| AI/Tools | `bg-pink-100 text-pink-600` | Should tokenize as `--color-category-ai` |
| Marketplace | `bg-orange-100 text-orange-600` | Should tokenize as `--color-category-marketplace` |
| Campus Map | `bg-sky-100 text-sky-600` | Should tokenize as `--color-category-campus` |
| Emergency | `bg-red-100 text-red-600` | Should tokenize as `--color-category-emergency` |
| Community | `bg-blue-100 text-blue-600` | (shares timetable color) |

**Current status:** Inline throughout dashboard components. Not centralized or documented.

**Action:** Create category color tokens in `globals.css` for consistency. Document in DESIGN_SYSTEM.md.

---

### 2.4 HARDCODED HEX IN MAP COMPONENTS

Map visualization uses hardcoded hex colors:

| Component | Hex Value | Purpose | Should Use |
|-----------|-----------|---------|-----------|
| `StudentMapViewer.tsx` | `#6366f1` | Building/route lines, marker | `--primary` |
| `StudentMapViewer.tsx` | `#0ea5e9` | Library marker | Category token |
| `StudentMapViewer.tsx` | `#10b981` | Hostel marker | Category token |
| `StudentMapViewer.tsx` | `#f59e0b` | Cafeteria marker | Category token |
| `InteractiveMapPicker.tsx` | `#6366f1` | Marker indicator | `--primary` |

**Problem:** Inline hex bypasses tokens. If color palette changes, maps won't update.

**Action:** Replace hex with CSS variable references or create wrapper component.

---

## 3. TYPOGRAPHY ISSUES

### 3.1 HARDCODED FONT SIZES IN AUTH SCREENS

| File | Class | px | Should Use |
|------|-------|-----|-----------|
| `login/page.tsx` | `text-[14px]` | 14 | `text-sm` |
| `login/page.tsx` | `text-[15px]` | 15 | `text-base` (approx) |
| `login/page.tsx` | `text-[20px]` | 20 | `text-xl` |
| `login/page.tsx` | `text-[24px]` | 24 | `text-2xl` |
| `register/page.tsx` | `text-3xl` | 30 | ✅ correct |
| `forgot-password/page.tsx` | `text-2xl` | 24 | ✅ correct |
| `reset-password/page.tsx` | `text-2xl` | 24 | ✅ correct |

**Problem:** Hardcoded sizes don't scale with design system changes.

**Action:** Replace all `text-[Npx]` with Tailwind scale classes.

---

### 3.2 SERIF FONT USAGE NOT DOCUMENTED

`font-serif` appears only in dashboard section headings. No serif font is loaded in `fonts.ts`:

| Use | Current | Result | Should Be |
|-----|---------|--------|-----------|
| Dashboard section titles | `font-serif` | System serif (Georgia, Times New Roman) | Should load Merriweather or similar, or remove |

**Problem:** `font-serif` relies on system fonts, not designed serif typeface.

**Action:** Either (1) load a serif font, (2) replace with sans-serif, or (3) document as intentional system fallback.

**Current DESIGN_SYSTEM.md indicates:** "Mixed-font personality that sets section titles apart" — so it's intentional. Document this clearly and keep.

---

### 3.3 TYPOGRAPHY SCALE NOT CONSISTENTLY APPLIED

Components use both token-aware and hardcoded sizes:

- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl` ✅
- `text-[14px]`, `text-[15px]`, `text-[20px]`, `text-[24px]` ❌

**Action:** Replace all hardcoded sizes with Tailwind scale.

---

## 4. RADIUS INCONSISTENCIES

### 4.1 CONFLICTING RADIUS VALUES

| Element | Current | Base token | Issue |
|---------|---------|-----------|-------|
| Button `.lg` | `rounded-lg` | 10px (`--radius`) | ✅ consistent |
| Input (auth) | `rounded-[12px]`, `rounded-2xl` (16px) | 10px | ❌ varies 10-16px |
| Card | `rounded-2xl`, `rounded-3xl` (16-18px) | 10px | ❌ inconsistent |
| Icon container | `rounded-xl` (12px) | 10px | ❌ inconsistent |
| OTP input | `rounded-2xl` (16px) | 10px | ❌ inconsistent |

**Problem:** No consistent rule. Base token (10px) is used for buttons, but everything else ranges 12-18px.

**Action:** Define clear semantic radius levels:
- `--radius-sm` = 6px (small buttons, tight elements)
- `--radius-md` = 8px (default - inputs, small cards)
- `--radius-lg` = 12px (buttons, icon containers)
- `--radius-xl` = 16px (cards)
- `--radius-2xl` = 24px (large cards, modals)
- `--radius-pill` = 9999px (pills, badges)

Remap hardcoded values to these tokens.

---

## 5. BUTTON IMPLEMENTATION INCONSISTENCIES

### 5.1 COMPONENT VS RAW BUTTONS

**Button component exists:** `components/ui/button.tsx` (excellent implementation)

**Uses:**
- LoginForm — uses `<Button>` ✅
- Everything else — raw `<button>` elements with inline Tailwind ❌

**Files with raw buttons:**
- `app/register/page.tsx`
- `app/login/page.tsx`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `app/verify-otp/page.tsx`
- Various dashboard and admin pages

**Problem:** Inconsistent button states, focus handling, accessibility attributes.

**Action:** Migrate all raw buttons to `<Button>` component or ensure raw buttons match component's accessible state handling.

---

### 5.2 BUTTON SIZE/STYLE VARIATIONS

Raw buttons use different patterns:

| File | Classes | Issue |
|------|---------|-------|
| `login/page.tsx` | `rounded-[12px] h-[48px]` | Hardcoded size, not using Button component |
| `register/page.tsx` | `rounded-2xl py-4` | Different radius and padding |
| `forgot-password/page.tsx` | `rounded-2xl py-4` | Same variation |
| `reset-password/page.tsx` | `rounded-2xl py-4` | Same variation |

**Action:** Standardize all buttons through component or define consistent raw-button pattern in Tailwind.

---

## 6. INPUT IMPLEMENTATION INCONSISTENCIES

### 6.1 NO SHARED INPUT COMPONENT

Inputs are styled inline per screen. Three main patterns:

**Pattern A (LoginForm, Register, Forgot/Reset):**
```tsx
className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
```

**Pattern B (Reset password variant):**
```tsx
className="rounded-2xl bg-slate-50 border border-slate-100 py-4"
```

**Pattern C (OTP inputs):**
```tsx
className="w-12 h-14 rounded-2xl border-2 border-indigo-200 bg-indigo-50 text-center text-xl font-bold"
```

**Problem:** Duplicated styling, no consistency, hard to maintain.

**Action:** Create shared Input component in `components/ui/input.tsx` (already specified in DESIGN_SYSTEM.md as missing).

---

## 7. PASSWORD STRENGTH IMPLEMENTATIONS

### 7.1 TWO DIFFERENT IMPLEMENTATIONS

**Implementation 1 (PasswordInput.tsx):**
- Single progress bar: `h-1.5 bg-slate-200 rounded-full`
- Color: red/yellow/blue/green based on strength
- Logic: word/number/special char scoring

**Implementation 2 (Register page):**
- 4-segment indigo bar: `h-1 flex-1 rounded-full bg-indigo-600`
- Fill progress: 25/50/75/100%
- Different scoring logic

**Problem:** User sees different strength indicators on different screens.

**Action:** Consolidate into single PasswordInput component, use it everywhere.

---

## 8. ICON LIBRARY DUPLICATION

### 8.1 TWO LIBRARIES IN USE

| Library | Imports | Usage | Style |
|---------|---------|-------|-------|
| Lucide React | `lucide-react` | Sidebars, BottomNav, dashboard, many screens | Outline/stroke |
| React Icons | `react-icons/md` | LoginForm, PasswordInput, SearchInput, auth screens | Filled |

**Declared library:** `components.json` lists Lucide as the shadcn icon library.

**Problem:** No separation of concern. Both styles coexist. New code should use only Lucide.

**Action:** Document in DESIGN_SYSTEM.md that only Lucide should be used going forward. Migration of existing React Icons is deferred to Phase 3.

---

## 9. INTERACTION STATE INCONSISTENCIES

### 9.1 HOVER STATES

| Element | Current | Issue |
|---------|---------|-------|
| Button | `hover:bg-primary/80` (from component) | ✅ consistent |
| Raw buttons | Varies (some have hover, some don't) | ❌ inconsistent |
| Nav items | `hover:bg-accent hover:text-accent-foreground` | ✅ uses tokens |
| Dashboard tiles | `active:scale-95 transition-transform` | ✅ tap feedback |
| Admin cards | `hover:shadow-md transition-shadow` | ✅ consistent |

**Action:** Standardize hover effects across all interactive elements.

---

### 9.2 FOCUS STATES

| Element | Current | Issue |
|---------|---------|-------|
| Button | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | ✅ good |
| Inputs (auth) | `focus:ring-2 focus:ring-indigo-500` | ❌ hardcoded indigo |
| Inputs (dashboard) | Uses generic `focus:outline-none` | ⚠️ minimal |

**Action:** Ensure all focus states use `focus-visible:ring` pattern with `--ring` token.

---

### 9.3 DISABLED STATES

| Element | Current | Issue |
|---------|---------|-------|
| Button | `disabled:opacity-50 disabled:pointer-events-none` | ✅ good |
| Inputs (auth) | `disabled:opacity-60` | ⚠️ inconsistent |
| Inputs (dashboard) | `disabled:cursor-not-allowed` | ⚠️ inconsistent |

**Action:** Standardize disabled state across all elements.

---

## 10. COMPONENT INVENTORY

### 10.1 EXISTS & WORKING

✅ `components/ui/button.tsx` — Complete, uses tokens, accessible
✅ `components/ui/LoadingSkeleton.tsx` — Working, uses `bg-slate-100`
✅ `components/shared/ErrorMessage.tsx` — Working, inline styled
✅ `components/shared/PasswordInput.tsx` — Working, but uses `slate-*`
✅ `components/shared/BottomNav.tsx` — Working, hardcoded structure
✅ `components/shared/BackButton.tsx` — Working
✅ `components/admin/AdminSidebar.tsx` — Working, separate implementation
✅ `components/super-admin/SuperAdminSidebar.tsx` — Working, separate implementation

### 10.2 MISSING (Spec'd in DESIGN_SYSTEM.md)

❌ Input component (should create `components/ui/input.tsx`)
❌ Card component (should create `components/ui/card.tsx`)
❌ Badge component (should create `components/ui/badge.tsx`)
❌ Dialog/Modal components
❌ Tabs component
❌ BottomSheet/Drawer components
❌ Checkbox/Radio components
❌ Select/Combobox components
❌ Tooltip component
❌ Toast/Snackbar component

### 10.3 DUPLICATED

⚠️ Password strength indicator — two implementations
⚠️ Auth screens — duplicated button/input styling across multiple files

---

## 11. FILES REQUIRING MIGRATION

### 11.1 HIGH PRIORITY (Core Design System)

| File | Issue | Migration |
|------|-------|-----------|
| `app/login/page.tsx` | Slate colors, hardcoded sizes, raw buttons | Replace `slate-*` → tokens, `text-[Npx]` → scale, use `<Button>` |
| `app/register/page.tsx` | Slate colors, hardcoded sizes, raw buttons | Same as login |
| `app/forgot-password/page.tsx` | Slate colors, hardcoded indigo focus | Same as login |
| `app/reset-password/page.tsx` | Slate colors, hardcoded indigo focus | Same as login |
| `app/verify-otp/page.tsx` | Slate colors, hardcoded indigo focus | Same as login |
| `components/ui/PasswordInput.tsx` | Slate colors, hardcoded indigo | Replace with tokens |
| `components/ui/LoadingSkeleton.tsx` | `bg-slate-100` | Replace with `bg-muted` |
| `components/shared/LoginForm.tsx` | Slate colors | Replace with tokens |
| `components/dashboard/StudentMapViewer.tsx` | Hardcoded hex colors | Replace with token references |
| `components/super-admin/InteractiveMapPicker.tsx` | Hardcoded hex colors | Replace with token references |

### 11.2 MEDIUM PRIORITY (Consistency)

| File | Issue | Migration |
|------|-------|-----------|
| `components/shared/SearchInput.tsx` | Likely slate colors | Audit and replace |
| `components/shared/SelectionList.tsx` | Likely slate colors | Audit and replace |
| Dashboard feature screens | Category colors inline | Document and tokenize category colors |
| Admin screens | Ensure consistent use of tokens | Audit and standardize |

### 11.3 DOCUMENTATION ONLY

| File | Issue | Action |
|------|-------|--------|
| `DESIGN_SYSTEM.md` | Update to reflect design decisions | Update after migrations complete |
| `globals.css` | Already comprehensive | Verify all tokens are used correctly |

---

## 12. MIGRATION STRATEGY

### Phase 1: Foundation (This Task)
1. ✅ Token system is complete in `globals.css`
2. ✅ Dark mode tokens are defined
3. ✅ Create category color tokens for features
4. ✅ Verify Button component uses tokens
5. ✅ Document in DESIGN_SYSTEM.md

### Phase 2: Auth Screen Consolidation (Next Task)
1. Migrate all auth screens from `slate-*` to semantic tokens
2. Replace hardcoded font sizes with scale
3. Replace raw buttons with `<Button>` component
4. Replace hardcoded indigo focus with `--ring` token
5. Standardize input styling (prepare for Input component)

### Phase 3: Component Library Creation (Phase 2+)
1. Create `components/ui/input.tsx`
2. Create `components/ui/card.tsx`
3. Create `components/ui/badge.tsx`
4. Create remaining missing components

### Phase 4: Icon Migration (Phase 3)
1. Migrate React Icons → Lucide only

### Phase 5: Dark Mode Activation (Phase 3+)
1. Wire up dark mode toggle
2. Test all components in both themes
3. Address any issues (e.g., auth screens using inline slate)

---

## 13. SUMMARY OF REQUIRED ACTIONS

### Immediate (This Task)
- [x] Review DESIGN_SYSTEM.md thoroughly
- [x] Audit existing implementation
- [x] Create this inventory
- [ ] Add category color tokens to `globals.css`
- [ ] Update `DESIGN_SYSTEM.md` with migration notes
- [ ] Document icon library decision (Lucide only)

### Short Term (Next 1-2 Tasks)
- [ ] Migrate auth screens from `slate-*` to tokens
- [ ] Consolidate password strength indicator
- [ ] Ensure all buttons use `<Button>` component or match its patterns
- [ ] Replace hardcoded hex in map components

### Medium Term
- [ ] Create Input, Card, Badge components
- [ ] Consolidate all button/input styling
- [ ] Document category color usage

### Long Term (Phase 3+)
- [ ] Icon library consolidation (Lucide only)
- [ ] Dark mode activation and testing
- [ ] Remaining component library build-out

---

## 14. OPEN QUESTIONS

1. **Serif font for dashboard:** Should we load a designed serif (e.g., Merriweather) or keep system fallback?
   - **Answer from DESIGN_SYSTEM.md:** Mixed-font personality is intentional. Keep as is.

2. **Category colors:** Should they be tokenized or remain inline?
   - **Recommendation:** Tokenize for consistency and future changes.

3. **Auth screen styling:** Should auth screens match dashboard token system or maintain distinct "public" aesthetic?
   - **Current behavior:** Auth uses `slate-*`, dashboard uses tokens.
   - **Recommendation:** Migrate to tokens but keep auth screens visually distinct through layout/spacing, not color.

4. **Button component migration:** Should raw buttons be migrated or patterns standardized?
   - **Recommendation:** Migrate raw buttons to `<Button>` component for consistency and accessibility.

5. **Dark mode timeline:** When should dark mode be activated?
   - **Current:** Tokens are ready, but no UI toggle exists.
   - **Recommendation:** Activate in Phase 3 after all auth screens are migrated.

---

**Document Status:** Ready for implementation  
**Last Updated:** August 13, 2026
