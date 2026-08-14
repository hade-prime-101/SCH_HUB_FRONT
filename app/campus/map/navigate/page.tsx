"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/lib/map/state/store";
import NavigationPanel from "@/components/campus/NavigationPanel";
import { MapHeader } from "@/components/campus/MapHeader";
import { FloatingControls } from "@/components/campus/FloatingControls";
import { RouteProgressResult } from "@/lib/map/types/route";
import { mapRoutingService } from "@/lib/map/services";

export default function NavigatePage() {
  const { currentRoute, position, stopNavigation, setViewMode } = useMapStore();
  const [progress, setProgress] = useState<RouteProgressResult | null>(null);

  // Update progress when position changes
  useEffect(() => {
    if (!currentRoute || !position) {
      setProgress(null);
      return;
    }

    const routeProgress = mapRoutingService.calculateRouteProgress(
      currentRoute,
      position,
      5
    );
    setProgress(routeProgress);
  }, [currentRoute, position]);

  if (!currentRoute) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No active route</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background">
      <NavigationPanel
        route={currentRoute}
        userLocation={position || undefined}
        onStop={() => {
          stopNavigation();
          setViewMode("map");
        }}
        onExit={() => {
          setViewMode("map");
        }}
      />

      {/* Optional header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <MapHeader
            searchQuery=""
            onSearchChange={() => {}}
            activeFilter="ALL"
            onFilterChange={() => {}}
            isLoading={false}
          />
        </div>
      </div>

      {/* Floating controls */}
      <div className="absolute bottom-6 right-4 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <FloatingControls />
        </div>
      </div>
    </div>
  );
}