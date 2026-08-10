/**
 * Manual verification script for navigation utilities
 * Tests the core functionality without requiring a test framework
 */

// Since this is JavaScript, we'll need to build the TypeScript first
// This script demonstrates the test cases

console.log('=== Navigation Utilities Verification ===\n');

// Define test helper
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAILED:', message);
    process.exit(1);
  }
  console.log('✓', message);
}

// Define test data matching TypeScript types
const UserRole = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  PARENT: 'parent',
};

const FeatureFlagKey = {
  WORKSPACE_SWITCHER: 'workspace_switcher',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  SETTINGS: 'settings',
  PLUGINS: 'plugins',
};

// Implement functions in pure JavaScript for testing
function filterNavigationItems(items, userRoles, featureFlags, removeEmptyGroups = true) {
  return items
    .filter(item => {
      // Check role visibility
      if (item.roles && item.roles.length > 0) {
        const hasRequiredRole = userRoles.some(role => item.roles.includes(role));
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Check feature flag visibility
      if (item.featureFlag) {
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
        return {
          ...item,
          children: filterNavigationItems(
            item.children,
            userRoles,
            featureFlags,
            removeEmptyGroups
          ),
        };
      }
      return item;
    })
    .filter(item => {
      if (removeEmptyGroups && item.type === 'group') {
        return item.children.length > 0;
      }
      return true;
    });
}

function findActiveItemId(items, currentPath) {
  for (const item of items) {
    if (item.type === 'link' && item.path === currentPath) {
      return item.id;
    }

    if (item.type === 'group') {
      const found = findActiveItemId(item.children, currentPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function getGroupsToExpand(items, activeItemId) {
  if (!activeItemId) {
    return new Set();
  }

  const groupsToExpand = new Set();

  function traverse(item, parentGroupPath) {
    if (item.id === activeItemId) {
      parentGroupPath.forEach(groupId => groupsToExpand.add(groupId));
      return true;
    }

    if (item.type === 'group') {
      const found = item.children.some(child =>
        traverse(child, [...parentGroupPath, item.id])
      );
      if (found) {
        return true;
      }
    }

    return false;
  }

  items.forEach(item => traverse(item, []));

  return groupsToExpand;
}

// Test 1: Role-based filtering
console.log('\n--- Test 1: Role-Based Filtering ---');
const config1 = [
  {
    type: 'link',
    id: 'public-link',
    label: 'Public',
    path: '/public',
  },
  {
    type: 'link',
    id: 'admin-only',
    label: 'Admin',
    path: '/admin',
    roles: [UserRole.ADMIN],
  },
];

const filtered1 = filterNavigationItems(config1, [UserRole.STUDENT], {}, true);
assert(filtered1.length === 1, 'Student can see only public link');
assert(filtered1[0].id === 'public-link', 'Correct item visible');

const filtered1b = filterNavigationItems(config1, [UserRole.ADMIN], {}, true);
assert(filtered1b.length === 2, 'Admin can see all items');

// Test 2: Feature flag filtering
console.log('\n--- Test 2: Feature Flag Filtering ---');
const config2 = [
  {
    type: 'link',
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
  },
];

const filtered2 = filterNavigationItems(
  config2,
  [UserRole.STUDENT],
  { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
  true
);
assert(filtered2.length === 0, 'Disabled feature flag hides item');

const filtered2b = filterNavigationItems(
  config2,
  [UserRole.STUDENT],
  { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
  true
);
assert(filtered2b.length === 1, 'Enabled feature flag shows item');

// Test 3: Nested group filtering
console.log('\n--- Test 3: Nested Group Filtering ---');
const config3 = [
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

const filtered3 = filterNavigationItems(config3, [UserRole.STUDENT], {}, true);
assert(filtered3.length === 0, 'Empty groups are removed by default');

const filtered3b = filterNavigationItems(config3, [UserRole.ADMIN], {}, true);
assert(filtered3b.length === 1, 'Admin can see group');
assert(filtered3b[0].type === 'group', 'Group structure preserved');
assert(filtered3b[0].children.length === 1, 'Children preserved');

// Test 4: Find active item by path
console.log('\n--- Test 4: Find Active Item by Path ---');
const config4 = [
  {
    type: 'link',
    id: 'classes',
    label: 'Classes',
    path: '/dashboard/classes',
  },
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

const activeId1 = findActiveItemId(config4, '/dashboard/classes');
assert(activeId1 === 'classes', 'Found top-level link');

const activeId2 = findActiveItemId(config4, '/dashboard/admin/users');
assert(activeId2 === 'admin-users', 'Found nested link');

const activeId3 = findActiveItemId(config4, '/non-existent');
assert(activeId3 === null, 'Returns null for non-existent path');

// Test 5: Get groups to expand
console.log('\n--- Test 5: Get Groups to Expand ---');
const config5 = [
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

const toExpand = getGroupsToExpand(config5, 'link1');
assert(toExpand.size === 2, 'Returns all ancestor groups');
assert(toExpand.has('group1'), 'Includes root group');
assert(toExpand.has('group2'), 'Includes immediate parent');

const toExpand2 = getGroupsToExpand(config5, 'non-existent');
assert(toExpand2.size === 0, 'Returns empty set for non-existent item');

// Test 6: Complex combined filtering
console.log('\n--- Test 6: Complex Combined Filtering ---');
const config6 = [
  {
    type: 'link',
    id: 'home',
    label: 'Home',
    path: '/home',
  },
  {
    type: 'divider',
    id: 'divider1',
  },
  {
    type: 'group',
    id: 'teacher-tools',
    label: 'Teacher Tools',
    roles: [UserRole.TEACHER],
    children: [
      {
        type: 'link',
        id: 'classes',
        label: 'Classes',
        path: '/classes',
      },
      {
        type: 'link',
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
      },
    ],
  },
];

const filtered6 = filterNavigationItems(
  config6,
  [UserRole.TEACHER],
  { [FeatureFlagKey.ADVANCED_ANALYTICS]: true },
  true
);
assert(filtered6.length === 3, 'All visible items included');
assert(filtered6[0].id === 'home', 'Public link visible');
assert(filtered6[1].id === 'divider1', 'Divider preserved');
assert(filtered6[2].type === 'group', 'Teacher group visible');
assert(filtered6[2].children.length === 2, 'All children visible with flag enabled');

const filtered6b = filterNavigationItems(
  config6,
  [UserRole.TEACHER],
  { [FeatureFlagKey.ADVANCED_ANALYTICS]: false },
  true
);
assert(filtered6b.length === 3, 'Group still included (has other children)');
assert(filtered6b[2].children.length === 1, 'Analytics hidden by feature flag');

console.log('\n=== ✅ All Tests Passed ===\n');
