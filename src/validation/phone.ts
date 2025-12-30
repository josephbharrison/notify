// src/validation/phone.ts
// Phone number validation and normalization

import parsePhoneNumber from 'libphonenumber-js';
import type { PhoneNumber, SendError } from '../sms/types.ts';

/**
 * Result of phone validation - either success with PhoneNumber or failure with error.
 */
export type PhoneValidationResult =
  | { success: true; phone: PhoneNumber }
  | { success: false; error: SendError };

/**
 * Sanitize a phone number by removing common formatting characters.
 * Preserves the leading '+' for E.164 format numbers.
 * 
 * @param input - Raw phone number input from user
 * @returns Sanitized phone number string
 */
export function sanitizePhoneNumber(input: string): string {
  // Trim whitespace
  let sanitized = input.trim();
  
  // Preserve leading '+' if present
  const hasPlus = sanitized.startsWith('+');
  
  // Remove common formatting characters: spaces, dashes, parentheses, dots
  sanitized = sanitized.replace(/[\s\-().]/g, '');
  
  // Restore leading '+' if it was removed (shouldn't happen, but be safe)
  if (hasPlus && !sanitized.startsWith('+')) {
    sanitized = '+' + sanitized;
  }
  
  return sanitized;
}

/**
 * Validate and format a phone number to E.164 format.
 *
 * @param input - Raw phone number input from user
 * @param defaultCountry - Default country code for national numbers (e.g., 'US')
 * @returns Validation result with normalized phone or error
 */
export function validateAndFormatPhone(
  input: string,
  defaultCountry: string = 'US'
): PhoneValidationResult {
  // Step 1: Sanitize the input
  const sanitized = sanitizePhoneNumber(input);
  
  try {
    // Parse the phone number (using sanitized input)
    const phone = parsePhoneNumber(sanitized, defaultCountry as any);

    if (!phone) {
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Could not parse phone number',
          retryable: false,
          guidance: `The phone number "${input}" could not be parsed. Please provide a valid phone number in E.164 format (e.g., +14155552671) or national format with --country flag.`,
        },
      };
    }

    if (!phone.isPossible()) {
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Phone number has invalid length',
          retryable: false,
          guidance: `The phone number "${input}" has an invalid length for the detected country. Please check the number and try again.`,
        },
      };
    }

    return {
      success: true,
      phone: {
        raw: input,
        e164: phone.format('E.164'),
        country: phone.country,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_PHONE',
        message: 'Invalid phone number format',
        retryable: false,
        guidance: `The phone number "${input}" could not be parsed. Please provide a valid phone number in E.164 format (e.g., +14155552671) or national format with --country flag.`,
      },
    };
  }
}
