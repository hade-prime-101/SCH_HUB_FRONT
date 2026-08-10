# Implementation Plan: Dashboard Navigation Architecture

## Overview

This implementation plan breaks down the Dashboard Navigation Architecture design into discrete, incremental coding tasks. The system will be built in phases: foundational types and utilities, core context and hooks, composable UI components, utility functions, state persistence and filtering, and comprehensive testing. Each task builds upon previous work, ending with integration into the existing dashboard layout.

The implementation prioritizes testability and separates concerns: pure algorithms are tested with property-based tests, React components with unit tests, and state synchronization with integration tests. Property-based tests validate 6 core universal properties from the design specification.

## Tasks

- [x] 1. Set up project structure and core type definitions
  - Create `/lib/navigation/` directory structure
  - Create `/components/navigation/` directory structure  
  - _Requirements: 1.1, 1.5, 9.1, 9.2_

- [x] 1.1 Define Navigation type system (enums and interfaces)
  - Export UserRole enum (STUDENT, TEACHER, ADMIN, PARENT)
  - Export FeatureFlagKey enum (WORKSPACE_SWITCHER, ADVANCED_ANALYTICS, SETTINGS, PLUGINS)
  - Create NavigationItem discriminated union type (NavLink | NavDivider | NavSection | NavGroup)
  - Define NavLink, NavDivider, NavSection, NavGroup, NavBadge interfaces
  - Write file: `/lib/navigation/navigation.types.ts`
  - _Requirements: 1.1, 1.5, 2.1, 9.1, 9.2, 9.5_

- [x] 1.2 Define Navigation Context types and state interface
  - Create NavigationContextType interface with all context properties
  - Define UserSession and FeatureFlagsData interfaces
  - Define NavigationProviderProps interface
  - Write file: `/lib/navigation/navigation.types.ts` (extend from 1.1)
  - _Requirements: 2.1, 7.1_

- [x] 1.3 Create sample navigation configuration
  - Create `/lib/navigation/navigation.config.ts`
  - Define navigationConfig export with mixed item types (links, groups, dividers, sections, badges)
  - Include role-based visibility examples (TEACHER and ADMIN roles)
  - Include feature-flag examples (ADVANCED_ANALYTICS)
  - Include nested groups with children
  - _Requirements: 1.2, 2.1, 2.2, 2.4_

- [x] 2. Implement core utility functions for navigation logic
  - [x] 2.1 Implement filterNavigationItems pure function
    - Accept: items, userRoles, featureFlags
    - Filter items based on roles array (if present)
    - Filter items based on featureFlag (if present)
    - Recursively filter children in NavGroup items
    - Remove groups with no visible children (optional)
    - Write file: `/lib/navigation/navigation.utils.ts`
    - _Requirements: 2.2, 2.4, 7.1, 7.2, 7.4_

  - [ ]* 2.2 Write property test for filterNavigationItems
    - **Property 1: Filtered Config Maintains Structure**
    - **Property 2: Role-Based Filtering Respects Role Array**
    - **Property 3: Feature Flag Filtering Respects Flag State**
    - **Validates: Requirements 2.2, 2.4, 7.1, 7.2, 7.4**
    - Use fast-check or similar property testing library
    - Generate random configs, roles, and feature flags
    - Verify filtered items pass all visibility checks
    - Verify structure remains consistent (no rearrangement)
    - Write file: `/lib/navigation/__tests__/filterNavigationItems.test.ts`

  - [x] 2.3 Implement findActiveItemId pure function
    - Accept: items, currentPath
    - Recursively search for NavLink with matching path
    - Return item.id if found, null otherwise
    - Write file: `/lib/navigation/navigation.utils.ts` (extend 2.1)
    - _Requirements: 5.2_

  - [ ]* 2.4 Write property test for findActiveItemId
    - **Property 4: Active Item Path Lookup is Exact**
    - **Validates: Requirement 5.2**
    - Generate random nested configs with various paths
    - Test that matching paths return correct item id
    - Test that non-matching paths return null
    - Test edge case: empty config returns null
    - Write file: `/lib/navigation/__tests__/findActiveItemId.test.ts`

  - [x] 2.5 Implement getGroupsToExpand pure function
    - Accept: items, activeItemId
    - Recursively traverse tree to find active item
    - Collect all ancestor group ids in path
    - Return Set of group ids that should be expanded
    - Write file: `/lib/navigation/navigation.utils.ts` (extend 2.1)
    - _Requirements: 5.4_

  - [ ]* 2.6 Write property test for getGroupsToExpand
    - **Property 5: Group Expansion Creates Complete Ancestor Chain**
    - **Property 6: Nested Config Recursion Preserves Item Identity**
    - **Validates: Requirements 5.4, 1.5**
    - Generate random nested group hierarchies
    - Test that all returned groups are ancestors of active item
    - Test that no gaps exist in ancestor chain
    - Test that item ids remain unchanged through traversal
    - Write file: `/lib/navigation/__tests__/getGroupsToExpand.test.ts`

  - [x] 2.7 Write unit tests for navigation utility functions
    - Test filterNavigationItems with specific examples (role filtering, feature flag filtering)
    - Test findActiveItemId with nested structures
    - Test getGroupsToExpand with multi-level nesting
    - Test edge cases: empty config, null activeItemId, no matching items
    - Write file: `/lib/navigation/__tests__/navigation.utils.test.ts`

- [ ] 3. Create React Context Provider and custom hook
  - [x] 3.1 Implement NavigationProvider component
    - Create file: `/components/navigation/NavigationProvider.tsx`
    - Initialize state for all context properties
    - Implement localStorage persistence for sidebar collapsed state
    - Implement sessionStorage persistence for expanded groups
    - Implement useEffect to compute filteredConfig when roles/flags change
    - Implement useEffect to sync active item id with router pathname
    - Provide memoized context value
    - Handle route changes to auto-expand ancestor groups
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 7.1_

  - [ ] 3.2 Implement useNavigation custom hook
    - Create file: `/components/navigation/NavigationProvider.tsx` (export hook)
    - Return all context values
    - Throw error if used outside NavigationProvider
    - _Requirements: 3.2_

  - [ ] 3.3 Write unit tests for NavigationProvider
    - Test initial state initialization
    - Test localStorage persistence (collapsed state)
    - Test sessionStorage persistence (expanded groups)
    - Test filteredConfig computation with various role/flag combinations
    - Test active item sync with route changes
    - Test context value memoization
    - Write file: `/components/navigation/__tests__/NavigationProvider.test.tsx`

- [ ] 4. Implement composable navigation components
  - [ ] 4.1 Implement NavRenderer component
    - Create file: `/components/navigation/NavRenderer.tsx`
    - Accept items array and optional level prop
    - Implement max depth check (return null if level >= 10)
    - Recursively render items based on type
    - Render NavLink for type='link'
    - Render NavDivider for type='divider'
    - Render NavSection for type='section'
    - Render NavGroup for type='group'
    - _Requirements: 1.6, 1.7, 1.8, 10.1, 10.2_

  - [ ] 4.2 Implement NavLink component
    - Create file: `/components/navigation/NavLink.tsx`
    - Render Next.js Link for internal paths, <a> for external
    - Display icon (if present) with className="w-4 h-4"
    - Display label
    - Display NavBadge (if present)
    - Apply active styling: bg-accent text-accent-foreground
    - Apply hover styling: bg-muted
    - Apply disabled styling: opacity-50 cursor-not-allowed
    - Show tooltip on hover (when parent collapsed)
    - Use Tailwind: px-4 py-2 rounded-md flex items-center gap-2 transition-colors
    - _Requirements: 2.1, 2.3, 2.4, 2.6, 2.7, 10.3_

  - [ ] 4.3 Implement NavGroup component
    - Create file: `/components/navigation/NavGroup.tsx`
    - Render collapsible group header
    - Display icon (if present) + label
    - Display badge (if present)
    - Show toggle button (chevron icon)
    - Render children when expanded (via children prop)
    - Smooth height transition on expand/collapse using Tailwind
    - Apply Tailwind: space-y-1, chevron rotation
    - Call onToggle callback when header clicked
    - _Requirements: 2.1, 2.3, 4.1, 4.2, 4.3, 10.3_

  - [ ] 4.4 Implement NavBadge component
    - Create file: `/components/navigation/NavBadge.tsx`
    - Accept NavBadge interface with content, variant, showDot
    - Render dot (w-2 h-2 rounded-full) if showDot=true
    - Render text badge (px-2 py-1 rounded-full text-xs) otherwise
    - Map variant to Tailwind colors: default, success, warning, error, info
    - Ensure contrast with text color
    - _Requirements: 2.1, 2.2_

  - [ ] 4.5 Implement NavDivider component
    - Create file: `/components/navigation/NavDivider.tsx`
    - Render simple horizontal line: h-px bg-border my-2
    - _Requirements: 1.3, 10.3_

  - [ ] 4.6 Implement NavSection component
    - Create file: `/components/navigation/NavSection.tsx`
    - Render section header (non-interactive)
    - Display label with styling: px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider
    - _Requirements: 1.3, 10.3_

  - [ ] 4.7 Write unit tests for composable components
    - Test NavRenderer recursion and type-based rendering
    - Test NavLink active/disabled states
    - Test NavGroup expand/collapse toggle
    - Test NavBadge variant colors and dot rendering
    - Test NavDivider and NavSection rendering
    - Write file: `/components/navigation/__tests__/composable.test.tsx`

- [ ] 5. Implement Desktop Sidebar component
  - [ ] 5.1 Implement Desktop_Sidebar component
    - Create file: `/components/navigation/Desktop_Sidebar.tsx`
    - Read context via useNavigation hook
    - Render aside element (fixed, left-0, h-full)
    - Render collapse toggle button in header
    - Use NavRenderer to render filteredConfig
    - Apply responsive classes: hidden md:flex
    - Apply collapse styling: 
      - Collapsed: w-20
      - Expanded: w-64
      - Transition: ease-in-out duration-200
    - Show tooltips on icons when collapsed
    - Memoize component to prevent unnecessary re-renders
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1_

  - [ ] 5.2 Write unit tests for Desktop_Sidebar
    - Test collapsed/expanded state toggle
    - Test sidebar width changes
    - Test tooltip display when collapsed
    - Test responsive hide (md breakpoint)
    - Test active item highlighting
    - Write file: `/components/navigation/__tests__/Desktop_Sidebar.test.tsx`

- [ ] 6. Implement Mobile Drawer component
  - [ ] 6.1 Implement Mobile_Drawer component
    - Create file: `/components/navigation/Mobile_Drawer.tsx`
    - Read context via useNavigation hook
    - Use Shadcn Sheet component for overlay
    - Render NavRenderer inside SheetContent
    - Set responsive: md:hidden (hidden on desktop)
    - Close drawer on item click
    - Close drawer on backdrop click
    - Restore expanded groups state from context on reopen
    - Memoize component to prevent unnecessary re-renders
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 6.2 Write unit tests for Mobile_Drawer
    - Test drawer open/close
    - Test drawer closes on item click
    - Test drawer closes on backdrop click
    - Test expanded groups persist when drawer reopens
    - Test responsive show (md breakpoint)
    - Write file: `/components/navigation/__tests__/Mobile_Drawer.test.tsx`

- [ ] 7. Export components and create index file
  - [ ] 7.1 Create component index file
    - Create file: `/components/navigation/index.ts`
    - Export all components: NavigationProvider, Desktop_Sidebar, Mobile_Drawer, NavRenderer, NavLink, NavGroup, NavBadge, NavDivider, NavSection
    - Export useNavigation hook
    - _Requirements: 10.2_

  - [ ] 7.2 Export types from central location
    - Create file: `/types/navigation.ts`
    - Re-export all types from `/lib/navigation/navigation.types.ts`
    - _Requirements: 9.4_

- [ ] 8. Integrate navigation into Dashboard layout
  - [ ] 8.1 Update Dashboard layout to use NavigationProvider
    - Modify file: `/app/dashboard/layout.tsx`
    - Import NavigationProvider, Desktop_Sidebar, Mobile_Drawer, navigationConfig
    - Implement getUserSession function (fetch from auth context/session)
    - Implement getFeatureFlags function (fetch from backend or config)
    - Wrap layout with NavigationProvider
    - Include Desktop_Sidebar and Mobile_Drawer components
    - Adjust main content area with responsive margin: md:ml-20 lg:ml-64
    - Add transition class for smooth margin changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 8.2 Create navigation header with hamburger trigger (Mobile_Drawer trigger)
    - Optional: Add responsive header with hamburger icon on mobile
    - Hamburger should trigger Mobile_Drawer open
    - Header should be visible on mobile only
    - _Requirements: 4.1_

  - [ ] 8.3 Write integration tests for Dashboard layout
    - Test NavigationProvider initialization with user session
    - Test Desktop_Sidebar visibility on desktop
    - Test Mobile_Drawer visibility on mobile
    - Test navigation config loads and renders
    - Test responsive behavior at breakpoints
    - Write file: `/app/dashboard/__tests__/layout.test.tsx`

- [ ] 9. Add custom hooks and utilities for navigation
  - [ ] 9.1 Implement useFilteredConfig hook (optional utility)
    - Create file: `/lib/navigation/navigation.hooks.ts`
    - Memoized hook that returns computed filteredConfig
    - _Requirements: 7.1_

  - [ ] 9.2 Implement findItemById utility function
    - Create file: `/lib/navigation/navigation.utils.ts` (extend)
    - Accept items, itemId
    - Recursively find item with matching id
    - Return item or null
    - _Requirements: 10.2_

  - [ ] 9.3 Implement getItemPath utility function
    - Create file: `/lib/navigation/navigation.utils.ts` (extend)
    - Accept items, itemId
    - Return array of item ids representing path to item (for breadcrumbs)
    - _Requirements: 8.5_

  - [ ] 9.4 Write unit tests for custom hooks and utilities
    - Test useFilteredConfig hook with various role/flag combinations
    - Test findItemById with nested structures
    - Test getItemPath returns correct breadcrumb trail
    - Write file: `/lib/navigation/__tests__/navigation.hooks.test.ts`

- [ ] 10. Checkpoint - Ensure all types are correctly exported and accessible
  - Verify all types are exported from `/types/navigation.ts`
  - Verify all components are exported from `/components/navigation/index.ts`
  - Verify all utilities are exported from `/lib/navigation/` files
  - Run TypeScript compiler to check for type errors
  - Verify no circular dependencies
  - _Requirements: 1.5, 9.1, 9.2, 9.4, 9.5_

- [ ] 11. Add React Strict Mode and memoization optimizations
  - [ ] 11.1 Add React.memo to all composable components
    - Memoize NavLink, NavGroup, NavBadge, NavDivider, NavSection, NavRenderer
    - Create file: `/components/navigation/` (update each component)
    - _Requirements: 10.1_

  - [ ] 11.2 Optimize NavigationProvider with useMemo
    - Memoize context value to prevent cascading re-renders
    - Memoize filteredConfig computation
    - Memoize expandedGroups Set
    - Update file: `/components/navigation/NavigationProvider.tsx`
    - _Requirements: 10.1_

  - [ ] 11.3 Write performance tests
    - Test component re-render counts with memoization
    - Benchmark navigation config filtering with large configs
    - Test state persistence without performance impact
    - Write file: `/components/navigation/__tests__/performance.test.tsx`

- [ ] 12. Add responsive behavior and touch optimizations
  - [ ] 12.1 Add responsive Tailwind classes to sidebar
    - Ensure sidebar width responsive at md breakpoint
    - Ensure main content margin responsive
    - Test margin transitions smooth
    - _Requirements: 3.3, 3.4, 6.4_

  - [ ] 12.2 Add mobile touch optimizations
    - Increase touch target sizes on mobile (min h-10)
    - Add proper spacing for touch interaction
    - Test drawer swipe-to-close (if using sheet library)
    - _Requirements: 4.4_

- [ ] 13. Checkpoint - Run full test suite and verify all tests pass
  - Run all unit tests for utilities (property-based + example-based)
  - Run all component tests
  - Run integration tests
  - Verify TypeScript compilation succeeds with no errors
  - Check test coverage for core algorithms (>90% for utilities)
  - _Requirements: 2.2, 2.4, 5.2, 5.4, 1.5_

- [ ] 14. Document navigation configuration and extension patterns
  - [ ] 14.1 Create usage guide for navigation config
    - Document how to add new NavLink items
    - Document role-based visibility syntax
    - Document feature flag syntax
    - Document nested NavGroup structure
    - Create file: `/docs/NAVIGATION_CONFIG_GUIDE.md`
    - _Requirements: 1.2, 2.1, 2.2, 2.4, 8.1, 8.2_

  - [ ] 14.2 Document custom component patterns (future extensibility)
    - Show example of registering custom Navigation_Item types
    - Show example of custom renderer registration
    - Create file: `/docs/NAVIGATION_EXTENSION_GUIDE.md`
    - _Requirements: 8.3, 8.4_

  - [ ] 14.3 Write TypeScript migration guide
    - Document navigation types and how to use them
    - Document useNavigation hook usage
    - Create file: `/docs/NAVIGATION_TYPESCRIPT_GUIDE.md`
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 15. Final checkpoint - Ensure all requirements are met
  - Verify all acceptance criteria from requirements.md are addressed
  - Verify navigation renders correctly on both desktop and mobile
  - Verify state persistence across page navigation
  - Verify role-based filtering works correctly
  - Verify feature flag filtering works correctly
  - Verify active item highlighting synchronizes across layouts
  - Run full test suite one final time
  - Ask the user if questions arise
  - _Requirements: All (1.1-10.5)_

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Core implementation tasks (no `*` marker) must be completed for functionality
- Property-based tests (2.2, 2.4, 2.6) validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Integration tests verify state synchronization between layouts
- All tasks reference specific requirements for traceability
- Memoization is critical for performance with deeply nested navigation structures
- localStorage/sessionStorage persistence must be carefully tested to ensure state recovery
- The design includes 6 correctness properties that are validated through property-based testing

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.3", "2.5"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.4", "2.6", "2.7"]
    },
    {
      "id": 3,
      "tasks": ["3.1", "3.2"]
    },
    {
      "id": 4,
      "tasks": ["3.3", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"]
    },
    {
      "id": 5,
      "tasks": ["4.7", "5.1", "6.1"]
    },
    {
      "id": 6,
      "tasks": ["5.2", "6.2", "7.1", "7.2"]
    },
    {
      "id": 7,
      "tasks": ["8.1", "8.2", "9.1", "9.2", "9.3"]
    },
    {
      "id": 8,
      "tasks": ["8.3", "9.4", "11.1", "11.2", "12.1", "12.2"]
    },
    {
      "id": 9,
      "tasks": ["11.3"]
    },
    {
      "id": 10,
      "tasks": ["14.1", "14.2", "14.3"]
    }
  ]
}
```
