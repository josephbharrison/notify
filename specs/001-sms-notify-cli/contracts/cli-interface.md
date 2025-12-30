# CLI Interface Contract: notify

**Feature Branch**: `001-sms-notify-cli`  
**Date**: 2025-12-30

## Overview

This document defines the CLI interface contract for the `notify` command. Since this is a CLI application (not a web API), the "contract" is the command-line interface specification.

---

## Command Signature

```
notify <phone_number> <message> [options]
```

## Positional Arguments

| Position | Name | Required | Description |
|----------|------|----------|-------------|
| 1 | `phone_number` | Yes | Destination phone number (E.164 or national format) |
| 2 | `message` | Yes | SMS message text (quote if contains spaces) |

## Options

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--help` | `-h` | boolean | false | Display usage information |
| `--version` | `-V` | boolean | false | Display version number |
| `--country` | `-c` | string | `US` | Default country code for national numbers |
| `--quiet` | `-q` | boolean | false | Suppress success output (errors still shown) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Yes | Sender phone number (E.164 format) |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success - message sent |
| `1` | General error |
| `2` | Invalid arguments / usage error |
| `3` | Configuration error (missing credentials) |
| `4` | Validation error (invalid phone number) |
| `5` | Network / provider error |

## Output Specification

### Success Output (stdout)

```
Message sent to +14155552671 (ID: SM1234567890abcdef)
```

With `--quiet`:
```
(no output)
```

### Error Output (stderr)

```
Error: <error message>

<guidance text>
```

Example:
```
Error: Invalid phone number format

The phone number "abc123" could not be parsed. Please provide a valid phone number in E.164 format (e.g., +14155552671) or national format with --country flag.
```

---

## Usage Examples

### Basic Usage
```bash
# Send SMS with international number
notify "+14155552671" "Hello, this is a test message"

# Send SMS with national format (assumes US)
notify "415-555-2671" "Meeting at 3pm"

# Send SMS with explicit country
notify --country GB "07700900123" "Hello from the UK"
```

### Help and Version
```bash
# Show help
notify --help

# Show version
notify --version
```

### Quiet Mode
```bash
# Suppress success output (for scripting)
notify -q "+14155552671" "Alert triggered" && echo "Sent"
```

---

## Help Output

```
Usage: notify [options] <phone_number> <message>

Send an SMS message to a phone number

Arguments:
  phone_number           Destination phone number (E.164 or national format)
  message                SMS message text

Options:
  -c, --country <code>   Default country for national numbers (default: "US")
  -q, --quiet            Suppress success output
  -V, --version          Display version number
  -h, --help             Display help information

Environment Variables:
  TWILIO_ACCOUNT_SID     Twilio Account SID (required)
  TWILIO_AUTH_TOKEN      Twilio Auth Token (required)
  TWILIO_PHONE_NUMBER    Sender phone number (required)

Examples:
  notify "+14155552671" "Hello world"
  notify --country GB "07700900123" "UK message"
```
