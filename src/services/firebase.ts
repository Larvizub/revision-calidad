import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, OAuthProvider } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const baseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Recinto-specific configuration: databaseURL override + allowed domains
export const RECINTO_CONFIGS: Record<string, { databaseURL: string; allowedDomains: string[] }> = {
  CCCI: {
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL_CCCI,
    allowedDomains: ['@grupoheroica.com', '@cccartagena.com'],
  },
  CCCR: {
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL_CCCR,
    allowedDomains: ['@grupoheroica.com', '@costaricacc.com'],
  },
  CEVP: {
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL_CEVP,
    allowedDomains: ['@grupoheroica.com', '@valledelpacifico.co'],
  },
};

// Initialize default app
let defaultApp: FirebaseApp;
if (!getApps().length) {
  defaultApp = initializeApp(baseConfig);
} else {
  defaultApp = getApp();
}

// Export auth and storage from default app (auth provider shared)
export const auth = getAuth(defaultApp);
export const storage = getStorage(defaultApp);

// Helper to get (or create) a Firebase app for a given recinto and return its Database
export function getDatabaseForRecinto(recinto?: string): Database {
  try {
    if (!recinto) {
      return getDatabase(defaultApp);
    }

    const cfg = RECINTO_CONFIGS[recinto];
    if (!cfg) return getDatabase(defaultApp);

    const appName = `app-${recinto}`;
    let app: FirebaseApp;
    try {
      app = getApp(appName);
    } catch {
      // create new app instance overriding databaseURL
      const config = { ...baseConfig, databaseURL: cfg.databaseURL };
      app = initializeApp(config, appName);
    }
    return getDatabase(app);
  } catch (error) {
    console.error('Error obtaining database for recinto:', recinto, error);
    return getDatabase(defaultApp);
  }
}

// Configure Microsoft OAuth provider
export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  tenant: import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common',
});

// Agregar scopes para obtener más información del perfil
microsoftProvider.addScope('user.read');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('email');
microsoftProvider.addScope('openid');

export default defaultApp;
