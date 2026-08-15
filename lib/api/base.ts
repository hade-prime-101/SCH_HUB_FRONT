import { withAuthInterceptor } from "./interceptor";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type ApiParams = Record<string, string | number | boolean | undefined | null>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isFormData = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(options.headers || {}),
    },
  };

  // Add auth token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await withAuthInterceptor(fetch)(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const error = new Error(
      errorData?.message || `HTTP ${response.status}`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = response.status;

    throw error;
  }

  // Handle empty responses safely
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  return data as T;
}

// -----------------------------------------------------------------------------
// GET
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiGet<T = any>(
  endpoint: string,
  params?: ApiParams
): Promise<T> {
  const query =
    params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()}`
      : "";

  return apiFetch<T>(endpoint + query, {
    method: "GET",
  });
}

// -----------------------------------------------------------------------------
// POST
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiPost<T = any>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any = {},
  isFormData = false
): Promise<T> {
  return apiFetch<T>(
    endpoint,
    {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    },
    isFormData
  );
}

// -----------------------------------------------------------------------------
// PATCH
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiPatch<T = any>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// -----------------------------------------------------------------------------
// PUT
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiPut<T = any>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// -----------------------------------------------------------------------------
// DELETE
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiDelete<T = any>(
  endpoint: string
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
  });
}

// -----------------------------------------------------------------------------
// Clear auth cookie
// -----------------------------------------------------------------------------

export async function clearAuthCookie(): Promise<void> {
  try {
    await fetch("/api/auth/clear-cookie", {
      method: "POST",
    });
  } catch {
    // Intentionally ignored.
  }
}