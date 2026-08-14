/**
 * Layer Manager — Centralized MapLibre layer and source management
 * 
 * Handles:
 * - Layer initialization and cleanup
 * - Dynamic layer visibility toggling
 * - Layer state management (paint properties, visibility)
 * - Performance optimization (layer batching)
 */

import maplibregl from 'maplibre-gl';

export interface LayerConfig {
  id: string;
  type: 'circle' | 'line' | 'fill' | 'symbol';
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourceData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paint?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout?: Record<string, any>;
  minzoom?: number;
  maxzoom?: number;
  beforeId?: string; // Insert before this layer for z-ordering
}

export interface SourceConfig {
  id: string;
  type: 'geojson' | 'vector' | 'raster';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  url?: string;
}

export class LayerManager {
  private map: maplibregl.Map;
  private layers: Map<string, LayerConfig> = new Map();
  private sources: Map<string, SourceConfig> = new Map();
  private layerVisibility: Map<string, boolean> = new Map();

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  /**
   * Add a source to the map
   */
  addSource(config: SourceConfig): void {
    if (this.map.getSource(config.id)) {
      console.warn(`Source ${config.id} already exists`);
      return;
    }

    this.sources.set(config.id, config);

    this.map.addSource(config.id, {
      type: config.type,
      data: config.data || config.url,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  /**
   * Update source data (for GeoJSON sources)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSourceData(sourceId: string, data: any): void {
    const source = this.map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source && 'setData' in source) {
      source.setData(data);
    }
  }

  /**
   * Remove a source
   */
  removeSource(sourceId: string): void {
    const source = this.map.getSource(sourceId);
    if (!source) return;

    // Remove all layers using this source
    const layersToRemove = Array.from(this.layers.values())
      .filter(layer => layer.source === sourceId)
      .map(layer => layer.id);

    layersToRemove.forEach(layerId => this.removeLayer(layerId));

    this.map.removeSource(sourceId);
    this.sources.delete(sourceId);
  }

  /**
   * Add a layer to the map
   */
  addLayer(config: LayerConfig): void {
    if (this.map.getLayer(config.id)) {
      console.warn(`Layer ${config.id} already exists`);
      return;
    }

    this.layers.set(config.id, config);
    this.layerVisibility.set(config.id, true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layerDef: any = {
      id: config.id,
      type: config.type,
      source: config.source,
      paint: config.paint || {},
      layout: config.layout || {},
    };

    if (config.filter !== undefined) layerDef.filter = config.filter;
    if (config.minzoom !== undefined) layerDef.minzoom = config.minzoom;
    if (config.maxzoom !== undefined) layerDef.maxzoom = config.maxzoom;

    this.map.addLayer(layerDef, config.beforeId);
  }

  /**
   * Update layer paint properties
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateLayerPaint(layerId: string, paint: Record<string, any>): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    Object.entries(paint).forEach(([key, value]) => {
      this.map.setPaintProperty(layerId, key, value);
      if (layer.paint) {
        layer.paint[key] = value;
      }
    });
  }

  /**
   * Update layer layout properties
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateLayerLayout(layerId: string, layout: Record<string, any>): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    Object.entries(layout).forEach(([key, value]) => {
      this.map.setLayoutProperty(layerId, key, value);
      if (layer.layout) {
        layer.layout[key] = value;
      }
    });
  }

  /**
   * Toggle layer visibility
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map.getLayer(layerId)) return;

    this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    this.layerVisibility.set(layerId, visible);
  }

  /**
   * Get layer visibility
   */
  getLayerVisibility(layerId: string): boolean {
    return this.layerVisibility.get(layerId) ?? false;
  }

  /**
   * Toggle multiple layers at once
   */
  setLayersVisibility(layerIds: string[], visible: boolean): void {
    layerIds.forEach(id => this.setLayerVisibility(id, visible));
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): void {
    const layer = this.map.getLayer(layerId);
    if (!layer) return;

    this.map.removeLayer(layerId);
    this.layers.delete(layerId);
    this.layerVisibility.delete(layerId);
  }

  /**
   * Get all layer IDs
   */
  getLayerIds(): string[] {
    return Array.from(this.layers.keys());
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.map.getLayer(layerId);
    if (!layer) return;

    const paintKey = layer.type === 'line'
      ? 'line-opacity'
      : layer.type === 'fill'
        ? 'fill-opacity'
        : layer.type === 'circle'
          ? 'circle-opacity'
          : 'text-opacity';

    this.map.setPaintProperty(layerId, paintKey, opacity);
  }

  /**
   * Cleanup — remove all layers and sources
   */
  cleanup(): void {
    // Remove layers in reverse order (top to bottom)
    const layerIds = Array.from(this.layers.keys()).reverse();
    layerIds.forEach(id => this.removeLayer(id));

    // Remove sources
    const sourceIds = Array.from(this.sources.keys());
    sourceIds.forEach(id => this.removeSource(id));

    this.layers.clear();
    this.sources.clear();
    this.layerVisibility.clear();
  }
}

export default LayerManager;
