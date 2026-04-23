// src/cli.ts
// CLI argument parsing and command handling

import { Command } from 'commander';
import { version } from '../package.json';
import { validateAndFormatPhone } from './validation/phone.ts';
import { detectProvider, loadCredentials, loadEmailCredentials, loadNtfyCredentials, loadPushoverCredentials } from './config/loader.ts';
import { createSmsClient, createEmailSmsClient, createNtfySmsClient, createPushoverSmsClient, type SmsClient } from './sms/client.ts';
import { ExitCodes, calculateSegmentCount, type SendError } from './sms/types.ts';

/**
 * Format an error for stderr output.
 */
function formatError(error: SendError): string {
  return `Error: ${error.message}\n\n${error.guidance}`;
}

/**
 * Exit with the appropriate code based on error type.
 */
function exitWithError(error: SendError): never {
  console.error(formatError(error));

  switch (error.code) {
    case 'INVALID_PHONE':
      process.exit(ExitCodes.VALIDATION_ERROR);
    case 'MISSING_CONFIG':
    case 'AUTH_FAILED':
      process.exit(ExitCodes.CONFIG_ERROR);
    case 'NETWORK_ERROR':
    case 'PROVIDER_ERROR':
    case 'RATE_LIMITED':
      process.exit(ExitCodes.NETWORK_ERROR);
    default:
      process.exit(ExitCodes.GENERAL_ERROR);
  }
}

// Create the CLI program
const program = new Command();

program
  .name('notify')
  .description('Send an SMS message to a phone number')
  .version(version)
  .argument('<phone_number>', 'Destination phone number (E.164 or national format)')
  .argument('<message>', 'SMS message text')
  .option('-c, --country <code>', 'Default country for national numbers', 'US')
  .option('-q, --quiet', 'Suppress success output')
  .option('--level <level>', 'Alert level: normal, high, or critical', 'normal')
  .option('--title <title>', 'Title override (Pushover max 250 chars)')
  .addHelpText(
    'after',
    `
Environment Variables (Pushover - $5, reliable iOS/Android push):
  PUSHOVER_USER          Your user key from https://pushover.net
  PUSHOVER_TOKEN         API token from your Pushover application
  PUSHOVER_SOUND         Optional sound (e.g., siren, persistent)
  PUSHOVER_PRIORITY      Optional priority (-2,-1,0,1,2)
  PUSHOVER_RETRY         Required for priority=2 (seconds)
  PUSHOVER_EXPIRE        Required for priority=2 (seconds)
  PUSHOVER_TITLE         Optional title override (max 250 chars)

Environment Variables (ntfy.sh - free, requires app open on iOS):
  NTFY_TOPIC             Your ntfy topic name (e.g., "my-alerts")
  NTFY_SERVER            Optional server URL (default: https://ntfy.sh)

Environment Variables (Twilio - requires A2P 10DLC registration):
  TWILIO_ACCOUNT_SID     Twilio Account SID
  TWILIO_AUTH_TOKEN      Twilio Auth Token
  TWILIO_PHONE_NUMBER    Sender phone number

Environment Variables (Email Gateway - carrier dependent):
  EMAIL_USER             Email address (e.g., you@gmail.com)
  EMAIL_PASS             Email password or app password
  SMS_CARRIER            Recipient carrier: att, tmobile, verizon, sprint

Examples:
  $ notify "+14155552671" "Hello world"
  $ notify --country GB "07700900123" "UK message"
  $ notify -q "+14155552671" "Silent send"
  $ notify --level high "+14155552671" "High priority"
  $ notify --level critical "+14155552671" "Critical alert"
  $ notify --title "Tripwire: diff in ai-core" "+14155552671" "See /tmp/verify-tripwire-last.txt"
`
  )
  .action(async (phoneNumber: string, message: string, options: { country: string; quiet: boolean; level: string; title?: string }) => {
    // Step 1: Validate phone number
    const phoneResult = validateAndFormatPhone(phoneNumber, options.country);
    if (!phoneResult.success) {
      exitWithError(phoneResult.error);
    }

    // Step 2: Detect provider and load credentials
    const provider = detectProvider();
    let client: SmsClient;

    const level = (options.level || 'normal').toLowerCase();
    if (level !== 'normal' && level !== 'high' && level !== 'critical') {
      exitWithError({
        code: 'INVALID_PHONE',
        message: `Invalid level: ${options.level}. Use "normal", "high", or "critical".`,
        retryable: false,
        guidance: 'Run notify --help for usage examples.',
      });
    }

    if (level === 'critical') {
      process.env.PUSHOVER_PRIORITY = '2';
      process.env.PUSHOVER_RETRY = process.env.PUSHOVER_RETRY || '30';
      process.env.PUSHOVER_EXPIRE = process.env.PUSHOVER_EXPIRE || '600';
      process.env.PUSHOVER_SOUND = process.env.PUSHOVER_SOUND || 'siren';
    } else if (level === 'high') {
      process.env.PUSHOVER_PRIORITY = '1';
      process.env.PUSHOVER_SOUND = process.env.PUSHOVER_SOUND || 'siren';
    } else {
      process.env.PUSHOVER_PRIORITY = '0';
    }

    if (options.title) {
      process.env.PUSHOVER_TITLE = options.title;
    }

    if (provider === 'pushover') {
      const credentialsResult = loadPushoverCredentials();
      if (!credentialsResult.success) {
        exitWithError(credentialsResult.error);
      }
      client = createPushoverSmsClient(credentialsResult.credentials);
    } else if (provider === 'ntfy') {
      const credentialsResult = loadNtfyCredentials();
      if (!credentialsResult.success) {
        exitWithError(credentialsResult.error);
      }
      client = createNtfySmsClient(credentialsResult.credentials);
    } else if (provider === 'twilio') {
      const credentialsResult = loadCredentials();
      if (!credentialsResult.success) {
        exitWithError(credentialsResult.error);
      }
      client = createSmsClient(credentialsResult.credentials);
    } else if (provider === 'email') {
      const credentialsResult = loadEmailCredentials();
      if (!credentialsResult.success) {
        exitWithError(credentialsResult.error);
      }
      client = createEmailSmsClient(credentialsResult.credentials);
    } else {
      exitWithError({
        code: 'MISSING_CONFIG',
        message: 'No SMS provider configured',
        retryable: false,
        guidance: `Please configure a provider:\n\nPushover ($5, reliable):\n  export PUSHOVER_USER="your-user-key"\n  export PUSHOVER_TOKEN="your-api-token"\n\nntfy.sh (free):\n  export NTFY_TOPIC="my-alerts"\n\nTwilio:\n  export TWILIO_ACCOUNT_SID="..."\n  export TWILIO_AUTH_TOKEN="..."\n  export TWILIO_PHONE_NUMBER="..."`,
      });
    }

    // Step 3: Check message segments and warn if multi-part (skip for push notification providers)
    if (provider !== 'ntfy' && provider !== 'pushover') {
      const segmentInfo = calculateSegmentCount(message);
      if (segmentInfo.segmentCount > 1 && !options.quiet) {
        const encodingNote = segmentInfo.encoding === 'UCS-2' 
          ? ' (contains emoji/special characters)' 
          : '';
        console.warn(
          `Warning: Message will be sent as ${segmentInfo.segmentCount} SMS segments${encodingNote} (${segmentInfo.charCount} characters)`
        );
      }
    }

    // Step 4: Send message
    const result = await client.sendSms(phoneResult.phone.e164, message);

    // Step 5: Handle result
    if (!result.success && result.error) {
      exitWithError(result.error);
    }

    // Step 6: Display success message
    if (!options.quiet) {
      console.log(`Message sent to ${result.to} (ID: ${result.messageId})`);
    }

    process.exit(ExitCodes.SUCCESS);
  });

export { program };
