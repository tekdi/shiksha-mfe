import {
  syncUserDataToCookies,
  needsUserDataSync,
} from '../services/LocalStorageService';

/**
 * Global function to sync user data from localStorage to cookies
 * This should be called whenever user data might have been updated (e.g., after login)
 * It can be called from anywhere in the application
 */
export const performUserDataSync = (): number => {
  if (typeof window !== 'undefined') {
    if (needsUserDataSync()) {
      console.log('Global sync: User data sync needed, performing sync...');
      return syncUserDataToCookies();
    } else {
      console.log(
        'Global sync: No sync needed, user data is already up to date'
      );
      return 0;
    }
  }
  return 0;
};

/**
 * Force sync all user data from localStorage to cookies
 * This bypasses the check and always performs the sync
 */
export const forceUserDataSync = (): number => {
  if (typeof window !== 'undefined') {
    console.log('Force sync: Performing user data sync...');
    return syncUserDataToCookies();
  }
  return 0;
};

/**
 * Check if user data sync is needed
 */
export const isUserDataSyncNeeded = (): boolean => {
  return needsUserDataSync();
};

// Make these functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).performUserDataSync = performUserDataSync;
  (window as any).forceUserDataSync = forceUserDataSync;
  (window as any).isUserDataSyncNeeded = isUserDataSyncNeeded;
}
