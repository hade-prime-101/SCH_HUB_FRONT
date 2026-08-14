import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again later.",
  onRetry,
  primaryAction,
  secondaryAction,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
      <div className="flex flex-wrap gap-3 mt-6">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try again
          </Button>
        )}
        {primaryAction && (
          <Button asChild variant="default">
            <a href={primaryAction.href} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </a>
          </Button>
        )}
        {secondaryAction && (
          <Button asChild variant="outline">
            <a href={secondaryAction.href} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}