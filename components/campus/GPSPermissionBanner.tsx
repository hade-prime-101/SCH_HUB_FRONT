"use client";

import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PermissionState } from "@/lib/map/hooks/useGPSTracking";

interface GPSPermissionBannerProps {
  permissionState: PermissionState;
  isLoading: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export function GPSPermissionBanner({
  permissionState,
  isLoading,
  onRequestPermission,
  onDismiss,
}: GPSPermissionBannerProps) {
  if (permissionState === "granted") return null;

  const isDenied = permissionState === "denied";
  const isUnknown = permissionState === "unknown" || permissionState === "prompt";

  if (!isDenied && !isUnknown) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/10 backdrop-blur-sm border-b border-destructive/20 p-3 flex items-center justify-between gap-3">
      <div className="flex items-start gap-2 flex-1">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isDenied
              ? "Location access denied. Enable it in your browser settings."
              : "Location access helps you navigate the campus."}
          </p>
          {isUnknown && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap &quot;Enable&quot; to allow location sharing.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isUnknown && (
          <Button
            size="sm"
            variant="default"
            onClick={onRequestPermission}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Enable"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}