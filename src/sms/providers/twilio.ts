// src/sms/providers/twilio.ts
// Twilio SMS provider implementation

import Twilio from 'twilio';
import type { Credentials, SendResult, SendError } from '../types.ts';

/**
 * Twilio SMS client implementation.
 */
export class TwilioSmsClient {
  private client: ReturnType<typeof Twilio>;
  private fromNumber: string;

  constructor(credentials: Credentials) {
    this.client = Twilio(credentials.accountSid, credentials.authToken);
    this.fromNumber = credentials.fromNumber;
  }

  /**
   * Send an SMS message via Twilio.
   */
  async sendSms(to: string, body: string): Promise<SendResult> {
    const timestamp = new Date();

    try {
      const message = await this.client.messages.create({
        body,
        to,
        from: this.fromNumber,
      });

      return {
        success: true,
        messageId: message.sid,
        to,
        timestamp,
      };
    } catch (err: unknown) {
      const error = this.mapTwilioError(err);
      return {
        success: false,
        to,
        timestamp,
        error,
      };
    }
  }

  /**
   * Map Twilio errors to our SendError type.
   */
  private mapTwilioError(err: unknown): SendError {
    // Handle Twilio-specific error codes
    if (err && typeof err === 'object' && 'code' in err) {
      const twilioError = err as { code: number; message: string };

      // Authentication errors
      if (twilioError.code === 20003) {
        return {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
          retryable: false,
          guidance:
            'Your Twilio credentials are invalid. Please verify your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN at https://console.twilio.com',
        };
      }

      // Rate limiting
      if (twilioError.code === 29) {
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          retryable: true,
          guidance: 'You have exceeded the rate limit. Please wait a moment and try again.',
        };
      }

      // Invalid phone number
      if (twilioError.code === 21211 || twilioError.code === 21614) {
        return {
          code: 'INVALID_PHONE',
          message: twilioError.message || 'Invalid phone number',
          retryable: false,
          guidance:
            'The destination phone number is invalid or cannot receive SMS. Please check the number and try again.',
        };
      }
    }

    // Network errors
    if (err && typeof err === 'object' && 'code' in err) {
      const nodeError = err as { code: string };
      if (
        nodeError.code === 'ENOTFOUND' ||
        nodeError.code === 'ECONNREFUSED' ||
        nodeError.code === 'ETIMEDOUT'
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
          guidance: 'Could not connect to Twilio. Please check your internet connection and try again.',
        };
      }
    }

    // Generic provider error
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      code: 'PROVIDER_ERROR',
      message: `SMS provider error: ${message}`,
      retryable: false,
      guidance: 'An error occurred while sending the SMS. Please try again or contact support.',
    };
  }
}
