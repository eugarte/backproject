import admin from 'firebase-admin';
import { Notification } from '@domain/entities/Notification';
import { IPushProvider } from '@domain/services/INotificationProviders';
import { LoggerService } from '../logging/LoggerService';

export class FirebaseProvider implements IPushProvider {
  private initialized = false;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      LoggerService.warn('Firebase credentials not set');
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });
      this.initialized = true;
      LoggerService.info('Firebase initialized');
    } catch (error) {
      LoggerService.error('Failed to initialize Firebase', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async sendPush(notification: Notification, deviceToken: string): Promise<boolean> {
    if (!this.initialized) {
      LoggerService.error('Firebase not initialized');
      return false;
    }

    try {
      await admin.messaging().send({
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.content,
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
        },
      });

      LoggerService.info(`Push sent to device`, { notificationId: notification.id });
      return true;
    } catch (error) {
      LoggerService.error('Failed to send push notification', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}
