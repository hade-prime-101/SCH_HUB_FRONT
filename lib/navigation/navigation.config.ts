/**
 * Sample Navigation Configuration
 * 
 * Demonstrates a comprehensive navigation structure for a school dashboard
 * including role-based visibility, feature flags, badges, and nested groups.
 * 
 * This configuration showcases:
 * - NavLink items with various paths and roles
 * - NavDivider for visual separation
 * - NavSection headers for organization
 * - NavGroup with nested children
 * - Role-based visibility (TEACHER and ADMIN roles)
 * - Feature flag filtering (ADVANCED_ANALYTICS, SETTINGS)
 * - Badge indicators on items
 * - Multi-level nesting
 */

import {
  NavigationConfig,
  NavigationItem,
  UserRole,
  FeatureFlagKey,
  NavBadge,
} from './navigation.types';

// Icon imports from lucide-react
import {
  Home,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Lock,
  Zap,
  FileText,
  User,
  Shield,
  Eye,
  Mail,
  Clock,
  AlertCircle,
} from 'lucide-react';

/**
 * Badge variant for unread messages
 */
const unreadBadge: NavBadge = {
  content: 12,
  variant: 'error',
};

/**
 * Badge variant for new feature
 */
const newFeatureBadge: NavBadge = {
  content: 'new',
  variant: 'success',
};

/**
 * Badge variant for pending action
 */
const pendingBadge: NavBadge = {
  content: 3,
  variant: 'warning',
};

/**
 * Sample navigation configuration demonstrating all features
 */
export const navigationConfig: NavigationConfig = [
  // Home link - visible to all roles
  {
    type: 'link',
    id: 'nav-home',
    label: 'Home',
    path: '/dashboard',
    icon: Home,
    description: 'Dashboard overview and quick stats',
  },

  // Divider for visual separation
  {
    type: 'divider',
    id: 'divider-main',
  },

  // Main section header
  {
    type: 'section',
    id: 'section-main',
    label: 'Main',
  },

  // Classes link - TEACHER role only with badge
  {
    type: 'link',
    id: 'nav-classes',
    label: 'Classes',
    path: '/dashboard/classes',
    icon: BookOpen,
    badge: {
      content: 2,
      variant: 'info',
    },
    roles: [UserRole.TEACHER, UserRole.ADMIN],
    description: 'Manage your classes and student enrollment',
  },

  // Students link - visible to teachers and admins
  {
    type: 'link',
    id: 'nav-students',
    label: 'Students',
    path: '/dashboard/students',
    icon: Users,
    roles: [UserRole.TEACHER, UserRole.ADMIN],
    badge: pendingBadge,
    description: 'View and manage student information',
  },

  // Communication link - visible to all authenticated users
  {
    type: 'link',
    id: 'nav-messages',
    label: 'Messages',
    path: '/dashboard/messages',
    icon: Mail,
    badge: unreadBadge,
    description: 'Your messages and communications',
  },

  // Another divider
  {
    type: 'divider',
    id: 'divider-admin',
    roles: [UserRole.ADMIN],
  },

  // Administration section - ADMIN role only
  {
    type: 'section',
    id: 'section-admin',
    label: 'Administration',
    roles: [UserRole.ADMIN],
  },

  // Administration group - ADMIN role only with nested items
  {
    type: 'group',
    id: 'nav-admin-group',
    label: 'Administration',
    icon: Shield,
    roles: [UserRole.ADMIN],
    badge: newFeatureBadge,
    collapsedByDefault: false,
    children: [
      {
        type: 'link',
        id: 'nav-users',
        label: 'User Management',
        path: '/dashboard/admin/users',
        icon: Users,
        description: 'Manage system users and accounts',
      },

      {
        type: 'link',
        id: 'nav-roles',
        label: 'Roles & Permissions',
        path: '/dashboard/admin/roles',
        icon: Lock,
        description: 'Configure user roles and permissions',
      },

      {
        type: 'link',
        id: 'nav-audit-log',
        label: 'Audit Log',
        path: '/dashboard/admin/audit-log',
        icon: FileText,
        description: 'System activity and changes log',
      },

      {
        type: 'divider',
        id: 'divider-admin-sub',
      },

      {
        type: 'link',
        id: 'nav-system-settings',
        label: 'System Settings',
        path: '/dashboard/admin/system-settings',
        icon: Zap,
        description: 'Configure system-wide settings',
      },
    ],
  },

  // Divider for analytics section
  {
    type: 'divider',
    id: 'divider-analytics',
    featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
  },

  // Analytics section header - only shows if feature flag enabled
  {
    type: 'section',
    id: 'section-analytics',
    label: 'Analytics',
    featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
  },

  // Analytics group - only visible when ADVANCED_ANALYTICS feature flag enabled
  {
    type: 'group',
    id: 'nav-analytics-group',
    label: 'Analytics',
    icon: BarChart3,
    featureFlag: FeatureFlagKey.ADVANCED_ANALYTICS,
    collapsedByDefault: true,
    children: [
      {
        type: 'link',
        id: 'nav-analytics-overview',
        label: 'Overview',
        path: '/dashboard/analytics/overview',
        icon: Eye,
        description: 'Analytics dashboard overview',
      },

      {
        type: 'link',
        id: 'nav-analytics-reports',
        label: 'Reports',
        path: '/dashboard/analytics/reports',
        icon: BarChart3,
        badge: newFeatureBadge,
        description: 'Generate and view reports',
      },

      {
        type: 'link',
        id: 'nav-analytics-retention',
        label: 'Student Retention',
        path: '/dashboard/analytics/retention',
        icon: AlertCircle,
        badge: pendingBadge,
        description: 'Track student retention metrics',
      },

      {
        type: 'divider',
        id: 'divider-analytics-sub',
      },

      {
        type: 'group',
        id: 'nav-analytics-advanced',
        label: 'Advanced Metrics',
        icon: Zap,
        collapsedByDefault: true,
        children: [
          {
            type: 'link',
            id: 'nav-performance-analytics',
            label: 'Performance Metrics',
            path: '/dashboard/analytics/performance',
            description: 'Detailed performance analysis',
          },

          {
            type: 'link',
            id: 'nav-engagement-analytics',
            label: 'Engagement Analysis',
            path: '/dashboard/analytics/engagement',
            description: 'Student engagement metrics',
          },
        ],
      },
    ],
  },

  // Divider before profile section
  {
    type: 'divider',
    id: 'divider-profile',
  },

  // Profile section header
  {
    type: 'section',
    id: 'section-profile',
    label: 'Personal',
  },

  // Profile link
  {
    type: 'link',
    id: 'nav-profile',
    label: 'My Profile',
    path: '/dashboard/profile',
    icon: User,
    description: 'View and edit your profile',
  },

  // Settings link - only visible when SETTINGS feature flag enabled
  {
    type: 'link',
    id: 'nav-settings',
    label: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    featureFlag: FeatureFlagKey.SETTINGS,
    description: 'Manage your preferences and settings',
  },

  // Activity/History link
  {
    type: 'link',
    id: 'nav-activity',
    label: 'Activity History',
    path: '/dashboard/activity',
    icon: Clock,
    description: 'View your recent activity',
  },
];
