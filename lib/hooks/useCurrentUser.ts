import { useEffect, useState } from "react";
import { User } from "@/types/auth";

/**
 * Hook to get the current logged-in user from localStorage.
 * Retrieves user data set at login time.
 *
 * @returns {Object} { user, isLoading }
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

   
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(raw) as User);
      }
    } catch {
      // Silently fail if localStorage is unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
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
