/**
 * Manual validation of findActiveItemId function
 * This script validates the logic without requiring a test framework
 */

// Simulating the findActiveItemId function
function findActiveItemId(items, currentPath) {
  for (const item of items) {
    // Check if this is a link with a matching path
    if (item.type === 'link') {
      if (item.path === currentPath) {
        return item.id;
      }
    }

    // Recursively search in group children
    if (item.type === 'group') {
      const found = findActiveItemId(item.children, currentPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

// Test 1: Basic path matching
console.log('Test 1: Basic path matching');
const config1 = [
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
const result1 = findActiveItemId(config1, '/dashboard/classes');
console.log(
  `✓ Found: ${result1 === 'nav-classes' ? 'PASS' : 'FAIL'} (expected 'nav-classes', got '${result1}')`
);

// Test 2: No matching path
console.log('\nTest 2: No matching path');
const result2 = findActiveItemId(config1, '/dashboard/nonexistent');
console.log(
  `✓ Not found: ${result2 === null ? 'PASS' : 'FAIL'} (expected null, got '${result2}')`
);

// Test 3: Empty config
console.log('\nTest 3: Empty config');
const result3 = findActiveItemId([], '/dashboard');
console.log(
  `✓ Empty config: ${result3 === null ? 'PASS' : 'FAIL'} (expected null, got '${result3}')`
);

// Test 4: Nested groups
console.log('\nTest 4: Nested groups');
const config4 = [
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
const result4 = findActiveItemId(config4, '/dashboard/admin/users');
console.log(
  `✓ Nested: ${result4 === 'nav-users' ? 'PASS' : 'FAIL'} (expected 'nav-users', got '${result4}')`
);

// Test 5: Deeply nested groups
console.log('\nTest 5: Deeply nested groups');
const config5 = [
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
const result5 = findActiveItemId(config5, '/dashboard/deep/nested/item');
console.log(
  `✓ Deep nested: ${result5 === 'deep-item' ? 'PASS' : 'FAIL'} (expected 'deep-item', got '${result5}')`
);

// Test 6: Mixed item types
console.log('\nTest 6: Mixed item types');
const config6 = [
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
const result6a = findActiveItemId(config6, '/dashboard');
const result6b = findActiveItemId(config6, '/dashboard/classes');
const result6c = findActiveItemId(config6, '/dashboard/admin/users');
const result6d = findActiveItemId(config6, '/nonexistent');
console.log(
  `✓ Mixed types: ${result6a === 'nav-home' && result6b === 'nav-classes' && result6c === 'nav-users' && result6d === null ? 'PASS' : 'FAIL'}`
);

console.log('\n✅ All manual validation tests completed');
