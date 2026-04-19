import twilio from 'twilio';
import { Notification } from '@domain/entities/Notification';
import { ISmsProvider } from '@domain/services/INotificationProviders';
import { LoggerService } from '../logging/LoggerService';

export class TwilioProvider implements ISmsProvider {
  private client: twilio.Twilio | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      LoggerService.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set');
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSms(notification: Notification, phoneNumber: string): Promise<boolean> {
    if (!this.client) {
      LoggerService.error('Twilio client not initialized');
      return false;
    }

    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        throw new Error('TWILIO_PHONE_NUMBER not set');
      }

      await this.client.messages.create({
        body: `${notification.title}: ${notification.content}`,
        from: fromNumber,
        to: phoneNumber,
      });

      LoggerService.info(`SMS sent to ${phoneNumber}`, { notificationId: notification.id });
      return true;
    } catch (error) {
      LoggerService.error('Failed to send SMS', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}
