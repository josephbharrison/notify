// src/sms/providers/ntfy.ts
// ntfy.sh push notification provider (free, no registration required)

import type { SendResult, SendError } from '../types.ts';

/**
 * ntfy.sh credentials/configuration.
 */
export interface NtfyCredentials {
  /** Topic name (like a channel) - can be any string */
  topic: string;
  /** ntfy server URL (default: https://ntfy.sh) */
  server?: string;
}

/**
 * ntfy.sh push notification client.
 * 
 * Usage:
 * 1. Set NTFY_TOPIC in your .env (e.g., "my-notify-alerts")
 * 2. Subscribe to the topic on your phone:
 *    - iOS: https://apps.apple.com/app/ntfy/id1625396347
 *    - Android: https://play.google.com/store/apps/details?id=io.heckel.ntfy
 * 3. Send notifications with the CLI
 */
export class NtfySmsClient {
  private topic: string;
  private server: string;

  constructor(credentials: NtfyCredentials) {
    this.topic = credentials.topic;
    this.server = credentials.server || 'https://ntfy.sh';
  }

  /**
   * Send a push notification via ntfy.sh.
   * Note: The 'to' parameter is ignored - notifications go to the configured topic.
   */
  async sendSms(to: string, body: string): Promise<SendResult> {
    const timestamp = new Date();
    const url = `${this.server}/${this.topic}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Title': 'notify',
          'Tags': 'speech_balloon',
        },
        body: body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          to,
          timestamp,
          error: this.mapHttpError(response.status, errorText),
        };
      }

      const result = await response.json() as { id: string };

      return {
        success: true,
        messageId: result.id,
        to,
        timestamp,
      };
    } catch (err: unknown) {
      const error = this.mapNetworkError(err);
      return {
        success: false,
        to,
        timestamp,
        error,
      };
    }
  }

  /**
   * Map HTTP errors to SendError type.
   */
  private mapHttpError(status: number, message: string): SendError {
    if (status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests to ntfy.sh',
        retryable: true,
        guidance: 'You have exceeded the rate limit. Wait a moment and try again.',
      };
    }

    return {
      code: 'PROVIDER_ERROR',
      message: `ntfy.sh error (${status}): ${message}`,
      retryable: false,
      guidance: 'Check your NTFY_TOPIC setting and try again.',
    };
  }

  /**
   * Map network errors to SendError type.
   */
  private mapNetworkError(err: unknown): SendError {
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    if (message.includes('fetch failed') || message.includes('ENOTFOUND')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Could not connect to ntfy.sh',
        retryable: true,
        guidance: 'Check your internet connection and try again.',
      };
    }

    return {
      code: 'PROVIDER_ERROR',
      message: `ntfy.sh error: ${message}`,
      retryable: false,
      guidance: 'An error occurred while sending the notification.',
    };
  }
}
