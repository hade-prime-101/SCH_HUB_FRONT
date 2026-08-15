"use client";

import { useEffect, useState } from "react";
import { X, Navigation, MapPin, Accessibility, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMapStore } from "@/lib/map/state/store";
import { mapEntranceService } from "@/lib/map/services";
import { formatLocationType } from "@/lib/map/types/location";
import { getCategoryConfig } from "@/lib/map/config/categories";
import { Entrance } from "@/lib/map/types/entrance";
import type { Location } from "@/lib/map/types/location";

interface LocationPanelProps {
  location: Location | null;
  onNavigate: () => void;
  onClose: () => void;
}

export function LocationPanel({ location, onNavigate, onClose }: LocationPanelProps) {
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [loadingEntrances, setLoadingEntrances] = useState(false);
  const { selectedEntrance, setSelectedEntrance } = useMapStore();

  useEffect(() => {
    if (!location) {
      setEntrances([]);
      return;
    }

    const fetchEntrances = async () => {
      setLoadingEntrances(true);
      try {
        const result = await mapEntranceService.getEntrances(location.id, location);
        setEntrances(result);
        // Select the best entrance automatically if not already selected
        if (result.length > 0 && !selectedEntrance) {
          const best = await mapEntranceService.selectBestEntrance(
            location.id,
            location,
            { userLocation: useMapStore.getState().position || undefined }
          );
          if (best) setSelectedEntrance(best);
        }
      } catch (error) {
        console.warn("Failed to fetch entrances", error);
        setEntrances([]);
      } finally {
        setLoadingEntrances(false);
      }
    };

    fetchEntrances();
  }, [location, selectedEntrance, setSelectedEntrance]);

  if (!location) return null;

  const category = getCategoryConfig(location.type);

  return (
    <Card className="h-full rounded-none md:rounded-lg shadow-lg border-t md:border-t-0 md:border-l border-border overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold truncate">{location.name}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <Badge
            style={{ backgroundColor: category.hexColor }}
            className="text-white border-0"
          >
            {formatLocationType(location.type)}
          </Badge>
          {location.distanceM != null && (
            <span className="text-sm text-muted-foreground">
              {location.distanceM < 1000
                ? `${Math.round(location.distanceM)} m`
                : `${(location.distanceM / 1000).toFixed(1)} km`}
            </span>
          )}
        </div>

        {/* Description */}
        {location.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {location.description}
          </p>
        )}

        {/* Image */}
        {location.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <img
              src={location.imageUrl}
              alt={location.name}
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Entrances */}
        <div>
          <h3 className="text-sm font-medium mb-2">Entrances</h3>
          {loadingEntrances ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading entrances...
            </div>
          ) : entrances.length > 0 ? (
            <ul className="space-y-1.5">
              {entrances.map((entrance) => (
                <li
                  key={entrance.id}
                  className={`flex items-center gap-2 text-sm p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedEntrance?.id === entrance.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedEntrance(entrance)}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{entrance.name}</span>
                  {entrance.isAccessible && (
                    <Accessibility className="w-4 h-4 text-blue-500" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No entrance information available.</p>
          )}
        </div>

        {/* Metadata */}
{location.metadata && Object.keys(location.metadata).length > 0 && (
  <div className="text-sm space-y-1">
    <h3 className="font-medium">Additional Info</h3>
    {typeof location.metadata.openingHours === 'string' && (
      <p>
        <span className="text-muted-foreground">Hours: </span>
        {location.metadata.openingHours}
      </p>
    )}
    {typeof location.metadata.capacity === 'number' && (
      <p>
        <span className="text-muted-foreground">Capacity: </span>
        {location.metadata.capacity}
      </p>
    )}
  </div>
)}
      </CardContent>

      {/* Action buttons */}
      <div className="p-4 border-t flex gap-2">
        <Button className="flex-1" onClick={onNavigate}>
          <Navigation className="w-4 h-4 mr-2" />
          Navigate
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Card>
  );
}