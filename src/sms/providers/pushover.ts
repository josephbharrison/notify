// src/sms/providers/pushover.ts
// Pushover push notification provider ($5 one-time, reliable iOS/Android push)

import type { SendResult, SendError } from '../types.ts';

/**
 * Pushover credentials/configuration.
 */
export interface PushoverCredentials {
  /** User key from https://pushover.net */
  userKey: string;
  /** API token from your application at https://pushover.net/apps */
  apiToken: string;
  /** Optional Pushover sound (e.g., "siren", "persistent") */
  sound?: string;
  /** Optional Pushover priority (-2,-1,0,1,2) */
  priority?: string;
  /** Required for emergency priority (2) */
  retry?: string;
  /** Required for emergency priority (2) */
  expire?: string;
  /** Optional Pushover title (max 250 chars) */
  title?: string;
}

/**
 * Pushover push notification client.
 */
export class PushoverSmsClient {
  private userKey: string;
  private apiToken: string;
  private sound?: string;
  private priority?: string;
  private retry?: string;
  private expire?: string;
  private title?: string;

  constructor(credentials: PushoverCredentials) {
    this.userKey = credentials.userKey;
    this.apiToken = credentials.apiToken;
    this.sound = credentials.sound;
    this.priority = credentials.priority;
    this.retry = credentials.retry;
    this.expire = credentials.expire;
    this.title = credentials.title;
  }

  /**
   * Send a push notification via Pushover.
   * Note: The 'to' parameter is ignored - notifications go to the user's devices.
   */
  async sendSms(to: string, body: string): Promise<SendResult> {
    const timestamp = new Date();

    try {
      const payload: Record<string, string> = {
        token: this.apiToken,
        user: this.userKey,
        message: body,
      };

      if (this.title) {
        payload.title = this.title;
      } else {
        payload.title = 'notify';
      }

      if (this.sound) {
        payload.sound = this.sound;
      }

      if (this.priority) {
        payload.priority = this.priority;
      }

      if (this.priority === '2') {
        if (this.retry) {
          payload.retry = this.retry;
        }
        if (this.expire) {
          payload.expire = this.expire;
        }
      }

      const response = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json() as { status: number; request: string; errors?: string[] };

      if (result.status !== 1) {
        return {
          success: false,
          to,
          timestamp,
          error: {
            code: 'PROVIDER_ERROR',
            message: `Pushover error: ${result.errors?.join(', ') || 'Unknown error'}`,
            retryable: false,
            guidance: 'Check your PUSHOVER_USER and PUSHOVER_TOKEN settings.',
          },
        };
      }

      return {
        success: true,
        messageId: result.request,
        to,
        timestamp,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      return {
        success: false,
        to,
        timestamp,
        error: {
          code: 'NETWORK_ERROR',
          message: `Pushover error: ${message}`,
          retryable: true,
          guidance: 'Check your internet connection and try again.',
        },
      };
    }
  }
}
