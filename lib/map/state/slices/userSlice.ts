/**
 * User location and tracking state slice
 */

import { UserLocationState, LocationPermissionState } from '../../types/map';

export interface UserState extends UserLocationState {
  permissionDeniedReason: string | null;
  isRequesting: boolean;
  trackingError: string | null;
  permissionState: LocationPermissionState;
}

export interface UserActions {
  setPosition: (position: { lat: number; lng: number } | null) => void;
  setAccuracy: (accuracy: number | null) => void;
  setHeading: (heading: number | undefined) => void;
  setSpeed: (speed: number | undefined) => void;
  setTimestamp: (timestamp: Date | null) => void;
  setIsTracking: (tracking: boolean) => void;
  setIsFollowing: (following: boolean) => void;
  setLocationPermission: (state: LocationPermissionState) => void;
  setPermissionDeniedReason: (reason: string | null) => void;
  setIsRequesting: (requesting: boolean) => void;
  setTrackingError: (error: string | null) => void;
  updateLocation: (position: { lat: number; lng: number }, accuracy: number, timestamp?: Date) => void;
  startTracking: () => void;
  stopTracking: () => void;
  clearTrackingError: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUserSlice = () => (set: any) => ({
  position: null,
  accuracy: null,
  heading: undefined,
  speed: undefined,
  timestamp: null,
  isTracking: false,
  isFollowing: false,
  permissionState: 'unknown' as LocationPermissionState,
  permissionDeniedReason: null,
  isRequesting: false,
  trackingError: null,

  setPosition: (position: { lat: number; lng: number } | null) =>
    set({ position }),

  setAccuracy: (accuracy: number | null) =>
    set({ accuracy }),

  setHeading: (heading: number | undefined) =>
    set({ heading }),

  setSpeed: (speed: number | undefined) =>
    set({ speed }),

  setTimestamp: (timestamp: Date | null) =>
    set({ timestamp }),

  setIsTracking: (isTracking: boolean) =>
    set({ isTracking }),

  setIsFollowing: (isFollowing: boolean) =>
    set({ isFollowing }),

  setLocationPermission: (state: LocationPermissionState) =>
    set({ permissionState: state }),

  setPermissionDeniedReason: (permissionDeniedReason: string | null) =>
    set({ permissionDeniedReason }),

  setIsRequesting: (isRequesting: boolean) =>
    set({ isRequesting }),

  setTrackingError: (trackingError: string | null) =>
    set({ trackingError }),

  updateLocation: (position: { lat: number; lng: number }, accuracy: number, timestamp?: Date) =>
    set({
      position,
      accuracy,
      timestamp: timestamp || new Date(),
      trackingError: null,
    }),

  startTracking: () =>
    set({
      isTracking: true,
      trackingError: null,
    }),

  stopTracking: () =>
    set({
      isTracking: false,
      isFollowing: false,
    }),

  clearTrackingError: () =>
    set({ trackingError: null }),
});
