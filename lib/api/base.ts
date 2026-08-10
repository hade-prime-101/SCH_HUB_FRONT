const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Generic request wrapper that:
 * - sets credentials: "include" (cookies/session)
 * - includes Authorization header with token from localStorage
 * - accepts optional query params for GET
 * - handles FormData vs JSON
 * - unwraps response: if response JSON has a `data` property, returns that; otherwise returns full JSON
 * - throws ApiError on non‑ok responses
 */
async function request<T = any>(
  method: string,
  path: string,
  {
    params,
    body,
    isFormData = false,
  }: {
    params?: Record<string, string | number | undefined>;
    body?: unknown;
    isFormData?: boolean;
  } = {},
): Promise<T> {
  // Build the full URL - handle both absolute and relative API_BASE
  let urlString = `${API_BASE}${path}`;
  
  // If API_BASE is a relative path (starts with /), prepend window location
  if (typeof window !== "undefined" && API_BASE.startsWith("/")) {
    urlString = `${window.location.origin}${API_BASE}${path}`;
  }
  
  const url = new URL(urlString);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
  }

  const headers: HeadersInit = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if token exists in localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    options.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const res = await fetch(url.toString(), options);

  let json: any;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    json = await res.json();
  } else {
    const text = await res.text();
    json = { message: text };
  }

  if (!res.ok) {
    const message =
      json?.message || json?.error || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, json);
  }

  // Unwrap: if response has a top‑level `data` property, return that;
  // otherwise return the whole JSON. This matches how sendSuccess / sendPaginated works.
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

// ─── Public helpers ───────────────────────────────────────────

export async function apiGet<T = any>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>("GET", path, { params });
}

export async function apiPost<T = any>(
  path: string,
  body?: unknown,
  isFormData?: boolean,
): Promise<T> {
  return request<T>("POST", path, { body, isFormData });
}

export async function apiPatch<T = any>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>("PATCH", path, { body });
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// Optional: you can also export apiPut
export async function apiPut<T = any>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>("PUT", path, { body });
}

export { ApiError };

// Alias for apiFetch (used by other API modules)
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  return request<T>(fetchOptions.method || "GET", path, { params, body: fetchOptions.body });
}

// Clear auth cookie function
export async function clearAuthCookie(): Promise<void> {
  await apiPost("/auth/logout");
}
