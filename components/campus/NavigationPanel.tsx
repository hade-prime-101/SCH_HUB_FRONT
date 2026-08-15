"use client";

import { useEffect, useState } from "react";
import { X, StopCircle, Clock, Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NavigationMapView from "./NavigationMapView";
import { mapRoutingService } from "@/lib/map/services";
import { formatDistance, formatDuration } from "@/lib/map/utils/distance";
import type { Route, RouteProgress } from "@/lib/map/types/route";

interface NavigationPanelProps {
  route: Route;
  userLocation?: { lat: number; lng: number };
  onStop: () => void;
  onExit: () => void;
}

export default function NavigationPanel({
  route,
  userLocation,
  onStop,
  onExit,
}: NavigationPanelProps) {
  const [progress, setProgress] = useState<RouteProgress | null>(null);
  const [nearestVertexIdx, setNearestVertexIdx] = useState(0);
  const destination = route.destination;

  // Update progress when user location changes
  useEffect(() => {
    if (!userLocation) return;

    const newProgress = mapRoutingService.calculateRouteProgress(
      route,
      userLocation,
      5 // accuracy in meters
    );
    setProgress(newProgress);

    // Compute nearest vertex index from geometry (simplified fallback)
    const coords = route.geometry.coordinates;
    let minDist = Infinity;
    let idx = 0;
    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      const d = Math.hypot(lat - userLocation.lat, lng - userLocation.lng);
      if (d < minDist) {
        minDist = d;
        idx = i;
      }
    }
    setNearestVertexIdx(idx);
  }, [userLocation, route]);

  const remainingDistance = progress?.distanceToEnd ?? route.distance;
  const remainingDuration = progress?.durationToEnd ?? route.duration;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background">
      {/* Full-screen map background */}
      <div className="flex-1 relative">
        <NavigationMapView
          routeGeometry={route.geometry}
          userPosition={userLocation ?? null}
          nearestVertexIdx={nearestVertexIdx}
          destination={destination}
        />

        {/* Overlay controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={onExit}
            aria-label="Exit navigation"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Bottom sheet */}
        <Card className="absolute bottom-0 left-0 right-0 max-h-[50%] rounded-t-xl shadow-lg border-t border-border overflow-y-auto">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Navigation</h3>
                <p className="text-sm text-muted-foreground">
                  {route.destination.name || "Destination"}
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={onStop}>
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>

            {/* Progress stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-md p-2 flex items-center gap-2">
                <Footprints className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium">{formatDistance(remainingDistance)}</p>
                </div>
              </div>
              <div className="bg-muted rounded-md p-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{formatDuration(remainingDuration)}</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            {route.steps && route.steps.length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-1">Turn-by-turn</p>
                <ol className="space-y-1 text-sm">
                  {route.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[1.5rem]">
                        {idx + 1}.
                      </span>
                      <span>
                        {step.instruction}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatDistance(step.distance)})
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Follow the blue route to your destination.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}