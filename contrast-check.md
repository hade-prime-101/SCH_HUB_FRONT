# Accessibility Contrast Analysis

Based on the color tokens defined in globals.css, here's an analysis of key contrast ratios:

## Light Mode Contrast Analysis

### Text Contrast
1. **Primary Text** (`--text-primary: oklch(0.145 0 0)` on `--background: oklch(1 0 0)`)
   - Foreground: L=14.5%, Background: L=100%
   - Contrast ratio: ~ 21:1 (AAA) ✅

2. **Secondary Text** (`--text-secondary: oklch(0.556 0 0)` on `--background: oklch(1 0 0)`)
   - Foreground: L=55.6%, Background: L=100%
   - Contrast ratio: ~ 4.6:1 (AA) ✅

3. **Muted Text** (`--text-muted: oklch(0.708 0 0)` on `--background: oklch(1 0 0)`)
   - Foreground: L=70.8%, Background: L=100%
   - Contrast ratio: ~ 2.5:1 (Fail for normal text, OK for large text) ⚠️

### Button Contrast
1. **Primary Button** (`--primary-foreground: oklch(1 0 0)` on `--primary: oklch(0.585 0.233 277.117)`)
   - Text: L=100%, Background: L=58.5%
   - Contrast ratio: ~ 5.8:1 (AA) ✅

2. **Destructive Button** (`text-white` on `--destructive: oklch(0.577 0.245 27.325)`)
   - Text: L=100%, Background: L=57.7%
   - Contrast ratio: ~ 6.0:1 (AA) ✅

### Border & Input Contrast
1. **Border** (`--border: oklch(0.922 0 0)` on `--background: oklch(1 0 0)`)
   - Border: L=92.2%, Background: L=100%
   - Contrast ratio: ~ 1.2:1 (Low for visibility) ⚠️

2. **Input background** (`--input: oklch(0.922 0 0)` on `--background: oklch(1 0 0)`)
   - Input: L=92.2%, Background: L=100%
   - Contrast ratio: ~ 1.2:1 (Low differentiation) ⚠️

### Focus Ring
1. **Focus Ring** (`--focus-ring: oklch(0.785 0.115 274.713)` on `--background: oklch(1 0 0)`)
   - Focus ring: L=78.5%, Background: L=100%
   - Contrast ratio: ~ 1.6:1 (Low visibility) ⚠️

## Dark Mode Contrast Analysis

### Text Contrast
1. **Primary Text** (`--text-primary: oklch(0.985 0 0)` on `--background: oklch(0.145 0 0)`)
   - Foreground: L=98.5%, Background: L=14.5%
   - Contrast ratio: ~ 21:1 (AAA) ✅

2. **Secondary Text** (`--text-secondary: oklch(0.708 0 0)` on `--background: oklch(0.145 0 0)`)
   - Foreground: L=70.8%, Background: L=14.5%
   - Contrast ratio: ~ 7.0:1 (AAA) ✅

3. **Muted Text** (`--text-muted: oklch(0.556 0 0)` on `--background: oklch(0.145 0 0)`)
   - Foreground: L=55.6%, Background: L=14.5%
   - Contrast ratio: ~ 5.4:1 (AA) ✅

### Button Contrast
1. **Primary Button** (`--primary-foreground: oklch(1 0 0)` on `--primary: oklch(0.673 0.182 276.935)`)
   - Text: L=100%, Background: L=67.3%
   - Contrast ratio: ~ 3.8:1 (AA for large text, borderline for normal) ⚠️

2. **Destructive Button** (`text-white` on `--destructive: oklch(0.704 0.191 22.216)`)
   - Text: L=100%, Background: L=70.4%
   - Contrast ratio: ~ 3.2:1 (Fail for normal text) ❌

### Border & Input Contrast
1. **Border** (`--border: oklch(1 0 0 / 10%)` on `--background: oklch(0.145 0 0)`)
   - Border: ~L=24% (10% opacity of white), Background: L=14.5%
   - Contrast ratio: ~ 1.3:1 (Very low) ❌

2. **Input background** (`--input: oklch(1 0 0 / 15%)` on `--background: oklch(0.145 0 0)`)
   - Input: ~L=27% (15% opacity of white), Background: L=14.5%
   - Contrast ratio: ~ 1.5:1 (Low differentiation) ❌

### Focus Ring
1. **Focus Ring** (`--focus-ring: oklch(0.673 0.182 276.935)` on `--background: oklch(0.145 0 0)`)
   - Focus ring: L=67.3%, Background: L=14.5%
   - Contrast ratio: ~ 4.5:1 (AA) ✅

## Key Issues Identified:

1. **Light Mode**: 
   - Muted text contrast (2.5:1) fails AA for normal text
   - Border and input contrast very low (1.2:1)
   - Focus ring visibility low (1.6:1)

2. **Dark Mode**:
   - Primary button contrast borderline (3.8:1)
   - Destructive button fails (3.2:1)
   - Border contrast very low (~1.3:1)
   - Input background contrast low (1.5:1)

## Recommendations:

1. **Increase border contrast** in both modes
2. **Improve input background differentiation**
3. **Adjust destructive button color** in dark mode for better contrast
4. **Consider increasing focus ring contrast** in light mode
5. **Review muted text** for better readability

The design system prioritizes aesthetic consistency over accessibility in some areas, particularly borders and subtle UI elements.