# NavigationProvider Implementation Notes

## Overview

The `NavigationProvider` component is a React Context-based state management solution for the dashboard navigation system. It manages all navigation UI state including sidebar collapse state, active item synchronization, expanded groups, user roles, and feature flags.

## Component Capabilities

### 1. State Management

The provider manages the following state:

- **isSidebarCollapsed** (boolean): Whether the desktop sidebar is collapsed
- **isDrawerOpen** (boolean): Whether the mobile drawer is open
- **activeItemId** (string | null): ID of the currently active navigation item (matching current route)
- **expandedGroups** (Set<string>): Set of expanded navigation group IDs
- **userRoles** (UserRole[]): Current user's assigned roles
- **featureFlags** (Record<FeatureFlagKey, boolean>): Enabled/disabled feature flags
- **filteredConfig** (NavigationItem[]): Navigation config filtered by roles and feature flags

### 2. Initialization

The provider initializes state from multiple sources:

- **userSession prop**: Used to initialize user roles for filtering
- **featureFlags prop**: Used to initialize feature flags (defaults to all false if not provided)
- **navigationConfig prop**: The full navigation structure
- **localStorage**: Loads sidebar collapsed state from key `dashboard_sidebar_collapsed`
- **sessionStorage**: Loads expanded groups from key `nav_expanded_groups`
- **usePathname hook**: Syncs active item with current route

### 3. localStorage Persistence

The sidebar collapsed state is persisted to localStorage:

- Key: `'dashboard_sidebar_collapsed'`
- Value: JSON boolean string
- Loaded on mount
- Saved whenever collapsed state changes
- Handles JSON parse errors gracefully

### 4. sessionStorage Persistence

Expanded groups are persisted to sessionStorage for in-session consistency between desktop and mobile:

- Key: `'nav_expanded_groups'`
- Value: JSON array of group IDs
- Loaded on mount and converted to Set
- Saved whenever groups are toggled
- Handles JSON parse errors gracefully

### 5. Active Item Synchronization

The component automatically syncs the active item with the current route:

- Uses `usePathname()` hook to track route changes
- Calls `findActiveItemId()` utility to find matching item by path
- Updates `activeItemId` whenever pathname changes
- Auto-expands all ancestor groups when active item changes

### 6. Filtered Config Computation

The navigation config is filtered based on user roles and feature flags:

- Uses `filterNavigationItems()` utility
- Recomputes whenever `userRoles`, `featureFlags`, or `navigationConfig` changes
- Removes role-restricted items if user lacks required role
- Removes feature-flagged items if flag is disabled
- Recursively filters nested groups
- Removes empty groups (groups with no visible children)

### 7. Memoization

All context values are memoized to prevent unnecessary re-renders:

- Uses `useMemo()` for context value object
- All state setters are wrapped in `useCallback()` for identity stability
- Dependencies are carefully tracked to ensure correct memoization

## Usage

### Wrapping the Dashboard

In your dashboard layout (`/app/dashboard/layout.tsx`):

```typescript
import { NavigationProvider } from '@/components/navigation';
import { navigationConfig } from '@/lib/navigation/navigation.config';
import { getUserSession, getFeatureFlags } from '@/lib/auth'; // Your auth functions

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user session and feature flags server-side
  const userSession = await getUserSession();
  const featureFlags = await getFeatureFlags(userSession.id);

  return (
    <NavigationProvider
      userSession={userSession}
      featureFlags={featureFlags}
      navigationConfig={navigationConfig}
    >
      {children}
    </NavigationProvider>
  );
}
```

### Consuming Context in Components

Use the `useNavigation()` hook in any child component:

```typescript
'use client';

import { useNavigation } from '@/components/navigation';

export function MyComponent() {
  const {
    isSidebarCollapsed,
    activeItemId,
    expandedGroups,
    filteredConfig,
    toggleGroup,
    setSidebarCollapsed,
  } = useNavigation();

  // Use context values and setters
}
```

### Toggling Group Expansion

```typescript
const { expandedGroups, toggleGroup } = useNavigation();

function GroupHeader({ groupId, label }) {
  const isExpanded = expandedGroups.has(groupId);
  
  return (
    <button onClick={() => toggleGroup(groupId)}>
      {isExpanded ? '▼' : '▶'} {label}
    </button>
  );
}
```

### Detecting Active Item

```typescript
const { activeItemId } = useNavigation();

function NavLink({ item }) {
  const isActive = activeItemId === item.id;
  
  return (
    <Link href={item.path} className={isActive ? 'active' : ''}>
      {item.label}
    </Link>
  );
}
```

## Key Design Decisions

### 1. Context vs Redux

- **Why Context**: For this feature set, Context is sufficient - no need for Redux complexity
- **Memoization**: Careful memoization prevents unnecessary re-renders
- **Performance**: Average app has <50 navigation items, re-render cost is negligible

### 2. localStorage vs sessionStorage

- **Sidebar collapsed state**: localStorage (persists across sessions - user preference)
- **Expanded groups**: sessionStorage (reset on new tab/session - transient UI state)
- **Design**: Keeps defaults sane - new users see sensible defaults, returning users get their preferences

### 3. Auto-Expansion Behavior

- **Pattern**: When user navigates to a deep nested item, all ancestor groups auto-expand
- **Benefit**: User can always see the breadcrumb trail to current page
- **Implementation**: Hooks into activeItemId change and calls `getGroupsToExpand()`

### 4. Filtered Config Computation

- **Approach**: Eagerly compute filteredConfig, not lazy
- **Rationale**: Avoids re-computing during every render, deps are few (roles, flags, config)
- **Trade-off**: Uses slightly more memory for config copy, but gains consistent behavior

### 5. Error Handling

- **Storage errors**: Gracefully handle JSON parse errors, default to sensible state
- **Missing userSession**: Component requires userSession, but handles missing roles
- **Missing featureFlags**: Defaults to all flags disabled (safe default)

## Type Safety

The component is fully typed with TypeScript:

- Props use `NavigationProviderProps` interface
- Context uses `NavigationContextType` interface
- Navigation items use discriminated union type
- Feature flags are enum-based for compile-time safety
- User roles are enum-based for compile-time safety

## Testing Strategy

Since this is a stateful component with side effects, testing should cover:

1. **Initialization**: Context values initialized correctly
2. **localStorage**: Collapsed state persisted and loaded
3. **sessionStorage**: Expanded groups persisted and loaded
4. **Route sync**: Active item updated when pathname changes
5. **Filtering**: Config filtered correctly based on roles and flags
6. **Auto-expansion**: Ancestor groups expand when active item changes
7. **Error handling**: Gracefully handles storage errors
8. **Hook**: useNavigation() throws outside provider

See related test files for examples.

## Future Enhancements

### 1. Loading Roles from Server

Currently, roles are passed at provider initialization. Could enhance to:

```typescript
<NavigationProvider
  userSession={userSession}
  onRolesChange={async () => {
    const roles = await fetchUserRoles();
    setUserRoles(roles);
  }}
  navigationConfig={navigationConfig}
>
```

### 2. Real-Time Feature Flag Updates

Could integrate with real-time systems:

```typescript
useEffect(() => {
  const subscription = featureFlagService.subscribe(setFeatureFlags);
  return () => subscription.unsubscribe();
}, []);
```

### 3. Navigation Analytics

Could add callback hooks for tracking navigation:

```typescript
<NavigationProvider
  onNavigate={(itemId, path) => {
    analytics.track('navigation', { itemId, path });
  }}
  navigationConfig={navigationConfig}
>
```

## Requirements Coverage

This implementation satisfies the following requirements:

- **Requirement 3.1** (Desktop Sidebar): State management for collapsed state
- **Requirement 4.1** (Mobile Drawer): State management for drawer open state
- **Requirement 5.1** (Active Item Sync): Router pathname sync with auto-expansion
- **Requirement 5.2** (Active Item Consistency): Synchronized across desktop/mobile
- **Requirement 5.3** (Expanded Groups State): sessionStorage persistence
- **Requirement 5.4** (Expanded Groups Consistency): Auto-expansion on active item change
- **Requirement 6.1** (Layout Integration): Context provides filtered config
- **Requirement 6.3** (Current User Context): Roles and flags provided via context
- **Requirement 7.1** (Role-Based Filtering): Implemented via filterNavigationItems()

## File Structure

```
/components/navigation/
  ├── NavigationProvider.tsx      # This file - Context provider + useNavigation hook
  ├── index.ts                     # Exports for easy importing
  └── IMPLEMENTATION_NOTES.md      # This documentation
```

Related files:

```
/lib/navigation/
  ├── navigation.types.ts          # Type definitions
  ├── navigation.utils.ts          # Utility functions (filter, find, expand)
  ├── navigation.config.ts         # Navigation configuration
  └── navigation.config.ts         # Sample config
```
