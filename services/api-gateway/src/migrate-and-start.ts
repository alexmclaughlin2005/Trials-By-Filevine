#!/usr/bin/env node

/**
 * Startup script that runs Prisma migrations before starting the API server
 * This ensures the database schema is up-to-date on every deployment
 */

import { spawn } from 'child_process';
import path from 'path';

// When running from cd services/api-gateway:
// __dirname = /app/services/api-gateway/dist/services/api-gateway/src
// Need to go up 6 levels to reach /app (monorepo root)
const SCHEMA_PATH = path.join(__dirname, '../../../../../packages/database/prisma/schema.prisma');

console.log('=========================================');
console.log('API Gateway Startup');
console.log('=========================================');
console.log('');
console.log('DEBUG: __dirname =', __dirname);
console.log('DEBUG: process.cwd() =', process.cwd());
console.log('');

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    console.log('');

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    // Step 1: Run migrations
    console.log('Step 1: Running database migrations...');
    console.log(`Schema path: ${SCHEMA_PATH}`);
    console.log('');

    await runCommand('npx', ['prisma', 'migrate', 'deploy', `--schema=${SCHEMA_PATH}`]);

    console.log('');
    console.log('✅ Migrations completed successfully!');
    console.log('');

    // Step 2: Start the API server
    console.log('Step 2: Starting API server...');
    console.log('');

    // __dirname is dist/services/api-gateway/src, so index.js is in the same directory
    const serverPath = path.join(__dirname, 'index.js');
    await runCommand('node', [serverPath]);

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

main();
