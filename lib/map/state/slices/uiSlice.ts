/**
 * UI state slice — panels, modals, view modes
 */

import { MapViewMode, MapLayerSettings } from '../../types/map';

export interface UIState {
  viewMode: MapViewMode;
  showLocationPanel: boolean;
  showNavigationPanel: boolean;
  showFilterPanel: boolean;
  showSearchResults: boolean;
  panelHeight: 'compact' | 'expanded' | 'fullscreen';
  layerSettings: MapLayerSettings;
  isCompactMode: boolean; // Mobile detection
}

export interface UIActions {
  setViewMode: (mode: MapViewMode) => void;
  setShowLocationPanel: (show: boolean) => void;
  setShowNavigationPanel: (show: boolean) => void;
  setShowFilterPanel: (show: boolean) => void;
  setShowSearchResults: (show: boolean) => void;
  setPanelHeight: (height: 'compact' | 'expanded' | 'fullscreen') => void;
  setLayerSettings: (settings: Partial<MapLayerSettings>) => void;
  setIsCompactMode: (compact: boolean) => void;
  toggleLocationPanel: () => void;
  toggleFilterPanel: () => void;
  closeAllPanels: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUISlice = () => (set: any) => ({
  viewMode: 'map' as MapViewMode,
  showLocationPanel: false,
  showNavigationPanel: false,
  showFilterPanel: false,
  showSearchResults: false,
  panelHeight: 'compact' as 'compact' | 'expanded' | 'fullscreen',
  isCompactMode: false,
  layerSettings: {
    showLocations: true,
    showEntrances: true,
    showRoute: true,
    showUserLocation: true,
    showBuildings3D: true,
    showRoads: true,
    showPathways: true,
    showLabels: true,
  } as MapLayerSettings,

  setViewMode: (viewMode: MapViewMode) =>
    set({ viewMode }),

  setShowLocationPanel: (showLocationPanel: boolean) =>
    set({ showLocationPanel }),

  setShowNavigationPanel: (showNavigationPanel: boolean) =>
    set({ showNavigationPanel }),

  setShowFilterPanel: (showFilterPanel: boolean) =>
    set({ showFilterPanel }),

  setShowSearchResults: (showSearchResults: boolean) =>
    set({ showSearchResults }),

  setPanelHeight: (panelHeight: 'compact' | 'expanded' | 'fullscreen') =>
    set({ panelHeight }),

  setLayerSettings: (partial: Partial<MapLayerSettings>) =>
    set((state: UIState) => ({
      layerSettings: { ...state.layerSettings, ...partial },
    })),

  setIsCompactMode: (isCompactMode: boolean) =>
    set({ isCompactMode }),

  toggleLocationPanel: () =>
    set((state: UIState) => ({
      showLocationPanel: !state.showLocationPanel,
    })),

  toggleFilterPanel: () =>
    set((state: UIState) => ({
      showFilterPanel: !state.showFilterPanel,
    })),

  closeAllPanels: () =>
    set({
      showLocationPanel: false,
      showNavigationPanel: false,
      showFilterPanel: false,
      showSearchResults: false,
    }),
});
