import { apiFetch } from "./base";
import type {
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
  VerifyOtpResponse,
  OtpType,
  User,
} from "@/types/auth";

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    matricNumber: string;
    level: string;
    schoolId: string;
    facultyId: string;
    departmentId: string;
  }) =>
    apiFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: () => apiFetch<User>("/auth/me"),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string, type: OtpType) =>
    apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp, type }),
    }),

  resetPassword: (data: {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendOtp: (email: string, type: OtpType) =>
    apiFetch<{ message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, type }),
    }),
};
