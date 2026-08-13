'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumber?: boolean;
  loading?: boolean;
}

/**
 * Pagination Component
 * 
 * Accessible pagination controls with:
 * - Keyboard navigation
 * - Proper ARIA labels
 * - Disabled state styling
 * - Optional page number display
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   onPageChange={setPage}
 *   showPageNumber
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumber = true,
  loading = false,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      className="flex items-center justify-between gap-4 py-4"
      aria-label="Pagination navigation"
    >
      <button
        onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
        disabled={!canGoPrevious || loading}
        aria-label={`Go to previous page (page ${currentPage - 1})`}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Previous</span>
      </button>

      {showPageNumber && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Page {currentPage}</span>
          {totalPages > 0 && (
            <>
              <span className="text-muted-foreground">of</span>
              <span className="font-medium">{totalPages}</span>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || loading}
        aria-label={`Go to next page (page ${currentPage + 1})`}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="text-sm font-medium">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

/**
 * Icon-only pagination buttons for compact layouts
 */
export function PaginationCompact({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination navigation">
      <button
        onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
        disabled={!canGoPrevious || loading}
        aria-label={`Go to previous page (page ${currentPage - 1})`}
        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="text-sm font-medium min-w-fit">
        Page {currentPage} of {totalPages}
      </div>

      <button
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || loading}
        aria-label={`Go to next page (page ${currentPage + 1})`}
        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}