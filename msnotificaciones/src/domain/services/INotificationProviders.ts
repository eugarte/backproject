import { Notification } from '../entities/Notification';

export interface IEmailProvider {
  sendEmail(notification: Notification, recipientEmail: string): Promise<boolean>;
}

export interface ISmsProvider {
  sendSms(notification: Notification, phoneNumber: string): Promise<boolean>;
}

export interface IPushProvider {
  sendPush(notification: Notification, deviceToken: string): Promise<boolean>;
}

export interface IInAppProvider {
  sendInApp(notification: Notification): Promise<boolean>;
}
