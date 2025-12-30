# Research: SMS Notify CLI

**Feature Branch**: `001-sms-notify-cli`  
**Date**: 2025-12-30

## Overview

This document captures research findings for the technical decisions required to implement the SMS Notify CLI application.

---

## 1. SMS Provider Selection

### Decision: Twilio SMS API

### Rationale
- **Best-in-class TypeScript SDK**: The `twilio` npm package has native TypeScript support, excellent typing, and is the most widely used SMS SDK in the Node.js ecosystem (122k+ dependents)
- **Simplest onboarding**: Sign up with email, get a phone number instantly, free trial with $15 credit (~1,800 test messages), no credit card required to start
- **CLI-friendly credential management**: Supports `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` environment variables out-of-the-box
- **Minimal code for basic send**: ~5 lines of code for a complete SMS send operation
- **Transparent pricing**: ~$0.011/SMS for US, ~$2.25/month for low-volume use (100 msgs + phone number)

### Alternatives Considered

| Provider | Why Not Primary Choice |
|----------|----------------------|
| **AWS SNS** | Overkill for CLI tool. Requires AWS account, IAM configuration, Pinpoint for phone numbers, and 10DLC registration. Better for applications already in AWS ecosystem. |
| **Vonage** | Viable alternative with slightly lower per-message cost (~$0.0068 vs $0.011). SDK is less mature than Twilio's. Would be second choice if pricing is a concern. |
| **MessageBird** | Good REST API but Node.js SDK is less maintained. Better for European markets. Would require more manual HTTP client code. |

### Implementation Notes
```typescript
// Environment variables
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

// Basic usage
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await client.messages.create({ body, to, from: process.env.TWILIO_PHONE_NUMBER });
```

---

## 2. CLI Framework & Build Tooling

### Decision: Commander.js for CLI parsing, Bun for runtime and compilation

### CLI Parser: Commander.js

**Rationale:**
- Native TypeScript types with optional `@commander-js/extra-typings` for inferred types
- Smallest footprint among full-featured options (~34kB)
- Most mature (27.8k stars, v14.x, actively maintained)
- Complete feature set: subcommands, auto-help, validation
- Wide adoption: Battle-tested in thousands of production CLIs

**Alternatives:**
- `yargs`: Feature-rich but heavier (~130kB)
- `meow`: Minimalist but ESM-only, no subcommands
- `citty`: Modern/minimal but less mature (v0.1.6)

### Build Tool: Bun Compile

**Rationale:**
- Native TypeScript execution (no transpilation step during development)
- Cross-compilation support (`--target` flag for any platform)
- Modern and actively maintained
- Fast bundling (near-instant compilation)
- Full Node.js/npm compatibility
- Produces standalone executable suitable for `/usr/local/bin` installation

**Build command:**
```bash
bun build --compile --minify --target=bun-darwin-arm64 ./src/index.ts --outfile notify
```

**Cross-platform targets:**
- `bun-darwin-arm64` (macOS Apple Silicon)
- `bun-darwin-x64` (macOS Intel)
- `bun-linux-x64` (Linux)
- `bun-linux-arm64` (Linux ARM)
- `bun-windows-x64` (Windows)

**Alternatives:**
- `pkg`: Deprecated (archived Jan 2024), do not use
- `deno compile`: Viable if preferring Deno's security model
- `esbuild + Node SEA`: Official Node.js solution but requires Node 21+

---

## 3. Testing Framework

### Decision: Vitest

### Rationale
- **Native TypeScript**: No transpilation config needed, works out of the box
- **Speed**: Significantly faster than Jest (especially in watch mode)
- **Jest-compatible API**: Same `describe`, `it`, `expect` syntax
- **Built-in mocking**: `vi.mock()`, `vi.spyOn()`, `vi.fn()` for all mocking needs
- **Instant watch mode**: Uses Vite's HMR for near-instant re-runs
- **CLI testing friendly**: Easy to test CLI apps by spawning processes and asserting output

**Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

### Alternatives Considered
- `Jest`: Slower, requires ts-jest configuration, less native TypeScript support

---

## 4. Phone Number Validation

### Decision: libphonenumber-js/min

### Rationale
- **Bundle size**: ~45 kB gzipped (acceptable for CLI tool that loads once at startup)
- **Accuracy**: Sufficient validation via `isPossible()` for SMS use case
- **E.164 support**: Direct formatting via `format('E.164')` - standard format for all SMS providers
- **Country handling**: Built-in support for default country + auto-detection from `+` prefix
- **Maintenance**: Auto-syncs with Google's libphonenumber metadata updates

### Alternatives Considered

| Library | Bundle Size | Why Not Primary |
|---------|-------------|-----------------|
| `google-libphonenumber` | ~580 kB | Too heavy for CLI tool |
| Regex approach | <1 kB | Cannot guarantee valid numbers, no E.164 formatting |

### Implementation Notes
```typescript
import parsePhoneNumber from 'libphonenumber-js/min'

export function validateAndFormatPhone(input: string, defaultCountry?: string) {
  const phone = parsePhoneNumber(input, defaultCountry)
  
  if (!phone || !phone.isPossible()) {
    return { valid: false, error: 'Invalid phone number' }
  }
  
  return {
    valid: true,
    e164: phone.format('E.164'),
    country: phone.country,
  }
}
```

### Edge Cases Handled
- Extensions (strip for SMS)
- Leading zeros (handled by library)
- Multiple input formats (`(213) 373-4253`, `213-373-4253`, `+1-213-373-4253`)
- Invalid length detection
- Non-geographic numbers (reject for SMS)

---

## 5. Final Technology Stack

| Concern | Choice | Version |
|---------|--------|---------|
| Runtime | Bun | Latest |
| Language | TypeScript | 5.x |
| CLI Parser | Commander.js | 14.x |
| SMS Provider | Twilio | Latest |
| Phone Validation | libphonenumber-js | Latest |
| Testing | Vitest | Latest |
| Build | Bun compile | Built-in |

### Dependencies Summary
```json
{
  "dependencies": {
    "commander": "^14.0.0",
    "twilio": "^5.0.0",
    "libphonenumber-js": "^1.11.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0"
  }
}
```
