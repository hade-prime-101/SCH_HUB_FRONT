'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * PasswordInput Component
 * 
 * Provides a password input field with:
 * - Toggle visibility with eye icon
 * - Password strength indicator
 * - Error display
 * - Accessibility support
 * 
 * @example
 * ```tsx
 * const [password, setPassword] = useState('');
 * <PasswordInput
 *   value={password}
 *   onChange={setPassword}
 *   error={errors.password}
 *   placeholder="Enter password"
 * />
 * ```
 */
export function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter password',
  error,
  name = 'password',
  id,
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const calculateStrength = (pwd: string): {
    level: 'weak' | 'fair' | 'good' | 'strong';
    percentage: number;
    color: string;
  } => {
    if (!pwd) {
      return { level: 'weak', percentage: 0, color: 'bg-muted' };
    }

    let score = 0;

    // Length scoring (0-2 points)
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    // Character variety scoring (0-3 points)
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1;

    // Determine strength level
    let level: 'weak' | 'fair' | 'good' | 'strong';
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

    return { level, percentage, color };
  };

  const strength = calculateStrength(value);

  return (
    <div className="space-y-2">
      {/* Password Input */}
      <div className="relative">
        <input
          id={id || name}
          type={showPassword ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full px-4 py-2.5 pr-12 rounded-lg border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition ${
            error
              ? 'border-destructive bg-destructive/5 focus:ring-destructive/20'
              : 'border-border bg-background focus:ring-primary/20 focus:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {/* Toggle Visibility Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:cursor-not-allowed"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Strength Indicator */}
      {value && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Password strength:</span>
            <span className={`text-xs font-medium capitalize ${
              strength.level === 'weak' ? 'text-destructive' :
              strength.level === 'fair' ? 'text-warning' :
              strength.level === 'good' ? 'text-info' :
              'text-success'
            }`}>
              {strength.level}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-300`}
              style={{ width: `${strength.percentage}%` }}
              role="progressbar"
              aria-valuenow={strength.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
