// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | "STUDENT"
  | "COURSE_REP"
  | "AUTHORIZED_UPLOADER"
  | "EVENT_ORCHESTRATOR"
  | "HOUSE_AGENT"
  | "SCHOOL_ADMIN"
  | "SUPER_ADMIN";

export type DashboardRedirect =
  | "mobile_app"
  | "course_rep_dashboard"
  | "event_orchestrator_dashboard"
  | "house_agent_dashboard"
  | "admin_dashboard"
  | "super_admin_dashboard";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  level?: string;
  schoolId?: string;
  facultyId?: string;
  departmentId?: string;
  phone?: string;
  bio?: string;
  profilePictureUrl?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
}

// ─── Auth Responses (aligned with backend) ────────────────────────────────────

export interface RegisterResponse {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  dashboardRedirect: DashboardRedirect;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
}

/** Shared internal type used by useAuth hook */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  dashboardRedirect?: DashboardRedirect;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export type OtpType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  matriculation: string;
  level: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export type RegistrationStep = "school" | "faculty" | "department" | "details";

export interface FormErrors {
  [field: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── School Lookup ────────────────────────────────────────────────────────────

export interface SchoolType {
  id: string;
  name: string;
  shortCode: string;
  location?: string;
  logoUrl?: string | null;
}

export interface FacultyType {
  id: string;
  name: string;
}

export interface DepartmentType {
  id: string;
  name: string;
  shortCode?: string;
}
