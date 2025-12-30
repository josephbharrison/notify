# Quickstart: SMS Notify CLI

**Feature Branch**: `001-sms-notify-cli`  
**Date**: 2025-12-30

## Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Twilio account](https://www.twilio.com/try-twilio) (free trial available)

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd notify-sms
bun install
```

### 2. Configure Twilio Credentials

Get your credentials from the [Twilio Console](https://console.twilio.com):
- Account SID (starts with `AC`)
- Auth Token
- Phone Number (from [Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming))

Set environment variables:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_PHONE_NUMBER="+14155551234"
```

Or create a `.env` file in the project root:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155551234
```

### 3. Run in Development Mode

```bash
# Send a test SMS
bun run src/index.ts "+14155552671" "Hello from notify CLI!"

# View help
bun run src/index.ts --help
```

## Build Standalone Binary

### For Your Current Platform

```bash
bun build --compile --minify ./src/index.ts --outfile notify
```

### For Specific Platforms

```bash
# macOS (Apple Silicon)
bun build --compile --minify --target=bun-darwin-arm64 ./src/index.ts --outfile notify-macos-arm64

# macOS (Intel)
bun build --compile --minify --target=bun-darwin-x64 ./src/index.ts --outfile notify-macos-x64

# Linux (x64)
bun build --compile --minify --target=bun-linux-x64 ./src/index.ts --outfile notify-linux-x64

# Linux (ARM)
bun build --compile --minify --target=bun-linux-arm64 ./src/index.ts --outfile notify-linux-arm64
```

## Install to System Path

```bash
# Build for your platform
bun build --compile --minify ./src/index.ts --outfile notify

# Install to /usr/local/bin (may require sudo)
sudo cp notify /usr/local/bin/notify

# Verify installation
notify --version
notify --help
```

## Usage

```bash
# Basic usage
notify "+14155552671" "Hello, World!"

# With national format (assumes US by default)
notify "415-555-2671" "Meeting at 3pm"

# Specify country for national format
notify --country GB "07700900123" "Hello from UK"

# Quiet mode (for scripts)
notify -q "+14155552671" "Alert triggered"
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/unit/validation.test.ts
```

## Project Structure

```
notify-sms/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── cli.ts             # Argument parsing
│   ├── sms/
│   │   ├── types.ts       # Type definitions
│   │   ├── client.ts      # SMS client abstraction
│   │   └── providers/
│   │       └── twilio.ts  # Twilio implementation
│   ├── config/
│   │   └── loader.ts      # Config/env loading
│   └── validation/
│       └── phone.ts       # Phone validation
├── tests/
│   ├── unit/
│   └── integration/
├── specs/                  # Feature specifications
├── package.json
└── tsconfig.json
```

## Troubleshooting

### "Missing credentials" error
Ensure environment variables are set:
```bash
echo $TWILIO_ACCOUNT_SID  # Should print ACxxxx...
echo $TWILIO_AUTH_TOKEN   # Should print a 32-char string
echo $TWILIO_PHONE_NUMBER # Should print +1xxxxxxxxxx
```

### "Invalid phone number" error
Use E.164 format: `+[country code][number]`
- US: `+14155552671`
- UK: `+447700900123`

### "Authentication failed" error
Verify credentials at [Twilio Console](https://console.twilio.com)

### Binary won't run after installation
Check execute permissions:
```bash
chmod +x /usr/local/bin/notify
```
