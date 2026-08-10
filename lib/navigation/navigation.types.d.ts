/**
 * Navigation Type System
 *
 * Provides fully typed configuration for the dashboard navigation system.
 * Uses TypeScript discriminated unions for compile-time type safety.
 * Supports role-based visibility, feature flags, badges, and hierarchical nesting.
 */
import React from 'react';
/**
 * User roles that can be assigned to users.
 * Used for role-based visibility of navigation items.
 */
export declare enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
    PARENT = "parent"
}
/**
 * Feature flags that control runtime visibility of navigation items.
 * Enables safe deployment of incomplete features.
 */
export declare enum FeatureFlagKey {
    WORKSPACE_SWITCHER = "workspace_switcher",
    ADVANCED_ANALYTICS = "advanced_analytics",
    SETTINGS = "settings",
    PLUGINS = "plugins"
}
/**
 * Navigation badge - visual indicator (count, status, or label)
 * displayed alongside a navigation item.
 */
export interface NavBadge {
    /** Content to display: number (12), string ("new"), etc. */
    content: string | number;
    /** Visual variant controlling background color */
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    /** If true, render as dot instead of text badge */
    showDot?: boolean;
}
/**
 * NavLink - clickable navigation entry that links to a route.
 */
export interface NavLink {
    type: 'link';
    /** Unique identifier for this item */
    id: string;
    /** Display label */
    label: string;
    /** Next.js route path (e.g., "/dashboard/classes") */
    path: string;
    /** Optional icon component (receives className prop) */
    icon?: React.ComponentType<{
        className?: string;
    }>;
    /** Optional badge indicator */
    badge?: NavBadge;
    /** If true, render as disabled (not clickable) */
    disabled?: boolean;
    /** Only show to users with these roles (if not specified, show to all) */
    roles?: UserRole[];
    /** Only show if this feature flag is enabled */
    featureFlag?: FeatureFlagKey;
    /** Optional tooltip/description text */
    description?: string;
    /** If true, links to external URL (use <a> instead of Next.js Link) */
    external?: boolean;
}
/**
 * NavDivider - visual separator between navigation items.
 */
export interface NavDivider {
    type: 'divider';
    /** Unique identifier for this item */
    id: string;
    /** Only show to users with these roles (if not specified, show to all) */
    roles?: UserRole[];
    /** Only show if this feature flag is enabled */
    featureFlag?: FeatureFlagKey;
}
/**
 * NavSection - non-clickable section header for organizing items.
 */
export interface NavSection {
    type: 'section';
    /** Unique identifier for this item */
    id: string;
    /** Section header label */
    label: string;
    /** Only show to users with these roles (if not specified, show to all) */
    roles?: UserRole[];
    /** Only show if this feature flag is enabled */
    featureFlag?: FeatureFlagKey;
}
/**
 * NavGroup - collapsible group of items with optional header and nesting.
 * Supports recursive nesting to arbitrary depth.
 */
export interface NavGroup {
    type: 'group';
    /** Unique identifier for this item */
    id: string;
    /** Group header label */
    label: string;
    /** Optional icon component (receives className prop) */
    icon?: React.ComponentType<{
        className?: string;
    }>;
    /** Optional badge indicator */
    badge?: NavBadge;
    /** If true, render as disabled (header not clickable) */
    disabled?: boolean;
    /** Only show to users with these roles (if not specified, show to all) */
    roles?: UserRole[];
    /** Only show if this feature flag is enabled */
    featureFlag?: FeatureFlagKey;
    /** If true, group starts collapsed */
    collapsedByDefault?: boolean;
    /** Child navigation items (recursive structure) */
    children: NavigationItem[];
}
/**
 * Navigation item discriminated union.
 * Each item has a 'type' discriminator for compile-time type safety.
 */
export type NavigationItem = NavLink | NavDivider | NavSection | NavGroup;
/**
 * Navigation configuration - array of navigation items.
 * This is the top-level structure that defines all navigation structure.
 */
export type NavigationConfig = NavigationItem[];
/**
 * User session information passed to NavigationProvider.
 * Contains user identity and role information for filtering.
 */
export interface UserSession {
    /** Unique user identifier */
    id: string;
    /** User's assigned roles */
    roles: UserRole[];
    /** Optional user display name */
    name?: string;
}
/**
 * Feature flags data passed to NavigationProvider.
 * Maps feature flag keys to their enabled/disabled state.
 */
export interface FeatureFlagsData {
    [FeatureFlagKey.WORKSPACE_SWITCHER]?: boolean;
    [FeatureFlagKey.ADVANCED_ANALYTICS]?: boolean;
    [FeatureFlagKey.SETTINGS]?: boolean;
    [FeatureFlagKey.PLUGINS]?: boolean;
}
/**
 * Navigation context type - all state and methods available via Context.
 */
export interface NavigationContextType {
    /** Whether desktop sidebar is collapsed */
    isSidebarCollapsed: boolean;
    /** Set sidebar collapsed state */
    setSidebarCollapsed: (collapsed: boolean) => void;
    /** Whether mobile drawer is open */
    isDrawerOpen: boolean;
    /** Set drawer open state */
    setDrawerOpen: (open: boolean) => void;
    /** ID of the currently active navigation item (matching current route) */
    activeItemId: string | null;
    /** Set active item ID */
    setActiveItemId: (id: string | null) => void;
    /** Set of group IDs that are currently expanded */
    expandedGroups: Set<string>;
    /** Toggle expanded state of a group */
    toggleGroup: (groupId: string) => void;
    /** Set expanded groups from array */
    setExpandedGroups: (groups: Set<string>) => void;
    /** Current user's roles */
    userRoles: UserRole[];
    /** Set user roles */
    setUserRoles: (roles: UserRole[]) => void;
    /** Current feature flags state */
    featureFlags: Record<FeatureFlagKey, boolean>;
    /** Set feature flags */
    setFeatureFlags: (flags: Record<FeatureFlagKey, boolean>) => void;
    /** Navigation config filtered by user roles and feature flags */
    filteredConfig: NavigationItem[];
}
/**
 * Props for NavigationProvider component.
 */
export interface NavigationProviderProps {
    /** Child components */
    children: React.ReactNode;
    /** User session information for filtering */
    userSession: UserSession;
    /** Feature flags configuration (optional, all default to false if not provided) */
    featureFlags?: FeatureFlagsData;
    /** Navigation configuration - all items to be rendered */
    navigationConfig: NavigationConfig;
    /** Optional callback when user navigates to an item */
    onNavigate?: (itemId: string, path: string) => void;
}
