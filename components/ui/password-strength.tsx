'use client';

import React from 'react';

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface PasswordStrengthProps {
  /** Password value to evaluate */
  password: string;
  /** Optional custom label */
  label?: string;
  /** Show strength indicator bar */
  showBar?: boolean;
  /** Show strength level text */
  showLabel?: boolean;
  /** Bar display variant */
  variant?: 'bar' | 'segments';
}

interface StrengthResult {
  level: StrengthLevel;
  percentage: number;
  color: string;
  semantic: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * calculatePasswordStrength
 * 
 * Evaluates password strength based on:
 * - Length (8+ chars: +1, 12+ chars: +1)
 * - Character variety (uppercase, numbers, special chars)
 * 
 * Scoring:
 * - 0-1 points: weak (25%)
 * - 2 points: fair (50%)
 * - 3 points: good (75%)
 * - 4+ points: strong (100%)
 */
function calculatePasswordStrength(pwd: string): StrengthResult {
  if (!pwd) {
    return {
      level: 'weak',
      percentage: 0,
      color: 'bg-destructive',
      semantic: 'weak',
    };
  }

  let score = 0;

  // Length scoring (0-2 points)
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;

  // Character variety scoring (0-2 points)
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1;

  // Determine strength level
  let level: StrengthLevel;
  let percentage: number;
  let color: string;

  if (score <= 1) {
    level = 'weak';
    percentage = 25;
    color = 'bg-destructive';
  } else if (score === 2) {
    level = 'fair';
    percentage = 50;
    color = 'bg-warning';
  } else if (score === 3) {
    level = 'good';
    percentage = 75;
    color = 'bg-info';
  } else {
    level = 'strong';
    percentage = 100;
    color = 'bg-success';
  }

  return { level, percentage, color, semantic: level };
}

/**
 * PasswordStrength Component
 * 
 * Displays password strength indicator with visual feedback.
 * Uses semantic design tokens for strength colors.
 * 
 * Variants:
 * - **bar:** Single progress bar (default)
 * - **segments:** 4 filled segments
 * 
 * Strength Levels:
 * - **Weak:** < 2 points (red/destructive)
 * - **Fair:** 2 points (orange/warning)
 * - **Good:** 3 points (blue/info)
 * - **Strong:** 4+ points (green/success)
 * 
 * @example
 * ```tsx
 * const [password, setPassword] = useState('');
 * <Input
 *   type="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 * <PasswordStrength password={password} variant="bar" />
 * ```
 */
const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({
    password,
    label = 'Password strength:',
    showBar = true,
    showLabel = true,
    variant = 'bar',
  }, ref) => {
    const strength = calculatePasswordStrength(password);

    if (!password) {
      return null;
    }

    return (
      <div ref={ref} className="space-y-1.5">
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <span className={`text-xs font-semibold capitalize ${
              strength.level === 'weak' ? 'text-destructive' :
              strength.level === 'fair' ? 'text-warning' :
              strength.level === 'good' ? 'text-info' :
              'text-success'
            }`}>
              {strength.level}
            </span>
          </div>
        )}

        {showBar && variant === 'bar' && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-300`}
              style={{ width: `${strength.percentage}%` }}
              role="progressbar"
              aria-valuenow={strength.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Password strength: ${strength.level}`}
            />
          </div>
        )}

        {showBar && variant === 'segments' && (
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((segment) => (
              <div
                key={segment}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  segment * 25 <= strength.percentage
                    ? strength.color
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

PasswordStrength.displayName = 'PasswordStrength';

export { PasswordStrength, calculatePasswordStrength, type StrengthLevel };
