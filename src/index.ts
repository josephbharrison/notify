#!/usr/bin/env bun
// src/index.ts
// CLI entry point

import { loadConfigFile } from './config/loader.ts';
import { program } from './cli.ts';

// Load config from ~/.config/notify/.env before parsing CLI
loadConfigFile();

// Run the CLI
program.parse(process.argv);
