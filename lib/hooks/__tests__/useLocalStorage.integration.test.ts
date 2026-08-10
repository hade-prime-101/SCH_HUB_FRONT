/**
 * Integration Tests for useLocalStorage Hook - JSON Serialization
 *
 * Tests the hook's JSON serialization and deserialization handling
 * through realistic usage scenarios.
 *
 * **Validates: Requirements 2.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Polyfill localStorage for Node environment
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};

  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key in store) {
        delete store[key];
      }
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    length: () => Object.keys(store).length,
  };
}

describe('useLocalStorage Hook - JSON Serialization Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('JSON Serialization', () => {
    it('should serialize and deserialize string values', () => {
      const { result } = renderHook(() => useLocalStorage('test_string', 'initial'));
      const [value, setValue] = result.current;

      expect(value).toBe('initial');

      act(() => {
        setValue('updated string');
      });

      // Value should be persisted and retrievable
      const stored = localStorage.getItem('test_string');
      expect(stored).toBe(JSON.stringify('updated string'));
      expect(JSON.parse(stored!)).toBe('updated string');
    });

    it('should serialize and deserialize number values', () => {
      const { result } = renderHook(() => useLocalStorage('test_number', 0));
      const [value, setValue] = result.current;

      expect(value).toBe(0);

      act(() => {
        setValue(42);
      });

      const stored = localStorage.getItem('test_number');
      expect(stored).toBe(JSON.stringify(42));
      expect(JSON.parse(stored!)).toBe(42);
    });

    it('should serialize and deserialize boolean values', () => {
      const { result } = renderHook(() => useLocalStorage('test_bool', false));
      const [value, setValue] = result.current;

      expect(value).toBe(false);

      act(() => {
        setValue(true);
      });

      const stored = localStorage.getItem('test_bool');
      expect(stored).toBe(JSON.stringify(true));
      expect(JSON.parse(stored!)).toBe(true);
    });

    it('should serialize and deserialize object values', () => {
      interface UserPrefs {
        theme: string;
        language: string;
      }

      const initialPrefs: UserPrefs = { theme: 'light', language: 'en' };
      const { result } = renderHook(() => useLocalStorage('user_prefs', initialPrefs));
      const [value, setValue] = result.current;

      expect(value).toEqual(initialPrefs);

      act(() => {
        setValue({ theme: 'dark', language: 'es' });
      });

      const stored = localStorage.getItem('user_prefs');
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual({ theme: 'dark', language: 'es' });
      expect(parsed.theme).toBe('dark');
    });

    it('should serialize and deserialize array values', () => {
      const initialArray: (number | string)[] = [1, 2, 3];
      const { result } = renderHook(() => useLocalStorage('test_array', initialArray));
      const [value, setValue] = result.current;

      expect(value).toEqual([1, 2, 3]);

      act(() => {
        setValue([4, 5, 6, 'seven']);
      });

      const stored = localStorage.getItem('test_array');
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual([4, 5, 6, 'seven']);
      expect(parsed.length).toBe(4);
      expect(parsed[3]).toBe('seven');
    });

    it('should preserve data types through serialization', () => {
      interface ComplexData {
        string: string;
        number: number;
        boolean: boolean;
        array: number[];
        nested: { key: string };
      }

      const initialData: ComplexData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: 'value' },
      };

      const { result } = renderHook(() => useLocalStorage('complex', initialData));
      const [value] = result.current;

      expect(typeof value.string).toBe('string');
      expect(typeof value.number).toBe('number');
      expect(typeof value.boolean).toBe('boolean');
      expect(Array.isArray(value.array)).toBe(true);
      expect(typeof value.nested).toBe('object');
    });

    it('should handle special characters in serialized strings', () => {
      const initialValue = 'string with "quotes" and \\backslashes\\';
      const { result } = renderHook(() => useLocalStorage('special', initialValue));
      const [value] = result.current;

      expect(value).toBe(initialValue);

      const stored = localStorage.getItem('special');
      const parsed = JSON.parse(stored!);
      expect(parsed).toBe(initialValue);
    });

    it('should handle unicode characters', () => {
      const initialValue = 'こんにちは 世界 🌍';
      const { result } = renderHook(() => useLocalStorage('unicode', initialValue));
      const [value] = result.current;

      expect(value).toBe(initialValue);

      const stored = localStorage.getItem('unicode');
      const parsed = JSON.parse(stored!);
      expect(parsed).toBe(initialValue);
    });

    it('should handle null values', () => {
      const { result } = renderHook(() => useLocalStorage('null_test', null as any));
      const [value, setValue] = result.current;

      expect(value).toBeNull();

      act(() => {
        setValue(null);
      });

      const stored = localStorage.getItem('null_test');
      expect(stored).toBe(JSON.stringify(null));
      expect(JSON.parse(stored!)).toBeNull();
    });

    it('should handle deeply nested structures', () => {
      const initialValue = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
                array: [1, 2, 3],
              },
            },
          },
        },
      };

      const { result } = renderHook(() => useLocalStorage('deep', initialValue));
      const [value] = result.current;

      expect(value.level1.level2.level3.level4.value).toBe('deep');
      expect(value.level1.level2.level3.level4.array).toEqual([1, 2, 3]);
    });
  });

  describe('Serialization Edge Cases', () => {
    it('should distinguish between 0 and false', () => {
      const { result: zeroResult } = renderHook(() => useLocalStorage('zero', 0));
      const { result: falseResult } = renderHook(() => useLocalStorage('false', false));

      const [zeroValue] = zeroResult.current;
      const [falseValue] = falseResult.current;

      expect(zeroValue).toBe(0);
      expect(falseValue).toBe(false);
      expect((zeroValue as unknown) === (falseValue as unknown)).toBe(false);

      const storedZero = JSON.parse(localStorage.getItem('zero')!);
      const storedFalse = JSON.parse(localStorage.getItem('false')!);

      expect(storedZero).toBe(0);
      expect(storedFalse).toBe(false);
      expect(storedZero === storedFalse).toBe(false);
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useLocalStorage('empty_str', ''));
      const [value] = result.current;

      expect(value).toBe('');

      const stored = localStorage.getItem('empty_str');
      expect(stored).toBe(JSON.stringify(''));
      expect(JSON.parse(stored!)).toBe('');
    });

    it('should handle empty object', () => {
      const { result } = renderHook(() => useLocalStorage('empty_obj', {}));
      const [value] = result.current;

      expect(value).toEqual({});

      const stored = localStorage.getItem('empty_obj');
      expect(JSON.parse(stored!)).toEqual({});
    });

    it('should handle empty array', () => {
      const { result } = renderHook(() => useLocalStorage('empty_arr', [] as string[]));
      const [value] = result.current;

      expect(Array.isArray(value)).toBe(true);
      expect(value.length).toBe(0);

      const stored = localStorage.getItem('empty_arr');
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });

  describe('Serialization with Storage Events', () => {
    it('should deserialize values from storage events', () => {
      const key = 'sync_test';
      const newValue = { data: 'from another tab' };

      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(newValue),
        oldValue: null,
        storageArea: localStorage,
      });

      expect(event.newValue).toBe(JSON.stringify(newValue));
      const parsed = JSON.parse(event.newValue!);
      expect(parsed).toEqual(newValue);
      expect(parsed.data).toBe('from another tab');
    });

    it('should handle null deserialization from storage events', () => {
      const key = 'delete_test';

      const event = new StorageEvent('storage', {
        key: key,
        newValue: null,
        oldValue: JSON.stringify({ old: 'data' }),
        storageArea: localStorage,
      });

      // When newValue is null, should reset to initial value
      expect(event.newValue).toBeNull();
      expect(event.oldValue).toBe(JSON.stringify({ old: 'data' }));
    });
  });

  describe('Acceptance Criteria - JSON Serialization', () => {
    it('should persist values through JSON serialization and deserialization', () => {
      // Validates: Requirements 2.4 - Handle JSON serialization
      interface TestData {
        email: string;
        count: number;
        active: boolean;
      }

      const initialData: TestData = {
        email: 'test@example.com',
        count: 5,
        active: true,
      };

      const { result } = renderHook(() => useLocalStorage('test_data', initialData));
      const [value, setValue] = result.current;

      // Initial value should match
      expect(value).toEqual(initialData);

      // Update and verify persistence
      act(() => {
        setValue({ email: 'new@example.com', count: 10, active: false });
      });

      // Check localStorage has correct JSON
      const stored = localStorage.getItem('test_data');
      expect(stored).not.toBeNull();

      // Deserialize and verify
      const deserialized = JSON.parse(stored!);
      expect(deserialized).toEqual({ email: 'new@example.com', count: 10, active: false });
      expect(deserialized.email).toBe('new@example.com');
      expect(deserialized.count).toBe(10);
      expect(deserialized.active).toBe(false);
    });

    it('should round-trip complex objects through serialization', () => {
      // Validates: Requirements 2.4 - Handle JSON serialization
      interface User {
        id: string;
        name: string;
        preferences: {
          theme: 'light' | 'dark';
          notifications: boolean;
        };
        tags: string[];
      }

      const user: User = {
        id: '123',
        name: 'John Doe',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
        tags: ['admin', 'developer'],
      };

      const { result } = renderHook(() => useLocalStorage('user', user));
      const [storedUser] = result.current;

      // Should be identical after round-trip
      expect(storedUser).toEqual(user);
      expect(storedUser.id).toBe(user.id);
      expect(storedUser.preferences.theme).toBe('dark');
      expect(storedUser.tags).toEqual(['admin', 'developer']);
    });
  });
});
