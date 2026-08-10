/**
 * Type-safe cookie manager
 * Handles secure cookie creation, reading, and deletion with options support
 */

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Cookie manager for secure authentication token and session management
 */
export const cookieManager = {
  /**
   * Get a cookie value by name
   * @param name Cookie name
   * @returns Cookie value or null if not found
   */
  getCookie(name: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(';');

      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(nameEQ)) {
          return decodeURIComponent(trimmed.substring(nameEQ.length));
        }
      }

      return null;
    } catch (error) {
      console.error(`Error reading cookie [${name}]:`, error);
      return null;
    }
  },

  /**
   * Set a cookie with optional options
   * @param name Cookie name
   * @param value Cookie value
   * @param options Cookie options (maxAge, path, secure, httpOnly, sameSite, etc.)
   */
  setCookie(name: string, value: string, options?: CookieOptions): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

      if (options) {
        if (options.maxAge !== undefined) {
          cookieString += `; Max-Age=${options.maxAge}`;
        }

        if (options.expires) {
          cookieString += `; Expires=${options.expires.toUTCString()}`;
        }

        if (options.path) {
          cookieString += `; Path=${options.path}`;
        } else {
          cookieString += '; Path=/';
        }

        if (options.domain) {
          cookieString += `; Domain=${options.domain}`;
        }

        if (options.secure) {
          cookieString += '; Secure';
        }

        if (options.httpOnly) {
          cookieString += '; HttpOnly';
        }

        if (options.sameSite) {
          cookieString += `; SameSite=${options.sameSite}`;
        }
      } else {
        // Default path if no options provided
        cookieString += '; Path=/';
      }

      document.cookie = cookieString;
    } catch (error) {
      console.error(`Error setting cookie [${name}]:`, error);
    }
  },

  /**
   * Delete a cookie by name
   * @param name Cookie name
   */
  deleteCookie(name: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.setCookie(name, '', {
        maxAge: 0,
        path: '/',
      });
    } catch (error) {
      console.error(`Error deleting cookie [${name}]:`, error);
    }
  },
};
