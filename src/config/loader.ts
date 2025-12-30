// src/config/loader.ts
// Environment variable and configuration loading

import { existsSync, readFileSync, mkdirSync, copyFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import type { Credentials, SendError } from '../sms/types.ts';
import type { EmailCredentials } from '../sms/providers/email-gateway.ts';
import type { NtfyCredentials } from '../sms/providers/ntfy.ts';
import type { PushoverCredentials } from '../sms/providers/pushover.ts';

/**
 * Get the config directory path: ~/.config/notify
 */
export function getConfigDir(): string {
  return join(homedir(), '.config', 'notify');
}

/**
 * Get the config file path: ~/.config/notify/.env
 */
export function getConfigPath(): string {
  return join(getConfigDir(), '.env');
}

/**
 * Load environment variables from ~/.config/notify/.env
 * This is called once at startup to populate process.env
 */
export function loadConfigFile(): void {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    return; // No config file, rely on shell environment
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Parse KEY=value (handle values with = in them)
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already in environment (shell env takes precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Silently ignore read errors
  }
}

/**
 * Initialize config directory with example file if it doesn't exist.
 * Called during build process.
 */
export function initConfigDir(examplePath: string): { created: boolean; path: string } {
  const configDir = getConfigDir();
  const configPath = getConfigPath();
  
  // Create directory if needed
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  // Copy example if config doesn't exist
  if (!existsSync(configPath)) {
    if (existsSync(examplePath)) {
      copyFileSync(examplePath, configPath);
      return { created: true, path: configPath };
    }
  }
  
  return { created: false, path: configPath };
}

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
