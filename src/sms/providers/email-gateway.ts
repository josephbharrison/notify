// src/sms/providers/email-gateway.ts
// Email-to-SMS gateway provider (bypasses A2P 10DLC requirements)

import nodemailer from 'nodemailer';
import type { SendResult, SendError } from '../types.ts';

/**
 * Carrier email-to-SMS gateways.
 * These allow sending SMS via email without carrier registration requirements.
 */
const CARRIER_GATEWAYS: Record<string, string> = {
  'att': 'txt.att.net',
  'tmobile': 'tmomail.net',
  'verizon': 'vtext.com',
  'sprint': 'messaging.sprintpcs.com',
  'uscellular': 'email.uscc.net',
  'boost': 'sms.myboostmobile.com',
  'cricket': 'sms.cricketwireless.net',
  'metropcs': 'mymetropcs.com',
  'virgin': 'vmobl.com',
};

/**
 * Email credentials for sending via SMTP.
 */
export interface EmailCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  carrier: string;
}

/**
 * Email-to-SMS gateway client.
 */
export class EmailGatewaySmsClient {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private carrierDomain: string;

  constructor(credentials: EmailCredentials) {
    this.transporter = nodemailer.createTransport({
      host: credentials.host,
      port: credentials.port,
      secure: credentials.secure,
      auth: {
        user: credentials.user,
        pass: credentials.pass,
      },
    });
    this.fromEmail = credentials.user;
    
    const domain = CARRIER_GATEWAYS[credentials.carrier.toLowerCase()];
    if (!domain) {
      throw new Error(`Unknown carrier: ${credentials.carrier}. Supported: ${Object.keys(CARRIER_GATEWAYS).join(', ')}`);
    }
    this.carrierDomain = domain;
  }

  /**
   * Send an SMS message via email gateway.
   */
  async sendSms(to: string, body: string): Promise<SendResult> {
    const timestamp = new Date();
    
    // Strip the phone number to just digits
    const phoneDigits = to.replace(/\D/g, '');
    // Remove country code if present (assuming US +1)
    const nationalNumber = phoneDigits.startsWith('1') && phoneDigits.length === 11 
      ? phoneDigits.slice(1) 
      : phoneDigits;
    
    const toEmail = `${nationalNumber}@${this.carrierDomain}`;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: toEmail,
        subject: '', // SMS gateways ignore subject
        text: body,
      });

      return {
        success: true,
        messageId: info.messageId,
        to,
        timestamp,
      };
    } catch (err: unknown) {
      const error = this.mapEmailError(err);
      return {
        success: false,
        to,
        timestamp,
        error,
      };
    }
  }

  /**
   * Map email errors to SendError type.
   */
  private mapEmailError(err: unknown): SendError {
    if (err && typeof err === 'object' && 'code' in err) {
      const nodeError = err as { code: string; message?: string };
      
      if (nodeError.code === 'EAUTH') {
        return {
          code: 'AUTH_FAILED',
          message: 'Email authentication failed',
          retryable: false,
          guidance: 'Your email credentials are invalid. Check EMAIL_USER and EMAIL_PASS in your .env file.',
        };
      }
      
      if (nodeError.code === 'ECONNREFUSED' || nodeError.code === 'ENOTFOUND') {
        return {
          code: 'NETWORK_ERROR',
          message: 'Could not connect to email server',
          retryable: true,
          guidance: 'Check your internet connection and EMAIL_HOST setting.',
        };
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      code: 'PROVIDER_ERROR',
      message: `Email gateway error: ${message}`,
      retryable: false,
      guidance: 'An error occurred while sending via email gateway. Check your email settings.',
    };
  }
}

/**
 * Get list of supported carriers.
 */
export function getSupportedCarriers(): string[] {
  return Object.keys(CARRIER_GATEWAYS);
}
