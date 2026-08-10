import { useEffect, useRef } from "react";
import { User } from "@/types/auth";

/**
 * Hook to get the current logged-in user from localStorage.
 * Retrieves user data set at login time.
 *
 * @returns {Object} { user, isLoading }
 */
export function useCurrentUser() {
  const userRef = useRef<User | null>(null);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        userRef.current = JSON.parse(raw) as User;
      }
    } catch {
      // Silently fail if localStorage is unavailable
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  return {
    user: userRef.current,
    isLoading: isLoadingRef.current,
  };
}

/**
 * Check if user has one of the required roles for quiz approval.
 * Quiz approval requires: COURSE_REP, SCHOOL_ADMIN, or SUPER_ADMIN
 */
export function canApproveQuiz(user: User | null): boolean {
  if (!user) return false;
  return ["COURSE_REP", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(user.role);
}
