import React from 'react';
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CommunityHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent header for all community pages.
 * Displays a title, optional description, and an optional action (e.g., "Create Post").
 */
export function CommunityHeader({
  title,
  description,
  action,
  className,
}: CommunityHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}