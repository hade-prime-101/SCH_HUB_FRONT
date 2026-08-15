import { useEffect, useRef, useState } from "react";

/**
 * Hook to resolve the current user's department ID.
 * First checks localStorage (set at login), then falls back to /users/me API call.
 * Updates localStorage on successful resolution so future uploads don't need API call.
 *
 * @returns {Object} { departmentId, isLoading, error }
 */
export function useDepartmentId() {
  const [departmentId, setDepartmentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

   
  useEffect(() => {
    let cancelled = false;
    cancelledRef.current = false;

    const resolve = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check localStorage first (set at login time)
        const raw = localStorage.getItem("auth_user");
        if (raw) {
          const u = JSON.parse(raw);
          // Backend may return flat departmentId or nested department.id
          const id = u?.departmentId ?? u?.department?.id ?? "";
          if (id) {
            if (!cancelled) {
              setDepartmentId(id);
              setIsLoading(false);
            }
            return;
          }
        }

        // Fallback — fetch fresh profile if not in stored user
        const { usersApi } = await import("@/lib/api/users.api");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const me = (await usersApi.getMe()) as any;
        const id = me?.departmentId ?? me?.department?.id ?? "";

        if (!cancelled) {
          setDepartmentId(id);

          // Update stored user so next upload doesn't need to fetch again
          if (id) {
            try {
              const stored = localStorage.getItem("auth_user");
              const u = stored ? JSON.parse(stored) : {};
              localStorage.setItem(
                "auth_user",
                JSON.stringify({ ...u, departmentId: id })
              );
            } catch {}
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to resolve department");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    resolve();
    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, []);

  return {
    departmentId,
    isLoading,
    error,
  };
}
