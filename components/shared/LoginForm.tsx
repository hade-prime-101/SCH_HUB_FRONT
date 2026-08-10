"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { MdOutlineEmail } from "react-icons/md";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";

const inputClassName =
  "w-full rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * LoginForm Component
 *
 * Reusable login form component with:
 * - Email and password inputs
 * - Form validation
 * - Error display
 * - Loading state
 * - Remember me checkbox
 * - Password visibility toggle
 *
 * @example
 * ```tsx
 * const [isLoading, setIsLoading] = useState(false);
 * const [error, setError] = useState<string | null>(null);
 *
 * const handleLogin = async (email: string, password: string) => {
 *   setIsLoading(true);
 *   try {
 *     await apiClient.login(email, password);
 *   } catch (err) {
 *     setError(err.message);
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 *
 * <LoginForm
 *   onSubmit={handleLogin}
 *   isLoading={isLoading}
 *   error={error}
 * />
 * ```
 */
export function LoginForm({
  onSubmit,
  isLoading = false,
  error = null,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate email format
   */
  const validateEmail = (value: string): string | undefined => {
    if (!value) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  /**
   * Validate password
   */
  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return undefined;
  };

  /**
   * Handle field blur - mark as touched and validate
   */
  const handleBlur = (fieldName: keyof typeof touched) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));

    // Validate the field
    let error: string | undefined;
    if (fieldName === "email") {
      error = validateEmail(email);
    } else if (fieldName === "password") {
      error = validatePassword(password);
    }

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName as keyof FormErrors];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    // Clear errors
    setErrors({});

    // Call onSubmit callback
    try {
      await onSubmit(email, password);
    } catch (err) {
      // Error handling is done by parent component
      console.error("Login form submission error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && <ErrorMessage message={error} />}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-[12px] font-semibold text-slate-500">
          Email address
        </label>
        <div className="relative">
          <MdOutlineEmail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            name="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email && errors.email) {
                const error = validateEmail(e.target.value);
                if (error) {
                  setErrors((prev) => ({ ...prev, email: error }));
                } else {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                  });
                }
              }
            }}
            onBlur={() => handleBlur("email")}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputClassName} pl-12 pr-4 ${
              errors.email
                ? "border-red-300 bg-red-50 focus:ring-red-500/50"
                : ""
            } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          />
        </div>
        {touched.email && errors.email && (
          <p id="email-error" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-[12px] font-semibold text-slate-500">
          Password
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (touched.password && errors.password) {
              const error = validatePassword(value);
              if (error) {
                setErrors((prev) => ({ ...prev, password: error }));
              } else {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.password;
                  return newErrors;
                });
              }
            }
          }}
          onBlur={() => handleBlur("password")}
          placeholder="Enter your password"
          error={touched.password ? errors.password : undefined}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <label htmlFor="remember-me" className="flex cursor-pointer items-center gap-2 select-none">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span>Remember me</span>
        </label>
        <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700">
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-[48px] w-full rounded-[12px] bg-indigo-600 text-[15px] font-semibold text-white shadow-[0_10px_12px_rgba(99,102,241,0.2)] transition hover:bg-indigo-700"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
