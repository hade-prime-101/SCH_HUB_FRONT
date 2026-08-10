/**
 * Navigation Utility Functions
 * 
 * Pure functions for navigation logic including filtering, searching,
 * and traversing navigation configurations.
 * 
 * These functions are designed to be side-effect free and easily testable,
 * particularly with property-based testing.
 */

import {
  NavigationItem,
  NavigationConfig,
  NavGroup,
  NavLink,
  UserRole,
  FeatureFlagKey,
} from './navigation.types';

/**
 * Filters navigation items based on user roles and feature flags.
 * 
 * This pure function recursively filters a navigation configuration:
 * 1. Removes items where user lacks required role(s)
 * 2. Removes items where required feature flag is disabled
 * 3. Recursively filters children in NavGroup items
 * 4. Removes groups that have no visible children (optional behavior)
 * 
 * Properties validated:
 * - Filtered config maintains structure (only visibility changed)
 * - Role-based filtering respects role array
 * - Feature flag filtering respects flag state
 * - Nested recursion preserves item identity
 * 
 * @param items - Navigation items to filter
 * @param userRoles - Current user's roles for visibility check
 * @param featureFlags - Map of feature flag keys to enabled/disabled state
 * @param removeEmptyGroups - If true, remove groups with no visible children (default: true)
 * @returns Filtered navigation items
 * 
 * @example
 * const items = [
 *   { type: 'link', id: 'home', label: 'Home', path: '/dashboard' },
 *   { type: 'group', id: 'admin', label: 'Admin', roles: ['admin'], children: [...] },
 * ];
 * const userRoles = ['student'];
 * const featureFlags = { workspace_switcher: false, ... };
 * const filtered = filterNavigationItems(items, userRoles, featureFlags);
 * // Result: [home] - admin group removed because user doesn't have admin role
 */
export function filterNavigationItems(
  items: NavigationConfig,
  userRoles: UserRole[],
  featureFlags: Partial<Record<FeatureFlagKey, boolean>>,
  removeEmptyGroups: boolean = true
): NavigationItem[] {
  return items
    .filter(item => {
      // Check role visibility: if item has roles, user must have at least one
      if ('roles' in item && item.roles && item.roles.length > 0) {
        const hasRequiredRole = userRoles.some(role =>
          item.roles!.includes(role)
        );
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Check feature flag visibility: if item has flag, it must be enabled
      if ('featureFlag' in item && item.featureFlag) {
        const isFlagEnabled = featureFlags[item.featureFlag];
        if (!isFlagEnabled) {
          return false;
        }
      }

      return true;
    })
    .map(item => {
      // Recursively filter children in groups
      if (item.type === 'group') {
        const filteredGroup: NavGroup = {
          ...item,
          children: filterNavigationItems(
            item.children,
            userRoles,
            featureFlags,
            removeEmptyGroups
          ),
        };
        return filteredGroup;
      }
      return item;
    })
    // Optional: Remove groups with no visible children
    .filter(item => {
      if (removeEmptyGroups && item.type === 'group') {
        return item.children.length > 0;
      }
      return true;
    });
}

/**
 * Finds a navigation item by its ID by recursively searching the configuration.
 * 
 * @param items - Navigation items to search
 * @param itemId - ID to search for
 * @returns The matching NavigationItem, or null if not found
 * 
 * @example
 * const item = findItemById(config, 'admin-users');
 * // Returns the NavLink or NavGroup with id 'admin-users'
 */
export function findItemById(
  items: NavigationConfig,
  itemId: string
): NavigationItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.type === 'group') {
      const found = findItemById(item.children, itemId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Finds a navigation item's ID by matching against a route path.
 * Recursively searches through the configuration for a NavLink with matching path.
 * 
 * Properties validated:
 * - Active item path lookup is exact (match returns item id, no match returns null)
 * 
 * @param items - Navigation items to search
 * @param currentPath - Route path to match against NavLink.path
 * @returns The ID of the matching NavLink, or null if not found
 * 
 * @example
 * const activeId = findActiveItemId(config, '/dashboard/admin/users');
 * // Returns 'admin-users' if a link with that path exists
 */
export function findActiveItemId(
  items: NavigationConfig,
  currentPath: string
): string | null {
  for (const item of items) {
    // Check if this link matches the current path
    if (item.type === 'link' && item.path === currentPath) {
      return item.id;
    }

    // Recursively search in groups
    if (item.type === 'group') {
      const found = findActiveItemId(item.children, currentPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Returns a Set of group IDs that should be expanded to show the active item.
 * Recursively traverses the item tree to find the active item, then collects
 * all ancestor group IDs that form the path to that item.
 * 
 * Properties validated:
 * - Group expansion creates complete ancestor chain (all ancestors included, no gaps)
 * - Nested config recursion preserves item identity (IDs unchanged)
 * 
 * @param items - Navigation items to traverse
 * @param activeItemId - ID of the currently active navigation item
 * @returns Set of group IDs that are ancestors of the active item
 * 
 * @example
 * const expandedGroups = getGroupsToExpand(config, 'admin-users');
 * // Returns Set containing all group IDs that must be expanded to show 'admin-users'
 * // e.g., Set(['admin-group', 'user-management-group'])
 */
export function getGroupsToExpand(
  items: NavigationConfig,
  activeItemId: string | null
): Set<string> {
  if (!activeItemId) {
    return new Set();
  }

  const groupsToExpand = new Set<string>();

  /**
   * Recursively traverse the tree, collecting ancestor groups on the path to activeItemId.
   * Returns true if the active item is found in this subtree.
   */
  function traverse(item: NavigationItem, parentGroupPath: string[]): boolean {
    // Found the active item
    if (item.id === activeItemId) {
      // Add all parent groups to the expansion set
      parentGroupPath.forEach(groupId => groupsToExpand.add(groupId));
      return true;
    }

    // Recursively search in group children
    if (item.type === 'group') {
      // Check if active item is in any child
      const found = item.children.some(child =>
        traverse(child, [...parentGroupPath, item.id])
      );
      if (found) {
        return true;
      }
    }

    return false;
  }

  // Search through all top-level items
  items.forEach(item => traverse(item, []));

  return groupsToExpand;
}

/**
 * Retrieves the breadcrumb trail (path of item IDs) to a specific item.
 * Useful for generating breadcrumb navigation showing the user's location.
 * 
 * @param items - Navigation items to search
 * @param targetItemId - ID of the target item
 * @returns Array of item IDs representing the path to the target item, or empty array if not found
 * 
 * @example
 * const breadcrumb = getItemPath(config, 'admin-users');
 * // Returns ['admin-group', 'admin-users']
 */
export function getItemPath(
  items: NavigationConfig,
  targetItemId: string
): string[] {
  /**
   * Recursively search for the target item, building path as we traverse.
   */
  function findPath(
    items: NavigationConfig,
    currentPath: string[]
  ): string[] | null {
    for (const item of items) {
      // Found the target
      if (item.id === targetItemId) {
        return [...currentPath, item.id];
      }

      // Recursively search in groups
      if (item.type === 'group') {
        const found = findPath(item.children, [...currentPath, item.id]);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  return findPath(items, []) || [];
}
