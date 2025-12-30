#!/usr/bin/env bun
// scripts/postbuild.ts
// Post-build script to initialize config directory

import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const configDir = join(homedir(), '.config', 'notify');
const configPath = join(configDir, '.env');
const examplePath = join(import.meta.dir, '..', '.env.example');

// Create directory if needed
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
  console.log(`Created config directory: ${configDir}`);
}

// Copy example if config doesn't exist
if (!existsSync(configPath)) {
  if (existsSync(examplePath)) {
    copyFileSync(examplePath, configPath);
    console.log(`Created config file: ${configPath}`);
    console.log(`\nEdit this file to configure your notification provider:`);
    console.log(`  ${configPath}`);
  } else {
    console.log(`Warning: .env.example not found at ${examplePath}`);
  }
} else {
  console.log(`Config file already exists: ${configPath}`);
}
