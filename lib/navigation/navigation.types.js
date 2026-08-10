/**
 * Navigation Type System
 *
 * Provides fully typed configuration for the dashboard navigation system.
 * Uses TypeScript discriminated unions for compile-time type safety.
 * Supports role-based visibility, feature flags, badges, and hierarchical nesting.
 */
/**
 * User roles that can be assigned to users.
 * Used for role-based visibility of navigation items.
 */
export var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["TEACHER"] = "teacher";
    UserRole["ADMIN"] = "admin";
    UserRole["PARENT"] = "parent";
})(UserRole || (UserRole = {}));
/**
 * Feature flags that control runtime visibility of navigation items.
 * Enables safe deployment of incomplete features.
 */
export var FeatureFlagKey;
(function (FeatureFlagKey) {
    FeatureFlagKey["WORKSPACE_SWITCHER"] = "workspace_switcher";
    FeatureFlagKey["ADVANCED_ANALYTICS"] = "advanced_analytics";
    FeatureFlagKey["SETTINGS"] = "settings";
    FeatureFlagKey["PLUGINS"] = "plugins";
})(FeatureFlagKey || (FeatureFlagKey = {}));
