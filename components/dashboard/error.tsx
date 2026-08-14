"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="We're sorry, but we couldn't load this page. Please try again."
      onRetry={reset}
    />
  );
}