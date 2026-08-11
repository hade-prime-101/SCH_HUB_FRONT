import { env } from '@/config/env.js';

// Dynamically import firebase-admin only when credentials are configured
// so local dev works without Firebase setup

let _messaging: import('firebase-admin/messaging').Messaging | null = null;

async function getMessaging() {
  if (_messaging) return _messaging;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getMessaging } = await import('firebase-admin/messaging');

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  _messaging = getMessaging();
  return _messaging;
}

export const firebase = {
  async sendPush(token: string, title: string, body: string, data?: Record<string, string>) {
    const messaging = await getMessaging();
    if (!messaging) {
      console.log('[FCM stub]', { token, title, body, data });
      return;
    }
    await messaging.send({ token, notification: { title, body }, data });
  },

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    const messaging = await getMessaging();
    if (!messaging) {
      console.log('[FCM stub multicast]', { tokens, title, body });
      return;
    }
    await messaging.sendEachForMulticast({ tokens, notification: { title, body }, data });
  },

  async sendTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    const messaging = await getMessaging();
    if (!messaging) {
      console.log('[FCM stub topic]', { topic, title, body, data });
      return;
    }
    await messaging.send({ topic, notification: { title, body }, data });
  },

  async subscribeToTopics(token: string, topics: string[]) {
    const messaging = await getMessaging();
    if (!messaging) {
      console.log('[FCM stub subscribe]', { token, topics });
      return;
    }

    await Promise.all(topics.map((topic) => messaging.subscribeToTopic([token], topic)));
  },
};
