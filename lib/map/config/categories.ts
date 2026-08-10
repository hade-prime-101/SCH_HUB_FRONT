/**
 * Location categories configuration
 * Centralized definition of all location types and their metadata
 */

import { LocationType } from '../types/location';

export interface CategoryConfig {
  type: LocationType;
  label: string;
  description: string;
  icon: string; // lucide-react icon name
  color: string; // Tailwind color class
  hexColor: string; // Hex for map rendering
  priority: number; // Display priority (lower = more important)
}

/**
 * All location categories with metadata
 * Used for filtering, display, and categorization
 */
export const CATEGORY_CONFIG: Record<LocationType, CategoryConfig> = {
  // Academic
  LIBRARY: {
    type: 'LIBRARY',
    label: 'Library',
    description: 'Campus library and study facilities',
    icon: 'BookOpen',
    color: 'bg-sky-500',
    hexColor: '#0ea5e9',
    priority: 1,
  },
  LECTURE_HALL: {
    type: 'LECTURE_HALL',
    label: 'Lecture Hall',
    description: 'Classrooms and lecture theaters',
    icon: 'MonitorPlay',
    color: 'bg-indigo-400',
    hexColor: '#818cf8',
    priority: 2,
  },
  LAB: {
    type: 'LAB',
    label: 'Laboratory',
    description: 'Science and computer labs',
    icon: 'FlaskConical',
    color: 'bg-teal-500',
    hexColor: '#14b8a6',
    priority: 3,
  },

  // Buildings & Facilities
  BUILDING: {
    type: 'BUILDING',
    label: 'Building',
    description: 'Campus buildings',
    icon: 'Building2',
    color: 'bg-indigo-500',
    hexColor: '#6366f1',
    priority: 4,
  },
  OFFICE: {
    type: 'OFFICE',
    label: 'Office',
    description: 'Administrative offices',
    icon: 'Building2',
    color: 'bg-purple-500',
    hexColor: '#a855f7',
    priority: 5,
  },

  // Student Amenities
  HOSTEL: {
    type: 'HOSTEL',
    label: 'Hostel',
    description: 'Student housing and accommodations',
    icon: 'Home',
    color: 'bg-emerald-500',
    hexColor: '#10b981',
    priority: 6,
  },
  CAFETERIA: {
    type: 'CAFETERIA',
    label: 'Cafeteria',
    description: 'Food courts and dining facilities',
    icon: 'Utensils',
    color: 'bg-amber-500',
    hexColor: '#f59e0b',
    priority: 7,
  },

  // Health & Wellness
  CLINIC: {
    type: 'CLINIC',
    label: 'Clinic',
    description: 'Medical center and health facilities',
    icon: 'HelpCircle',
    color: 'bg-rose-500',
    hexColor: '#f43f5e',
    priority: 8,
  },
  SPORTS: {
    type: 'SPORTS',
    label: 'Sports',
    description: 'Sports complex and recreation',
    icon: 'Dumbbell',
    color: 'bg-orange-500',
    hexColor: '#f97316',
    priority: 9,
  },

  // Services
  ATM: {
    type: 'ATM',
    label: 'ATM',
    description: 'Automated teller machines',
    icon: 'Banknote',
    color: 'bg-green-600',
    hexColor: '#16a34a',
    priority: 10,
  },

  // Transportation & Access
  GATE: {
    type: 'GATE',
    label: 'Gate',
    description: 'Campus entrance gates',
    icon: 'MapPin',
    color: 'bg-slate-500',
    hexColor: '#64748b',
    priority: 11,
  },
  PARKING: {
    type: 'PARKING',
    label: 'Parking',
    description: 'Parking lots and spaces',
    icon: 'ParkingCircle',
    color: 'bg-blue-500',
    hexColor: '#3b82f6',
    priority: 12,
  },
  SHUTTLE_STOP: {
    type: 'SHUTTLE_STOP',
    label: 'Shuttle Stop',
    description: 'Shuttle bus stops',
    icon: 'Bus',
    color: 'bg-cyan-500',
    hexColor: '#06b6d4',
    priority: 13,
  },

  // Landmarks & Infrastructure
  LANDMARK: {
    type: 'LANDMARK',
    label: 'Landmark',
    description: 'Notable campus landmarks',
    icon: 'Landmark',
    color: 'bg-yellow-500',
    hexColor: '#eab308',
    priority: 14,
  },
  ROAD: {
    type: 'ROAD',
    label: 'Road',
    description: 'Campus roads',
    icon: 'Route',
    color: 'bg-slate-400',
    hexColor: '#94a3b8',
    priority: 15,
  },
  PATH: {
    type: 'PATH',
    label: 'Path',
    description: 'Walking paths',
    icon: 'Route',
    color: 'bg-slate-300',
    hexColor: '#cbd5e1',
    priority: 16,
  },

  // Fallbacks
  OTHER: {
    type: 'OTHER',
    label: 'Other',
    description: 'Other locations',
    icon: 'MapPin',
    color: 'bg-slate-400',
    hexColor: '#94a3b8',
    priority: 100,
  },
  UNKNOWN: {
    type: 'UNKNOWN',
    label: 'Location',
    description: 'Unknown location type',
    icon: 'MapPin',
    color: 'bg-slate-400',
    hexColor: '#94a3b8',
    priority: 101,
  },
};

/**
 * Get category config by type
 */
export function getCategoryConfig(type: LocationType): CategoryConfig {
  return CATEGORY_CONFIG[type] || CATEGORY_CONFIG.UNKNOWN;
}

/**
 * Get all categories sorted by priority
 */
export function getCategoriesSorted(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIG)
    .filter(cat => cat.type !== 'UNKNOWN' && cat.type !== 'OTHER') // Exclude fallbacks from main list
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get categories for filter pills (user-facing)
 */
export function getFilterCategories(): Array<{ type: LocationType; label: string }> {
  return getCategoriesSorted().map(cat => ({
    type: cat.type,
    label: cat.label,
  }));
}

/**
 * Map of category type to hex color (for MapLibre rendering)
 */
export const CATEGORY_COLORS: Record<LocationType, string> = Object.entries(CATEGORY_CONFIG).reduce(
  (acc, [type, config]) => {
    acc[type as LocationType] = config.hexColor;
    return acc;
  },
  {} as Record<LocationType, string>,
);

/**
 * Map of category type to icon name (for UI rendering)
 */
export const CATEGORY_ICONS: Record<LocationType, string> = Object.entries(CATEGORY_CONFIG).reduce(
  (acc, [type, config]) => {
    acc[type as LocationType] = config.icon;
    return acc;
  },
  {} as Record<LocationType, string>,
);
