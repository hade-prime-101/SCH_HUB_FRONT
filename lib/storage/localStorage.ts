/**
 * Type-safe localStorage manager with JSON serialization
 * Handles quota exceeded errors and provides consistent error handling
 */

export interface StorageManager {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * localStorage manager with type-safe access
 * Automatically handles JSON serialization/deserialization
 * Catches and logs errors gracefully
 */
export const localStorageManager: StorageManager = {
  /**
   * Get item from localStorage with type safety
   * @param key Storage key
   * @returns Deserialized value or null if not found/error
   */
  getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available in SSR environment');
        return null;
      }

      const item = window.localStorage.getItem(key);
      if (!item) {
        return null;
      }

      try {
        return JSON.parse(item) as T;
      } catch (parseError) {
        console.error(`Failed to parse localStorage[${key}]:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`Error reading localStorage[${key}]:`, error);
      return null;
    }
  },

  /**
   * Set item in localStorage with automatic serialization
   * @param key Storage key
   * @param value Value to store (will be JSON serialized)
   */
  setItem<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available in SSR environment');
        return;
      }

      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      // Check for quota exceeded error
      if (error instanceof DOMException) {
        if (error.code === 22 || error.code === DOMException.QUOTA_EXCEEDED_ERR) {
          console.error(`localStorage quota exceeded for key "${key}"`);
          return;
        }
      }
      console.error(`Error writing to localStorage[${key}]:`, error);
    }
  },

  /**
   * Remove item from localStorage
   * @param key Storage key
   */
  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available in SSR environment');
        return;
      }

      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage[${key}]:`, error);
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available in SSR environment');
        return;
      }

      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};
