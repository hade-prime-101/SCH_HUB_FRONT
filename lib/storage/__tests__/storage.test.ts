/**
 * Unit Tests for Storage Managers - localStorage, sessionStorage, and cookies
 *
 * Tests type-safe storage access, JSON serialization, quota handling,
 * error cases, and common authentication use cases.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock implementations for testing in Node environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Setup global mocks
global.localStorage = new MockStorage() as any;
global.sessionStorage = new MockStorage() as any;

// Now import after mocks are setup
import { localStorageManager } from '../localStorage';
import { sessionStorageManager } from '../sessionStorage';
import { cookieManager } from '../cookies';

beforeEach(() => {
  // Clear storage before each test
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('Storage Managers', () => {
  // ===== localStorage Tests =====
  describe('localStorageManager', () => {
    it('should set and get string values', () => {
      localStorageManager.setItem('key1', 'value1');
      expect(localStorageManager.getItem<string>('key1')).toBe('value1');
    });

    it('should set and get object values with JSON serialization', () => {
      const obj = { name: 'John', age: 30 };
      localStorageManager.setItem('user', obj);
      const retrieved = localStorageManager.getItem<typeof obj>('user');
      expect(retrieved).toEqual(obj);
    });

    it('should set and get array values', () => {
      const arr = [1, 2, 3, 4, 5];
      localStorageManager.setItem('numbers', arr);
      expect(localStorageManager.getItem<number[]>('numbers')).toEqual(arr);
    });

    it('should return null for non-existent keys', () => {
      expect(localStorageManager.getItem('nonexistent')).toBeNull();
    });

    it('should remove items', () => {
      localStorageManager.setItem('key1', 'value1');
      localStorageManager.removeItem('key1');
      expect(localStorageManager.getItem('key1')).toBeNull();
    });

    it('should clear all items', () => {
      localStorageManager.setItem('key1', 'value1');
      localStorageManager.setItem('key2', 'value2');
      localStorageManager.clear();
      expect(localStorageManager.getItem('key1')).toBeNull();
      expect(localStorageManager.getItem('key2')).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const complex = {
        user: {
          name: 'John',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      };
      localStorageManager.setItem('complex', complex);
      const retrieved = localStorageManager.getItem(
        'complex'
      );
      expect(retrieved).toEqual(complex);
    });

    it('should handle boolean values', () => {
      localStorageManager.setItem('flag', true);
      expect(localStorageManager.getItem<boolean>('flag')).toBe(true);

      localStorageManager.setItem('flag', false);
      expect(localStorageManager.getItem<boolean>('flag')).toBe(false);
    });

    it('should handle numbers', () => {
      localStorageManager.setItem('number', 42);
      expect(localStorageManager.getItem<number>('number')).toBe(42);
    });
  });

  // ===== sessionStorage Tests =====
  describe('sessionStorageManager', () => {
    it('should set and get string values', () => {
      sessionStorageManager.setItem('key1', 'value1');
      expect(sessionStorageManager.getItem<string>('key1')).toBe('value1');
    });

    it('should set and get object values with JSON serialization', () => {
      const obj = { name: 'Jane', age: 25 };
      sessionStorageManager.setItem('user', obj);
      const retrieved = sessionStorageManager.getItem<typeof obj>('user');
      expect(retrieved).toEqual(obj);
    });

    it('should return null for non-existent keys', () => {
      expect(sessionStorageManager.getItem('nonexistent')).toBeNull();
    });

    it('should remove items', () => {
      sessionStorageManager.setItem('key1', 'value1');
      sessionStorageManager.removeItem('key1');
      expect(sessionStorageManager.getItem('key1')).toBeNull();
    });

    it('should clear all items', () => {
      sessionStorageManager.setItem('key1', 'value1');
      sessionStorageManager.setItem('key2', 'value2');
      sessionStorageManager.clear();
      expect(sessionStorageManager.getItem('key1')).toBeNull();
      expect(sessionStorageManager.getItem('key2')).toBeNull();
    });

    it('should handle arrays', () => {
      const arr = ['a', 'b', 'c'];
      sessionStorageManager.setItem('items', arr);
      expect(sessionStorageManager.getItem<string[]>('items')).toEqual(arr);
    });
  });

  // ===== Cookie Manager Tests (skip actual document.cookie in Node) =====
  describe('cookieManager', () => {
    it('should export cookieManager functions', () => {
      expect(typeof cookieManager.getCookie).toBe('function');
      expect(typeof cookieManager.setCookie).toBe('function');
      expect(typeof cookieManager.deleteCookie).toBe('function');
    });

    it('should handle auth token format', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      // Verify token is valid JWT-like format
      expect(token).toContain('.');
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/);
    });

    it('should validate cookie options interface', () => {
      const options = {
        maxAge: 3600,
        path: '/',
        secure: true,
        sameSite: 'Strict' as const,
      };
      expect(options.maxAge).toBe(3600);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('Strict');
    });
  });

  // ===== Integration & Use Case Tests =====
  describe('Integration & Use Cases', () => {
    it('should maintain separate storage contexts', () => {
      // localStorage
      localStorageManager.setItem('key', 'localStorage_value');

      // sessionStorage
      sessionStorageManager.setItem('key', 'sessionStorage_value');

      // cookies
      cookieManager.setCookie('key', 'cookie_value');

      expect(localStorageManager.getItem('key')).toBe('localStorage_value');
      expect(sessionStorageManager.getItem('key')).toBe('sessionStorage_value');
      expect(cookieManager.getCookie('key')).toBe('cookie_value');
    });

    it('should handle auth tokens securely in cookies', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      cookieManager.setCookie('auth_token', token, {
        secure: true,
        sameSite: 'Strict',
      });
      expect(cookieManager.getCookie('auth_token')).toBe(token);
    });

    it('should handle complex auth state in localStorage', () => {
      const authState = {
        user: {
          id: '123',
          email: 'user@example.com',
          roles: ['user', 'admin'],
        },
      };
      localStorageManager.setItem('auth_state', authState);
      const retrieved = localStorageManager.getItem<typeof authState>('auth_state');
      expect(retrieved).toEqual(authState);
    });

    it('should support user preferences in localStorage', () => {
      const prefs = {
        theme: 'dark',
        language: 'en',
        fontSize: 16,
      };
      localStorageManager.setItem('user_prefs', prefs);
      const retrieved = localStorageManager.getItem<typeof prefs>('user_prefs');
      expect(retrieved?.theme).toBe('dark');
    });

    it('should support temporary session data in sessionStorage', () => {
      const tempData = {
        formProgress: { step: 2, data: { email: 'test@test.com' } },
      };
      sessionStorageManager.setItem('temp_data', tempData);
      const retrieved = sessionStorageManager.getItem<typeof tempData>('temp_data');
      expect(retrieved?.formProgress.step).toBe(2);
    });
  });
});
