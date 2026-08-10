"use client";

/**
 * LocationPanel — Display location details, entrances, and navigation options
 * 
 * Layout:
 * - Desktop: Right-side panel (sidebar)
 * - Mobile: Bottom sheet (fixed at bottom)
 * 
 * Content:
 * - Location header (name, type, icon)
 * - Distance from user (if user location available)
 * - Description/metadata
 * - Entrance list with:
 *   - Entrance name and type
 *   - Accessibility info
 *   - Distance from user
 * - Primary CTA: "Navigate Here" button
 * - Secondary: Share, Save, etc.
 */

import { useMemo, useState, useEffect } from 'react';
import { X, MapPin, Compass, Clock, Info } from 'lucide-react';

import { Location, isMapLocation, useMapStore, Entrance, mapEntranceService } from '@/lib/map';
import { formatDistance } from '@/lib/map/utils';

interface LocationPanelProps {
  location: Location;
  onNavigate: () => void;
  onClose: () => void;
}

export default function LocationPanel({
  location,
  onNavigate,
  onClose,
}: LocationPanelProps) {
  const { position: userLocation, selectedEntrance, setSelectedEntrance } = useMapStore();
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [loadingEntrances, setLoadingEntrances] = useState(false);

  // Fetch entrances for this location
  useEffect(() => {
    const loadEntrances = async () => {
      try {
        setLoadingEntrances(true);
        const data = await mapEntranceService.getEntrances(location.id, location);
        setEntrances(data);
      } catch (err) {
        console.warn('Failed to load entrances:', err);
        setEntrances([]);
      } finally {
        setLoadingEntrances(false);
      }
    };

    if (location.id) {
      loadEntrances();
    }
  }, [location.id, location]);

  // Calculate distance from user
  const distance = useMemo(() => {
    if (!userLocation || !isMapLocation(location)) {
      return null;
    }

    const userLat = userLocation.lat;
    const userLng = userLocation.lng;
    const locLat = location.latitude;
    const locLng = location.longitude;

    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((locLat - userLat) * Math.PI) / 180;
    const dLng = ((locLng - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((locLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    return formatDistance(dist);
  }, [userLocation, location]);

  // Get location type display name
  const typeName = useMemo(() => {
    const types: Record<string, string> = {
      BUILDING: 'Building',
      CLASSROOM: 'Classroom',
      LIBRARY: 'Library',
      CAFETERIA: 'Cafeteria',
      LAB: 'Laboratory',
      GYM: 'Gym',
      PARKING: 'Parking',
      ENTRANCE: 'Entrance',
      RESTROOM: 'Restroom',
    };
    return types[location.type] || location.type;
  }, [location.type]);

  // Get location icon/emoji
  const getLocationIcon = (type: string) => {
    const icons: Record<string, string> = {
      BUILDING: '🏢',
      CLASSROOM: '📚',
      LIBRARY: '📖',
      CAFETERIA: '🍽️',
      LAB: '🧪',
      GYM: '🏋️',
      PARKING: '🚗',
      ENTRANCE: '🚪',
      RESTROOM: '🚻',
    };
    return icons[type] || '📍';
  };

  // Filter entrances for this location
  const locationEntrances = useMemo(() => {
    return entrances; // Already filtered by the useEffect
  }, [entrances]);

  return (
    <div className="flex flex-col h-full max-h-screen bg-background border-l border-border md:w-80 md:shadow-lg rounded-t-lg md:rounded-none overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-4 border-b border-border bg-secondary/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getLocationIcon(location.type)}</span>
            <h2 className="text-lg font-semibold truncate">{location.name}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{typeName}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1.5 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Distance and travel info */}
        {distance && (
          <div className="px-4 py-3 border-b border-border bg-blue-50/50 dark:bg-blue-950/20 flex items-center gap-3">
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{distance}</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">from your location</p>
            </div>
          </div>
        )}

        {/* Description/Metadata */}
        {location.metadata && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {typeof location.metadata.description === 'string'
                  ? location.metadata.description
                  : 'No description available'}
              </p>
            </div>

            {/* Additional metadata */}
            {typeof location.metadata.capacity === 'number' && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Capacity:</span> {location.metadata.capacity}
              </div>
            )}

            {typeof location.metadata.hours === 'string' && (
              <div className="mt-2 flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Hours</p>
                  <p>{location.metadata.hours}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entrances */}
        {locationEntrances.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold mb-2">Entrances</h3>
            <div className="space-y-2">
              {locationEntrances.map((entrance) => (
                <button
                  key={entrance.id}
                  onClick={() => setSelectedEntrance(entrance)}
                  className={`
                    w-full text-left p-2 rounded-lg border transition-all
                    ${
                      selectedEntrance?.id === entrance.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary hover:bg-secondary/80 border-border text-secondary-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{entrance.name}</p>
                      {entrance.isAccessible && (
                        <p className="text-xs text-muted-foreground">♿ Accessible</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Images gallery */}
        {location.images && location.images.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold mb-2">Images</h3>
            <div className="grid grid-cols-2 gap-2">
              {location.images.slice(0, 4).map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-secondary rounded-lg overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={`Location image ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with navigation CTA */}
      <div className="border-t border-border p-4 bg-secondary/50 space-y-2">
        <button
          onClick={onNavigate}
          className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors active:scale-95"
        >
          📍 Navigate Here
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
