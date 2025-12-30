# Data Model: SMS Notify CLI

**Feature Branch**: `001-sms-notify-cli`  
**Date**: 2025-12-30

## Overview

This document defines the data entities, types, and validation rules for the SMS Notify CLI application. Since this is a stateless CLI tool, the "data model" focuses on the shapes of data flowing through the application rather than persistent storage.

---

## Core Entities

### 1. PhoneNumber

Represents a validated, normalized phone number ready for SMS delivery.

**Attributes:**
| Field | Type | Description |
|-------|------|-------------|
| `raw` | string | Original input as provided by user |
| `e164` | string | Normalized E.164 format (e.g., `+14155552671`) |
| `country` | string? | Detected ISO 3166-1 alpha-2 country code (e.g., `US`) |

**Validation Rules:**
- Must be parseable by libphonenumber-js
- Must pass `isPossible()` check (valid length for country)
- Must not be a non-geographic number (e.g., `+800`)
- Normalized output always in E.164 format

**State Transitions:**
```
[Raw Input] → validate → [Valid PhoneNumber] | [ValidationError]
```

---

### 2. Message

Represents the SMS message content to be sent.

**Attributes:**
| Field | Type | Description |
|-------|------|-------------|
| `body` | string | The text content of the SMS |
| `segmentCount` | number | Estimated number of SMS segments (calculated) |
| `encoding` | 'GSM-7' \| 'UCS-2' | Character encoding based on content |

**Validation Rules:**
- Must not be empty
- No maximum length enforced (SMS provider handles segmentation)
- Warn user if message exceeds 160 characters (GSM-7) or 70 characters (UCS-2/emoji)

**Segment Calculation:**
- GSM-7 encoding: 160 chars/segment (or 153 for multi-part)
- UCS-2 encoding (emoji/unicode): 70 chars/segment (or 67 for multi-part)

---

### 3. Credentials

Configuration for authenticating with the SMS provider.

**Attributes:**
| Field | Type | Description |
|-------|------|-------------|
| `accountSid` | string | Twilio Account SID |
| `authToken` | string | Twilio Auth Token |
| `fromNumber` | string | Sender phone number (Twilio-owned) |

**Source Priority:**
1. Environment variables (recommended):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
2. Config file (optional): `~/.notify/config.json`

**Validation Rules:**
- Account SID must start with `AC` and be 34 characters
- Auth Token must be 32 characters
- From number must be valid E.164 format

---

### 4. SendResult

Represents the outcome of an SMS send operation.

**Attributes:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the message was accepted for delivery |
| `messageId` | string? | Provider's message identifier (on success) |
| `to` | string | Destination phone number (E.164) |
| `timestamp` | Date | When the request was made |
| `error` | SendError? | Error details (on failure) |

---

### 5. SendError

Represents a failure during the SMS send operation.

**Attributes:**
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Error code category |
| `message` | string | User-friendly error message |
| `retryable` | boolean | Whether the operation can be retried |
| `guidance` | string | Actionable steps for the user |

**Error Codes:**
| Code | Meaning | Retryable | Guidance |
|------|---------|-----------|----------|
| `INVALID_PHONE` | Phone number validation failed | No | Check phone number format |
| `MISSING_CONFIG` | Credentials not configured | No | Set environment variables |
| `AUTH_FAILED` | Invalid credentials | No | Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN |
| `NETWORK_ERROR` | Connection failed | Yes | Check internet connection and retry |
| `PROVIDER_ERROR` | SMS provider returned error | Maybe | See provider message |
| `RATE_LIMITED` | Too many requests | Yes | Wait and retry |

---

## Type Definitions (TypeScript)

```typescript
// src/sms/types.ts

export interface PhoneNumber {
  raw: string;
  e164: string;
  country?: string;
}

export interface Message {
  body: string;
  segmentCount: number;
  encoding: 'GSM-7' | 'UCS-2';
}

export interface Credentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  to: string;
  timestamp: Date;
  error?: SendError;
}

export interface SendError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  guidance: string;
}

export type ErrorCode = 
  | 'INVALID_PHONE'
  | 'MISSING_CONFIG'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'RATE_LIMITED';
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Input                               │
│                  notify <phone> <message>                        │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
                  ▼                           ▼
         ┌───────────────┐           ┌───────────────┐
         │ PhoneNumber   │           │   Message     │
         │  Validation   │           │  Processing   │
         └───────┬───────┘           └───────┬───────┘
                 │                           │
                 │ Valid PhoneNumber         │ Message
                 │ (E.164)                   │ (with segments)
                 ▼                           ▼
         ┌─────────────────────────────────────────┐
         │              Credentials                 │
         │         (from environment)               │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │            SMS Client                    │
         │         (Twilio SDK)                     │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │            SendResult                    │
         │    (success/failure with details)        │
         └─────────────────────────────────────────┘
```
