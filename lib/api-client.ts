/**
 * Legacy compatibility shim.
 * New code should import from "@/lib/api" directly.
 * e.g. import { authApi, studyApi } from "@/lib/api"
 */

export { authApi as apiClient } from "@/lib/api";
export * from "@/lib/api";
