import { useEffect, useRef } from "react";

/**
 * Hook to resolve the current user's department ID.
 * First checks localStorage (set at login), then falls back to /users/me API call.
 * Updates localStorage on successful resolution so future uploads don't need API call.
 *
 * @returns {Object} { departmentId, isLoading, error }
 */
export function useDepartmentId() {
  const departmentId = useRef<string>("");
  const isLoadingRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      isLoadingRef.current = true;
      errorRef.current = null;

      try {
        // Check localStorage first (set at login time)
        const raw = localStorage.getItem("auth_user");
        if (raw) {
          const u = JSON.parse(raw);
          // Backend may return flat departmentId or nested department.id
          const id = u?.departmentId ?? u?.department?.id ?? "";
          if (id) {
            departmentId.current = id;
            isLoadingRef.current = false;
            return;
          }
        }

        // Fallback — fetch fresh profile if not in stored user
        const { usersApi } = await import("@/lib/api/users");
        const me = (await usersApi.getMe()) as any;
        const id = me?.departmentId ?? me?.department?.id ?? "";

        if (!cancelled) {
          departmentId.current = id;

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
          errorRef.current = e instanceof Error ? e.message : "Failed to resolve department";
        }
      } finally {
        if (!cancelled) {
          isLoadingRef.current = false;
        }
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    departmentId: departmentId.current,
    isLoading: isLoadingRef.current,
    error: errorRef.current,
  };
}
