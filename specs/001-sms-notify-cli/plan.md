# Implementation Plan: SMS Notify CLI

**Branch**: `001-sms-notify-cli` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sms-notify-cli/spec.md`

## Summary

Build a TypeScript CLI application that sends SMS messages via a third-party SMS service. The CLI accepts a phone number and message as arguments, authenticates with the SMS service using configured credentials, and provides clear success/error feedback. The compiled application will be installable as a single executable at `/usr/local/bin/notify`.

## Technical Context

**Language/Version**: TypeScript 5.x on Bun runtime (compiled to standalone executable via `bun compile`)
**Primary Dependencies**: Commander.js (CLI parsing), Twilio SDK (SMS delivery), libphonenumber-js (phone validation)
**Storage**: N/A (credentials via environment variables)
**Testing**: Vitest
**Target Platform**: macOS/Linux CLI (standalone binary for /usr/local/bin installation)
**Project Type**: Single CLI application
**Performance Goals**: Message send under 5 seconds (per SC-001, excluding network latency)
**Constraints**: Single-file binary distribution, clear error messages (no stack traces)
**Scale/Scope**: Single-user CLI tool

**Research**: See [research.md](./research.md) for decision rationale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Design Status**: PASS (No specific constraints defined)

**Post-Design Status**: PASS

The project constitution is a template without defined constraints. This implementation follows general best practices:
- Single standalone application (simplest structure)
- CLI interface with stdin/args input, stdout/stderr output
- Testable components with Vitest
- Clear documentation (quickstart.md, CLI interface contract)
- Standard error handling patterns (exit codes, stderr for errors)
- Environment-based configuration (no secrets in code)

## Project Structure

### Documentation (this feature)

```text
specs/001-sms-notify-cli/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts for CLI)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── index.ts             # CLI entry point
├── cli.ts               # Argument parsing and help
├── sms/
│   ├── types.ts         # SMS-related type definitions
│   ├── client.ts        # SMS service client abstraction
│   └── providers/       # Provider-specific implementations
│       └── twilio.ts    # Twilio implementation (or chosen provider)
├── config/
│   └── loader.ts        # Environment variable / config loading
└── validation/
    └── phone.ts         # Phone number validation and normalization

tests/
├── unit/
│   ├── cli.test.ts
│   ├── validation.test.ts
│   └── config.test.ts
└── integration/
    └── sms.test.ts      # Integration tests with mocked SMS service
```

**Structure Decision**: Single project structure with clear separation of concerns. The `src/sms/providers/` directory allows for multiple SMS provider support in future while starting with one.

## Complexity Tracking

> No violations - using simplest viable structure for a CLI tool.
