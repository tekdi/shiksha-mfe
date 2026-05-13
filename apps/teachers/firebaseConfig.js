const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FCM_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FCM_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FCM_PROJECT_FCM_ID,
    storageBucket: process.env.NEXT_PUBLIC_FCM_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FCM_MESSAGING_SENDER,
    appId: process.env.NEXT_PUBLIC_FCM_FCM_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FCM_MEASUREMENT_ID,
};

if (!firebaseConfig.projectId) {
    console.warn('Firebase projectId is missing. Firebase features will be disabled.');
}

export default firebaseConfig;