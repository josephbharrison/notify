#!/usr/bin/env bun
// src/index.ts
// CLI entry point

import { program } from './cli.ts';

// Run the CLI
program.parse(process.argv);
