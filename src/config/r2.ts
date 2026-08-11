/**
 * r2.ts — backward-compatibility shim
 *
 * Storage has moved to Supabase Storage (storage.ts).
 * This file re-exports everything so existing imports of '@/config/r2.js'
 * continue to work without modification.
 */
export { storage as r2, type UploadResult } from '@/config/storage.js';
