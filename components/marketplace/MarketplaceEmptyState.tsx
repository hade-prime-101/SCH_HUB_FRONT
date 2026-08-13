import { Button } from "@/components/ui/button";

interface MarketplaceEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function MarketplaceEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: MarketplaceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}