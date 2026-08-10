/**
 * Comprehensive Unit Tests for Navigation Utility Functions
 * 
 * Tests core navigation algorithms with specific examples and edge cases:
 * - filterNavigationItems: Role and feature flag filtering
 * - findActiveItemId: Active item detection in nested structures
 * - getGroupsToExpand: Group expansion for multi-level nesting
 * 
 * **Validates: Requirements 2.2, 2.4, 5.2, 5.4, 7.1, 7.2, 7.4**
 */

import { describe, it, expect } from 'vitest';
import {
  filterNavigationItems,
  findActiveItemId,
  getGroupsToExpand,
  findItemById,
  getItemPath,
} from '../navigation.utils';
import {
  NavigationConfig,
  UserRole,
  FeatureFlagKey,
} from '../navigation.types';

describe('Navigation Utility Functions - Comprehensive Tests', () => {
  // ============================================================
  // filterNavigationItems Tests
  // ============================================================

  describe('filterNavigationItems', () => {
    describe('Basic role filtering', () => {
      it('should filter items by role - keep matching role', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'teacher-link',
            label: 'Teacher Only',
            path: '/teacher',
            roles: [UserRole.TEACHER],
          },
          {
            type: 'link',
            id: 'public-link',
            label: 'Public',
            path: '/public',
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.TEACHER],
          {},
          true
        );

        expect(result).toHaveLength(2);
        expect(result.map(item => item.id)).toContain('teacher-link');
        expect(result.map(item => item.id)).toContain('public-link');
      });

      it('should filter items by role - remove non-matching role', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'admin-link',
            label: 'Admin Only',
            path: '/admin',
            roles: [UserRole.ADMIN],
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(0);
      });

      it('should filter items with multiple allowed roles', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'staff-link',
            label: 'Staff',
            path: '/staff',
            roles: [UserRole.TEACHER, UserRole.ADMIN],
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.TEACHER],
          {},
          true
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('staff-link');
      });
    });

    describe('Feature flag filtering', () => {
      it('should show item when feature flag is enabled', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'analytics-link',
            label: 'Analytics',
            path: '/analytics',
            featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
          true
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('analytics-link');
      });

      it('should hide item when feature flag is disabled', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'analytics-link',
            label: 'Analytics',
            path: '/analytics',
            featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
          true
        );

        expect(result).toHaveLength(0);
      });

      it('should hide item when feature flag is not provided', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'analytics-link',
            label: 'Analytics',
            path: '/analytics',
            featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
          },
        ];

        const result = filterNavigationItems(config, [UserRole.STUDENT], {}, true);

        expect(result).toHaveLength(0);
      });
    });

    describe('Nested group filtering', () => {
      it('should recursively filter children in groups', () => {
        const config: NavigationConfig = [
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
            ],
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(0);
      });

      it('should keep groups when children are visible', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'main-group',
            label: 'Main',
            children: [
              {
                type: 'link',
                id: 'public-link',
                label: 'Public',
                path: '/public',
              },
            ],
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('group');
        if (result[0].type === 'group') {
          expect(result[0].children).toHaveLength(1);
        }
      });

      it('should filter mixed content in groups', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'mixed-group',
            label: 'Mixed',
            children: [
              {
                type: 'link',
                id: 'public-link',
                label: 'Public',
                path: '/public',
              },
              {
                type: 'link',
                id: 'admin-link',
                label: 'Admin',
                path: '/admin',
                roles: [UserRole.ADMIN],
              },
              {
                type: 'divider',
                id: 'divider-1',
              },
            ],
          },
        ];

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(1);
        if (result[0].type === 'group') {
          expect(result[0].children).toHaveLength(2); // public-link + divider
        }
      });
    });

    describe('Empty groups removal', () => {
      it('should remove empty groups when removeEmptyGroups=true', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'admin-group',
            label: 'Admin',
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

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(0);
      });

      it('should keep empty groups when removeEmptyGroups=false', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'admin-group',
            label: 'Admin',
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

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          false
        );

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('group');
        if (result[0].type === 'group') {
          expect(result[0].children).toHaveLength(0);
        }
      });
    });

    describe('Edge cases for filtering', () => {
      it('should handle empty config', () => {
        const result = filterNavigationItems([], [UserRole.STUDENT], {}, true);
        expect(result).toEqual([]);
      });

      it('should handle empty user roles', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'public-link',
            label: 'Public',
            path: '/public',
          },
        ];

        const result = filterNavigationItems(config, [], {}, true);
        expect(result).toHaveLength(1);
      });

      it('should preserve non-filterable item types', () => {
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

        const result = filterNavigationItems(
          config,
          [UserRole.STUDENT],
          {},
          true
        );

        expect(result).toHaveLength(2);
      });
    });
  });

  // ============================================================
  // findActiveItemId Tests
  // ============================================================

  describe('findActiveItemId', () => {
    describe('Simple path matching', () => {
      it('should find link with exact path at root level', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'home-link',
            label: 'Home',
            path: '/dashboard',
          },
        ];

        const result = findActiveItemId(config, '/dashboard');
        expect(result).toBe('home-link');
      });

      it('should return null for non-matching path', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'home-link',
            label: 'Home',
            path: '/dashboard',
          },
        ];

        const result = findActiveItemId(config, '/dashboard/other');
        expect(result).toBeNull();
      });

      it('should return null for empty config', () => {
        const result = findActiveItemId([], '/dashboard');
        expect(result).toBeNull();
      });
    });

    describe('Nested structure searching', () => {
      it('should find link inside group', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'admin-group',
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

        const result = findActiveItemId(config, '/dashboard/admin/users');
        expect(result).toBe('admin-users');
      });

      it('should find link in deeply nested groups', () => {
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
                        label: 'Deep',
                        path: '/deep/path/item',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ];

        const result = findActiveItemId(config, '/deep/path/item');
        expect(result).toBe('deep-link');
      });

      it('should search multiple branches', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'branch1',
            label: 'Branch 1',
            children: [
              {
                type: 'link',
                id: 'link1',
                label: 'Link 1',
                path: '/branch1/item',
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
                id: 'link2',
                label: 'Link 2',
                path: '/branch2/item',
              },
            ],
          },
        ];

        expect(findActiveItemId(config, '/branch1/item')).toBe('link1');
        expect(findActiveItemId(config, '/branch2/item')).toBe('link2');
      });
    });

    describe('Edge cases for path matching', () => {
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

      it('should return first match (not multiple)', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'link-a',
            label: 'Link A',
            path: '/same',
          },
          {
            type: 'link',
            id: 'link-b',
            label: 'Link B',
            path: '/same',
          },
        ];

        const result = findActiveItemId(config, '/same');
        expect(result).toBe('link-a');
      });

      it('should do exact path matching (not prefix)', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'dashboard-link',
            label: 'Dashboard',
            path: '/dashboard',
          },
        ];

        expect(findActiveItemId(config, '/dashboard')).toBe('dashboard-link');
        expect(findActiveItemId(config, '/dashboard/extra')).toBeNull();
      });
    });
  });

  // ============================================================
  // getGroupsToExpand Tests
  // ============================================================

  describe('getGroupsToExpand', () => {
    describe('Single level nesting', () => {
      it('should expand immediate parent group', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'admin-group',
            label: 'Admin',
            children: [
              {
                type: 'link',
                id: 'admin-users',
                label: 'Users',
                path: '/admin/users',
              },
            ],
          },
        ];

        const result = getGroupsToExpand(config, 'admin-users');
        expect(result.size).toBe(1);
        expect(result.has('admin-group')).toBe(true);
      });

      it('should return empty set for top-level item', () => {
        const config: NavigationConfig = [
          {
            type: 'link',
            id: 'home',
            label: 'Home',
            path: '/home',
          },
        ];

        const result = getGroupsToExpand(config, 'home');
        expect(result.size).toBe(0);
      });
    });

    describe('Multi-level nesting', () => {
      it('should expand all ancestor groups', () => {
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
                    type: 'link',
                    id: 'nested-link',
                    label: 'Nested',
                    path: '/nested',
                  },
                ],
              },
            ],
          },
        ];

        const result = getGroupsToExpand(config, 'nested-link');
        expect(result.size).toBe(2);
        expect(result.has('level1')).toBe(true);
        expect(result.has('level2')).toBe(true);
      });

      it('should handle 3+ levels of nesting', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'g1',
            label: 'G1',
            children: [
              {
                type: 'group',
                id: 'g2',
                label: 'G2',
                children: [
                  {
                    type: 'group',
                    id: 'g3',
                    label: 'G3',
                    children: [
                      {
                        type: 'group',
                        id: 'g4',
                        label: 'G4',
                        children: [
                          {
                            type: 'link',
                            id: 'deep',
                            label: 'Deep',
                            path: '/deep',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ];

        const result = getGroupsToExpand(config, 'deep');
        expect(result.size).toBe(4);
        ['g1', 'g2', 'g3', 'g4'].forEach(id => {
          expect(result.has(id)).toBe(true);
        });
      });
    });

    describe('Edge cases for group expansion', () => {
      it('should return empty set when activeItemId is null', () => {
        const config: NavigationConfig = [
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

      it('should return empty set when item not found', () => {
        const config: NavigationConfig = [
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

      it('should handle multiple branches (correct path)', () => {
        const config: NavigationConfig = [
          {
            type: 'group',
            id: 'branch1',
            label: 'Branch 1',
            children: [
              {
                type: 'link',
                id: 'link-b1',
                label: 'Link B1',
                path: '/b1',
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
                label: 'Link B2',
                path: '/b2',
              },
            ],
          },
        ];

        const result = getGroupsToExpand(config, 'link-b2');
        expect(result.size).toBe(1);
        expect(result.has('branch2')).toBe(true);
        expect(result.has('branch1')).toBe(false);
      });
    });
  });

  // ============================================================
  // Additional Utility Functions Tests
  // ============================================================

  describe('findItemById', () => {
    it('should find item by id at root level', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      const result = findItemById(config, 'home');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('home');
    });

    it('should find item in nested groups', () => {
      const config: NavigationConfig = [
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

      const result = findItemById(config, 'users');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('users');
    });

    it('should return null for non-existent id', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      const result = findItemById(config, 'non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getItemPath', () => {
    it('should return path to root-level item', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      const result = getItemPath(config, 'home');
      expect(result).toEqual(['home']);
    });

    it('should return breadcrumb path for nested item', () => {
      const config: NavigationConfig = [
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

      const result = getItemPath(config, 'users');
      expect(result).toEqual(['admin', 'users']);
    });

    it('should return empty array for non-existent item', () => {
      const config: NavigationConfig = [
        {
          type: 'link',
          id: 'home',
          label: 'Home',
          path: '/home',
        },
      ];

      const result = getItemPath(config, 'non-existent');
      expect(result).toEqual([]);
    });
  });
});
