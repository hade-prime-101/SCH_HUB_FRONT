/**
 * Property-Based Tests for filterNavigationItems
 * 
 * These tests use property-based testing to verify universal properties
 * about the filterNavigationItems function that should hold for all inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  filterNavigationItems,
  findActiveItemId,
  getGroupsToExpand,
} from '../navigation.utils';
import {
  NavigationItem,
  UserRole,
  FeatureFlagKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  NavGroup,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  NavLink,
} from '../navigation.types';

describe('filterNavigationItems', () => {
  describe('Property 1: Filtered Config Maintains Structure', () => {
    it('should preserve item types and hierarchy after filtering', () => {
      // Arrange: Create config with mixed types
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'public-link',
          label: 'Public',
          path: '/public',
        },
        {
          type: 'divider',
          id: 'divider1',
        },
        {
          type: 'group',
          id: 'admin-group',
          label: 'Admin',
          roles: [UserRole.ADMIN],
          children: [
            {
              type: 'link',
              id: 'admin-users',
              label: 'Users',
              path: '/admin/users',
            },
            {
              type: 'section',
              id: 'admin-section',
              label: 'Settings',
            },
          ],
        },
      ];

      // Act: Filter with student role
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert: Public items remain, admin group filtered out, structure intact
      expect(result).toHaveLength(2); // public-link + divider
      expect(result[0].type).toBe('link');
      expect(result[1].type).toBe('divider');
    });

    it('should maintain nested group structure when children are visible', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group',
          children: [
            {
              type: 'link',
              id: 'child1',
              label: 'Child',
              path: '/child',
            },
          ],
        },
      ];

      // Act
      const result = filterNavigationItems(config, [UserRole.STUDENT], {}, true);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('group');
      if (result[0].type === 'group') {
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].id).toBe('child1');
      }
    });
  });

  describe('Property 2: Role-Based Filtering Respects Role Array', () => {
    it('should include items with matching role', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'teacher-only',
          label: 'Teacher',
          path: '/teacher',
          roles: [UserRole.TEACHER],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.TEACHER],
        {},
        true
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('teacher-only');
    });

    it('should exclude items when user lacks required role', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'admin-only',
          label: 'Admin',
          path: '/admin',
          roles: [UserRole.ADMIN],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should include items when user has one of multiple allowed roles', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'staff-only',
          label: 'Staff',
          path: '/staff',
          roles: [UserRole.TEACHER, UserRole.ADMIN],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.TEACHER],
        {},
        true
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('staff-only');
    });

    it('should include items with no roles specified (public items)', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'public',
          label: 'Public',
          path: '/public',
          // no roles array
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('public');
    });

    it('should recursively filter roles in nested groups', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group',
          children: [
            {
              type: 'link',
              id: 'admin-child',
              label: 'Admin Child',
              path: '/admin',
              roles: [UserRole.ADMIN],
            },
            {
              type: 'link',
              id: 'public-child',
              label: 'Public Child',
              path: '/public',
            },
          ],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert: Group should contain only public child
      expect(result).toHaveLength(1);
      if (result[0].type === 'group') {
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].id).toBe('public-child');
      }
    });
  });

  describe('Property 3: Feature Flag Filtering Respects Flag State', () => {
    it('should include items when feature flag is enabled', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'analytics',
          label: 'Analytics',
          path: '/analytics',
          featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
        true
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('analytics');
    });

    it('should exclude items when feature flag is disabled', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'analytics',
          label: 'Analytics',
          path: '/analytics',
          featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
        true
      );

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should exclude items when feature flag is not provided (treats as false)', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'analytics',
          label: 'Analytics',
          path: '/analytics',
          featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
        },
      ];

      // Act
      const result = filterNavigationItems(config, [UserRole.STUDENT], {}, true);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should recursively filter feature flags in nested groups', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group',
          children: [
            {
              type: 'link',
              id: 'analytics',
              label: 'Analytics',
              path: '/analytics',
              featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
            },
            {
              type: 'link',
              id: 'home',
              label: 'Home',
              path: '/home',
            },
          ],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
        true
      );

      // Assert: Group should contain only home link
      expect(result).toHaveLength(1);
      if (result[0].type === 'group') {
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].id).toBe('home');
      }
    });
  });

  describe('Empty Groups Removal', () => {
    it('should remove empty groups when removeEmptyGroups=true', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Admin Group',
          roles: [UserRole.ADMIN],
          children: [
            {
              type: 'link',
              id: 'admin-link',
              label: 'Admin',
              path: '/admin',
            },
          ],
        },
      ];

      // Act: Student filtering out admin group
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert: Group should be removed
      expect(result).toHaveLength(0);
    });

    it('should keep empty groups when removeEmptyGroups=false', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Admin Group',
          roles: [UserRole.ADMIN],
          children: [
            {
              type: 'link',
              id: 'admin-link',
              label: 'Admin',
              path: '/admin',
            },
          ],
        },
      ];

      // Act: Student filtering, but keep empty groups
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        false
      );

      // Assert: Group should be kept (but empty)
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('group');
      if (result[0].type === 'group') {
        expect(result[0].children).toHaveLength(0);
      }
    });
  });

  describe('Combined Role and Feature Flag Filtering', () => {
    it('should filter on both role and feature flag', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'analytics',
          label: 'Analytics',
          path: '/analytics',
          roles: [UserRole.TEACHER],
          featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
        },
      ];

      // Act: Student without analytics flag
      const result1 = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
        true
      );

      // Assert: Filtered by role
      expect(result1).toHaveLength(0);

      // Act: Teacher with analytics flag disabled
      const result2 = filterNavigationItems(
        config,
        [UserRole.TEACHER],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
        true
      );

      // Assert: Filtered by flag
      expect(result2).toHaveLength(0);

      // Act: Teacher with analytics flag enabled
      const result3 = filterNavigationItems(
        config,
        [UserRole.TEACHER],
        { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
        true
      );

      // Assert: Passes both checks
      expect(result3).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input array', () => {
      const result = filterNavigationItems([], [UserRole.STUDENT], {}, true);
      expect(result).toEqual([]);
    });

    it('should handle empty roles array', () => {
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      // User with no roles can see public items
      const result = filterNavigationItems(config, [], {}, true);
      expect(result).toHaveLength(1);
    });

    it('should handle deeply nested groups', () => {
      // Arrange: 3 levels deep
      const config: NavigationItem[] = [
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
                      label: 'Deep',
                      path: '/deep',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      // Act
      const result = filterNavigationItems(
        config,
        [UserRole.STUDENT],
        {},
        true
      );

      // Assert: Structure preserved at all levels
      expect(result).toHaveLength(1);
      if (result[0].type === 'group') {
        expect(result[0].children).toHaveLength(1);
        if (result[0].children[0].type === 'group') {
          expect(result[0].children[0].children).toHaveLength(1);
          if (result[0].children[0].children[0].type === 'group') {
            expect(result[0].children[0].children[0].children).toHaveLength(1);
          }
        }
      }
    });
  });
});

describe('findActiveItemId', () => {
  describe('Property 4: Active Item Path Lookup is Exact', () => {
    it('should find link with exact path match', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'classes',
          label: 'Classes',
          path: '/dashboard/classes',
        },
      ];

      // Act
      const result = findActiveItemId(config, '/dashboard/classes');

      // Assert
      expect(result).toBe('classes');
    });

    it('should return null when path does not match any link', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'classes',
          label: 'Classes',
          path: '/dashboard/classes',
        },
      ];

      // Act
      const result = findActiveItemId(config, '/dashboard/other');

      // Assert
      expect(result).toBeNull();
    });

    it('should find nested link by exact path', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'admin',
          label: 'Admin',
          children: [
            {
              type: 'link',
              id: 'admin-users',
              label: 'Users',
              path: '/dashboard/admin/users',
            },
          ],
        },
      ];

      // Act
      const result = findActiveItemId(config, '/dashboard/admin/users');

      // Assert
      expect(result).toBe('admin-users');
    });

    it('should return null for empty config', () => {
      const result = findActiveItemId([], '/dashboard');
      expect(result).toBeNull();
    });

    it('should not match paths that contain the target path', () => {
      // Arrange: Ensure exact match only
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'classes',
          label: 'Classes',
          path: '/dashboard/classes',
        },
      ];

      // Act: Similar but not exact path
      const result = findActiveItemId(config, '/dashboard/classes/123');

      // Assert
      expect(result).toBeNull();
    });
  });
});

describe('getGroupsToExpand', () => {
  describe('Property 5: Group Expansion Creates Complete Ancestor Chain', () => {
    it('should return empty set when activeItemId is null', () => {
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group',
          children: [],
        },
      ];

      const result = getGroupsToExpand(config, null);
      expect(result.size).toBe(0);
    });

    it('should return empty set when activeItemId is not in config', () => {
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group',
          children: [
            {
              type: 'link',
              id: 'link1',
              label: 'Link',
              path: '/link',
            },
          ],
        },
      ];

      const result = getGroupsToExpand(config, 'non-existent');
      expect(result.size).toBe(0);
    });

    it('should return all ancestor groups for nested item', () => {
      // Arrange: Multi-level nesting
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group 1',
          children: [
            {
              type: 'group',
              id: 'group2',
              label: 'Group 2',
              children: [
                {
                  type: 'link',
                  id: 'link1',
                  label: 'Link',
                  path: '/link',
                },
              ],
            },
          ],
        },
      ];

      // Act
      const result = getGroupsToExpand(config, 'link1');

      // Assert: Should include both ancestor groups
      expect(result.size).toBe(2);
      expect(result.has('group1')).toBe(true);
      expect(result.has('group2')).toBe(true);
    });

    it('should include immediate parent group', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'admin',
          label: 'Admin',
          children: [
            {
              type: 'link',
              id: 'users',
              label: 'Users',
              path: '/users',
            },
          ],
        },
      ];

      // Act
      const result = getGroupsToExpand(config, 'users');

      // Assert
      expect(result.size).toBe(1);
      expect(result.has('admin')).toBe(true);
    });

    it('should return empty for top-level items', () => {
      // Arrange
      const config: NavigationItem[] = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      // Act
      const result = getGroupsToExpand(config, 'home');

      // Assert: No groups to expand
      expect(result.size).toBe(0);
    });

    it('should handle items in multiple groups (returns correct path)', () => {
      // Arrange: Item exists in specific path
      const config: NavigationItem[] = [
        {
          type: 'group',
          id: 'group1',
          label: 'Group 1',
          children: [
            {
              type: 'link',
              id: 'link1',
              label: 'Link 1',
              path: '/link1',
            },
          ],
        },
        {
          type: 'group',
          id: 'group2',
          label: 'Group 2',
          children: [
            {
              type: 'link',
              id: 'link1-copy',
              label: 'Link 1 Copy',
              path: '/link1-copy',
            },
          ],
        },
      ];

      // Act: Find first occurrence of a link
      const result = getGroupsToExpand(config, 'link1');

      // Assert: Should include group1
      expect(result.has('group1')).toBe(true);
      expect(result.has('group2')).toBe(false);
    });
  });
});
