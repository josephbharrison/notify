# notify

A simple CLI to send push notifications to your phone. Supports multiple providers with automatic fallback.

```bash
notify "+1234567890" "Your message here"
```

## Why?

Sending notifications to yourself should be simple. But:

- **Twilio** requires A2P 10DLC registration ($25+ and 1-7 day approval)
- **Email-to-SMS gateways** are blocked by most carriers
- **ntfy.sh** doesn't have real push notifications on iOS
- **Pushover** works reliably for $5 one-time.

> Fortunately, this CLI supports all four options, so you can use what works for you.

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/josephbharrison/notify.git
cd notify

# Install dependencies
bun install

# Build the binary
bun run build

# Symlink to your PATH
sudo ln -sf "$(pwd)/notify" /usr/local/bin/notify

# Verify installation
notify --version
```

## Configuration

The CLI loads configuration from `~/.config/notify/.env`. This file is created automatically during build with example content.

```bash
# Edit your config
nano ~/.config/notify/.env
```

Configure ONE provider (see below for options). The CLI auto-detects which provider to use based on which environment variables are set.

### Option 1: Pushover (Recommended)

**Cost:** $5 one-time per platform | **Reliability:** Excellent | **Setup:** 5 minutes

1. Download the app: [iOS](https://apps.apple.com/app/pushover/id506088175) / [Android](https://play.google.com/store/apps/details?id=net.superblock.pushover)
2. Create account at [pushover.net](https://pushover.net)
3. Copy your **User Key** from the dashboard
4. Create an Application at [pushover.net/apps/build](https://pushover.net/apps/build)
5. Copy the **API Token/Key**
6. Add to `~/.config/notify/.env`:

```env
PUSHOVER_USER=your-user-key
PUSHOVER_TOKEN=your-api-token
```

### Option 2: ntfy.sh (Free)

**Cost:** Free | **Reliability:** Good (Android), Limited (iOS*) | **Setup:** 2 minutes

*iOS uses polling, not real push - you must have the app open to receive notifications.

1. Download the app: [iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
2. Subscribe to a unique topic (e.g., `my-alerts-xyz123`)
3. Add to `~/.config/notify/.env`:

```env
NTFY_TOPIC=my-alerts-xyz123
```

### Option 3: Twilio (SMS)

**Cost:** ~$25 to start | **Reliability:** Excellent | **Setup:** 1-7 days

Requires A2P 10DLC registration for US numbers. Trial accounts cannot complete registration.

1. Create account at [twilio.com](https://www.twilio.com/try-twilio)
2. Upgrade to paid account ($20 minimum)
3. Buy a phone number (~$1.15/month)
4. Complete A2P 10DLC registration (Sole Proprietor: ~$5.50)
5. Wait for approval (1-7 days)
6. Add to `~/.config/notify/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155551234
```

### Option 4: Email-to-SMS Gateway (Unreliable)

**Cost:** Free | **Reliability:** Poor | **Setup:** 5 minutes

Many carriers block these messages (especially AT&T). Requires knowing recipient's carrier.

1. Generate a Gmail App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Add to `~/.config/notify/.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SMS_CARRIER=att
```

Supported carriers: `att`, `tmobile`, `verizon`, `sprint`, `uscellular`, `boost`, `cricket`, `metropcs`, `virgin`

## Usage

```bash
# Send a notification
notify "+14155551234" "Hello world!"

# Use national format (assumes US)
notify "415-555-1234" "Meeting in 5 minutes"

# Specify country for national format
notify --country GB "07700900123" "Hello from UK"

# Quiet mode (for scripts)
notify -q "+14155551234" "Alert triggered" && echo "Sent!"

# Show help
notify --help

# Show version
notify --version
```

## Provider Comparison

| Provider | Cost | Reliability | iOS Push | Setup Time |
|----------|------|-------------|----------|------------|
| **Pushover** | $5 one-time | Excellent | Yes | 5 minutes |
| ntfy.sh | Free | Good | No* | 2 minutes |
| Twilio | ~$25+ | Excellent | N/A (SMS) | 1-7 days |
| Email Gateway | Free | Poor | N/A (SMS) | 5 minutes |

*ntfy.sh on iOS requires the app to be open to receive notifications.

**Recommendation:** Use Pushover. The $5 is worth it.

## Development

```bash
# Run in development mode
bun run src/index.ts "+1234567890" "Test message"

# Run tests
bun test

# Build standalone binary
bun run build

# Build for specific platforms
bun run build:mac-arm64    # macOS Apple Silicon
bun run build:mac-x64      # macOS Intel
bun run build:linux-x64    # Linux x64
bun run build:linux-arm64  # Linux ARM64
```

## License

MIT License - see [LICENSE](LICENSE) for details.
