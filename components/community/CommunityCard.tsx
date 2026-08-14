import { ReactNode } from "react";
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Elevated card used consistently across community pages.
 * Supports optional click handler for interactivity.
 */
export function CommunityCard({ children, className, onClick }: CommunityCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}