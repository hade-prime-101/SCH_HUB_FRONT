# React Icons → Lucide React Migration Mapping

## Overview

This document maps all Material Design icons (react-icons/md) to their Lucide React equivalents.

**Migration Strategy:**
- Preserve semantic meaning and visual weight
- Maintain current icon sizes (5px, 6px, 8px)
- Use identical color tokens
- Keep accessibility labels unchanged

---

## Icon Mappings

### Form & Input Icons

| React Icon | Semantic Purpose | Lucide Equivalent | Notes |
|------------|------------------|------------------|-------|
| `MdOutlineEmail` | Email field label | `Mail` | Outline style matches |
| `MdEmail` | Email field label | `Mail` | Same semantic |
| `MdPhone` | Phone field label | `Phone` | Direct equivalent |
| `MdLock` | Password field label | `Lock` | Direct equivalent |
| `MdPerson` | Name field label | `User` | Direct equivalent |
| `MdBadge` | ID/Badge field label | `Badge` | Direct equivalent |
| `MdSchool` | School/Education select | `GraduationCap` | More semantic than `Building2` |
| `MdSearch` | Search input icon | `Search` | Direct equivalent |

### Visibility & Toggle Icons

| React Icon | Semantic Purpose | Lucide Equivalent | Notes |
|------------|------------------|------------------|-------|
| `MdVisibility` | Show password | `Eye` | Direct equivalent |
| `MdVisibilityOff` | Hide password | `EyeOff` | Direct equivalent |

### Navigation & Selection Icons

| React Icon | Semantic Purpose | Lucide Equivalent | Notes |
|------------|------------------|------------------|-------|
| `MdArrowBack` | Back button | `ArrowLeft` | Navigate back |
| `MdCheckCircle` | Selected/Confirmed item | `CheckCircle2` | Direct equivalent with stroke style |
| `MdNavigateNext` | Next/Forward indicator | `ChevronRight` | Indicates forward direction |
| `MdDownload` | Faculty/Category icon | `Download` | Used as category indicator (visual placeholder) |

### Status & Feedback Icons

| React Icon | Semantic Purpose | Lucide Equivalent | Notes |
|------------|------------------|------------------|-------|
| `MdError` | Error message icon | `AlertCircle` | Error/warning indication |
| `MdFingerprint` | Biometric auth button | `Fingerprint` | Direct equivalent |

---

## Size Mapping

| React Icons Size | Tailwind Class | Lucide Equivalent |
|-----------------|--------|----------|
| 5px (default) | `w-5 h-5` | `size-5` |
| 6px (checked) | `w-6 h-6` | `size-6` |
| 8px (feature) | `w-8 h-8` | `size-8` |

**Note:** Lucide uses `size-*` utility which is equivalent to `w-* h-*` in Tailwind.

---

## Color Token Mapping

All colors remain unchanged - they use semantic design tokens:

```
text-muted-foreground  → stays text-muted-foreground
text-primary           → stays text-primary
text-destructive       → stays text-destructive
text-foreground        → stays text-foreground
```

---

## Implementation Notes

### Stroke vs Fill

- **React Icons (Material):** Filled icons
- **Lucide React:** Stroke-based (outline) icons

This is intentional per migration specification:
> "Do not mix filled Material icons with Lucide icons after migration unless there is a specific, documented reason."

All Lucide icons in Loopz will be stroke-based for visual consistency.

### Visual Weight Preservation

Lucide stroke-based icons maintain similar visual prominence as Material filled icons when sized appropriately. No additional adjustment needed.

### Icon Naming Convention

Lucide uses PascalCase with more descriptive names:
- `MdEmail` → `Mail`
- `MdArrowBack` → `ArrowLeft`
- `MdCheckCircle` → `CheckCircle2` (Lucide v2 style)

---

## Files Affected

### Direct React Icon Imports

1. `components/shared/LoginForm.tsx` - `MdOutlineEmail`
2. `components/ui/PasswordInput.tsx` - `MdVisibility`, `MdVisibilityOff`
3. `components/ui/ErrorMessage.tsx` - `MdError`
4. `components/shared/SearchInput.tsx` - `MdSearch`
5. `components/shared/SelectionList.tsx` - `MdCheckCircle`, `MdNavigateNext`
6. `app/login/page.tsx` - `MdFingerprint`, `MdCheckCircle`
7. `app/register/page.tsx` - `MdArrowBack`, `MdSchool`, `MdDownload`, `MdBadge`, `MdPerson`, `MdEmail`, `MdPhone`, `MdLock`, `MdVisibility`, `MdVisibilityOff`, `MdCheckCircle`, `MdNavigateNext`

### No Changes Required

- ProgressDots: Already uses Lucide
- Other dashboard/admin pages: Already using Lucide

---

## Migration Completion Checklist

- [ ] Replace `MdOutlineEmail` with `Mail`
- [ ] Replace `MdEmail` with `Mail`
- [ ] Replace `MdPhone` with `Phone`
- [ ] Replace `MdLock` with `Lock`
- [ ] Replace `MdPerson` with `User`
- [ ] Replace `MdBadge` with `Badge`
- [ ] Replace `MdSchool` with `GraduationCap`
- [ ] Replace `MdSearch` with `Search`
- [ ] Replace `MdVisibility` with `Eye`
- [ ] Replace `MdVisibilityOff` with `EyeOff`
- [ ] Replace `MdArrowBack` with `ArrowLeft`
- [ ] Replace `MdCheckCircle` with `CheckCircle2`
- [ ] Replace `MdNavigateNext` with `ChevronRight`
- [ ] Replace `MdDownload` with `Download`
- [ ] Replace `MdError` with `AlertCircle`
- [ ] Replace `MdFingerprint` with `Fingerprint`
- [ ] Remove all `from 'react-icons/md'` imports
- [ ] Add `from 'lucide-react'` imports
- [ ] Verify typecheck passes
- [ ] Verify lint passes
- [ ] Verify build succeeds
- [ ] Remove react-icons dependency

---

## Exceptions & Special Cases

**None documented.** All React Icons have clear Lucide equivalents.

---

## References

- [Lucide React Documentation](https://lucide.dev)
- [Lucide Icon Showcase](https://lucide.dev/icons/)
- [Material Design Icons (reference only)](https://fonts.google.com/icons)
