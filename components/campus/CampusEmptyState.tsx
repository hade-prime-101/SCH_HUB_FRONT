import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CampusEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CampusEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: CampusEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <Icon className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button variant="link" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}