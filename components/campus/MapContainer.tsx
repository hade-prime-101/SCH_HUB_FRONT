import { MapPin } from "lucide-react";
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useMapStore } from "@/lib/map/state/store";
import {
  mapLocationService,
  mapEntranceService,
  mapRoutingService,
  mapCategoryService,
  mapConfigService,
} from "@/lib/map/services";
import { useGPSTracking } from "@/lib/map/hooks";
import { isMapLocation } from "@/lib/map/utils";
import { LocationType } from "@/lib/map/types/location";
import MapCanvas from "./MapCanvas";
import { MapHeader } from "./MapHeader";
import { LocationPanel } from "./LocationPanel";
import NavigationPanel from "./NavigationPanel";
import { FloatingControls } from "./FloatingControls";
import { GPSPermissionModal } from "./GPSPermissionModal";
import { GPSPermissionBanner } from "./GPSPermissionBanner";

export default function MapContainer() {
  const router = useRouter();
  const initRef = useRef(false);

  // GPS tracking
  const {
    position: gpsPosition,
    isTracking,
    permissionState: gpsPermissionState,
    error: gpsError,
    requestPermission: requestGPSPermission,
    startTracking,
    stopTracking,
  } = useGPSTracking(true, 10000, 0);

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Zustand store
  const {
    camera,
    setCamera,
    animateToCamera,
    resetCamera,
    locations,
    filteredLocations,
    selectedLocation,
    setLocations,
    setFilteredLocations,
    setSelectedLocation,
    setSelectedEntrance,
    clearSelection,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError,
    viewMode,
    setViewMode,
    showLocationPanel,
    setShowLocationPanel,
    isCompactMode,
    setIsCompactMode,
    position: userPosition,
    setPosition: setUserPosition,
    isFollowing,
    setIsFollowing,
    setLocationPermission,
    currentRoute,
    setCurrentRoute,
    isNavigating,
    setIsNavigating,
    navigationError,
    setNavigationError,
  } = useMapStore();

  // ─── Initialization ───────────────────────────────────────────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (gpsPermissionState === "unknown" || gpsPermissionState === "prompt") {
          setShowPermissionModal(true);
        } else if (gpsPermissionState === "denied") {
          setShowPermissionBanner(true);
        }

        const [config, categories] = await Promise.all([
          mapConfigService.getMapConfig(),
          mapCategoryService.getCategories(),
        ]);

        resetCamera({
          center: config.defaultCenter,
          zoom: config.defaultZoom,
          pitch: config.defaultPitch,
          bearing: config.defaultBearing,
        });

        const initialLocations = await mapLocationService.getLocations();
        setLocations(initialLocations);
        setFilteredLocations(initialLocations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize map");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // ─── GPS sync ────────────────────────────────────────────────────

  useEffect(() => {
    if (gpsPosition) setUserPosition(gpsPosition);
  }, [gpsPosition, setUserPosition]);

  useEffect(() => {
    setLocationPermission(gpsPermissionState);
  }, [gpsPermissionState, setLocationPermission]);

  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      await requestGPSPermission();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [requestGPSPermission]);

  useEffect(() => {
    if (gpsPermissionState === "granted") {
      setShowPermissionModal(false);
      setShowPermissionBanner(false);
    }
  }, [gpsPermissionState]);

  // ─── Search & Filter ──────────────────────────────────────────────

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        const filtered =
          activeFilter === "ALL"
            ? locations
            : locations.filter((loc) => loc.type === activeFilter);
        setFilteredLocations(filtered);
        return;
      }
      try {
        setIsLoading(true);
        const results = await mapLocationService.searchLocations({
          query,
          category: activeFilter === "ALL" ? undefined : activeFilter,
          userLocation: userPosition || undefined,
          limit: 50,
        });
        setFilteredLocations(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setFilteredLocations([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchQuery, activeFilter, locations, userPosition, setFilteredLocations, setIsLoading, setError]
  );

  const handleFilterChange = useCallback(
    async (filter: string) => {
      setActiveFilter(filter as LocationType | "ALL");
      setSearchQuery("");
      try {
        setIsLoading(true);
        if (filter === "ALL") {
          setFilteredLocations(locations);
        } else {
          const filtered = locations.filter((loc) => loc.type === filter);
          setFilteredLocations(filtered);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [setActiveFilter, setSearchQuery, locations, setFilteredLocations, setIsLoading]
  );

  // ─── Location Selection ──────────────────────────────────────────

  const handleSelectLocation = useCallback(
    async (location: any) => {
      setSelectedLocation(location);
      setShowLocationPanel(true);
      if (!isMapLocation(location)) return;
      animateToCamera({
        center: [location.longitude, location.latitude],
        zoom: Math.max(camera.zoom, 17),
        pitch: camera.pitch,
        bearing: camera.bearing,
      });
      try {
        const entrances = await mapEntranceService.getEntrances(location.id, location);
        if (entrances.length > 0) {
          const best = await mapEntranceService.selectBestEntrance(
            location.id,
            location,
            { userLocation: userPosition || undefined }
          );
          if (best) setSelectedEntrance(best);
        }
      } catch (err) {
        console.warn(err);
      }
    },
    [setSelectedLocation, setShowLocationPanel, animateToCamera, camera, userPosition, setSelectedEntrance]
  );

  const handleDeselectLocation = useCallback(() => {
    clearSelection();
    setShowLocationPanel(false);
  }, [clearSelection, setShowLocationPanel]);

  // ─── Navigation ──────────────────────────────────────────────────

  const handleStartNavigation = useCallback(async () => {
    if (!selectedLocation || !userPosition) {
      setNavigationError("Missing location or user position");
      return;
    }
    try {
      setIsNavigating(true);
      setNavigationError(null);
      const route = await mapRoutingService.calculateRouteToLocation(
        userPosition,
        selectedLocation
      );
      if (!route) {
        setNavigationError("Unable to calculate route");
        setIsNavigating(false);
        return;
      }
      setCurrentRoute(route);
      if (!isTracking) startTracking();
      setViewMode("navigate");
    } catch (err) {
      setNavigationError(err instanceof Error ? err.message : "Navigation failed");
      setIsNavigating(false);
    }
  }, [selectedLocation, userPosition, setIsNavigating, setNavigationError, setCurrentRoute, isTracking, startTracking, setViewMode]);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentRoute(null);
    setViewMode("map");
  }, [setIsNavigating, setCurrentRoute, setViewMode]);

  const handleRecenter = useCallback(() => {
    if (!userPosition) {
      setError("User location not available");
      return;
    }
    animateToCamera({
      center: [userPosition.lng, userPosition.lat],
      zoom: 17,
      pitch: 45,
      bearing: -10,
    });
    setIsFollowing(true);
  }, [userPosition, animateToCamera, setIsFollowing, setError]);

  const handleToggleFollowMode = useCallback(() => {
    setIsFollowing(!isFollowing);
  }, [isFollowing, setIsFollowing]);

  // ─── Responsive ──────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      setIsCompactMode(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCompactMode]);

  // ─── Render ──────────────────────────────────────────────────────

  if (isLoading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading campus map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GPSPermissionModal
        isOpen={showPermissionModal}
        isLoading={isRequestingPermission}
        onRequestPermission={handleRequestPermission}
        onDismiss={() => {
          setShowPermissionModal(false);
          if (gpsPermissionState !== "granted") setShowPermissionBanner(true);
        }}
      />

      {showPermissionBanner && (
        <GPSPermissionBanner
          permissionState={gpsPermissionState}
          isLoading={isRequestingPermission}
          onRequestPermission={handleRequestPermission}
          onDismiss={() => setShowPermissionBanner(false)}
        />
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 bg-destructive/10 text-destructive px-4 py-3 border-b border-destructive/20 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => clearError()}
            className="text-xs font-medium hover:opacity-70"
          >
            Dismiss
          </button>
        </div>
      )}

      {viewMode === "map" && (
        <>
          <MapHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isLoading={isLoading}
          />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative">
              <MapCanvas
                locations={filteredLocations.filter(isMapLocation)}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                userLocation={userPosition || undefined}
                currentRoute={currentRoute}
              />
              <FloatingControls />
              {filteredLocations.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <MapPin className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No locations found
                  </p>
                </div>
              )}
            </div>
            {!isCompactMode && showLocationPanel && selectedLocation && (
              <LocationPanel
                location={selectedLocation}
                onNavigate={handleStartNavigation}
                onClose={handleDeselectLocation}
              />
            )}
          </div>
          {isCompactMode && showLocationPanel && selectedLocation && (
            <div className="fixed inset-x-0 bottom-0 z-30">
              <LocationPanel
                location={selectedLocation}
                onNavigate={handleStartNavigation}
                onClose={handleDeselectLocation}
              />
            </div>
          )}
        </>
      )}

      {viewMode === "navigate" && currentRoute && (
        <NavigationPanel
          route={currentRoute}
          userLocation={userPosition || undefined}
          onStop={handleStopNavigation}
          onExit={() => setViewMode("map")}
        />
      )}
    </div>
  );
}