interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ count = 3, height = "h-16" }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} rounded-xl bg-slate-100 animate-pulse`}
        />
      ))}
    </div>
  );
}
