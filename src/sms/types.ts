// src/sms/types.ts
// Core type definitions for SMS Notify CLI

/**
 * Represents a validated, normalized phone number ready for SMS delivery.
 */
export interface PhoneNumber {
  /** Original input as provided by user */
  raw: string;
  /** Normalized E.164 format (e.g., +14155552671) */
  e164: string;
  /** Detected ISO 3166-1 alpha-2 country code (e.g., US) */
  country?: string;
}

/**
 * Represents the SMS message content to be sent.
 */
export interface Message {
  /** The text content of the SMS */
  body: string;
  /** Estimated number of SMS segments */
  segmentCount: number;
  /** Character encoding based on content */
  encoding: 'GSM-7' | 'UCS-2';
}

/**
 * Configuration for authenticating with the SMS provider.
 */
export interface Credentials {
  /** Twilio Account SID */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** Sender phone number (Twilio-owned) */
  fromNumber: string;
}

/**
 * Represents the outcome of an SMS send operation.
 */
export interface SendResult {
  /** Whether the message was accepted for delivery */
  success: boolean;
  /** Provider's message identifier (on success) */
  messageId?: string;
  /** Destination phone number (E.164) */
  to: string;
  /** When the request was made */
  timestamp: Date;
  /** Error details (on failure) */
  error?: SendError;
}

/**
 * Error code categories for SMS operations.
 */
export type ErrorCode =
  | 'INVALID_PHONE'
  | 'MISSING_CONFIG'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'RATE_LIMITED';

/**
 * Represents a failure during the SMS send operation.
 */
export interface SendError {
  /** Error code category */
  code: ErrorCode;
  /** User-friendly error message */
  message: string;
  /** Whether the operation can be retried */
  retryable: boolean;
  /** Actionable steps for the user */
  guidance: string;
}

/**
 * Exit codes per CLI contract.
 */
export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  CONFIG_ERROR: 3,
  VALIDATION_ERROR: 4,
  NETWORK_ERROR: 5,
} as const;

export type ExitCode = (typeof ExitCodes)[keyof typeof ExitCodes];

/**
 * Create a SendError with the given parameters.
 * Helper factory function for consistent error creation.
 */
export function createSendError(
  code: ErrorCode,
  message: string,
  guidance: string,
  retryable: boolean = false
): SendError {
  return { code, message, retryable, guidance };
}

/**
 * GSM-7 basic character set (standard SMS encoding).
 * Characters in this set use 7 bits per character.
 */
const GSM7_BASIC_CHARS = new Set([
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', 'Æ', 'æ', 'ß', 'É',
  ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
  '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à',
]);

/**
 * GSM-7 extended character set (requires escape sequence, counts as 2 chars).
 */
const GSM7_EXTENDED_CHARS = new Set(['|', '^', '€', '{', '}', '[', ']', '~', '\\']);

/**
 * Detect the encoding required for an SMS message.
 * Returns 'GSM-7' if all characters are in the GSM-7 character set,
 * otherwise returns 'UCS-2' (required for emoji, non-Latin scripts, etc.).
 */
export function detectMessageEncoding(text: string): 'GSM-7' | 'UCS-2' {
  for (const char of text) {
    if (!GSM7_BASIC_CHARS.has(char) && !GSM7_EXTENDED_CHARS.has(char)) {
      return 'UCS-2';
    }
  }
  return 'GSM-7';
}

/**
 * Calculate the number of SMS segments required for a message.
 * 
 * Segment limits:
 * - GSM-7: 160 chars single, 153 chars per segment for multi-part
 * - UCS-2: 70 chars single, 67 chars per segment for multi-part
 * 
 * Note: GSM-7 extended characters count as 2 characters.
 */
export function calculateSegmentCount(text: string): { encoding: 'GSM-7' | 'UCS-2'; segmentCount: number; charCount: number } {
  const encoding = detectMessageEncoding(text);
  
  let charCount: number;
  if (encoding === 'GSM-7') {
    // Count extended chars as 2
    charCount = 0;
    for (const char of text) {
      charCount += GSM7_EXTENDED_CHARS.has(char) ? 2 : 1;
    }
  } else {
    charCount = text.length;
  }
  
  // Determine segment limits
  const singleLimit = encoding === 'GSM-7' ? 160 : 70;
  const multiLimit = encoding === 'GSM-7' ? 153 : 67;
  
  let segmentCount: number;
  if (charCount <= singleLimit) {
    segmentCount = 1;
  } else {
    segmentCount = Math.ceil(charCount / multiLimit);
  }
  
  return { encoding, segmentCount, charCount };
}
