'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useLocalStorage Hook
 *
 * Persists state to localStorage with automatic JSON serialization,
 * cross-tab synchronization via storage events, and SSR safety.
 *
 * @template T - The type of value to persist
 * @param key - The localStorage key to persist to
 * @param initialValue - Initial value if key doesn't exist in localStorage
 * @returns Tuple of [value, setValue] similar to useState
 *
 * @example
 * ```typescript
 * // Simple persistence
 * const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
 *   'sidebar_collapsed',
 *   false
 * );
 *
 * // With complex types
 * interface UserPreferences {
 *   theme: 'light' | 'dark';
 *   language: string;
 * }
 *
 * const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
 *   'user_prefs',
 *   { theme: 'light', language: 'en' }
 * );
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Use ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // State for the current value
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety - only access localStorage on client
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from localStorage by key
      const item = window.localStorage.getItem(key);

      // Parse stored json or return initial value
      if (item === null) {
        return initialValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      // If error reading localStorage, log and return initial value
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Wrapped setValue that also updates localStorage
   */
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Only proceed if mounted to prevent memory leaks
        if (!isMountedRef.current) return;

        // Save state
        setStoredValue(valueToStore);

        // SSR safety - only access localStorage on client
        if (typeof window === 'undefined') {
          return;
        }

        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // Handle quota exceeded or other storage errors
        if (error instanceof Error) {
          if (error.name === 'QuotaExceededError' || error.message.includes('QuotaExceededError')) {
            console.error(
              `localStorage quota exceeded for key "${key}". Unable to persist data.`,
              error
            );
          } else {
            console.warn(`Error saving to localStorage key "${key}":`, error);
          }
        } else {
          console.warn(`Error saving to localStorage key "${key}":`, error);
        }
      }
    },
    [key, storedValue]
  );

  /**
   * Listen for storage changes in other tabs/windows
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    /**
     * Handle storage changes from other browser tabs/windows
     */
    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes for our key
      if (e.key !== key) {
        return;
      }

      if (!isMountedRef.current) return;

      try {
        // If value was deleted in another tab, reset to initial value
        if (e.newValue === null) {
          setStoredValue(initialValue);
          return;
        }

        // Parse and set the new value from another tab
        const newValue = JSON.parse(e.newValue) as T;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error syncing localStorage key "${key}" from another tab:`, error);
      }
    };

    // Add listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [storedValue, setValue];
}
