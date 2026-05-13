import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
// import config from './config.json';
import firebaseConfig from './firebaseConfig';

export const firebaseApp = (() => {
  if (firebaseConfig.projectId) {
    try {
      return initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }
  return undefined;
})();

export const messaging = (() => {
  if (typeof globalThis.window !== 'undefined' && 'serviceWorker' in globalThis.navigator && firebaseApp) {
    return getMessaging(firebaseApp);
  }
  console.warn('Service workers are not supported or Firebase is not initialized.');
  return undefined;
})();

export const requestPermission = async () => {
  if (typeof globalThis.window === 'undefined') return;

  const permission = await globalThis.window.Notification.requestPermission();
  try {
    if (permission === 'granted' && messaging) {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      });
      return token;
    } else {
      console.log('Permission failed or messaging not initialized');
    }
  } catch (error) {
    console.log('Error getting token:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } else {
      reject(new Error('Firebase messaging is not initialized or supported in this environment.'));
    }
  });
