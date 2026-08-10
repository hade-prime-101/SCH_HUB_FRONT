# Dashboard Navigation Architecture - Design Document

## Overview

The Dashboard Navigation Architecture provides a scalable, maintainable navigation system for the Next.js/React dashboard. The design uses a configuration-driven approach with a centralized `Navigation_Config` TypeScript structure that drives both desktop (collapsible sidebar) and mobile (overlay drawer) layouts. A React Context API manages shared state (collapsed/expanded, active item, expanded groups), while generic, composable components render navigation items without duplicating logic.

Key design principles:
- **Configuration-Driven**: All navigation structure defined in typed TypeScript config, not JSX
- **Composition-Based**: Generic sub-components (NavLink, NavGroup, NavBadge, NavDivider) composed together
- **Synchronized State**: Desktop and mobile share active item, expanded groups, and other state via Context
- **Fully Typed**: TypeScript discriminated unions and interfaces ensure compile-time validation
- **Extensible**: Custom Navigation_Item types and renderers supported without modifying core logic

---

## Architecture

### High-Level System Flow

```
Navigation_Config (TypeScript)
        ↓
   Navigation Context (React Context API)
   ├─ collapsed state (desktop)
   ├─ active item
   ├─ expanded groups (nested)
   ├─ drawer open state (mobile)
   ├─ user roles
   ├─ feature flags
        ↓
   Filtering & Synchronization Layer
   ├─ Role-based filtering
   ├─ Feature-flag filtering
   ├─ Active item synchronization
        ↓
   Generic Rendering Components
   ├─ Desktop_Sidebar (uses filtered config)
   ├─ Mobile_Drawer (uses filtered config)
   ├─ NavItem (polymorphic renderer)
   ├─ NavGroup (expandable container)
   ├─ NavLink (clickable item)
   ├─ NavBadge (visual indicator)
        ↓
   Dashboard Layout Integration
        ↓
   Responsive Viewport Output
   ├─ Desktop (≥768px): Sidebar visible
   └─ Mobile (<768px): Drawer hidden, hamburger triggers drawer
```

### Component Hierarchy

```
DashboardLayout
├── NavigationProvider (Context)
│   ├── Header (with hamburger on mobile)
│   ├── Desktop_Sidebar (responsive, hidden <768px)
│   │   └── NavRenderer (recursively renders Navigation_Config)
│   │       ├── NavLink
│   │       ├── NavDivider
│   │       ├── NavSection
│   │       └── NavGroup (collapsible)
│   │           └── [recursive NavRenderer]
│   ├── Mobile_Drawer (responsive, hidden ≥768px)
│   │   └── NavRenderer (recursively renders Navigation_Config)
│   │       └── [same structure as desktop]
│   └── MainContent (children area)
```

---

## Data Models

### 1. Navigation_Config Type System

The navigation system uses TypeScript discriminated unions to enforce type safety at compile time.


### 1. Navigation_Config Type System (continued)

```typescript
// Role enumeration - predefined set of valid roles
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  PARENT = 'parent',
}

// Feature flag keys - predefined feature flags
export enum FeatureFlagKey {
  WORKSPACE_SWITCHER = 'workspace_switcher',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  SETTINGS = 'settings',
  PLUGINS = 'plugins',
}

// Navigation_Item base type using discriminated union
export type NavigationItem = 
  | NavLink 
  | NavDivider 
  | NavSection 
  | NavGroup;

// NavLink: Clickable navigation entry
export interface NavLink {
  type: 'link';
  id: string;
  label: string;
  path: string; // Must be a valid Next.js route
  icon?: React.ComponentType<{ className?: string }>;
  badge?: NavBadge;
  disabled?: boolean;
  roles?: UserRole[];
  featureFlag?: FeatureFlagKey;
  description?: string;
  external?: boolean; // Links to external URL if true
}

// NavDivider: Visual separator
export interface NavDivider {
  type: 'divider';
  id: string;
  roles?: UserRole[];
  featureFlag?: FeatureFlagKey;
}

// NavSection: Non-clickable section header
export interface NavSection {
  type: 'section';
  id: string;
  label: string;
  roles?: UserRole[];
  featureFlag?: FeatureFlagKey;
}

// NavGroup: Collapsible group of items (recursive)
export interface NavGroup {
  type: 'group';
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: NavBadge;
  disabled?: boolean;
  roles?: UserRole[];
  featureFlag?: FeatureFlagKey;
  collapsedByDefault?: boolean; // Default collapsed state
  children: NavigationItem[]; // Recursive nesting
}

// Navigation_Badge: Visual indicator
export interface NavBadge {
  content: string | number; // "12", "new", "beta"
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showDot?: boolean; // Show as dot instead of badge
}

// Navigation_Config: Top-level config array
export type NavigationConfig = NavigationItem[];
```

### 2. Navigation Context State

```typescript
// Context state shape
export interface NavigationContextType {
  // Desktop sidebar state
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile drawer state
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  // Current active route
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;

  // Expanded groups (for both desktop and mobile, key: group id)
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
  setExpandedGroups: (groups: Set<string>) => void;

  // User context (for filtering)
  userRoles: UserRole[];
  setUserRoles: (roles: UserRole[]) => void;

  // Feature flags (for filtering)
  featureFlags: Record<FeatureFlagKey, boolean>;
  setFeatureFlags: (flags: Record<FeatureFlagKey, boolean>) => void;

  // Filtered config (lazy computed)
  filteredConfig: NavigationItem[];
}
```

### 3. User Session Types

```typescript
// User session info passed to NavigationProvider
export interface UserSession {
  roles: UserRole[];
  id: string;
  name?: string;
}

// Feature flags from session or configuration
export interface FeatureFlagsData {
  [key in FeatureFlagKey]?: boolean;
}
```

---

## Components and Interfaces

### 1. NavigationProvider (Context Provider)

Wraps the dashboard and provides navigation state to all children.

```typescript
interface NavigationProviderProps {
  children: React.ReactNode;
  userSession: UserSession;
  featureFlags?: FeatureFlagsData;
  navigationConfig: NavigationConfig;
  onNavigate?: (itemId: string, path: string) => void; // Callback on nav item click
}

// Implementation pseudocode:
// - Initialize context with user roles, feature flags
// - Load sidebar collapsed state from localStorage (key: 'dashboard_sidebar_collapsed')
// - Load expanded groups from sessionStorage (key: 'nav_expanded_groups')
// - Compute filteredConfig based on roles + featureFlags on mount and whenever they change
// - Provide memoized context value to avoid unnecessary re-renders
// - Subscribe to route changes (useRouter) to update activeItemId
```

### 2. Desktop_Sidebar Component

Displays navigation on desktop viewports (≥768px), collapsed to icons on toggle.

```typescript
interface DesktopSidebarProps {
  // No props needed - reads from NavigationProvider Context
}

// Responsibilities:
// - Render sidebar div (fixed, left-0, h-full)
// - Display collapse/expand toggle button
// - Use NavRenderer to render filtered config
// - Apply class names:
//   - When collapsed: w-20 (icon-only)
//   - When expanded: w-64 (full width)
//   - Transition: ease-in-out duration-200
// - Add tooltips to icons when collapsed
// - Hide on mobile: hidden md:flex (Tailwind responsive)
// - Sync scroll position with main content

// Structure:
// <aside className="fixed left-0 h-full transition-all">
//   <div className="flex flex-col h-full">
//     <header className="p-4">
//       <ToggleButton onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} />
//     </header>
//     <ScrollArea>
//       <NavRenderer items={filteredConfig} />
//     </ScrollArea>
//   </div>
// </aside>
```

### 3. Mobile_Drawer Component

Slide-in overlay for mobile navigation.

```typescript
interface MobileDrawerProps {
  // No props needed - reads from NavigationProvider Context
}

// Responsibilities:
// - Render sheet/dialog overlay on mobile only
// - Use Shadcn Sheet component (or custom Drawer)
// - Display NavRenderer to render filtered config
// - Close drawer on:
//   - NavItem click
//   - Click outside
//   - ESC key
// - Hide on desktop: md:hidden (Tailwind responsive)
// - Restore expanded groups state from sessionStorage when reopened

// Structure:
// <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
//   <SheetContent side="left">
//     <nav className="space-y-4">
//       <NavRenderer items={filteredConfig} />
//     </nav>
//   </SheetContent>
// </Sheet>
```

### 4. NavRenderer Component (Generic Recursive Renderer)

Renders an array of navigation items based on their type.

```typescript
interface NavRendererProps {
  items: NavigationItem[];
  level?: number; // Nesting depth (default 0)
}

// Pseudocode:
// for each item in items:
//   if item.type === 'link':
//     render <NavLink item={item} />
//   else if item.type === 'divider':
//     render <NavDivider item={item} />
//   else if item.type === 'section':
//     render <NavSection item={item} />
//   else if item.type === 'group':
//     render <NavGroup item={item} onChildrenRender={() => <NavRenderer items={item.children} level={level+1} />} />
//
// Handles all polymorphism - no hardcoded item rendering elsewhere
```

### 5. NavLink Component

Renders a single clickable navigation link.

```typescript
interface NavLinkProps {
  item: NavLink;
  isActive?: boolean;
}

// Responsibilities:
// - Render Link component (Next.js Link or anchor)
// - Show icon (if present) + label
// - Display badge (if present)
// - Show tooltip when parent sidebar is collapsed
// - Highlight if item is active (check activeItemId from context)
// - Disable click if disabled=true (opacity, no pointer-events)
// - Apply Tailwind classes:
//   - Active: bg-accent text-accent-foreground
//   - Hover: bg-muted
//   - Disabled: opacity-50 cursor-not-allowed
//   - Base: px-4 py-2 rounded-md flex items-center gap-2 transition-colors
// - Call onNavigate callback (from context) on click

// Structure:
// <Link href={item.path}>
//   <div className="flex items-center gap-2 px-4 py-2 rounded-md...">
//     {icon && <item.icon className="w-4 h-4" />}
//     {label && <span className="text-sm">{item.label}</span>}
//     {badge && <NavBadge badge={item.badge} />}
//   </div>
// </Link>
```

### 6. NavGroup Component

Renders a collapsible group with toggle and nested items.

```typescript
interface NavGroupProps {
  item: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

// Responsibilities:
// - Render group header with expand/collapse toggle
// - Show icon (if present) + label
// - Display badge (if present)
// - Toggle expand state on header click
// - Render children (NavRenderer output) if expanded
// - Smooth height transition: max-h-0 → max-h-[1000px]
// - Persist expanded state to sessionStorage
// - Apply Tailwind classes:
//   - Header: flex items-center justify-between px-4 py-2 rounded-md
//   - Chevron: rotate-0 → rotate-90 (when expanded)
//   - Children: pl-4 space-y-1 overflow-hidden transition-all max-h-0...

// Structure:
// <div className="space-y-1">
//   <button onClick={onToggle} className="w-full flex items-center justify-between...">
//     <div className="flex items-center gap-2">
//       {icon && <item.icon />}
//       <span>{item.label}</span>
//     </div>
//     <ChevronIcon className={isExpanded ? 'rotate-90' : ''} />
//   </button>
//   {isExpanded && <div className="pl-4">{children}</div>}
// </div>
```

### 7. NavBadge Component

Small visual indicator for notifications, counts, or status.

```typescript
interface NavBadgeProps {
  badge: NavBadge;
  compact?: boolean; // Smaller size for sidebar
}

// Responsibilities:
// - Render badge pill or dot
// - Map variant to Tailwind background colors:
//   - 'default': bg-gray-200
//   - 'success': bg-green-500
//   - 'warning': bg-yellow-500
//   - 'error': bg-red-500
//   - 'info': bg-blue-500
// - Show dot (w-2 h-2 rounded-full) if showDot=true
// - Show text badge (px-2 py-1 rounded-full text-xs) otherwise
// - Keep text color contrasting based on variant

// Structure:
// {showDot ? (
//   <div className="w-2 h-2 rounded-full" style={{backgroundColor: variantColor}} />
// ) : (
//   <span className="px-2 py-1 rounded-full text-xs bg-{variant}">
//     {content}
//   </span>
// )}
```

### 8. NavDivider and NavSection Components

Minimal components for visual organization.

```typescript
// NavDivider: Simple horizontal line
// <div className="h-px bg-border my-2" />

// NavSection: Section header (non-interactive)
// <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
//   {item.label}
// </div>
```

---

## State Management and Synchronization

### 1. Sidebar Collapsed State Persistence

```typescript
// Pattern: Save to localStorage, load on mount

// In NavigationProvider useEffect:
useEffect(() => {
  const saved = localStorage.getItem('dashboard_sidebar_collapsed');
  if (saved !== null) {
    setSidebarCollapsed(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    'dashboard_sidebar_collapsed',
    JSON.stringify(isSidebarCollapsed)
  );
}, [isSidebarCollapsed]);
```

### 2. Expanded Groups Synchronization (Desktop ↔ Mobile)

```typescript
// Pattern: Use sessionStorage + Context for in-session persistence

// In NavigationProvider useEffect:
useEffect(() => {
  const saved = sessionStorage.getItem('nav_expanded_groups');
  if (saved) {
    setExpandedGroups(new Set(JSON.parse(saved)));
  }
}, []);

// When group is toggled:
const handleToggleGroup = (groupId: string) => {
  const updated = new Set(expandedGroups);
  if (updated.has(groupId)) {
    updated.delete(groupId);
  } else {
    updated.add(groupId);
  }
  setExpandedGroups(updated);
  sessionStorage.setItem('nav_expanded_groups', JSON.stringify([...updated]));
};
```

### 3. Active Item Synchronization

```typescript
// Pattern: Track route changes and update context

// In NavigationProvider useEffect:
const router = useRouter();

useEffect(() => {
  // Find item matching current route
  const findActiveItem = (items: NavigationItem[], path: string): string | null => {
    for (const item of items) {
      if (item.type === 'link' && item.path === path) {
        return item.id;
      }
      if (item.type === 'group') {
        const found = findActiveItem(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const activeId = findActiveItem(navigationConfig, router.pathname);
  setActiveItemId(activeId);
}, [router.pathname, navigationConfig]);
```

### 4. Role-Based and Feature-Flag Filtering

```typescript
// Pattern: Compute filteredConfig whenever roles or flags change

// In NavigationProvider useEffect:
useEffect(() => {
  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter(item => {
        // Check role visibility
        if (item.roles && item.roles.length > 0) {
          const hasRole = userRoles.some(role => item.roles.includes(role));
          if (!hasRole) return false;
        }

        // Check feature flag visibility
        if (item.featureFlag) {
          if (!featureFlags[item.featureFlag]) return false;
        }

        return true;
      })
      .map(item => {
        // Recursively filter children in groups
        if (item.type === 'group') {
          return {
            ...item,
            children: filterItems(item.children),
          };
        }
        return item;
      });
  };

  const filtered = filterItems(navigationConfig);
  setFilteredConfig(filtered);
}, [userRoles, featureFlags, navigationConfig]);
```

---

## File Structure and Organization

```
/app
  /dashboard
    /layout.tsx           # Main dashboard layout (imports NavigationProvider + components)
    /page.tsx             # Dashboard home page
    /[other-routes]       # Other dashboard pages

/components
  /navigation             # NEW: All navigation-related components
    /NavigationProvider.tsx      # Context provider + hook
    /Desktop_Sidebar.tsx         # Desktop sidebar component
    /Mobile_Drawer.tsx           # Mobile drawer component
    /NavRenderer.tsx             # Generic recursive renderer
    /NavLink.tsx                 # Link component
    /NavGroup.tsx                # Collapsible group component
    /NavBadge.tsx                # Badge indicator component
    /NavDivider.tsx              # Divider component
    /NavSection.tsx              # Section header component
    /index.ts                    # Export all components + hook

  /ui                    # Existing Shadcn UI components
  /shared                # Existing shared components

/lib
  /navigation            # NEW: Navigation utilities and types
    /navigation.config.ts        # Navigation_Config definition (where items are defined)
    /navigation.types.ts         # All TypeScript interfaces (NavLink, NavGroup, etc.)
    /navigation.hooks.ts         # Custom hooks (useNavigation, useFilteredConfig, etc.)
    /navigation.utils.ts         # Utility functions (findItemById, getItemPath, etc.)

/types
  /navigation.ts         # Export types for app-wide use
```

---

## Key Algorithms and Patterns

### 1. Recursive Item Filtering Algorithm

```typescript
function filterNavigationItems(
  items: NavigationItem[],
  userRoles: UserRole[],
  featureFlags: Record<FeatureFlagKey, boolean>
): NavigationItem[] {
  return items
    .filter(item => {
      // Role check
      if (item.roles && item.roles.length > 0) {
        if (!userRoles.some(r => item.roles!.includes(r))) {
          return false;
        }
      }

      // Feature flag check
      if (item.featureFlag && !featureFlags[item.featureFlag]) {
        return false;
      }

      return true;
    })
    .map(item => {
      if (item.type === 'group') {
        return {
          ...item,
          children: filterNavigationItems(
            item.children,
            userRoles,
            featureFlags
          ),
        };
      }
      return item;
    })
    // Optional: Filter out groups with no visible children
    .filter(item => {
      if (item.type === 'group') {
        return item.children.length > 0;
      }
      return true;
    });
}
```

### 2. Find Active Item in Nested Structure

```typescript
function findActiveItemId(
  items: NavigationItem[],
  currentPath: string
): string | null {
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
```

### 3. Auto-Expand Groups When Item Becomes Active

```typescript
function getGroupsToExpand(
  items: NavigationItem[],
  activeItemId: string | null
): Set<string> {
  const groupsToExpand = new Set<string>();

  function traverse(item: NavigationItem, path: string[]): boolean {
    if (item.id === activeItemId) {
      // Found the active item, expand all ancestor groups
      path.forEach(groupId => groupsToExpand.add(groupId));
      return true;
    }

    if (item.type === 'group') {
      const found = item.children.some(child =>
        traverse(child, [...path, item.id])
      );
      if (found) return true;
    }

    return false;
  }

  items.forEach(item => traverse(item, []));
  return groupsToExpand;
}
```

---

## Integration with Existing Dashboard Layout

### 1. Updated Dashboard Layout Structure

```typescript
// /app/dashboard/layout.tsx

import { NavigationProvider } from '@/components/navigation';
import { Desktop_Sidebar } from '@/components/navigation/Desktop_Sidebar';
import { Mobile_Drawer } from '@/components/navigation/Mobile_Drawer';
import { navigationConfig } from '@/lib/navigation/navigation.config';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user session and feature flags
  const userSession = await getUserSession(); // Implement based on auth
  const featureFlags = await getFeatureFlags(userSession.id); // Implement

  return (
    <NavigationProvider
      userSession={userSession}
      featureFlags={featureFlags}
      navigationConfig={navigationConfig}
    >
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <Desktop_Sidebar />

        {/* Mobile Drawer */}
        <Mobile_Drawer />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto md:ml-20 lg:ml-64 transition-all">
          {/* Responsive padding/margin adjusts based on sidebar collapse state */}
          {children}
        </main>
      </div>
    </NavigationProvider>
  );
}
```

### 2. Responsive Layout Adjustments

The main content area dynamically adjusts margin based on sidebar collapse state:

```typescript
// In Desktop_Sidebar or via Context-provided className utility
const getMainContentMargin = (isSidebarCollapsed: boolean): string => {
  return isSidebarCollapsed ? 'ml-20' : 'ml-64';
};

// Usage in DashboardLayout:
// <main className={`flex-1 overflow-auto transition-all ${getMainContentMargin(isSidebarCollapsed)}`}>
```

---

## Custom Hook: useNavigation

Provides easy access to navigation context for child components.

```typescript
interface useNavigationReturn {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
  userRoles: UserRole[];
  featureFlags: Record<FeatureFlagKey, boolean>;
  filteredConfig: NavigationItem[];
}

// Usage in components:
// const { isSidebarCollapsed, activeItemId, filteredConfig } = useNavigation();
```

---

## Navigation Configuration Example

```typescript
// /lib/navigation/navigation.config.ts

import { NavigationConfig, UserRole, FeatureFlagKey } from '@/lib/navigation/navigation.types';
import { FiHome, FiUsers, FiSettings, FiBarChart3 } from 'react-icons/fi';

export const navigationConfig: NavigationConfig = [
  {
    type: 'link',
    id: 'dashboard-home',
    label: 'Home',
    path: '/dashboard',
    icon: FiHome,
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
    id: 'classes',
    label: 'Classes',
    path: '/dashboard/classes',
    badge: { content: '3', variant: 'default' },
    roles: [UserRole.TEACHER],
  },
  {
    type: 'group',
    id: 'admin-group',
    label: 'Administration',
    icon: FiSettings,
    roles: [UserRole.ADMIN],
    children: [
      {
        type: 'link',
        id: 'admin-users',
        label: 'Users',
        path: '/dashboard/admin/users',
      },
      {
        type: 'link',
        id: 'admin-roles',
        label: 'Roles & Permissions',
        path: '/dashboard/admin/roles',
      },
    ],
  },
  {
    type: 'group',
    id: 'analytics-group',
    label: 'Analytics',
    icon: FiBarChart3,
    featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
    collapsedByDefault: true,
    children: [
      {
        type: 'link',
        id: 'analytics-overview',
        label: 'Overview',
        path: '/dashboard/analytics',
      },
      {
        type: 'link',
        id: 'analytics-reports',
        label: 'Reports',
        path: '/dashboard/analytics/reports',
      },
    ],
  },
];
```

---

## Error Handling and Edge Cases

### 1. Invalid Route in NavLink

```typescript
// Handle invalid paths gracefully
// - If path is invalid, Link component will still render
// - Navigation attempt will show 404 page
// - Add path validation in config validation step (optional)

function validateNavigationPath(path: string): boolean {
  // Basic validation: starts with /, no spaces, valid characters
  return /^\/[a-z0-9\-/_]*$/.test(path);
}
```

### 2. Circular Group References

```typescript
// Prevent infinite recursion in group nesting
// - Renderer includes level counter: if level > MAX_DEPTH, stop rendering
// - NavRenderer({ items, level = 0 }) checks if level >= 10, renders nothing

const MAX_NESTING_DEPTH = 10;

function NavRenderer({ items, level = 0 }: NavRendererProps) {
  if (level >= MAX_NESTING_DEPTH) {
    console.warn('Navigation nesting depth exceeded');
    return null;
  }
  // ... render items
}
```

### 3. Missing User Roles or Feature Flags

```typescript
// Handle missing context gracefully
// - NavigationProvider checks for nullish userSession, provides defaults
// - If featureFlags not provided, all flags default to false (safe default)
// - If userSession not provided, navigationConfig treated as public (no role filtering)

const defaultUserSession: UserSession = {
  id: 'anonymous',
  roles: [],
};

const defaultFeatureFlags: FeatureFlagsData = {
  // All flags default to false
};
```


---

## Testing Strategy

### PBT Applicability Assessment

This feature involves several distinct testable layers:

**Pure Function Components (PBT Applicable):**
- `filterNavigationItems()`: Takes config, roles, flags → returns filtered config. Input space is large, universal properties exist (e.g., filtered items should all pass role/flag checks). **PROPERTY-BASED SUITABLE**
- `findActiveItemId()`: Traverses nested structure to find active item. Universal property: if item with matching path exists, result should be its id. **PROPERTY-BASED SUITABLE**
- `getGroupsToExpand()`: Given active item id and config, returns set of ancestor groups to expand. Universal property: all returned groups should be ancestors of active item. **PROPERTY-BASED SUITABLE**
- NavLink/NavBadge/NavDivider/NavSection component rendering: Given props, render correct JSX. Component snapshot/visual testing more valuable than properties. **PROPERTY-BASED NOT IDEAL**

**React Components and State (Example-Based Suitable):**
- Desktop_Sidebar collapse/expand toggle: Specific UI interaction, not universal rule. **EXAMPLE-BASED**
- Mobile_Drawer open/close: Specific state transition. **EXAMPLE-BASED**
- Navigation state persistence: localStorage/sessionStorage behavior. **INTEGRATION TEST**
- Route change → active item sync: Behavior depends on Next.js router. **INTEGRATION TEST**
- Role-based filtering in UI: Render items for permitted roles only. **EXAMPLE-BASED**

**Infrastructure/External Services (Not Testable as PBT):**
- User session loading: Depends on auth system. **INTEGRATION TEST**
- Feature flag retrieval: External configuration service. **INTEGRATION TEST**
- Next.js Link component integration: Third-party library behavior. **INTEGRATION TEST**

### Classification: Features Suitable for PBT

This feature has multiple pure functions that benefit from property-based testing:

1. **Navigation config filtering** (roles + flags)
2. **Active item detection** (route matching)
3. **Group expansion** (ancestor path finding)

These are algorithms that should work correctly across all possible valid inputs (any config structure, any role/flag combination, any route). PBT is appropriate.

### Properties Suitable for Property-Based Testing

Based on the acceptance criteria and architecture, the following properties are testable as universal characteristics:

**Property 1: Filtered Config Maintains Structure**
- *For any* valid Navigation_Config, user roles, and feature flags, the filtered config should have the same item tree structure as input (only visibility changed)
- **Validates: Requirements 2.2, 7.1** (Role-based and flag-based filtering)

**Property 2: Role-Based Filtering Respects Role Array**
- *For any* Navigation_Item with roles defined, if the current user does not have one of those roles, the item should not appear in filtered config
- **Validates: Requirements 2.2, 7.2** (Role visibility)

**Property 3: Feature Flag Filtering Respects Flag State**
- *For any* Navigation_Item with featureFlag defined, if that flag is disabled, the item should not appear in filtered config
- **Validates: Requirements 2.4, 7.4** (Feature flag filtering)

**Property 4: Active Item Found Correctly**
- *For any* Navigation_Config and route path, if a Navigation_Item exists with that path, findActiveItemId should return its id; otherwise null
- **Validates: Requirement 5.2** (Active item synchronization across layouts)

**Property 5: Group Expansion Path Completeness**
- *For any* Navigation_Config and active item id, the groups returned by getGroupsToExpand should be a complete ancestor path (all groups containing the active item)
- **Validates: Requirement 5.4** (Expanded groups maintain consistency)

**Property 6: Filtered Config Preserves Item IDs**
- *For any* valid Navigation_Config after filtering, all item ids should remain unique and unchanged (no duplicate ids introduced)
- **Validates: Requirement 1.5** (Type safety and validation)

**Property Reflection:** These 6 properties have good coverage:
- Property 1-3 cover filtering logic (most critical business logic)
- Property 4 covers active item detection
- Property 5 covers group expansion
- Property 6 covers data integrity

No redundancy: each property tests a distinct algorithm with meaningful input variation.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Filtered Config Maintains Visibility Consistency

*For any* valid Navigation_Config, when filtered based on user roles and feature flags, items that pass both role and feature flag checks should remain in the output, while items that fail either check should be excluded.

**Validates: Requirements 2.2, 2.4, 7.1, 7.4**

### Property 2: All Visible Items Pass Role Check

*For any* filtered Navigation_Config output, every item with a defined roles array should contain at least one role matching the current user's role set, ensuring only authorized items are visible.

**Validates: Requirements 2.2, 7.2**

### Property 3: All Visible Items Pass Feature Flag Check

*For any* filtered Navigation_Config output, every item with a defined featureFlag should have that flag enabled in the current feature flags configuration.

**Validates: Requirements 2.4, 7.4**

### Property 4: Active Item Path Lookup is Exact

*For any* Navigation_Config and current route path, if an item with a matching path exists in the config, findActiveItemId should return that item's id; if no matching path exists, it should return null.

**Validates: Requirement 5.2**

### Property 5: Group Expansion Creates Complete Ancestor Chain

*For any* Navigation_Config containing a group hierarchy and a given active item id, the set of groups returned by getGroupsToExpand should form a complete chain from root to the active item's containing group, with no gaps.

**Validates: Requirement 5.4**

### Property 6: Nested Config Recursion Preserves Item Identity

*For any* valid Navigation_Config with nested groups, after recursive filtering, all item ids in the output should be unique and match exactly with ids from the input (no id collisions or transformations).

**Validates: Requirement 1.5**

---

## Component Prop Contracts and Type Safety

### Desktop_Sidebar Component Contract

```typescript
// Input: None (reads from NavigationProvider Context)
// Output: JSX rendering sidebar or null (on mobile)
// Side Effects:
//   - Persist collapsed state to localStorage
//   - Handle user interactions (collapse toggle, item click)
//   - Subscribe to route changes for active item sync

interface DesktopSidebarContext {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  filteredConfig: NavigationItem[];
  activeItemId: string | null;
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}
```

### Mobile_Drawer Component Contract

```typescript
// Input: None (reads from NavigationProvider Context)
// Output: JSX rendering sheet overlay or null (on desktop)
// Side Effects:
//   - Persist expanded groups to sessionStorage when drawer reopens
//   - Close drawer on item click
//   - Handle backdrop click to close

interface MobileDrawerContext {
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  filteredConfig: NavigationItem[];
  activeItemId: string | null;
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}
```

### NavLink Component Contract

```typescript
// Input:
interface NavLinkProps {
  item: NavLink;
  isActive?: boolean;
}

// Output: JSX <Link> element or <a> tag (if external)
// Behavior:
//   - Render icon + label + badge
//   - Apply active styling if isActive=true
//   - Apply disabled styling if item.disabled=true
//   - Show tooltip on hover (when parent sidebar collapsed)
//   - Prevent click if disabled
```

### NavGroup Component Contract

```typescript
// Input:
interface NavGroupProps {
  item: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // Output of NavRenderer(item.children)
}

// Output: JSX <div> with expandable header and content area
// Behavior:
//   - Render header with toggle button, icon, label, badge
//   - Render children only if isExpanded=true
//   - Smooth height transition on expand/collapse
//   - Persist expanded state changes
```

---

## Performance Considerations

### 1. Memoization Strategy

```typescript
// Memoize context value to prevent unnecessary re-renders
const contextValue = useMemo(
  () => ({
    isSidebarCollapsed,
    setSidebarCollapsed,
    // ... all other context properties
  }),
  [
    isSidebarCollapsed,
    setSidebarCollapsed,
    // ... dependencies
  ]
);

// Memoize filtered config computation
const filteredConfig = useMemo(
  () => filterNavigationItems(navigationConfig, userRoles, featureFlags),
  [navigationConfig, userRoles, featureFlags]
);
```

### 2. Component Memoization

```typescript
// NavLink, NavGroup, NavRenderer should be memoized
// to prevent re-render cascade when navigation state changes

export const NavLink = React.memo(({ item, isActive }: NavLinkProps) => {
  // ... component logic
});

export const NavGroup = React.memo(({ item, isExpanded, onToggle, children }: NavGroupProps) => {
  // ... component logic
});
```

### 3. Lazy Rendering for Large Trees

```typescript
// For deeply nested configs, consider virtualizing (if >100 items)
// Or lazy-load child groups only when expanded:

const NavGroup = React.memo(({ item, isExpanded }: NavGroupProps) => {
  const { toggleGroup } = useNavigation();
  
  return (
    <div>
      <button onClick={() => toggleGroup(item.id)}>
        {/* header */}
      </button>
      {isExpanded && (
        <NavRenderer items={item.children} /> // Rendered only when expanded
      )}
    </div>
  );
});
```

---

## Extension Points for Future Features

### 1. Custom Navigation Item Types

The system allows registration of custom renderers without modifying core logic:

```typescript
// Define custom type
export interface NavCustom {
  type: 'custom';
  id: string;
  customType: 'workspace-switcher' | 'theme-selector' | string;
  renderer: React.ComponentType<{ item: NavCustom }>;
}

// Update discriminated union
export type NavigationItem = NavLink | NavGroup | NavDivider | NavSection | NavCustom;

// In NavRenderer, handle custom type:
if (item.type === 'custom') {
  const CustomRenderer = item.renderer;
  return <CustomRenderer item={item} key={item.id} />;
}
```

### 2. Breadcrumb Navigation

Derive breadcrumb path from current route and config:

```typescript
function generateBreadcrumbs(
  config: NavigationItem[],
  currentPath: string
): NavLink[] {
  // Traverse config to find path to active item
  // Return array of NavLink items forming breadcrumb trail
  // "Home > Classes > Period 3 > Students"
}
```

### 3. Command Palette Integration

Search navigation config and provide fuzzy matching:

```typescript
function searchNavigationItems(
  config: NavigationItem[],
  query: string
): NavLink[] {
  // Flatten config to array of NavLink items
  // Perform fuzzy match on label + path
  // Return sorted results
}
```

### 4. Notification Center Badge Updates

Reactively update badge counts from real-time events:

```typescript
const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

useEffect(() => {
  const subscription = realtimeEvents$.subscribe(event => {
    setBadgeCounts(prev => ({
      ...prev,
      [event.itemId]: event.count,
    }));
  });
  return () => subscription.unsubscribe();
}, []);

// Pass badgeCounts to context, merge with config badge content
```

---

## Summary

This Dashboard Navigation Architecture provides a production-ready, scalable navigation system that:

- ✓ Uses configuration-driven design (separation of structure from rendering)
- ✓ Supports desktop collapsible sidebar + mobile overlay drawer
- ✓ Implements role-based and feature-flag filtering
- ✓ Maintains synchronized state across layouts
- ✓ Provides full TypeScript type safety with discriminated unions
- ✓ Uses composition pattern for generic, reusable rendering
- ✓ Supports nested groups with arbitrary depth
- ✓ Persists UI state (collapsed, expanded groups) across sessions
- ✓ Includes property-based testing coverage for core algorithms
- ✓ Extensible for future features (custom types, breadcrumbs, search, plugins)
- ✓ Integrates seamlessly with existing Next.js dashboard layout

The design follows React best practices (Context API, composition, memoization) and TypeScript patterns (discriminated unions, interfaces) for maintainability and correctness.
