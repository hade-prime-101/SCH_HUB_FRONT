/**
 * useGPSTracking — Hook for GPS location tracking with permissions
 * 
 * Features:
 * - Request geolocation permission
 * - Start/stop continuous GPS tracking
 * - Detect permission state (unknown, granted, denied)
 * - Handle permission changes (e.g. user grants in browser settings)
 * - Battery-efficient (disable high accuracy when not needed)
 * - Error handling and recovery
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface UseGPSTrackingReturn {
  position: GPSPosition | null;
  isTracking: boolean;
  permissionState: PermissionState;
  error: string | null;
  requestPermission: () => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
}

/**
 * Hook for GPS tracking
 * 
 * @param enableHighAccuracy - Use high accuracy mode (better but drains battery)
 * @param timeout - Timeout for position requests (ms)
 * @param maximumAge - Cache position for this duration (ms)
 */
export function useGPSTracking(
  enableHighAccuracy = false,
  timeout = 10000,
  maximumAge = 0,
): UseGPSTrackingReturn {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const permissionListenerRef = useRef<PermissionStatus | null>(null);

  const normalizePermissionState = (state: globalThis.PermissionState): PermissionState =>
    state === 'prompt' ? 'prompt' : state;

  /**
   * Check initial permission state and setup listener
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      setError('Geolocation not available');
      return;
    }

    // Try to use Permissions API (not available in all browsers)
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(normalizePermissionState(result.state));
          permissionListenerRef.current = result;

          // Listen for permission changes (e.g. user grants in settings)
          result.addEventListener('change', () => {
            setPermissionState(normalizePermissionState(result.state));
            setError(null);
          });
        })
        .catch(() => {
          // Permissions API not available — permission state is unknown
          setPermissionState('unknown');
        });
    } else {
      // Permissions API not available
      setPermissionState('unknown');
    }

    return () => {
      if (permissionListenerRef.current) {
        permissionListenerRef.current.removeEventListener('change', () => {});
      }
    };
  }, []);

  /**
   * Request geolocation permission from user
   */
  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      setError('Geolocation not available');
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
          setPermissionState('granted');
          setError(null);
          resolve();
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionState('denied');
            setError('Location permission denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setError('Position unavailable');
          } else if (err.code === err.TIMEOUT) {
            setError('Position request timeout');
          } else {
            setError('Unknown geolocation error');
          }
          resolve();
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  /**
   * Start GPS tracking — continuously update position
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
        setIsTracking(true);
      },
      (err) => {
        console.error('GPS tracking error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
          setError('Location permission denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Position unavailable');
        } else if (err.code === err.TIMEOUT) {
          // Timeout is not critical — keep trying
          console.warn('Position request timeout');
        } else {
          setError('GPS error: ' + err.message);
        }
      },
      {
        enableHighAccuracy: true, // Use high accuracy for navigation
        timeout,
        maximumAge: 0, // Always get fresh position
      },
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
  }, [timeout]);

  /**
   * Stop GPS tracking
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTracking();
      if (permissionListenerRef.current) {
        permissionListenerRef.current.removeEventListener('change', () => {});
      }
    };
  }, [stopTracking]);

  return {
    position,
    isTracking,
    permissionState,
    error,
    requestPermission,
    startTracking,
    stopTracking,
  };
}
