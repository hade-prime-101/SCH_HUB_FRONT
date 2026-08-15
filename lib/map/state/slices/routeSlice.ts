/**
 * Route and navigation state slice — active routes, navigation state
 */

import { Route, RouteProgress, NavigationMode } from '../../types/route';

export interface RouteState {
  currentRoute: Route | null;
  alternativeRoutes: Route[];
  routeProgress: RouteProgress | null;
  navigationMode: NavigationMode;
  isNavigating: boolean;
  navigationError: string | null;
  showRouteDetails: boolean;
  currentStepIndex: number;
}

export interface RouteActions {
  setCurrentRoute: (route: Route | null) => void;
  setAlternativeRoutes: (routes: Route[]) => void;
  setRouteProgress: (progress: RouteProgress | null) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  setIsNavigating: (navigating: boolean) => void;
  setNavigationError: (error: string | null) => void;
  setShowRouteDetails: (show: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  startNavigation: (route: Route) => void;
  stopNavigation: () => void;
  clearRoute: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createRouteSlice = () => (set: any) => ({
  currentRoute: null,
  alternativeRoutes: [],
  routeProgress: null,
  navigationMode: 'overview' as NavigationMode,
  isNavigating: false,
  navigationError: null,
  showRouteDetails: false,
  currentStepIndex: 0,

  setCurrentRoute: (currentRoute: Route | null) =>
    set({ currentRoute }),

  setAlternativeRoutes: (alternativeRoutes: Route[]) =>
    set({ alternativeRoutes }),

  setRouteProgress: (routeProgress: RouteProgress | null) =>
    set({ routeProgress }),

  setNavigationMode: (navigationMode: NavigationMode) =>
    set({ navigationMode }),

  setIsNavigating: (isNavigating: boolean) =>
    set({ isNavigating }),

  setNavigationError: (navigationError: string | null) =>
    set({ navigationError }),

  setShowRouteDetails: (showRouteDetails: boolean) =>
    set({ showRouteDetails }),

  setCurrentStepIndex: (currentStepIndex: number) =>
    set({ currentStepIndex }),

  startNavigation: (route: Route) =>
    set({
      currentRoute: route,
      isNavigating: true,
      navigationMode: 'turn-by-turn' as NavigationMode,
      navigationError: null,
      currentStepIndex: 0,
    }),

  stopNavigation: () =>
    set({
      isNavigating: false,
      navigationMode: 'overview' as NavigationMode,
      routeProgress: null,
      currentStepIndex: 0,
    }),

  clearRoute: () =>
    set({
      currentRoute: null,
      alternativeRoutes: [],
      routeProgress: null,
      isNavigating: false,
      navigationMode: 'overview' as NavigationMode,
      navigationError: null,
      currentStepIndex: 0,
    }),
});
