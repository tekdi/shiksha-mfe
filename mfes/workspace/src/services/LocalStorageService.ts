import Cookies from 'js-cookie';

/**
 * Sync all user-related data from localStorage to cookies
 * This should be called whenever user data might have been updated (e.g., after login)
 */
export const syncUserDataToCookies = () => {
  if (typeof window !== 'undefined') {
    try {
      console.log('Syncing user data from localStorage to cookies...');

      // List of user-related keys to sync
      const userDataKeys = [
        'userData',
        'userId',
        'token',
        'refreshToken',
        'adminInfo',
        'tenantId',
        'showHeader',
        'userSpecificBoard',
      ];

      let syncedCount = 0;

      userDataKeys.forEach((key) => {
        const localStorageValue = localStorage.getItem(key);
        if (localStorageValue) {
          // Set in cookies with proper options
          Cookies.set(key, localStorageValue, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          console.log(`Synced ${key} from localStorage to cookies`);
          syncedCount++;
        }
      });

      console.log(
        `Sync complete: ${syncedCount} items synced from localStorage to cookies`
      );
      return syncedCount;
    } catch (error) {
      console.error('Error syncing user data to cookies:', error);
      return 0;
    }
  }
  return 0;
};

/**
 * Check if user data exists in localStorage but not in cookies
 * Returns true if sync is needed
 */
export const needsUserDataSync = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const userDataKeys = [
        'userData',
        'userId',
        'token',
        'adminInfo',
        'tenantId',
      ];

      for (const key of userDataKeys) {
        const localStorageValue = localStorage.getItem(key);
        const cookieValue = Cookies.get(key);

        if (localStorageValue && !cookieValue) {
          console.log(
            `Sync needed: ${key} exists in localStorage but not in cookies`
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }
  return false;
};

export const getLocalStoredUserId = () => {
  if (typeof window !== 'undefined') {
    try {
      // First try cookies (new approach)
      const userId = Cookies.get('userId');
      if (userId) {
        console.log('getLocalStoredUserId - found userId in cookies:', userId);
        return userId;
      }

      // Fallback to localStorage (old approach)
      const userIdLocalStorage = localStorage.getItem('userId');
      if (userIdLocalStorage) {
        console.log(
          'getLocalStoredUserId - found userId in localStorage:',
          userIdLocalStorage
        );

        // Migrate to cookies for future use
        Cookies.set('userId', userIdLocalStorage, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        console.log(
          'getLocalStoredUserId - migrated userId from localStorage to cookies'
        );

        return userIdLocalStorage;
      }

      console.log('getLocalStoredUserId - no userId found, returning fallback');
      return '5afb0c71-5e85-46f6-8780-3059cbb7bbf9'; // Do-do : remove the fall back of userId and handle empty case in components
    } catch (error) {
      console.error('Error retrieving user data from storage:', error);
      return null;
    }
  } else {
    // Running in SSR, return fallback
    return '5afb0c71-5e85-46f6-8780-3059cbb7bbf9';
  }
};

export const getLocalStoredUserName = () => {
  if (typeof window !== 'undefined') {
    try {
      // First try cookies (new approach)
      const userDataCookie = Cookies.get('userData');
      console.log('getLocalStoredUserName - userData cookie:', userDataCookie);

      if (userDataCookie) {
        const userData = JSON.parse(userDataCookie);
        console.log(
          'getLocalStoredUserName - parsed userData from cookies:',
          userData
        );

        if (userData?.firstName) {
          const lastName = userData.lastName || '';
          const fullName = `${userData.firstName} ${lastName}`.trim();
          console.log(
            'getLocalStoredUserName - returning firstName + lastName from cookies:',
            fullName
          );
          return fullName;
        }

        if (userData?.name) {
          console.log(
            'getLocalStoredUserName - returning name from cookies:',
            userData.name
          );
          return userData.name;
        }
      }

      // Fallback to localStorage (old approach)
      const userDataLocalStorage = localStorage.getItem('userData');
      console.log(
        'getLocalStoredUserName - userData localStorage:',
        userDataLocalStorage
      );

      if (userDataLocalStorage) {
        const userData = JSON.parse(userDataLocalStorage);
        console.log(
          'getLocalStoredUserName - parsed userData from localStorage:',
          userData
        );

        if (userData?.firstName) {
          const lastName = userData.lastName || '';
          const fullName = `${userData.firstName} ${lastName}`.trim();
          console.log(
            'getLocalStoredUserName - returning firstName + lastName from localStorage:',
            fullName
          );

          // Migrate to cookies for future use
          Cookies.set('userData', userDataLocalStorage, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          console.log(
            'getLocalStoredUserName - migrated userData from localStorage to cookies'
          );

          return fullName;
        }

        if (userData?.name) {
          console.log(
            'getLocalStoredUserName - returning name from localStorage:',
            userData.name
          );

          // Migrate to cookies for future use
          Cookies.set('userData', userDataLocalStorage, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          console.log(
            'getLocalStoredUserName - migrated userData from localStorage to cookies'
          );

          return userData.name;
        }
      }

      console.log(
        'getLocalStoredUserName - no valid user data found, returning Anonymous User'
      );
      return 'Anonymous User';
    } catch (error) {
      console.error('Error retrieving user name from storage:', error);
      return 'Anonymous User';
    }
  } else {
    // Running in SSR, return fallback
    return 'Anonymous User';
  }
};
export const getLocalStoredToken = () => {
  if (typeof window !== 'undefined') {
    try {
      // First try cookies (new approach)
      const token = Cookies.get('token');
      if (token) {
        console.log('getLocalStoredToken - found token in cookies');
        return token;
      }

      // Fallback to localStorage (old approach)
      const tokenLocalStorage = localStorage.getItem('token');
      if (tokenLocalStorage) {
        console.log('getLocalStoredToken - found token in localStorage');

        // Migrate to cookies for future use
        Cookies.set('token', tokenLocalStorage, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        console.log(
          'getLocalStoredToken - migrated token from localStorage to cookies'
        );

        return tokenLocalStorage;
      }

      console.log('getLocalStoredToken - no token found');
      return null;
    } catch (error) {
      console.error('Error retrieving token from storage:', error);
      return null;
    }
  } else {
    // Running in SSR, return null
    return null;
  }
};
export const getLocalStoredUserRole = () => {
  if (typeof window !== 'undefined') {
    try {
      const userInfo = JSON.parse(Cookies.get('adminInfo') || '{}');
      return userInfo?.role;
    } catch (error) {
      console.error('Error retrieving user role from cookies:', error);
      return null;
    }
  } else {
    // Running in SSR, return null
    return null;
  }
};

export const getLocalStoredUserSpecificBoard = () => {
  if (typeof window !== 'undefined') {
    try {
      const userSpecificBoard = Cookies.get('userSpecificBoard') || '[]';
      return {
        code: 'board',
        value: userSpecificBoard,
      };
    } catch (error) {
      console.error('Error retrieving userSpecificBoard from cookies:', error);
      return null;
    }
  } else {
    // Running in SSR, return null
    return null;
  }
};
