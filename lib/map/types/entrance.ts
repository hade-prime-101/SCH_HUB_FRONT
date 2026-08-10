/**
 * Entrance types — represents a point of entry to a building/location
 * Multiple entrances can serve a single location (main, side, accessible, service, etc.)
 */

export type EntranceKind = 'MAIN' | 'SIDE' | 'SERVICE' | 'ACCESSIBLE' | 'EMERGENCY' | 'OTHER';

export interface Entrance {
  // Identity
  id: string;
  name: string;

  // Relationship to location
  locationId?: string; // Link to parent Location (if provided by backend)

  // Kind and accessibility
  kind?: EntranceKind;
  isAccessible?: boolean;
  accessibility?: {
    wheelchair?: boolean;
    visual?: boolean;
    hearing?: boolean;
    mobility?: boolean;
  };

  // Coordinates (always a Point in GeoJSON)
  latitude: number;
  longitude: number;

  // Description and metadata
  description?: string;
  metadata?: {
    openingHours?: string;
    contactInfo?: string;
    notes?: string;
  };
}

/**
 * Type guard: check if entrance has valid coordinates
 */
export function hasEntranceCoordinates(entrance: Entrance): boolean {
  return (
    typeof entrance.latitude === 'number' &&
    typeof entrance.longitude === 'number' &&
    !isNaN(entrance.latitude) &&
    !isNaN(entrance.longitude)
  );
}

/**
 * Format entrance kind for display: "MAIN" → "Main Entrance"
 */
export function formatEntranceKind(kind?: EntranceKind): string {
  if (!kind) return 'Entrance';
  return (
    kind
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') + ' Entrance'
  );
}

/**
 * Entrance priority for sorting/selection
 * Main entrance should be suggested first, followed by accessible, etc.
 */
export function getEntrancePriority(entrance: Entrance): number {
  switch (entrance.kind) {
    case 'MAIN': return 0;
    case 'ACCESSIBLE': return 1;
    case 'SIDE': return 2;
    case 'SERVICE': return 3;
    case 'EMERGENCY': return 4;
    case 'OTHER': return 5;
    default: return 6;
  }
}

/**
 * Sort entrances by priority (lower is better)
 */
export function sortEntrancesByPriority(entrances: Entrance[]): Entrance[] {
  return [...entrances].sort((a, b) => getEntrancePriority(a) - getEntrancePriority(b));
}
