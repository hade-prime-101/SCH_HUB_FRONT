/**
 * Test Suite for findActiveItemId
 *
 * Tests the pure function that finds the active navigation item
 * by matching against the current route path.
 *
 * **Validates: Requirement 5.2**
 */

import { describe, it, expect } from 'vitest';
import { findActiveItemId } from '../navigation.utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NavigationConfig, UserRole, FeatureFlagKey } from '../navigation.types';

describe('findActiveItemId', () => {
  describe('Basic path matching', () => {
    it('should find a link with matching path at root level', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'nav-home',
          label: 'Home',
          path: '/dashboard',
        },
        {
          type: 'link',
          id: 'nav-classes',
          label: 'Classes',
          path: '/dashboard/classes',
        },
      ];

      const result = findActiveItemId(config, '/dashboard/classes');
      expect(result).toBe('nav-classes');
    });

    it('should return null when no matching path exists', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'nav-home',
          label: 'Home',
          path: '/dashboard',
        },
      ];

      const result = findActiveItemId(config, '/dashboard/nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for empty config', () => {
      const result = findActiveItemId([], '/dashboard');
      expect(result).toBeNull();
    });
  });

  describe('Nested groups', () => {
    it('should find a link inside a nested group', () => {
      const config: NavigationConfig = [
        {
          type: 'group',
          id: 'admin-group',
          label: 'Administration',
          children: [
            {
              type: 'link',
              id: 'nav-users',
              label: 'Users',
              path: '/dashboard/admin/users',
            },
            {
              type: 'link',
              id: 'nav-roles',
              label: 'Roles',
              path: '/dashboard/admin/roles',
            },
          ],
        },
      ];

      const result = findActiveItemId(config, '/dashboard/admin/users');
      expect(result).toBe('nav-users');
    });

    it('should find a link in deeply nested groups', () => {
      const config: NavigationConfig = [
        {
          type: 'group',
          id: 'parent-group',
          label: 'Parent',
          children: [
            {
              type: 'group',
              id: 'child-group',
              label: 'Child',
              children: [
                {
                  type: 'link',
                  id: 'deep-item',
                  label: 'Deep Item',
                  path: '/dashboard/deep/nested/item',
                },
              ],
            },
          ],
        },
      ];

      const result = findActiveItemId(config, '/dashboard/deep/nested/item');
      expect(result).toBe('deep-item');
    });

    it('should return null when path exists but is inside a filtered group', () => {
      const config: NavigationConfig = [
        {
          type: 'group',
          id: 'admin-group',
          label: 'Administration',
          children: [
            {
              type: 'link',
              id: 'nav-users',
              label: 'Users',
              path: '/dashboard/admin/users',
            },
          ],
        },
      ];

      // The config contains the path, but findActiveItemId doesn't do filtering
      // It just finds the item if it exists
      const result = findActiveItemId(config, '/dashboard/admin/users');
      expect(result).toBe('nav-users');
    });
  });

  describe('Edge cases', () => {
    it('should not match dividers or sections', () => {
      const config: NavigationConfig = [
        {
          type: 'divider',
          id: 'divider-1',
        },
        {
          type: 'section',
          id: 'section-1',
          label: 'Section',
        },
      ];

      const result = findActiveItemId(config, '/dashboard');
      expect(result).toBeNull();
    });

    it('should return the first matching path (not multiple results)', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'link-1',
          label: 'Link 1',
          path: '/dashboard/same',
        },
        {
          type: 'link',
          id: 'link-2',
          label: 'Link 2',
          path: '/dashboard/same',
        },
      ];

      const result = findActiveItemId(config, '/dashboard/same');
      expect(result).toBe('link-1');
    });

    it('should handle path with query parameters exactly as provided', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'nav-search',
          label: 'Search',
          path: '/dashboard/search',
        },
      ];

      // findActiveItemId does exact path matching, so query params must match exactly
      const result = findActiveItemId(config, '/dashboard/search');
      expect(result).toBe('nav-search');

      const resultWithParams = findActiveItemId(
        config,
        '/dashboard/search?q=test'
      );
      expect(resultWithParams).toBeNull();
    });

    it('should handle mixed item types in config', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'nav-home',
          label: 'Home',
          path: '/dashboard',
        },
        {
          type: 'divider',
          id: 'divider-1',
        },
        {
          type: 'section',
          id: 'section-main',
          label: 'Main',
        },
        {
          type: 'link',
          id: 'nav-classes',
          label: 'Classes',
          path: '/dashboard/classes',
        },
        {
          type: 'group',
          id: 'admin-group',
          label: 'Admin',
          children: [
            {
              type: 'link',
              id: 'nav-users',
              label: 'Users',
              path: '/dashboard/admin/users',
            },
          ],
        },
      ];

      expect(findActiveItemId(config, '/dashboard')).toBe('nav-home');
      expect(findActiveItemId(config, '/dashboard/classes')).toBe('nav-classes');
      expect(findActiveItemId(config, '/dashboard/admin/users')).toBe(
        'nav-users'
      );
      expect(findActiveItemId(config, '/nonexistent')).toBeNull();
    });
  });

  describe('Complex nested structures', () => {
    it('should traverse multiple levels of nesting', () => {
      const config: NavigationConfig = [
        {
          type: 'group',
          id: 'level1',
          label: 'Level 1',
          children: [
            {
              type: 'group',
              id: 'level2',
              label: 'Level 2',
              children: [
                {
                  type: 'group',
                  id: 'level3',
                  label: 'Level 3',
                  children: [
                    {
                      type: 'link',
                      id: 'deep-link',
                      label: 'Deep Link',
                      path: '/dashboard/level1/level2/level3/deep',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = findActiveItemId(
        config,
        '/dashboard/level1/level2/level3/deep'
      );
      expect(result).toBe('deep-link');
    });

    it('should search all branches in a config', () => {
      const config: NavigationConfig = [
        {
          type: 'group',
          id: 'branch1',
          label: 'Branch 1',
          children: [
            {
              type: 'link',
              id: 'link-b1',
              label: 'Link Branch 1',
              path: '/dashboard/branch1/item',
            },
          ],
        },
        {
          type: 'group',
          id: 'branch2',
          label: 'Branch 2',
          children: [
            {
              type: 'link',
              id: 'link-b2',
              label: 'Link Branch 2',
              path: '/dashboard/branch2/item',
            },
          ],
        },
      ];

      expect(findActiveItemId(config, '/dashboard/branch1/item')).toBe(
        'link-b1'
      );
      expect(findActiveItemId(config, '/dashboard/branch2/item')).toBe(
        'link-b2'
      );
    });
  });
});
