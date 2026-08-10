# Icon Reference Guide

Quick reference for icons used in the application.

## Quick Import

```typescript
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdFingerprint,
  MdArrowBack,
  MdSearch,
  MdCheckCircle,
  MdNavigateNext,
  MdPerson,
  MdPhone,
  MdBadge,
  MdSchool,
  MdDownload,
  MdOutlineEmail,
} from 'react-icons/md';
```

## Icon Catalog

### Authentication Icons
| Icon | Component | Usage | Size |
|------|-----------|-------|------|
| 📧 | `MdOutlineEmail` | Email input field | `w-5 h-5` |
| 🔒 | `MdLock` | Password/shield | `w-5 h-5` |
| 👁️ | `MdVisibility` | Show password | `w-5 h-5` |
| 👁️‍🗨️ | `MdVisibilityOff` | Hide password | `w-5 h-5` |
| 🔐 | `MdFingerprint` | Biometric auth | `w-5 h-5` |

### Navigation Icons
| Icon | Component | Usage | Size |
|------|-----------|-------|------|
| ← | `MdArrowBack` | Go back button | `w-6 h-6` |
| → | `MdNavigateNext` | Next/arrow right | `w-6 h-6` |
| 🔍 | `MdSearch` | Search field | `w-5 h-5` |

### Selection Icons
| Icon | Component | Usage | Size |
|------|-----------|-------|------|
| ✓ | `MdCheckCircle` | Selected item | `w-6 h-6` |

### Form Icons
| Icon | Component | Usage | Size |
|------|-----------|-------|------|
| 👤 | `MdPerson` | Full name | `w-5 h-5` |
| 📧 | `MdEmail` | Email field | `w-5 h-5` |
| ☎️ | `MdPhone` | Phone number | `w-5 h-5` |
| 🆔 | `MdBadge` | Matriculation/ID | `w-5 h-5` |
| 🎓 | `MdSchool` | Level/School | `w-5 h-5` |

### Selection List Icons
| Icon | Component | Usage | Size |
|------|-----------|-------|------|
| 🎓 | `MdSchool` | School option | `w-8 h-8` |
| 📄 | `MdDownload` | Faculty option | `w-8 h-8` |
| 🆔 | `MdBadge` | Department option | `w-8 h-8` |

## Usage Examples

### In Input Fields
```typescript
<div className="relative">
  <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input type="password" className="pl-12" />
</div>
```

### In Buttons
```typescript
<button className="flex items-center gap-2">
  <MdFingerprint className="w-5 h-5" />
  Use Biometrics
</button>
```

### Conditional Rendering
```typescript
{showPassword ? (
  <MdVisibility className="w-5 h-5" />
) : (
  <MdVisibilityOff className="w-5 h-5" />
)}
```

### With Colors
```typescript
<MdCheckCircle className="w-6 h-6 text-indigo-600" />
<MdLock className="w-5 h-5 text-slate-400" />
```

### With Animation
```typescript
<MdFingerprint className="w-5 h-5 animate-spin" />
```

## Size Guide

```
Icon Size Classes:
w-4 h-4   = 16px  (small)
w-5 h-5   = 20px  (form fields)
w-6 h-6   = 24px  (navigation)
w-8 h-8   = 32px  (list items)
w-10 h-10 = 40px  (large)
```

## Color Classes

```
Text Color (inherited):
text-slate-400  = Gray (disabled/hint)
text-slate-600  = Darker gray (hover)
text-slate-900  = Black (active)
text-indigo-600 = Blue (primary)
text-green-500  = Green (success)
text-red-500    = Red (error)
```

## Common Patterns

### Icon in Input
```typescript
<div className="relative">
  <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input className="pl-12" />
</div>
```

### Icon in Button
```typescript
<button className="flex items-center justify-center gap-2">
  <MdFingerprint className="w-5 h-5" />
  Text
</button>
```

### Icon with Hover State
```typescript
<MdLock className="w-5 h-5 text-slate-400 hover:text-slate-600 transition" />
```

### Icon Toggle
```typescript
<button onClick={() => setShow(!show)}>
  {show ? <MdVisibility /> : <MdVisibilityOff />}
</button>
```

### Icon List Item
```typescript
<div className="flex items-center gap-3">
  <MdSchool className="w-8 h-8 text-indigo-600" />
  <div>
    <h3>Item Name</h3>
    <p>Subtitle</p>
  </div>
</div>
```

## Finding More Icons

Visit [react-icons.github.io](https://react-icons.github.io/react-icons/) to:
1. Browse all available icons
2. Search by name
3. Preview different sizes
4. See icon names

## Icon Naming Convention

Material Design icons follow this pattern:
- `Md` = Material Design pack prefix
- Example: `MdLock`, `MdEmail`, `MdSearch`

If you need icons from other packs:
- `Fa` for FontAwesome: `FaLock`, `FaEnvelope`
- `Hi` for Heroicons: `HiLock`, `HiMail`
- `Ri` for Remix: `RiLockLine`, `RiMailLine`

## Performance Tips

✅ **DO:**
- Import only icons you use
- Use tree-shaking friendly imports
- Reuse icon components
- Use className for sizing

❌ **DON'T:**
- Import entire icon libraries
- Dynamically import icons in loops
- Use inline styles for sizing
- Use unsupported icons

## Browser Support

React Icons works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

For more details, see `REACT_ICONS_MIGRATION.md`
