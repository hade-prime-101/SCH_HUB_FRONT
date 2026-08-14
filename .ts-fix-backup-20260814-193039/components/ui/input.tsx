import * as React from "react";


export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input
          ref={ref}
          className={className}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Leading icon element */
  leadingIcon?: React.ReactNode;
  /** Trailing icon element */
  trailingIcon?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
}

/**
 * Input Component
 * 
 * Canonical form input primitive with semantic token styling.
 * Supports leading/trailing icons, error states, and labels.
 * 
 * Features:
 * - Normal, focus, error, and disabled states
 * - Optional leading and trailing icons
 * - Semantic design tokens for colors
 * - Full accessibility support
 * - Type-safe with React.InputHTMLAttributes
 * 
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   placeholder="Enter email"
 *   label="Email Address"
 *   leadingIcon={<Mail />}
 *   error={errors.email}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    leadingIcon,
    trailingIcon,
    error,
    label,
    helperText,
    disabled,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Leading Icon */}
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-foreground">
              {leadingIcon}
            </div>
          )}

          {/* Input Element */}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={`
              w-full px-3 py-2.5 rounded-lg border transition-colors
              text-foreground placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leadingIcon ? 'pl-10' : ''}
              ${trailingIcon ? 'pr-10' : ''}
              ${
                hasError
                  ? 'border-destructive/50 bg-destructive/5 focus:ring-destructive/50'
                  : 'border-border bg-background focus:border-primary'
              }
              ${className || ''}
            `}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {/* Trailing Icon */}
          {trailingIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-foreground">
              {trailingIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !hasError && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
