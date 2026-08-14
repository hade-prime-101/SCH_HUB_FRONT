"use client";

import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface GPSPermissionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export function GPSPermissionModal({
  isOpen,
  isLoading,
  onRequestPermission,
  onDismiss,
}: GPSPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enable location services to:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Find your current position on the map</li>
            <li>Get walking directions to any campus building</li>
            <li>See the nearest entrances and facilities</li>
            <li>Navigate with turn-by-turn guidance</li>
          </ul>
          <p className="text-xs text-muted-foreground/70">
            Your location data stays on your device and is never stored.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
          <Button variant="outline" onClick={onDismiss} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={onRequestPermission} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              "Enable Location"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}