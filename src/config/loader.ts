// src/config/loader.ts
// Environment variable and configuration loading

import type { Credentials, SendError } from '../sms/types.ts';
import type { EmailCredentials } from '../sms/providers/email-gateway.ts';
import type { NtfyCredentials } from '../sms/providers/ntfy.ts';
import type { PushoverCredentials } from '../sms/providers/pushover.ts';

/**
 * Result of loading credentials - either success with credentials or failure with error.
 */
export type CredentialsResult =
  | { success: true; credentials: Credentials }
  | { success: false; error: SendError };

/**
 * Result of loading email credentials.
 */
export type EmailCredentialsResult =
  | { success: true; credentials: EmailCredentials }
  | { success: false; error: SendError };

/**
 * Result of loading ntfy credentials.
 */
export type NtfyCredentialsResult =
  | { success: true; credentials: NtfyCredentials }
  | { success: false; error: SendError };

/**
 * Result of loading Pushover credentials.
 */
export type PushoverCredentialsResult =
  | { success: true; credentials: PushoverCredentials }
  | { success: false; error: SendError };

/**
 * Detect which provider is configured based on environment variables.
 * Priority: pushover > ntfy > twilio > email
 */
export function detectProvider(): 'pushover' | 'ntfy' | 'twilio' | 'email' | 'none' {
  const hasPushover = !!(process.env.PUSHOVER_USER && process.env.PUSHOVER_TOKEN);
  const hasNtfy = !!process.env.NTFY_TOPIC;
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasEmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  if (hasPushover) return 'pushover';
  if (hasNtfy) return 'ntfy';
  if (hasTwilio) return 'twilio';
  if (hasEmail) return 'email';
  return 'none';
}

/**
 * Load Twilio credentials from environment variables.
 * Returns a result object with either credentials or an error.
 */
export function loadCredentials(): CredentialsResult {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // Check for missing credentials
  const missing: string[] = [];
  if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
  if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
  if (!fromNumber) missing.push('TWILIO_PHONE_NUMBER');

  if (missing.length > 0) {
    return {
      success: false,
      error: {
        code: 'MISSING_CONFIG',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        retryable: false,
        guidance: `Please set the following environment variables:\n${missing.map((v) => `  export ${v}="your-value"`).join('\n')}\n\nGet these values from https://console.twilio.com`,
      },
    };
  }

  return {
    success: true,
    credentials: {
      accountSid: accountSid!,
      authToken: authToken!,
      fromNumber: fromNumber!,
    },
  };
}

/**
 * Load email gateway credentials from environment variables.
 */
export function loadEmailCredentials(): EmailCredentialsResult {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const carrier = process.env.SMS_CARRIER;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true';

  // Check for missing credentials
  const missing: string[] = [];
  if (!user) missing.push('EMAIL_USER');
  if (!pass) missing.push('EMAIL_PASS');
  if (!carrier) missing.push('SMS_CARRIER');

  if (missing.length > 0) {
    return {
      success: false,
      error: {
        code: 'MISSING_CONFIG',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        retryable: false,
        guidance: `Please set the following environment variables:\n${missing.map((v) => `  export ${v}="your-value"`).join('\n')}\n\nSupported carriers: att, tmobile, verizon, sprint`,
      },
    };
  }

  return {
    success: true,
    credentials: {
      host,
      port,
      secure,
      user: user!,
      pass: pass!,
      carrier: carrier!,
    },
  };
}

/**
 * Load ntfy.sh credentials from environment variables.
 */
export function loadNtfyCredentials(): NtfyCredentialsResult {
  const topic = process.env.NTFY_TOPIC;
  const server = process.env.NTFY_SERVER || 'https://ntfy.sh';

  if (!topic) {
    return {
      success: false,
      error: {
        code: 'MISSING_CONFIG',
        message: 'Missing required environment variable: NTFY_TOPIC',
        retryable: false,
        guidance: `Please set your ntfy topic:\n  export NTFY_TOPIC="your-topic-name"\n\nThen subscribe to this topic on your phone using the ntfy app.`,
      },
    };
  }

  return {
    success: true,
    credentials: {
      topic,
      server,
    },
  };
}

/**
 * Load Pushover credentials from environment variables.
 */
export function loadPushoverCredentials(): PushoverCredentialsResult {
  const userKey = process.env.PUSHOVER_USER;
  const apiToken = process.env.PUSHOVER_TOKEN;

  const missing: string[] = [];
  if (!userKey) missing.push('PUSHOVER_USER');
  if (!apiToken) missing.push('PUSHOVER_TOKEN');

  if (missing.length > 0) {
    return {
      success: false,
      error: {
        code: 'MISSING_CONFIG',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        retryable: false,
        guidance: `Please set the following environment variables:\n${missing.map((v) => `  export ${v}="your-value"`).join('\n')}\n\nGet these values from https://pushover.net`,
      },
    };
  }

  return {
    success: true,
    credentials: {
      userKey: userKey!,
      apiToken: apiToken!,
    },
  };
}
