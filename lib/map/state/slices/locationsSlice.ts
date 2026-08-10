/**
 * Locations state slice — all locations, filtering, searching
 */

import { Location, LocationType } from '../../types/location';
import { Entrance } from '../../types/entrance';

export interface LocationsState {
  locations: Location[];
  filteredLocations: Location[];
  selectedLocation: Location | null;
  selectedEntrance: Entrance | null;
  activeFilter: LocationType | 'ALL';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface LocationsActions {
  setLocations: (locations: Location[]) => void;
  setFilteredLocations: (locations: Location[]) => void;
  setSelectedLocation: (location: Location | null) => void;
  setSelectedEntrance: (entrance: Entrance | null) => void;
  setActiveFilter: (filter: LocationType | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelection: () => void;
  clearError: () => void;
}

export const createLocationsSlice = () => (set: any) => ({
  locations: [],
  filteredLocations: [],
  selectedLocation: null,
  selectedEntrance: null,
  activeFilter: 'ALL' as LocationType | 'ALL',
  searchQuery: '',
  isLoading: false,
  error: null,

  setLocations: (locations: Location[]) =>
    set({ locations }),

  setFilteredLocations: (filteredLocations: Location[]) =>
    set({ filteredLocations }),

  setSelectedLocation: (selectedLocation: Location | null) =>
    set({ selectedLocation }),

  setSelectedEntrance: (selectedEntrance: Entrance | null) =>
    set({ selectedEntrance }),

  setActiveFilter: (activeFilter: LocationType | 'ALL') =>
    set({ activeFilter }),

  setSearchQuery: (searchQuery: string) =>
    set({ searchQuery }),

  setIsLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setError: (error: string | null) =>
    set({ error }),

  clearSelection: () =>
    set({
      selectedLocation: null,
      selectedEntrance: null,
    }),

  clearError: () =>
    set({ error: null }),
});
