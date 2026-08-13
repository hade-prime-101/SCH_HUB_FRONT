interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  radius?: string;
}

/**
 * LoadingSkeleton Component
 * 
 * Displays loading placeholder skeletons with configurable dimensions.
 * Uses semantic muted token for consistent styling across themes.
 * 
 * @example
 * ```tsx
 * <LoadingSkeleton count={3} height="h-12" radius="rounded-lg" />
 * ```
 */
export function LoadingSkeleton({ 
  count = 3, 
  height = "h-16",
  width = "w-full",
  radius = "rounded-xl"
}: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} ${radius} bg-muted animate-pulse`}
        />
      ))}
    </div>
  );
}
