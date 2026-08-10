/**
 * Type-safe sessionStorage manager with JSON serialization
 * Same interface as localStorage but for session-only data
 */

export interface StorageManager {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * sessionStorage manager with type-safe access
 * Automatically handles JSON serialization/deserialization
 * Catches and logs errors gracefully
 * Data is cleared when session ends (browser closes)
 */
export const sessionStorageManager: StorageManager = {
  /**
   * Get item from sessionStorage with type safety
   * @param key Storage key
   * @returns Deserialized value or null if not found/error
   */
  getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined') {
        console.warn('sessionStorage not available in SSR environment');
        return null;
      }

      const item = window.sessionStorage.getItem(key);
      if (!item) {
        return null;
      }

      try {
        return JSON.parse(item) as T;
      } catch (parseError) {
        console.error(`Failed to parse sessionStorage[${key}]:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`Error reading sessionStorage[${key}]:`, error);
      return null;
    }
  },

  /**
   * Set item in sessionStorage with automatic serialization
   * @param key Storage key
   * @param value Value to store (will be JSON serialized)
   */
  setItem<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('sessionStorage not available in SSR environment');
        return;
      }

      const serialized = JSON.stringify(value);
      window.sessionStorage.setItem(key, serialized);
    } catch (error) {
      // Check for quota exceeded error
      if (error instanceof DOMException) {
        if (error.code === 22 || error.code === DOMException.QUOTA_EXCEEDED_ERR) {
          console.error(`sessionStorage quota exceeded for key "${key}"`);
          return;
        }
      }
      console.error(`Error writing to sessionStorage[${key}]:`, error);
    }
  },

  /**
   * Remove item from sessionStorage
   * @param key Storage key
   */
  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('sessionStorage not available in SSR environment');
        return;
      }

      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing sessionStorage[${key}]:`, error);
    }
  },

  /**
   * Clear all items from sessionStorage
   */
  clear(): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('sessionStorage not available in SSR environment');
        return;
      }

      window.sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  },
};
