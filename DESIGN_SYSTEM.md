# LOOPZ Design System

## Table of Contents
1. [Design Principles](#1-design-principles)
2. [Design Source of Truth](#2-design-source-of-truth)
3. [Color Tokens](#3-color-tokens)
4. [Typography](#4-typography)
5. [Spacing System](#5-spacing-system)
6. [Radius System](#6-radius-system)
7. [Shadows & Elevation](#7-shadows--elevation)
8. [Interaction States](#8-interaction-states)
9. [Layout Patterns](#9-layout-patterns)
10. [Component Primitives](#10-component-primitives)
11. [Iconography](#11-iconography)
12. [Motion & Animation](#12-motion--animation)
13. [Dark Mode](#13-dark-mode)
14. [Screen Inventory](#14-screen-inventory)
15. [Design Personality](#15-design-personality)
16. [Inconsistencies & Drift](#16-inconsistencies--drift)

---

## 1. Design Principles

**Loopz is designed to be:**
- **Modern** — Clean, minimal, uncluttered interface
- **Student-focused** — Intuitive, accessible, mobile-first
- **Friendly** — Warm, approachable, human tone
- **Intelligent** — Connects features, reveals information hierarchy
- **Trustworthy** — Clear actions, predictable behavior
- **Energetic** — Responsive, tactile, alive (but restrained)

**Foundation principles:**
1. Token-driven design (no magic numbers, all via CSS variables)
2. Semantic naming (colors named by purpose, not by look)
3. Accessibility-first (WCAG 2.1 AA minimum)
4. Mobile-first (scale up to desktop, not down)
5. Consistent patterns (same interaction = same visual feedback)
6. Dark mode ready (all tokens work in both themes)

---

## 1. Design Source of Truth

**Styling approach:** Tailwind CSS v4 with CSS custom properties (oklch tokens). No `tailwind.config.js` — config is done via `@theme inline` in the global CSS file.

**Component library:** shadcn/ui (style: `base-nova`) via `components.json`. Primitive layer uses `@base-ui/react`.

**Global stylesheet:** `app/ui/globals.css` — defines all design tokens as CSS variables, dark mode class, and base layer resets.

**Font setup:** `app/ui/fonts.ts` — single font loaded via `next/font/google`.

**Shared components live in two places:**
- `components/ui/` — low-level UI primitives (Button, PasswordInput, LoadingSkeleton, ErrorMessage)
- `components/shared/` — composed app-level components (LoginForm, BottomNav, BackButton, SearchInput, SelectionList, ProgressDots)
- `components/admin/` and `components/super-admin/` — role-specific sidebar components

---

## 2. Color Palette

All colors are defined as oklch CSS variables in `app/ui/globals.css`.

### Light Mode

| Token | oklch value | Approximate hex | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `#ffffff` | Page backgrounds |
| `--foreground` | `oklch(0.145 0 0)` | `#111111` | Body text |
| `--card` | `oklch(1 0 0)` | `#ffffff` | Card surfaces |
| `--card-foreground` | `oklch(0.145 0 0)` | `#111111` | Text on cards |
| `--primary` | `oklch(0.585 0.233 277.117)` | `#6366f1` (indigo-500) | CTAs, active states, links |
| `--primary-foreground` | `oklch(1 0 0)` | `#ffffff` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | `#f8f8f8` | Secondary buttons bg |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `#222222` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | `#f8f8f8` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#6b6b6b` | Placeholder/secondary text |
| `--accent` | `oklch(0.962 0.018 272.314)` | `#eef2ff` (indigo-50) | Hover/selected tint backgrounds |
| `--accent-foreground` | `oklch(0.585 0.233 277.117)` | `#6366f1` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#ef4444` | Errors, danger actions |
| `--border` | `oklch(0.922 0 0)` | `#e5e5e5` | Dividers, input borders |
| `--input` | `oklch(0.922 0 0)` | `#e5e5e5` | Input borders |
| `--ring` | `oklch(0.785 0.115 274.713)` | `#a5b4fc` (indigo-300) | Focus rings |
| `--sidebar` | `oklch(0.985 0 0)` | `#fafafa` | Admin sidebar bg |
| `--sidebar-primary` | same as `--primary` | `#6366f1` | Active nav item bg |

### Chart Colors (greyscale + primary)
`--chart-1` = primary indigo; `--chart-2` through `--chart-5` = progressively darker greys (`#6b6b6b` → `#1a1a1a`).

### Semantic/Accent Colors used inline (not tokens)
These appear directly as Tailwind classes throughout the codebase — they are **not** in the token system:

| Color | Tailwind classes | Usage |
|---|---|---|
| Blue | `bg-blue-100 text-blue-600/700` | Timetable, community, user stats |
| Violet | `bg-violet-100 text-violet-600/700` | Planner, quizzes, admin |
| Amber | `bg-amber-100 text-amber-600/700` | Reminders, warnings, medium priority |
| Emerald | `bg-emerald-100 text-emerald-600/700` | Events, success states |
| Sky | `bg-sky-100 text-sky-600` | Campus map |
| Red | `bg-red-100 text-red-600`, `bg-red-50 border-red-200` | Emergency, errors |
| Pink | `bg-pink-100 text-pink-600` | AI Tools |
| Orange | `bg-orange-100 text-orange-600` | Marketplace |
| Green | `bg-green-500` | Password strength "strong" |
| Yellow | `bg-yellow-500` | Password strength "fair" |
| Slate | `bg-slate-*`, `text-slate-*`, `border-slate-*` | Used heavily in auth screens as an alternative neutral system |

---

## 2.1.1 FEATURE CATEGORY COLORS (NEW - TOKENIZED ✅)

**Status:** Phase 1 Foundation - Now tokenized in `globals.css`

These semantic tokens represent the visual category system used throughout the dashboard to quickly identify feature areas by color. Each category has a primary color (for text/icons) and a background variant (for cards/containers).

| Category | Token | Light Mode | Dark Mode | Current Inline Usage |
|----------|-------|-----------|-----------|----------------------|
| **Timetable** | `--category-timetable` / `--category-timetable-bg` | oklch(0.326 0.151 261.688) / oklch(0.95 0.035 263.604) | oklch(0.611 0.157 258.995) / oklch(0.269 0.018 261.688) | `bg-blue-100 text-blue-600/700` |
| **Planner** | `--category-planner` / `--category-planner-bg` | oklch(0.473 0.198 279.235) / oklch(0.969 0.025 278.996) | oklch(0.623 0.162 276.935) / oklch(0.269 0.022 279.235) | `bg-violet-100 text-violet-600/700` |
| **Events** | `--category-events` / `--category-events-bg` | oklch(0.332 0.144 155.995) / oklch(0.952 0.027 155.858) | oklch(0.563 0.178 150) / oklch(0.269 0.02 155.995) | `bg-emerald-100 text-emerald-600/700` |
| **AI Tools** | `--category-ai` / `--category-ai-bg` | oklch(0.599 0.224 12.164) / oklch(0.969 0.03 12.316) | oklch(0.704 0.191 22.216) / oklch(0.269 0.025 12.164) | `bg-pink-100 text-pink-600` |
| **Marketplace** | `--category-marketplace` / `--category-marketplace-bg` | oklch(0.634 0.194 41.877) / oklch(0.959 0.047 39.754) | oklch(0.722 0.161 40) / oklch(0.269 0.035 41.877) | `bg-orange-100 text-orange-600` |
| **Campus Map** | `--category-campus` / `--category-campus-bg` | oklch(0.497 0.185 254.211) / oklch(0.958 0.056 256.802) | oklch(0.622 0.158 256.802) / oklch(0.269 0.025 254.211) | `bg-sky-100 text-sky-600` |
| **Emergency** | `--category-emergency` / `--category-emergency-bg` | oklch(0.577 0.245 27.325) / oklch(0.968 0.061 27.325) | oklch(0.704 0.191 22.216) / oklch(0.269 0.035 27.325) | `bg-red-100 text-red-600` |
| **Community** | `--category-community` / `--category-community-bg` | Alias to timetable | Alias to timetable | `bg-blue-100 text-blue-600/700` |

**Usage in Tailwind:**
```tsx
// Old way (inline Tailwind - will be migrated Phase 2)
<div className="bg-blue-100 text-blue-600">Timetable</div>

// New way (using tokens)
<div className="bg-category-timetable-bg text-category-timetable">Timetable</div>
```

**Dark mode support:** All category tokens automatically adjust when `.dark` class is applied to the root element.

---

## 3. Typography

**Font family:** Geist (Google Fonts, variable font), loaded as `--font-sans`. Applied globally via `html { @apply font-sans }` and `body` class on the root layout.

**Monospace:** `--font-geist-mono` (referenced in theme but not loaded in `fonts.ts` — likely unused at runtime).

**No explicit type scale config.** Sizes are applied inline with Tailwind utilities. Observed scale:

| Size class | px equiv | Usage |
|---|---|---|
| `text-xs` | 12px | Timestamps, captions, badge labels, nav labels |
| `text-sm` | 14px | Body text, form labels, list descriptions, button text in shared components |
| `text-[14px]` | 14px | Auth form input text (hardcoded, not using scale) |
| `text-[15px]` | 15px | Login submit button (hardcoded) |
| `text-base` | 16px | Default (rarely explicit) |
| `text-lg` | 18px | Register submit button, dashboard username |
| `text-xl` | 20px | Welcome text, section headers |
| `text-2xl` | 24px | Page headings on auth screens |
| `text-3xl` | 30px | Registration step headings |
| `text-4xl` | 36px | Dashboard main heading, CGPA stat |
| `text-[20px]` | 20px | Login welcome text (hardcoded) |
| `text-[24px]` | 24px | Login page h1 (hardcoded) |

**Font weights:**
- `font-medium` — nav labels, secondary labels
- `font-semibold` — form labels, button text, card titles
- `font-bold` — page headings, stat values, user name
- `font-serif` — used for dashboard section headers (`h2`, `h3`) creating a mixed-font personality

**Line heights:** Not explicitly set; Tailwind defaults apply. `leading-tight` used on the dashboard username and card titles.

**Notable pattern:** Dashboard uses `font-serif` for section headings (e.g. "Today's Classes", "Dashboard", "CGPA") while auth screens use default sans-serif for all text. This is the only place serif appears.

---

## 4. Spacing System

Tailwind's default 4px-base spacing scale. No custom spacing config. Common patterns observed:

**Padding:**
- Page horizontal padding: `px-4` (16px) mobile, `px-6` (24px) dashboard, `sm:px-6 lg:px-8` on login
- Card internal padding: `p-4` or `p-5` (16–20px)
- Input padding: `py-3 px-4` (12px/16px) or `py-4` (16px) on auth screens
- Section vertical padding: `pt-8 pb-6`, `py-6`, `py-8`

**Gaps/margins:**
- Stack spacing between form fields: `space-y-4` or `space-y-5`
- Card list gaps: `gap-3` or `gap-4`
- Icon-to-text gaps: `gap-2` or `gap-3`
- Grid gaps: `gap-3` (quick links 3-col) or `gap-4` (stat cards)

**Bottom padding for BottomNav:** `pb-24` on scrollable dashboard pages to clear the fixed nav bar.

---

## 5. Layout Patterns

### Pattern A — Mobile-first single column (auth screens)
`min-h-screen w-full bg-white px-6 py-8 flex flex-col`
Used by: Forgot Password, Verify OTP, Reset Password, Register (steps 1–3).

### Pattern B — Split panel (login only)
Left panel: form on `bg-slate-50/70`. Right panel: `bg-indigo-600` with marketing copy. Hidden on mobile (`hidden lg:flex`). Outer card: `rounded-[28px] shadow-[0_20px_50px_...]` with `max-w-6xl`.

### Pattern C — Mobile scrollable feed with bottom nav
`min-h-screen w-full bg-muted pb-24` + `<BottomNav />` fixed at bottom.
Used by: Dashboard, Study, Community, Marketplace, Notifications, Planner, Timetable, Events, Profile, Emergency, Map.

### Pattern D — Admin sidebar + content
`flex min-h-screen bg-muted` with a sticky `w-56` sidebar on `lg:`, mobile drawer overlay on smaller screens.
Used by: all `/admin/*` and `/super-admin/*` routes.

### Pattern E — Centered max-width content
`max-w-2xl w-full mx-auto` inside full-width page.
Used by: Register details step.

**Breakpoints used:** Only `lg:` (1024px) is used for layout switching (sidebar vs. drawer, split panel). `sm:` appears in a few places for padding adjustments. No `md:` breakpoint usage found.

**Container widths:** `max-w-6xl` (login split card), `max-w-2xl` (register form), `w-56` (sidebars). No global container component.

**Grid usage:** `grid grid-cols-3 gap-3` (quick links), `grid grid-cols-2 gap-4` (CGPA+Notifications), `grid grid-cols-2 lg:grid-cols-3/4 gap-4` (admin stat cards). Flex used for everything else.

---

## 6. Component Styles

### Buttons

**Primary source:** `components/ui/button.tsx` (shadcn Button wrapping `@base-ui/react/button` + CVA).

| Variant | Classes | Usage |
|---|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/80` | Main CTAs |
| `outline` | `border-border bg-background hover:bg-muted` | Secondary actions |
| `secondary` | `bg-secondary text-secondary-foreground` | Neutral actions |
| `ghost` | `hover:bg-muted` | Icon buttons, nav items |
| `destructive` | `bg-destructive/10 text-destructive hover:bg-destructive/20` | Danger actions |
| `link` | `text-primary underline-offset-4 hover:underline` | Inline links |

| Size | Height | Radius |
|---|---|---|
| `xs` | h-6 (24px) | `radius-md` capped at 10px |
| `sm` | h-7 (28px) | `radius-md` capped at 12px |
| `default` | h-8 (32px) | `rounded-lg` |
| `lg` | h-9 (36px) | `rounded-lg` |
| `icon` | 32×32px | `rounded-lg` |

**Base radius:** `rounded-lg` = `var(--radius)` = `0.625rem` (10px).

**Focus:** `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`

**Disabled:** `opacity-50 pointer-events-none`

**Note:** Auth screen CTAs deviate from this component — they use raw `<button>` elements with hardcoded classes (`rounded-[12px] h-[48px]`, `rounded-2xl py-4`, `rounded-xl py-3`). The shared Button component is only used inside LoginForm.

---

### Inputs

No shared input component exists. Inputs are styled inline per screen. Two patterns:

**Auth screens (LoginForm, Register details, Forgot/Reset password):**
```
rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12
focus:outline-none focus:ring-2 focus:ring-indigo-500
placeholder-slate-400
```
Error state: `border-red-300 bg-red-50 focus:ring-red-500/50`

**Auth screens variant 2 (Forgot/Reset/OTP):**
```
rounded-2xl bg-slate-50 border border-slate-100 py-4
focus:ring-2 focus:ring-indigo-400
```
Slightly larger padding, softer border, larger radius.

**OTP inputs:**
```
w-12 h-14 rounded-2xl border-2 border-indigo-200 bg-indigo-50
text-center text-xl font-bold focus:border-indigo-500
```

**Icon pattern:** All inputs with icons use `relative` wrapper + `absolute left-4 top-1/2 -translate-y-1/2` icon + `pl-12` on the input.

---

### Cards

No shared Card component. Cards are `div` elements with consistent classes:

**Dashboard / admin cards:**
`bg-card rounded-2xl p-5` or `bg-card rounded-3xl p-5`

**Selection list items (register flow):**
`p-4 rounded-xl border-2 border-slate-200 cursor-pointer`
Selected: `border-indigo-600 bg-indigo-50`
Hover: `hover:border-indigo-300`

**Stat cards (admin):**
`bg-card rounded-2xl p-5 flex items-center gap-4`

**Super admin nav cards:**
`bg-card rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow`

---

### Badges / Tags / Pills

Inline styled. Common pattern:
`text-xs font-semibold rounded-full px-3 py-1`

Priority badges:
- High/overdue: `text-destructive bg-destructive/10`
- Medium: `text-amber-600 bg-amber-100`

Condition badges (marketplace):
- NEW: `bg-emerald-100 text-emerald-700`
- LIKE_NEW: `bg-accent text-primary`
- GOOD: `bg-muted text-muted-foreground`
- FAIR: `bg-amber-100 text-amber-700`

"Pinned" badge: `text-xs font-medium text-primary border border-ring rounded-full px-2 py-0.5`

---

### Bottom Navigation (`BottomNav`)

`fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center py-3 z-30`

Active icon container: `w-9 h-9 rounded-xl bg-accent`
Active icon: `text-primary`
Inactive icon/label: `text-muted-foreground`
Label: `text-xs font-medium`
5 items: Home, Study, Market, Community, Profile

---

### Admin Sidebar

`w-56 bg-sidebar border-r border-border h-screen sticky top-0`

Nav item default: `text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-xl px-3 py-2.5 text-sm font-medium`
Nav item active: `bg-primary text-primary-foreground rounded-xl`
Logo mark: `w-8 h-8 rounded-lg bg-primary` with white icon inside.
Logout button: `hover:bg-destructive/10 hover:text-destructive`

Mobile: fixed top bar (h-14) + slide-in drawer with `bg-black/40` overlay.

---

### ErrorMessage component

`mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3`
Icon: `MdError w-5 h-5 text-red-600`
Text: `text-red-700 text-sm`

---

### LoadingSkeleton component

`h-{height} rounded-xl bg-slate-100 animate-pulse`
Default height: `h-16`. Default count: 3. Gap: `space-y-3`.

---

### ProgressDots (register stepper)

Active dot: `bg-indigo-600 w-8 h-2 rounded-full` (elongated pill)
Completed dot: `bg-indigo-600 w-2 h-2 rounded-full`
Upcoming dot: `bg-slate-300 w-2 h-2 rounded-full`
Container: `flex gap-2 justify-center mb-6`

---

### Password Strength Indicator

Thin bar: `h-1.5 bg-slate-200 rounded-full` with colored fill:
- Weak (25%): `bg-red-500`
- Fair (50%): `bg-yellow-500`
- Good (75%): `bg-blue-500`
- Strong (100%): `bg-green-500`

Register page uses a different 4-segment version: `h-1 flex-1 rounded-full` filled with `bg-indigo-600`.

---

### Quick Link tiles (Dashboard)

`bg-card rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform`
Icon container: `w-11 h-11 rounded-xl` with category-specific accent color.
Label: `text-xs font-semibold text-foreground text-center leading-tight`

---

## 7. Iconography

**Two icon libraries are used simultaneously:**

1. **Lucide React** (`lucide-react` ^1.23.0) — declared as the shadcn icon library in `components.json`. Used in: BottomNav, BackButton, sidebars, dashboard, forgot/reset/verify screens, study, community, notifications, marketplace, admin pages.

2. **React Icons / Material Design** (`react-icons` ^5.7.0, `MdXxx` icons) — used in: LoginForm, PasswordInput, ErrorMessage, SearchInput, SelectionList, ProgressDots, register page, login page (MdFingerprint).

**There is no single icon library.** Both are used across the codebase with no clear division of responsibility.

**Sizing conventions:**
- Standard inline icon: `w-5 h-5` (20px) — most common
- Small icon: `w-4 h-4` (16px) — nav, back button, chevrons
- Large icon: `w-6 h-6` (24px) — back arrows, header icons
- Feature icon: `w-7 h-7` (28px) — auth screen icon cards
- Quick link tile icon: `w-5 h-5` inside `w-11 h-11` container

**Stroke style:** Lucide icons are outline/stroke. Material icons (`Md*`) are filled. Both coexist without a unified style.

**Icon containers:**
- Colored pill/square: `w-11 h-11 rounded-xl` or `w-12 h-12 rounded-xl` with `bg-{color}-100 text-{color}-600`
- Brand mark: `w-8 h-8 rounded-lg bg-primary text-primary-foreground`
- Auth page icon card: `w-16 h-16 rounded-2xl bg-indigo-50` or `bg-indigo-500`

---

## 8. Motion & Animation

**Transitions:** `transition` (all, 150ms ease) or `transition-colors` applied broadly to buttons, nav items, links.

**Transform:** `active:scale-95` on dashboard quick-link tiles (tap feedback). `hover:shadow-md` on super-admin cards.

**Spin animation:** Custom `@keyframes spin { to { transform: rotate(360deg) } }` defined in globals.css. Used on the splash screen loader (`animate-spin`) and biometric button loading state.

**Pulse:** `animate-pulse` on loading skeletons (`bg-slate-100` or `bg-card`).

**Password strength bar:** `transition-all duration-300` on width change.

**Progress dots:** `transition-all` on width (dot expands to pill on active step).

**Library:** `tw-animate-css` is installed and imported in globals.css — provides additional Tailwind animation utilities, but no custom animations beyond the above are observed in component code.

**No page transitions.** Navigation is instant Next.js routing with no enter/exit animations.

---

## 9. Dark Mode

Dark mode **exists in the token system** (`globals.css` defines a full `.dark` class with remapped tokens) but is **not wired up** in the UI:

- No theme toggle component exists anywhere in the codebase.
- The root layout does not apply a `dark` class conditionally.
- No `useTheme` hook or `ThemeProvider` is used.
- The `@custom-variant dark (&:is(.dark *))` declaration is present but unused in practice.

**Dark mode token changes (if activated):**
- Background: `#111111` (near-black)
- Card: slightly lighter `oklch(0.205)` surface
- Primary: shifts to indigo-400 `oklch(0.673 0.182 276.935)` for better contrast
- Border: `oklch(1 0 0 / 10%)` — white at 10% opacity
- Muted/secondary/accent collapse to the same dark grey `oklch(0.269)`

Many inline `slate-*` color classes used in auth screens and some shared components will **not** respond to the dark mode token system since they bypass CSS variables entirely.

---

## 10. Screen Inventory

### Auth / Onboarding

| Screen | Route | Layout | Shared Components | Notes |
|---|---|---|---|---|
| Splash | `/` | Full-screen `bg-[#6366F1]`, centered logo + spinner | — | Hardcoded hex `#6366F1`, not using `--primary` token |
| Login | `/login` | Split panel (Pattern B) on lg, single col mobile | LoginForm, LoadingSkeleton | Biometric button only shown on mobile. Reset success toast shown via query param. |
| Register | `/register` | Single col mobile (Pattern A) | ProgressDots, SearchInput, SelectionList, ErrorMessage, LoadingSkeleton | 4-step wizard: school → faculty → department → details |
| Forgot Password | `/forgot-password` | Single col (Pattern A) | — | Lucide icons; different input style (rounded-2xl, py-4) |
| Verify OTP | `/verify-otp` | Single col (Pattern A) | — | 6-digit input grid; indigo-tinted boxes |
| Reset Password | `/reset-password` | Single col (Pattern A) | — | Inline password strength with checklist |

### Student Dashboard

| Screen | Route | Layout | Shared Components | Notes |
|---|---|---|---|---|
| Dashboard Home | `/dashboard` | Feed + BottomNav (Pattern C) | BottomNav | font-serif section headers; colorful quick-link grid |
| Study Hub | `/dashboard/study` | Feed + BottomNav | BackButton, BottomNav | Quick-link cards to sub-sections |
| Materials | `/dashboard/study/materials` | Feed + BottomNav | BackButton, BottomNav | — |
| Material Detail | `/dashboard/study/materials/[id]` | Feed + BottomNav | BackButton | — |
| Upload Material | `/dashboard/study/materials/upload` | Feed + BottomNav | BackButton | — |
| Quizzes | `/dashboard/study/quizzes` | Feed + BottomNav | BackButton, BottomNav | — |
| Quiz Detail | `/dashboard/study/quizzes/[id]` | Feed + BottomNav | BackButton | — |
| CGPA Tracker | `/dashboard/study/cgpa` | Feed + BottomNav | BackButton, BottomNav | — |
| AI Summaries | `/dashboard/study/ai` | Feed + BottomNav | BackButton, BottomNav | — |
| AI Summary Detail | `/dashboard/study/ai/[id]` | Feed + BottomNav | BackButton | — |
| Community Feed | `/dashboard/community` | Feed + BottomNav | BottomNav | Section filter tabs; priority border-left accents |
| Post Detail | `/dashboard/community/[postId]` | Feed + BottomNav | BackButton | — |
| Create Post | `/dashboard/community/create` | Feed + BottomNav | BackButton | — |
| Notices | `/dashboard/community/notices` | Feed + BottomNav | BackButton | — |
| Q&A | `/dashboard/community/qa` | Feed + BottomNav | BackButton | — |
| Ask Question | `/dashboard/community/qa/ask` | Feed + BottomNav | BackButton | — |
| Q&A Detail | `/dashboard/community/qa/[id]` | Feed + BottomNav | BackButton | — |
| Groups | `/dashboard/community/groups` | Feed + BottomNav | BackButton | — |
| Group Detail | `/dashboard/community/groups/[id]` | Feed + BottomNav | BackButton | — |
| Create Group | `/dashboard/community/groups/create` | Feed + BottomNav | BackButton | — |
| Mentors | `/dashboard/community/mentors` | Feed + BottomNav | BackButton | — |
| FAQs | `/dashboard/community/faqs` | Feed + BottomNav | BackButton | — |
| Marketplace | `/dashboard/marketplace` | Feed + BottomNav | BackButton, BottomNav | Category filter chips; condition badges |
| Listing Detail | `/dashboard/marketplace/[id]` | Feed + BottomNav | BackButton | — |
| Create Listing | `/dashboard/marketplace/listings/create` | Feed + BottomNav | BackButton | Uses ListingForm component |
| Edit Listing | `/dashboard/marketplace/[id]/edit` | Feed + BottomNav | BackButton | — |
| Saved Listings | `/dashboard/marketplace/saved` | Feed + BottomNav | BackButton | — |
| Shops | `/dashboard/marketplace/shops` | Feed + BottomNav | BackButton | — |
| Shop Detail | `/dashboard/marketplace/shops/[id]` | Feed + BottomNav | BackButton | — |
| Create Shop | `/dashboard/marketplace/shops/create` | Feed + BottomNav | BackButton | — |
| Jobs | `/dashboard/marketplace/jobs` | Feed + BottomNav | BackButton | — |
| Services | `/dashboard/marketplace/services` | Feed + BottomNav | BackButton | — |
| Accommodation | `/dashboard/marketplace/accommodation` | Feed + BottomNav | BackButton | — |
| Lost & Found | `/dashboard/marketplace/lost-found` | Feed + BottomNav | BackButton | — |
| Roommates | `/dashboard/marketplace/roommates` | Feed + BottomNav | BackButton | — |
| Planner | `/dashboard/planner` | Feed + BottomNav | BackButton, BottomNav | — |
| Weekly Planner | `/dashboard/planner/weekly` | Feed + BottomNav | BackButton | — |
| Reminders | `/dashboard/planner/reminders` | Feed + BottomNav | BackButton | — |
| Timetable | `/dashboard/timetable` | Feed + BottomNav | BackButton, BottomNav | — |
| Events | `/dashboard/events` | Feed + BottomNav | BackButton, BottomNav | — |
| Event Detail | `/dashboard/events/[id]` | Feed + BottomNav | BackButton | — |
| Create Event | `/dashboard/events/create` | Feed + BottomNav | BackButton | — |
| Notifications | `/dashboard/notifications` | Feed + BottomNav | — | Type-colored icon containers; filter tabs |
| Campus Map | `/dashboard/map` | Feed + BottomNav | BackButton | — |
| Map Location Detail | `/dashboard/map/[id]` | Feed + BottomNav | BackButton | — |
| Emergency | `/dashboard/emergency` | Feed + BottomNav | BackButton | — |
| Profile | `/dashboard/profile` | Feed + BottomNav | BackButton | — |

### Admin

| Screen | Route | Layout | Shared Components | Notes |
|---|---|---|---|---|
| Admin Dashboard | `/admin` | Sidebar + content (Pattern D) | AdminSidebar | Stat cards grid; audit log table |
| Admin Users | `/admin/users` | Sidebar + content | AdminSidebar | — |
| Admin Events | `/admin/events` | Sidebar + content | AdminSidebar | — |
| Admin Community | `/admin/community` | Sidebar + content | AdminSidebar | — |
| Admin Materials | `/admin/materials` | Sidebar + content | AdminSidebar | — |
| Admin Groups | `/admin/groups` | Sidebar + content | AdminSidebar | — |
| Admin Jobs | `/admin/jobs` | Sidebar + content | AdminSidebar | — |
| Admin Marketplace | `/admin/marketplace` | Sidebar + content | AdminSidebar | — |
| Admin Emergency | `/admin/emergency` | Sidebar + content | AdminSidebar | — |
| Super Admin Dashboard | `/super-admin` | Sidebar + content (Pattern D) | SuperAdminSidebar | Navigation card grid |
| Super Admin Stats | `/super-admin/stats` | Sidebar + content | SuperAdminSidebar | — |
| Super Admin Schools | `/super-admin/schools` | Sidebar + content | SuperAdminSidebar | — |
| Super Admin Faculties | `/super-admin/faculties` | Sidebar + content | SuperAdminSidebar | — |
| Super Admin Admins | `/super-admin/admins` | Sidebar + content | SuperAdminSidebar | — |
| Super Admin Users | `/super-admin/users` | Sidebar + content | SuperAdminSidebar | — |
| Super Admin Audit Logs | `/super-admin/audit-logs` | Sidebar + content | SuperAdminSidebar | — |

---

## 15. Design Personality

**Overall aesthetic:** Clean, friendly, mobile-first. Rounded corners throughout (8–24px range). Layered card surfaces over muted page backgrounds. Indigo as the single brand color applied consistently.

**What makes it distinctive:**
- The indigo brand color (`#6366f1`) is used with unusual depth — not just for buttons, but as icon container fills, focus rings, selection states, border accents, and the splash screen background.
- Dashboard section headings use a **serif font** (via `font-serif` Tailwind class) against a sans-serif body — a deliberate typographic personality that sets section titles apart.
- Colorful categorical icon containers (each feature area has its own tint: blue=timetable, violet=planner, emerald=events, red=emergency, pink=AI) create a visual taxonomy without needing text labels.
- The `active:scale-95` press effect on quick-link tiles gives a native-app tap feel.
- Auth screens use a warmer, more minimal style (`bg-white`, `slate-*` palette) while dashboard uses the token system (`bg-muted`, `bg-card`) — a deliberate context shift from "public" to "app."

**Implicit principles for new screens:**
1. Use `bg-muted` as the page background, `bg-card` for lifted surfaces.
2. Round everything: `rounded-2xl` for cards and inputs, `rounded-xl` for icon containers and smaller elements.
3. Prefix every feature area with a colored icon container using the established tint palette.
4. Use `text-primary` and `bg-accent` for active/selected states — not custom colors.
5. Keep font weights in `font-semibold`/`font-bold` for titles; `text-muted-foreground` for secondary text.
6. Use `font-serif` only for section-level headings in the dashboard context.
7. Always add `pb-24` on scrollable pages that include BottomNav.
8. New admin screens should use the sidebar layout with `bg-muted` page bg and `bg-card rounded-2xl` content panels.

---

## 16. Migration Status (Phase 1 Foundation)

**Date:** August 13, 2026  
**Phase:** Phase 1 - Design System Foundation  
**Objective:** Consolidate Loopz into a single coherent design system without breaking existing functionality.

### 16.1 COMPLETED ✅

#### Token System
- [x] Core semantic tokens fully defined in `globals.css`
- [x] Dark mode tokens fully defined with proper remapping
- [x] Radius system tokens defined (with semantic levels)
- [x] Spacing system tokens defined
- [x] Shadow system tokens defined
- [x] Typography scale tokens defined (reference only)
- [x] Interaction state tokens defined
- [x] **NEW:** Feature category color tokens added (7 categories, light + dark modes)
- [x] All tokens exposed in `@theme inline` for Tailwind class generation

#### Documentation
- [x] DESIGN_SYSTEM.md reviewed and comprehensive
- [x] Category colors documented with token names and usage
- [x] Migration inventory created (MIGRATION_INVENTORY.md)
- [x] Token source of truth established in globals.css

#### Button Component
- [x] `components/ui/button.tsx` verified - excellent implementation
- [x] Uses semantic tokens throughout
- [x] Supports all necessary variants (default, outline, secondary, ghost, destructive, link)
- [x] Proper focus states with `focus-visible:ring` pattern
- [x] Disabled states handled correctly
- [x] Dark mode compatible
- [x] Accessibility features present (aria-invalid, aria-expanded)

#### Icon Library
- [x] Decision documented: Lucide React is the primary icon library
- [x] React Icons currently present but not encouraged for new code
- [x] Migration to Lucide-only deferred to Phase 3

### 16.2 IN PROGRESS 🚧

#### Auth Screens Token Migration
- [ ] Replace 50+ `slate-*` color classes with semantic tokens
- [ ] Replace hardcoded `indigo-*` focus colors with `--ring` token
- [ ] Replace hardcoded font sizes (`text-[Npx]`) with Tailwind scale
- [ ] Consolidate raw `<button>` elements to use `<Button>` component
- [ ] Files to migrate:
  - `app/login/page.tsx`
  - `app/register/page.tsx`
  - `app/forgot-password/page.tsx`
  - `app/reset-password/page.tsx`
  - `app/verify-otp/page.tsx`
  - `components/ui/PasswordInput.tsx`
  - `components/ui/LoadingSkeleton.tsx`
  - `components/shared/LoginForm.tsx`

#### Component Consolidation
- [ ] Password strength indicator - consolidate two implementations
- [ ] Input styling - prepare for dedicated Input component
- [ ] Button patterns - ensure consistency across all buttons

#### Map Components
- [ ] Replace hardcoded hex colors with token references
  - `components/dashboard/StudentMapViewer.tsx`
  - `components/super-admin/InteractiveMapPicker.tsx`

### 16.3 DEFERRED TO PHASE 2 ⏳

- [ ] Create `components/ui/input.tsx` shared input component
- [ ] Create `components/ui/card.tsx` shared card component
- [ ] Create `components/ui/badge.tsx` shared badge component
- [ ] Consolidate password strength indicator into PasswordInput
- [ ] Migrate all raw buttons to `<Button>` component
- [ ] Migrate all `slate-*` colors to semantic tokens
- [ ] Migrate all hardcoded hex values to tokens

### 16.4 DEFERRED TO PHASE 3 ⏳

- [ ] Icon library consolidation - migrate React Icons to Lucide only
- [ ] Dark mode UI activation - wire up theme toggle
- [ ] Test all components in dark mode
- [ ] Serif font - decide whether to load Merriweather or keep system fallback
- [ ] Remaining component library build-out

---

## 17. Inconsistencies & Drift (Known Issues)

### 1. Two icon libraries with no separation of concern
Lucide (`lucide-react`) and React Icons (`react-icons/md`) are both used across the codebase with no rule about which to use where. The same screen can use both. New screens should standardize on Lucide (declared as the shadcn icon library), but existing `react-icons` usage would need migration.

### 2. Auth screens bypass the design token system
Forgot password, verify OTP, reset password, and parts of the register flow use raw `slate-*` Tailwind classes instead of semantic tokens (`bg-background`, `text-foreground`, `border-border`). These screens will **not** respond correctly if dark mode is ever activated.

### 3. Inconsistent border radius on inputs
- LoginForm inputs: `rounded-[12px]` (hardcoded 12px)
- Register inputs: `rounded-xl` (12px via Tailwind, same value but different syntax)
- Forgot/Reset/OTP inputs: `rounded-2xl` (16px)
- shadcn Button default: `rounded-lg` (10px via `--radius`)
- The system token is `--radius: 0.625rem` (10px), but inputs ignore this and range 10–16px.

### 4. Inconsistent CTA button implementation
The shared `Button` component from `components/ui/button.tsx` is only used inside `LoginForm`. All other screens (register, forgot-password, reset-password, verify-otp) use raw `<button>` elements with inline Tailwind classes. This means button states (focus ring, disabled, aria handling) are inconsistently implemented.

### 5. Two password strength implementations
`PasswordInput` (used in LoginForm) uses a color-coded single bar (red/yellow/blue/green). The Register page implements its own 4-segment indigo bar. They use different scoring logic and different visual output.

### 6. Hardcoded hex on splash screen
`bg-[#6366F1]` on the splash screen duplicates the primary brand color as a hardcoded hex instead of using `bg-primary`. If the primary color token ever changes, the splash screen won't update.

### 7. Serif font only on dashboard, not defined as a named token
`font-serif` appears only in the dashboard. It references the browser's default serif stack, not a loaded custom font. This is likely unintentional — there is no serif font loaded in `fonts.ts`. The displayed font will be the system serif (Georgia, Times New Roman, etc.) rather than a designed choice.

### 8. `--font-geist-mono` referenced but not loaded
`globals.css` maps `--font-mono: var(--font-geist-mono)` but `fonts.ts` only loads `Geist` (sans), not `Geist Mono`. The mono token resolves to nothing at runtime.

### 9. Inline color classes circumvent the semantic palette
Dashboard uses both `bg-emerald-50` (inline) and `bg-accent` (token) for highlighted card backgrounds. Marketplace uses `bg-accent text-primary` for one condition badge but `bg-emerald-100 text-emerald-700` for another. The accent token exists precisely to avoid these inline color references.

### 10. `bg-ring` used as a background color
In the dashboard timetable card: `bg-ring text-primary-foreground` is used as a time slot background. `--ring` is an indigo-300 focus ring token, not a background color token. This produces a valid visual result but misuses the semantic token.
