"use client";

/**
 * MapContainer — Main orchestrator for the campus map feature
 * 
 * Responsibilities:
 * - Coordinate all sub-components
 * - Manage data fetching (locations, categories, routes)
 * - Handle state synchronization via Zustand store
 * - GPS tracking and location permissions
 * - Route calculation and navigation
 * - Error boundaries and loading states
 * 
 * Does NOT handle:
 * - MapLibre GL rendering (MapCanvas)
 * - Search filtering (handled by store effects)
 * - Individual component styling
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';

import {
  useMapStore,
  mapLocationService,
  mapEntranceService,
  mapRoutingService,
  mapCategoryService,
  mapConfigService,
  MapServiceError,
  Location,
  LocationType,
  isMapLocation,
} from '@/lib/map';
import { useGPSTracking } from '@/lib/map/hooks';

import MapCanvas from './MapCanvas';
import MapHeader from './MapHeader';
import LocationPanel from './LocationPanel';
import NavigationPanel from './NavigationPanel';
import FloatingControls from './FloatingControls';
import GPSPermissionModal from './GPSPermissionModal';
import GPSPermissionBanner from './GPSPermissionBanner';

export default function MapContainer() {
  const router = useRouter();
  const initRef = useRef(false); // Prevent double initialization
  
  // GPS tracking hook
  const {
    position: gpsPosition,
    isTracking,
    permissionState: gpsPermissionState,
    error: gpsError,
    requestPermission: requestGPSPermission,
    startTracking,
    stopTracking,
  } = useGPSTracking(true, 10000, 0);

  // Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Zustand store selectors
  const {
    // Map state
    camera,
    setCamera,
    animateToCamera,
    resetCamera,

    // Locations
    locations,
    filteredLocations,
    selectedLocation,
    setLocations,
    setFilteredLocations,
    setSelectedLocation,
    setSelectedEntrance,
    clearSelection,

    // Filtering
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,

    // Loading
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError,

    // UI
    viewMode,
    setViewMode,
    showLocationPanel,
    setShowLocationPanel,
    isCompactMode,
    setIsCompactMode,
    layerSettings,

    // User location
    position: userPosition,
    setPosition: setUserPosition,
    isFollowing,
    setIsFollowing,
    setLocationPermission,

    // Navigation
    currentRoute,
    setCurrentRoute,
    isNavigating,
    setIsNavigating,
    navigationError,
    setNavigationError,

    // Categories
    activeFilter: categoryFilter,
  } = useMapStore();

  // ────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Initialize map on mount:
   * 1. Load map configuration (API keys, defaults)
   * 2. Load categories
   * 3. Load initial locations
   * 4. Setup GPS tracking
   * 5. Setup event listeners
   */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (gpsPermissionState === 'unknown' || gpsPermissionState === 'prompt') {
          setShowPermissionModal(true);
        } else if (gpsPermissionState === 'denied') {
          setShowPermissionBanner(true);
        }

        // Load configuration in parallel
        const [config, categories] = await Promise.all([
          mapConfigService.getMapConfig(),
          mapCategoryService.getCategories(),
        ]);

        // Set default camera from config
        resetCamera({
          center: config.defaultCenter,
          zoom: config.defaultZoom,
          pitch: config.defaultPitch,
          bearing: config.defaultBearing,
        });

        // Load initial locations
        const initialLocations = await mapLocationService.getLocations();
        setLocations(initialLocations);
        setFilteredLocations(initialLocations);

        setIsLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize map';
        setError(message);
        setIsLoading(false);
      }
    };

    initialize();
  }, [setIsLoading, setError, setLocations, setFilteredLocations, resetCamera, setLocationPermission, gpsPermissionState]);

  // ────────────────────────────────────────────────────────────────────────────
  // GPS LOCATION TRACKING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Sync GPS position from hook to store
   */
  useEffect(() => {
    if (gpsPosition) {
      setUserPosition(gpsPosition);
    }
  }, [gpsPosition, setUserPosition]);

  /**
   * Sync GPS permission state to store
   */
  useEffect(() => {
    setLocationPermission(gpsPermissionState);
  }, [gpsPermissionState, setLocationPermission]);

  /**
   * Handle permission request (from modal or banner)
   */
  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      await requestGPSPermission();
      // Modal will auto-close when permission state changes
    } catch (err) {
      console.error('Permission request failed:', err);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [requestGPSPermission]);

  /**
   * Handle permission modal close
   */
  const handleDismissPermissionModal = useCallback(() => {
    setShowPermissionModal(false);
    // Show banner instead if permission not granted
    if (gpsPermissionState !== 'granted') {
      setShowPermissionBanner(true);
    }
  }, [gpsPermissionState]);

  /**
   * Auto-hide permission modal when permission granted
   */
  useEffect(() => {
    if (gpsPermissionState === 'granted') {
      setShowPermissionModal(false);
      setShowPermissionBanner(false);
    }
  }, [gpsPermissionState]);

  // ────────────────────────────────────────────────────────────────────────────
  // SEARCH & FILTERING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Handle search query change
   * Debounced by Zustand action
   */
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        // No query — show all locations with current filter
        const filtered = activeFilter === 'ALL'
          ? locations
          : locations.filter(loc => loc.type === activeFilter);
        setFilteredLocations(filtered);
        return;
      }

      try {
        setIsLoading(true);
        const results = await mapLocationService.searchLocations({
          query,
          category: activeFilter === 'ALL' ? undefined : activeFilter,
          userLocation: userPosition || undefined,
          limit: 50,
        });
        setFilteredLocations(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
        setFilteredLocations([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchQuery, activeFilter, locations, userPosition, setFilteredLocations, setIsLoading, setError],
  );

  /**
   * Handle category filter change
   */
  const handleFilterChange = useCallback(
    async (filter: LocationType | 'ALL') => {
      setActiveFilter(filter);
      setSearchQuery(''); // Clear search when filtering

      try {
        setIsLoading(true);

        // If filter is "ALL", use all locations
        if (filter === 'ALL') {
          setFilteredLocations(locations);
          return;
        }

        // Otherwise filter by category
        const filtered = locations.filter(loc => loc.type === filter);
        setFilteredLocations(filtered);
      } finally {
        setIsLoading(false);
      }
    },
    [setActiveFilter, setSearchQuery, locations, setFilteredLocations, setIsLoading],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // LOCATION SELECTION & DETAILS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Handle location selection from map or list
   */
  const handleSelectLocation = useCallback(
    async (location: Location) => {
      setSelectedLocation(location);
      setShowLocationPanel(true);

      // If location doesn't have coordinates, skip map animation
      if (!isMapLocation(location)) {
        return;
      }

      // Animate map to location
      animateToCamera({
        center: [location.longitude, location.latitude],
        zoom: Math.max(camera.zoom, 17),
        pitch: camera.pitch,
        bearing: camera.bearing,
      });

      // Fetch and display entrances
      try {
        const entrances = await mapEntranceService.getEntrances(location.id, location);
        if (entrances.length > 0) {
          // Auto-select best entrance for navigation
          const best = await mapEntranceService.selectBestEntrance(location.id, location, {
            userLocation: userPosition || undefined,
          });
          if (best) setSelectedEntrance(best);
        }
      } catch (err) {
        console.warn('Failed to load entrances:', err);
      }
    },
    [setSelectedLocation, setShowLocationPanel, animateToCamera, camera, userPosition, setSelectedEntrance],
  );

  /**
   * Handle location deselection
   */
  const handleDeselectLocation = useCallback(() => {
    clearSelection();
    setShowLocationPanel(false);
  }, [clearSelection, setShowLocationPanel]);

  // ────────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Start navigation to selected location/entrance
   */
  const handleStartNavigation = useCallback(async () => {
    if (!selectedLocation || !userPosition) {
      setNavigationError('Missing location or user position');
      return;
    }

    try {
      setIsNavigating(true);
      setNavigationError(null);

      // Calculate route to location (or entrance if selected)
      const route = await mapRoutingService.calculateRouteToLocation(userPosition, selectedLocation);

      if (!route) {
        setNavigationError('Unable to calculate route');
        setIsNavigating(false);
        return;
      }

      setCurrentRoute(route);

      // Start GPS tracking (from hook) if not already tracking
      if (!isTracking) {
        startTracking();
      }

      // Switch to navigation view
      setViewMode('navigate');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Navigation failed';
      setNavigationError(message);
      setIsNavigating(false);
    }
  }, [selectedLocation, userPosition, setIsNavigating, setNavigationError, mapRoutingService, setCurrentRoute, isTracking, startTracking, setViewMode]);

  /**
   * Stop navigation
   */
  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentRoute(null);
    setViewMode('map');
  }, [setIsNavigating, setCurrentRoute, setViewMode]);

  /**
   * Recenter map on user location
   */
  const handleRecenter = useCallback(() => {
    if (!userPosition) {
      setError('User location not available');
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

  /**
   * Toggle follow mode
   */
  const handleToggleFollowMode = useCallback(() => {
    setIsFollowing(!isFollowing);
  }, [isFollowing, setIsFollowing]);

  // ────────────────────────────────────────────────────────────────────────────
  // RESPONSIVE BEHAVIOR
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Detect compact mode (mobile) on mount and resize
   */
  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth < 768; // md breakpoint
      setIsCompactMode(compact);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCompactMode]);

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  // Loading state
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
      {/* GPS Permission Modal */}
      <GPSPermissionModal
        isOpen={showPermissionModal}
        isLoading={isRequestingPermission}
        onRequestPermission={handleRequestPermission}
        onDismiss={handleDismissPermissionModal}
      />

      {/* GPS Permission Banner */}
      {showPermissionBanner && (
        <GPSPermissionBanner
          permissionState={gpsPermissionState}
          isLoading={isRequestingPermission}
          onRequestPermission={handleRequestPermission}
          onDismiss={() => setShowPermissionBanner(false)}
        />
      )}

      {/* Error banner */}
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

      {/* Map view */}
      {viewMode === 'map' && (
        <>
          {/* Header with search and filters */}
          <MapHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isLoading={isLoading}
          />

          {/* Map canvas and location panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Map */}
            <div className="flex-1 relative">
              <MapCanvas
                locations={filteredLocations.filter(isMapLocation)}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                userLocation={userPosition || undefined}
                currentRoute={currentRoute}
              />

              {/* Floating controls */}
              <FloatingControls
                isFollowing={isFollowing}
                onRecenter={handleRecenter}
                onToggleFollowMode={handleToggleFollowMode}
                hasUserLocation={Boolean(userPosition)}
              />

              {/* Empty state */}
              {filteredLocations.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <MapPin className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No locations found</p>
                </div>
              )}
            </div>

            {/* Location panel (desktop only) */}
            {!isCompactMode && showLocationPanel && selectedLocation && (
              <LocationPanel
                location={selectedLocation}
                onNavigate={handleStartNavigation}
                onClose={handleDeselectLocation}
              />
            )}
          </div>

          {/* Location panel (mobile - bottom sheet) */}
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

      {/* Navigation view */}
      {viewMode === 'navigate' && currentRoute && (
        <NavigationPanel
          route={currentRoute}
          userLocation={userPosition || undefined}
          onStop={handleStopNavigation}
          onExit={() => setViewMode('map')}
        />
      )}
    </div>
  );
}
