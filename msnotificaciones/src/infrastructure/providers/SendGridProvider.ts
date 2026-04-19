import sgMail from '@sendgrid/mail';
import { Notification } from '@domain/entities/Notification';
import { IEmailProvider } from '@domain/services/INotificationProviders';
import { LoggerService } from '../logging/LoggerService';

export class SendGridProvider implements IEmailProvider {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      LoggerService.warn('SENDGRID_API_KEY not set');
      return;
    }
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(notification: Notification, recipientEmail: string): Promise<boolean> {
    try {
      const msg = {
        to: recipientEmail,
        from: {
          email: process.env.EMAIL_FROM || 'noreply@example.com',
          name: process.env.EMAIL_FROM_NAME || 'Notifications Service',
        },
        subject: notification.title,
        text: notification.content,
        html: `<p>${notification.content}</p>`,
        customArgs: {
          notificationId: notification.id,
        },
      };

      await sgMail.send(msg);
      LoggerService.info(`Email sent to ${recipientEmail}`, { notificationId: notification.id });
      return true;
    } catch (error) {
      LoggerService.error('Failed to send email', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}
