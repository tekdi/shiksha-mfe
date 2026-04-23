import Cookies from 'js-cookie';

/**
 * SSR-safe storage utility that uses cookies instead of localStorage
 * Cookies are available on both server and client side
 */

export const storage = {
  // Get value from cookies (works on both server and client)
  get: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return Cookies.get(key) || null;
    }
    return null;
  },

  // Set value in cookies (client-side only)
  set: (key: string, value: string, options?: any): void => {
    if (typeof window !== 'undefined') {
      Cookies.set(key, value, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        ...options,
      });
    }
  },

  // Remove value from cookies
  remove: (key: string): void => {
    if (typeof window !== 'undefined') {
      Cookies.remove(key);
    }
  },

  // Clear all cookies
  clear: (): void => {
    if (typeof window !== 'undefined') {
      // Get all cookies and remove them
      const cookies = document.cookie.split(';');
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        Cookies.remove(name);
      });
    }
  },
};

// Convenience functions for common use cases
export const getUserId = (): string | null => {
  return storage.get('userId') || '5afb0c71-5e85-46f6-8780-3059cbb7bbf9';
};

export const getUserName = (): string => {
  const userData = storage.get('userData');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed?.firstName) {
        const lastName = parsed.lastName || '';
        return `${parsed.firstName} ${lastName}`.trim();
      }
      if (parsed?.name) {
        return parsed.name;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return 'Anonymous User';
};

export const getToken = (): string | null => {
  return storage.get('token');
};

export const getUserRole = (): string | null => {
  const adminInfo = storage.get('adminInfo');
  if (adminInfo) {
    try {
      const parsed = JSON.parse(adminInfo);
      return parsed?.role;
    } catch (error) {
      console.error('Error parsing admin info:', error);
    }
  }
  return null;
};

export const getTenantId = (): string | null => {
  return storage.get('tenantId');
};

export const setUserId = (userId: string): void => {
  storage.set('userId', userId);
};

export const setUserName = (userData: any): void => {
  storage.set('userData', JSON.stringify(userData));
};

export const setToken = (token: string): void => {
  storage.set('token', token);
};

export const setUserRole = (adminInfo: any): void => {
  storage.set('adminInfo', JSON.stringify(adminInfo));
};

export const setTenantId = (tenantId: string): void => {
  storage.set('tenantId', tenantId);
};
