# Tasks: SMS Notify CLI

**Input**: Design documents from `/specs/001-sms-notify-cli/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/cli-interface.md, research.md

**Tests**: Not explicitly requested in spec - test tasks omitted. Tests can be added later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure per implementation plan (src/, tests/)
- [x] T002 Initialize Bun project with package.json and TypeScript dependencies
- [x] T003 [P] Create tsconfig.json with strict TypeScript configuration
- [x] T004 [P] Create vitest.config.ts for test framework setup
- [x] T005 [P] Add .gitignore for node_modules, dist, .env files
- [x] T006 Install runtime dependencies: commander, twilio, libphonenumber-js in package.json
- [x] T007 [P] Create .env.example with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER placeholders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define all TypeScript types and interfaces in src/sms/types.ts (PhoneNumber, Message, Credentials, SendResult, SendError, ErrorCode)
- [x] T009 [P] Create config loader skeleton with environment variable reading in src/config/loader.ts
- [x] T010 [P] Create phone validation skeleton with parsePhoneNumber import in src/validation/phone.ts
- [x] T011 Create CLI skeleton with Commander.js program definition in src/cli.ts
- [x] T012 Create entry point that imports and runs CLI in src/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Send SMS Message (Priority: P1) 🎯 MVP

**Goal**: User can send an SMS message to a phone number using `notify <phone> <message>`

**Independent Test**: Run `notify +15551234567 "Hello test"` with valid Twilio credentials and confirm message is received

### Implementation for User Story 1

- [x] T013 [US1] Implement phone number validation with E.164 formatting in src/validation/phone.ts (validateAndFormatPhone function)
- [x] T014 [US1] Implement credential loading from environment variables in src/config/loader.ts (loadCredentials function with validation)
- [x] T015 [US1] Create SMS client interface and factory function in src/sms/client.ts
- [x] T016 [US1] Implement Twilio provider with sendSms method in src/sms/providers/twilio.ts
- [x] T017 [US1] Wire up CLI positional arguments (phone_number, message) in src/cli.ts using Commander.js
- [x] T018 [US1] Implement send command action: validate phone, load config, call SMS client, display success in src/cli.ts
- [x] T019 [US1] Add success output formatting per CLI contract: "Message sent to +X (ID: SMxxxx)" in src/cli.ts

**Checkpoint**: At this point, `notify <phone> <message>` should successfully send an SMS

---

## Phase 4: User Story 2 - Receive Clear Error Feedback (Priority: P2)

**Goal**: User receives clear, actionable error messages for all failure scenarios

**Independent Test**: Run `notify` with missing args, invalid phone, missing credentials and verify helpful error messages on stderr

### Implementation for User Story 2

- [x] T020 [US2] Create error factory functions for all ErrorCode types in src/sms/types.ts (createSendError helper)
- [x] T021 [US2] Add credential validation errors with guidance text in src/config/loader.ts (MISSING_CONFIG, AUTH_FAILED)
- [x] T022 [US2] Add phone validation error with format guidance in src/validation/phone.ts (INVALID_PHONE)
- [x] T023 [US2] Implement error formatting for stderr output in src/cli.ts (formatError function: "Error: X\n\n<guidance>")
- [x] T024 [US2] Add try-catch wrapper in CLI action with proper error handling in src/cli.ts
- [x] T025 [US2] Implement exit codes per CLI contract (0=success, 2=args, 3=config, 4=validation, 5=network) in src/cli.ts
- [x] T026 [US2] Add network/provider error handling with retryable guidance in src/sms/providers/twilio.ts (NETWORK_ERROR, PROVIDER_ERROR)
- [x] T027 [US2] Handle missing arguments with usage display in src/cli.ts (Commander.js automatic + custom message)

**Checkpoint**: All error scenarios produce user-friendly messages with guidance

---

## Phase 5: User Story 3 - Install and Configure the CLI (Priority: P3)

**Goal**: User can install the CLI binary and understand usage via --help and --version

**Independent Test**: Build binary, copy to /usr/local/bin, run `notify --help` and `notify --version`

### Implementation for User Story 3

- [x] T028 [US3] Implement --help with full usage info per CLI contract in src/cli.ts (description, examples, env vars section)
- [x] T029 [US3] Implement --version flag reading from package.json in src/cli.ts
- [x] T030 [US3] Add --country option with default "US" for national number parsing in src/cli.ts
- [x] T031 [US3] Add --quiet option to suppress success output in src/cli.ts
- [x] T032 [US3] Create build script in package.json: `bun build --compile --minify ./src/index.ts --outfile notify`
- [x] T033 [US3] Add cross-platform build scripts for darwin-arm64, darwin-x64, linux-x64, linux-arm64 in package.json

**Checkpoint**: Binary builds successfully, --help and --version work, installable to /usr/local/bin

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T034 [P] Add message segment count warning for messages >160 chars in src/cli.ts
- [x] T035 [P] Add segment encoding detection (GSM-7 vs UCS-2 for emoji) in src/sms/types.ts or src/cli.ts
- [x] T036 Validate quickstart.md instructions by running through setup flow manually
- [x] T037 [P] Add input sanitization for phone number (strip spaces, dashes, parentheses) in src/validation/phone.ts
- [x] T038 Final code cleanup and unused import removal across src/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends error handling started in US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

- Config and validation before CLI wiring
- SMS client before CLI send action
- Core functionality before options/flags
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 Setup (3 parallel tasks):**
- T003, T004, T005, T007 can all run in parallel

**Phase 2 Foundational (2 parallel tasks):**
- T009 and T010 can run in parallel after T008

**User Story 1:**
- T013 and T014 can run in parallel (validation and config)
- T015 and T016 are sequential (interface then implementation)

**User Story 2:**
- T021 and T022 can run in parallel (different error types)

**Polish:**
- T034, T035, T037 can all run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# After T001-T002 complete, launch these in parallel:
Task: "Create tsconfig.json with strict TypeScript configuration"
Task: "Create vitest.config.ts for test framework setup"
Task: "Add .gitignore for node_modules, dist, .env files"
Task: "Create .env.example with TWILIO_* placeholders"
```

## Parallel Example: User Story 1 Start

```bash
# After Phase 2 Foundational, launch these in parallel:
Task: "Implement phone number validation with E.164 formatting in src/validation/phone.ts"
Task: "Implement credential loading from environment variables in src/config/loader.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (7 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (7 tasks)
4. **STOP and VALIDATE**: Test sending an SMS works
5. Deploy/demo if ready - this is a functional MVP!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (12 tasks)
2. Add User Story 1 → Test independently → **MVP!** (19 tasks total)
3. Add User Story 2 → Better error handling (27 tasks total)
4. Add User Story 3 → Full CLI experience with --help, --version, build (33 tasks total)
5. Add Polish → Production-ready (38 tasks total)

### Suggested Implementation Order (Single Developer)

| Order | Phase | Tasks | Cumulative | Milestone |
|-------|-------|-------|------------|-----------|
| 1 | Setup | T001-T007 | 7 | Project scaffolded |
| 2 | Foundational | T008-T012 | 12 | Skeleton ready |
| 3 | US1 | T013-T019 | 19 | **MVP: Can send SMS** |
| 4 | US2 | T020-T027 | 27 | Error handling complete |
| 5 | US3 | T028-T033 | 33 | --help, --version, build |
| 6 | Polish | T034-T038 | 38 | Production-ready |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at US1 checkpoint for MVP demonstration
- No test tasks included - add `tests/unit/*.test.ts` and `tests/integration/*.test.ts` if TDD requested
