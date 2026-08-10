"use client";

import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
  className,
  "aria-label": ariaLabel = "Refresh",
}: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`relative w-10 h-10 rounded-full bg-card flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform ${className ?? ""}`}
    >
      {/* Expanding ring — only visible while loading */}
      {loading && (
        <span className="absolute inset-0 rounded-full bg-primary/15 animate-refresh-ring" />
      )}

      {/* Icon */}
      <RefreshCw
        className={`w-4 h-4 transition-colors ${
          loading ? "text-primary animate-refresh" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}
