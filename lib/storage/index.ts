/**
 * Storage utilities index
 * Exports type-safe storage managers for localStorage, sessionStorage, and cookies
 */

export { localStorageManager, type StorageManager } from './localStorage';
export { sessionStorageManager } from './sessionStorage';
export { cookieManager, type CookieOptions } from './cookies';
