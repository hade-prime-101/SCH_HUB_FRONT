/**
 * MapLibre GL layer styles and configuration
 * Centralized styling for all map elements (roads, buildings, locations, routes)
 */

/**
 * Road layer styling — warm amber with glow
 */
export const ROAD_LAYER_STYLE = {
  id: 'campus-roads',
  type: 'line' as const,
  source: 'campus-features',
  'source-layer': 'default',
  filter: ['==', ['get', 'type'], 'ROAD'],
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'round' as const,
  },
  paint: {
    'line-color': '#f59e0b', // amber-500
    'line-width': 3,
    'line-opacity': 0.9,
    'line-glow-color': '#fbbf24', // amber-400
    'line-glow-blur': 4,
    'line-glow-width': 2,
  },
};

/**
 * Pathway layer styling — lighter, less prominent
 */
export const PATHWAY_LAYER_STYLE = {
  id: 'campus-pathways',
  type: 'line' as const,
  source: 'campus-features',
  'source-layer': 'default',
  filter: ['==', ['get', 'type'], 'PATH'],
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'round' as const,
  },
  paint: {
    'line-color': '#cbd5e1', // slate-300
    'line-width': 1.5,
    'line-opacity': 0.6,
  },
};

/**
 * Building layer styling — 3D extrusion (MapTiler only)
 */
export const BUILDING_3D_LAYER_STYLE = {
  id: '3d-buildings',
  type: 'fill-extrusion' as const,
  source: 'maptiler_planet',
  'source-layer': 'building',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      '#e2e8f0', // slate-200
      16,
      '#cbd5e1', // slate-300
    ],
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.5,
      ['coalesce', ['get', 'render_height'], ['get', 'height'], 20],
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.5,
      ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
    ],
    'fill-extrusion-opacity': 0.7,
  },
};

/**
 * Building highlight layer — for selected buildings
 */
export const BUILDING_HIGHLIGHT_LAYER_STYLE = {
  id: 'building-highlight',
  type: 'line' as const,
  source: 'selected-building',
  paint: {
    'line-color': '#fbbf24', // amber-400
    'line-width': 3,
    'line-glow-color': '#f59e0b', // amber-500
    'line-glow-blur': 6,
  },
};

/**
 * Route polyline styling — strong navigation color with glow
 */
export const ROUTE_LAYER_STYLE = {
  id: 'route-line',
  type: 'line' as const,
  source: 'route',
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'round' as const,
  },
  paint: {
    'line-color': '#6366f1', // indigo-500
    'line-width': 5,
    'line-opacity': 0.95,
    'line-dasharray': [2, 1.5],
    'line-glow-color': '#6366f1', // indigo-500
    'line-glow-blur': 4,
    'line-glow-width': 1,
  },
};

/**
 * Route casing — white layer underneath for contrast
 */
export const ROUTE_CASING_LAYER_STYLE = {
  id: 'route-casing',
  type: 'line' as const,
  source: 'route',
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'round' as const,
  },
  paint: {
    'line-color': '#ffffff',
    'line-width': 9,
    'line-opacity': 0.8,
  },
};

/**
 * Location cluster styling — for zoomed out views
 */
export const LOCATION_CLUSTER_LAYER_STYLE = {
  id: 'location-clusters',
  type: 'circle' as const,
  source: 'locations-clustered',
  paint: {
    'circle-color': '#6366f1', // indigo-500
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      100,
      30,
      750,
      40,
    ],
    'circle-opacity': 0.8,
  },
};

/**
 * Location cluster count label
 */
export const LOCATION_CLUSTER_COUNT_LAYER_STYLE = {
  id: 'location-cluster-count',
  type: 'symbol' as const,
  source: 'locations-clustered',
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
};

/**
 * Unclustered location points
 */
export const LOCATION_POINT_LAYER_STYLE = {
  id: 'location-points',
  type: 'circle' as const,
  source: 'locations',
  filter: ['!=', ['feature-state', 'cluster'], true],
  paint: {
    'circle-radius': 8,
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#fbbf24', // amber-400 on hover
      '#6366f1', // indigo-500 normal
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

/**
 * Location labels — zoom-dependent visibility
 */
export const LOCATION_LABEL_LAYER_STYLE = {
  id: 'location-labels',
  type: 'symbol' as const,
  source: 'locations',
  minzoom: 14,
  layout: {
    'text-field': '{name}',
    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 14],
    'text-anchor': 'top',
    'text-offset': [0, 1],
    'text-max-width': 10,
  },
  paint: {
    'text-color': '#1f2937', // gray-800
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
  },
};

/**
 * User location marker — blue circle with halo
 */
export const USER_LOCATION_LAYER_STYLE = {
  id: 'user-location',
  type: 'circle' as const,
  source: 'user-location',
  paint: {
    'circle-radius': 9,
    'circle-color': '#6366f1', // indigo-500
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

/**
 * User location accuracy ring
 */
export const USER_ACCURACY_RING_LAYER_STYLE = {
  id: 'user-accuracy-ring',
  type: 'circle' as const,
  source: 'user-location',
  paint: {
    'circle-radius': ['get', 'accuracy'],
    'circle-color': '#6366f1', // indigo-500
    'circle-opacity': 0.1,
  },
};

/**
 * Entrance markers — distinct from POIs
 */
export const ENTRANCE_LAYER_STYLE = {
  id: 'entrances',
  type: 'circle' as const,
  source: 'entrances',
  paint: {
    'circle-radius': 7,
    'circle-color': '#8b5cf6', // violet-500
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-glow-blur': 3,
    'circle-glow-color': '#8b5cf6',
    'circle-glow-width': 1,
    'circle-opacity': 0.95,
  },
};

/**
 * Layer order (from bottom to top)
 * Used when adding layers to map
 */
export const LAYER_ORDER = [
  'route-casing', // Behind everything
  'route-line',
  'campus-roads',
  'campus-pathways',
  '3d-buildings', // After roads, before POIs
  'user-accuracy-ring',
  'location-clusters',
  'location-cluster-count',
  'location-points',
  'location-labels',
  'entrances',
  'user-location', // Topmost
  'building-highlight',
];
