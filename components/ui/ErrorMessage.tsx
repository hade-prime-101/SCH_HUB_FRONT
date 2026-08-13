import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

/**
 * ErrorMessage Component
 * 
 * Displays an error message with destructive semantic styling.
 * Uses design tokens for color consistency across light and dark modes.
 * 
 * @example
 * ```tsx
 * <ErrorMessage message="Failed to create account" />
 * ```
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      <p className="text-destructive text-sm">{message}</p>
    </div>
  );
}
