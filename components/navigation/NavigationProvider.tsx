'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  NavigationContextType,
  NavigationProviderProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  NavigationItem,
  UserRole,
  FeatureFlagKey,
} from '@/lib/navigation/navigation.types';
import {
  filterNavigationItems,
  findActiveItemId,
  getGroupsToExpand,
} from '@/lib/navigation/navigation.utils';

/**
 * Navigation Context
 * Provides state and methods for managing navigation UI across the dashboard.
 */
const NavigationContext = createContext<NavigationContextType | null>(null);

/**
 * NavigationProvider Component
 * 
 * Wraps the dashboard and provides centralized navigation state management.
 * 
 * Responsibilities:
 * - Initialize context state for collapsed/expanded states, active item, expanded groups
 * - Load sidebar collapsed state from localStorage (key: 'dashboard_sidebar_collapsed')
 * - Load expanded groups from sessionStorage (key: 'nav_expanded_groups')
 * - Persist collapsed state to localStorage on change
 * - Persist expanded groups to sessionStorage on change
 * - Subscribe to router pathname changes to sync activeItemId
 * - Compute filteredConfig whenever userRoles or featureFlags change
 * - Auto-expand ancestor groups when activeItemId changes
 * - Provide memoized context value to prevent unnecessary re-renders
 */
export function NavigationProvider({
  children,
  userSession,
  featureFlags: initialFeatureFlags = {},
  navigationConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNavigate,
}: NavigationProviderProps): React.ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const pathname = usePathname();

  // Desktop sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Current active route
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // User context (for filtering)
  const [userRoles, setUserRoles] = useState<UserRole[]>(userSession.roles);

  // Feature flags (for filtering)
  const [featureFlags, setFeatureFlags] = useState<Record<FeatureFlagKey, boolean>>(
    (initialFeatureFlags as Record<FeatureFlagKey, boolean>) || {}
  );

  // Filtered configuration (lazy computed)
  const filteredConfig = useMemo(
    () => filterNavigationItems(navigationConfig, userRoles, featureFlags),
    [navigationConfig, userRoles, featureFlags]
  );

  // EFFECT: Load sidebar collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_sidebar_collapsed');
      if (saved !== null) {
        try {
          setIsSidebarCollapsed(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse sidebar collapsed state from localStorage', e);
        }
      }
    }
  }, []);

  // EFFECT: Persist sidebar collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'dashboard_sidebar_collapsed',
        JSON.stringify(isSidebarCollapsed)
      );
    }
  }, [isSidebarCollapsed]);

  // EFFECT: Load expanded groups from sessionStorage
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nav_expanded_groups');
      if (saved !== null) {
        try {
          const groups = JSON.parse(saved);
          if (Array.isArray(groups)) {
            setExpandedGroups(new Set(groups));
          }
        } catch (e) {
          console.error('Failed to parse expanded groups from sessionStorage', e);
        }
      }
    }
  }, []);

  // EFFECT: Persist expanded groups to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'nav_expanded_groups',
        JSON.stringify(Array.from(expandedGroups))
      );
    }
  }, [expandedGroups]);

  // EFFECT: Sync activeItemId with current route pathname
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const activeId = findActiveItemId(navigationConfig, pathname);
    setActiveItemId(activeId);
  }, [pathname, navigationConfig]);

  // EFFECT: Auto-expand ancestor groups when activeItemId changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (activeItemId) {
      const groupsToExpand = getGroupsToExpand(navigationConfig, activeItemId);
      // Merge new groups with existing expanded groups
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedGroups(prev => new Set([...prev, ...groupsToExpand]));
    }
  }, [activeItemId, navigationConfig]);

  // CALLBACK: Toggle group expanded state
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const updated = new Set(prev);
      if (updated.has(groupId)) {
        updated.delete(groupId);
      } else {
        updated.add(groupId);
      }
      return updated;
    });
  }, []);

  // CALLBACK: Update sidebar collapsed state
  const setSidebarCollapsedCallback = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  // CALLBACK: Update drawer open state
  const setDrawerOpenCallback = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
  }, []);

  // CALLBACK: Update active item ID
  const setActiveItemIdCallback = useCallback((id: string | null) => {
    setActiveItemId(id);
  }, []);

  // CALLBACK: Update user roles
  const setUserRolesCallback = useCallback((roles: UserRole[]) => {
    setUserRoles(roles);
  }, []);

  // CALLBACK: Update feature flags
  const setFeatureFlagsCallback = useCallback((flags: Record<FeatureFlagKey, boolean>) => {
    setFeatureFlags(flags);
  }, []);

  // CALLBACK: Set expanded groups from Set
  const setExpandedGroupsCallback = useCallback((groups: Set<string>) => {
    setExpandedGroups(groups);
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue: NavigationContextType = useMemo(
    () => ({
      isSidebarCollapsed,
      setSidebarCollapsed: setSidebarCollapsedCallback,
      isDrawerOpen,
      setDrawerOpen: setDrawerOpenCallback,
      activeItemId,
      setActiveItemId: setActiveItemIdCallback,
      expandedGroups,
      toggleGroup,
      setExpandedGroups: setExpandedGroupsCallback,
      userRoles,
      setUserRoles: setUserRolesCallback,
      featureFlags,
      setFeatureFlags: setFeatureFlagsCallback,
      filteredConfig,
    }),
    [
      isSidebarCollapsed,
      setSidebarCollapsedCallback,
      isDrawerOpen,
      setDrawerOpenCallback,
      activeItemId,
      setActiveItemIdCallback,
      expandedGroups,
      toggleGroup,
      setExpandedGroupsCallback,
      userRoles,
      setUserRolesCallback,
      featureFlags,
      setFeatureFlagsCallback,
      filteredConfig,
    ]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Custom Hook: useNavigation
 * 
 * Provides access to the Navigation context from within the dashboard.
 * Must be used within a NavigationProvider.
 * 
 * @returns Navigation context value (all state and setters)
 * @throws Error if used outside NavigationProvider
 * 
 * @example
 * const { activeItemId, expandedGroups, isSidebarCollapsed } = useNavigation();
 */
export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      'useNavigation must be used within a NavigationProvider. ' +
      'Make sure NavigationProvider wraps your component tree.'
    );
  }
  return context;
}
