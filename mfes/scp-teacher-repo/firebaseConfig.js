const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FCM_API_KEY || 'dummy-api-key',
    authDomain: process.env.NEXT_PUBLIC_FCM_AUTH_DOMAIN || 'dummy-auth-domain',
    projectId: process.env.NEXT_PUBLIC_FCM_PROJECT_FCM_ID || 'dummy-project-id',
    storageBucket: process.env.NEXT_PUBLIC_FCM_STORAGE_BUCKET || 'dummy-storage-bucket',
    messagingSenderId: process.env.NEXT_PUBLIC_FCM_MESSAGING_SENDER || 'dummy-sender-id',
    appId: process.env.NEXT_PUBLIC_FCM_FCM_APP_ID || 'dummy-app-id',
    measurementId: process.env.NEXT_PUBLIC_FCM_MEASUREMENT_ID || 'dummy-measurement-id',
};

export default firebaseConfig;