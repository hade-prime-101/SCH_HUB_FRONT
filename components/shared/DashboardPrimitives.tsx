import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// SectionHeader
// -----------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  action?: string;
  href?: string;
}

export function SectionHeader({
  title,
  action = "View all",
  href,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>

      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-primary text-sm font-medium shrink-0"
        >
          <span>{action}</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// LoadingState
// -----------------------------------------------------------------------------

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Loading",
}: LoadingStateProps) {
  return (
    <div
      className="flex justify-center py-6"
      role="status"
      aria-label={label}
    >
      <Loader2
        className="w-5 h-5 animate-spin text-muted-foreground"
        aria-hidden="true"
      />

      <span className="sr-only">{label}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// EmptyState
// -----------------------------------------------------------------------------

interface EmptyStateProps {
  children: ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <p className="text-sm text-muted-foreground py-2">
      {children}
    </p>
  );
}

