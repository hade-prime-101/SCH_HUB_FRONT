
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/AuthProvider";
import { LoadingState } from "@/components/shared/DashboardPrimitives";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If authentication check is complete and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state while authentication is initialising
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Checking authentication..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}