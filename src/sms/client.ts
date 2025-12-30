// src/sms/client.ts
// SMS client interface and factory

import type { Credentials, SendResult } from './types.ts';
import type { EmailCredentials } from './providers/email-gateway.ts';
import type { NtfyCredentials } from './providers/ntfy.ts';
import type { PushoverCredentials } from './providers/pushover.ts';
import { TwilioSmsClient } from './providers/twilio.ts';
import { EmailGatewaySmsClient } from './providers/email-gateway.ts';
import { NtfySmsClient } from './providers/ntfy.ts';
import { PushoverSmsClient } from './providers/pushover.ts';

/**
 * Interface for SMS providers.
 */
export interface SmsClient {
  /**
   * Send an SMS message.
   * @param to - Destination phone number in E.164 format
   * @param body - Message content
   * @returns Result of the send operation
   */
  sendSms(to: string, body: string): Promise<SendResult>;
}

/**
 * Create a Twilio SMS client with the given credentials.
 */
export function createSmsClient(credentials: Credentials): SmsClient {
  return new TwilioSmsClient(credentials);
}

/**
 * Create an email gateway SMS client with the given credentials.
 */
export function createEmailSmsClient(credentials: EmailCredentials): SmsClient {
  return new EmailGatewaySmsClient(credentials);
}

/**
 * Create an ntfy.sh push notification client with the given credentials.
 */
export function createNtfySmsClient(credentials: NtfyCredentials): SmsClient {
  return new NtfySmsClient(credentials);
}

/**
 * Create a Pushover push notification client with the given credentials.
 */
export function createPushoverSmsClient(credentials: PushoverCredentials): SmsClient {
  return new PushoverSmsClient(credentials);
}
