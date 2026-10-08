import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

function loadServiceAccount() {
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (keyJson) {
    try {
      return JSON.parse(keyJson);
    } catch (error) {
      throw new Error('Unable to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
    }
  }

  if (keyPath) {
    const resolvedPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.resolve(process.cwd(), keyPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Firebase service account file not found at ${resolvedPath}`);
    }

    return JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  }

  throw new Error(
    'Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH in the backend .env file.'
  );
}

function initializeFirebaseAdmin() {
  const existingApps = getApps();
  if (existingApps.length) {
    return existingApps[0];
  }

  const serviceAccount = loadServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function sendFCMNotifications(tokens, title, body, data = {}) {
  const app = initializeFirebaseAdmin();
  const messaging = getMessaging(app);

  const registrationTokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
  if (!registrationTokens.length) {
    return { success: true, message: 'No registration tokens available' };
  }

  const chunkSize = 500;
  const responses = [];

  for (let i = 0; i < registrationTokens.length; i += chunkSize) {
    const tokensChunk = registrationTokens.slice(i, i + chunkSize);
    const payload = {
      tokens: tokensChunk,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ),
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(payload);
    responses.push({ successCount: response.successCount, failureCount: response.failureCount, responses: response.responses });
  }

  return responses;
}
