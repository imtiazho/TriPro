import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from '../utils/logger';

let firebaseInitialized = false;

export function initializeFirebase(): admin.app.App | null {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    // 1. Check for service account JSON key file
    const possibleKeyPaths = [
      env.FIREBASE_SERVICE_ACCOUNT_PATH,
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
      path.resolve(__dirname, '../../serviceAccountKey.json'),
    ].filter(Boolean) as string[];

    for (const keyPath of possibleKeyPaths) {
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
        logger.info({ path: keyPath }, 'Firebase Admin SDK initialized with service account JSON file');
        return admin.app();
      }
    }

    // 2. Check for individual environment credentials
    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      firebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized with service account environment variables');
      return admin.app();
    } else if (env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
      firebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized with project ID default credentials');
      return admin.app();
    } else {
      logger.warn('Firebase Admin credentials not provided in environment; operating in development simulated auth mode');
      return null;
    }
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to initialize Firebase Admin SDK');
    return null;
  }
}

export async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string; name?: string }> {
  const app = initializeFirebase();

  if (app) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to verify Firebase ID token');
      throw new Error('Invalid or expired authentication token');
    }
  }

  // Development / Test Fallback mode when Firebase credentials are not yet configured:
  // Supports tokens in format "dev-token-<uid>" or JSON encoded string
  if (env.NODE_ENV !== 'production') {
    if (token.startsWith('dev-token-')) {
      const parts = token.split(':');
      const uid = parts[0].replace('dev-token-', '');
      const email = parts[1] || `${uid}@demo.local`;
      return { uid, email, name: `User ${uid}` };
    }
    // Also support base64 decoded payload in dev
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded && decoded.uid) {
        return { uid: decoded.uid, email: decoded.email, name: decoded.name };
      }
    } catch {
      // not base64 json
    }
  }

  throw new Error('Authentication service not configured and invalid token format');
}

export async function getFirebaseUserByUid(uid: string): Promise<{ uid: string; email?: string; displayName?: string } | null> {
  const app = initializeFirebase();
  if (app) {
    try {
      const record = await admin.auth().getUser(uid);
      return {
        uid: record.uid,
        email: record.email,
        displayName: record.displayName,
      };
    } catch (error) {
      logger.error({ uid, error: (error as Error).message }, 'Firebase Admin getUser failed');
      return null;
    }
  }

  // In dev fallback mode:
  if (env.NODE_ENV !== 'production') {
    return {
      uid,
      email: `${uid}@demo.local`,
      displayName: `Dev User (${uid})`,
    };
  }

  return null;
}
