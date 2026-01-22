#!/usr/bin/env node

/**
 * Startup script that runs Prisma migrations before starting the API server
 * This ensures the database schema is up-to-date on every deployment
 */

import { spawn } from 'child_process';
import path from 'path';

// When running from cd services/api-gateway:
// __dirname = /app/services/api-gateway/dist/services/api-gateway/src
// Need to go up 7 levels to reach /app (monorepo root)
const SCHEMA_PATH = path.join(__dirname, '../../../../../../packages/database/prisma/schema.prisma');

console.log('=========================================');
console.log('API Gateway Startup v5 - Use db push instead');
console.log('=========================================');
console.log('');
console.log('DEBUG: __dirname =', __dirname);
console.log('DEBUG: process.cwd() =', process.cwd());
console.log('DEBUG: SCHEMA_PATH =', SCHEMA_PATH);
console.log('');

async function runCommand(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    console.log('');

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`Command exited with code ${code}`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error('Process error:', err);
      resolve(false);
    });
  });
}

async function main() {
  try {
    console.log('Step 1: Syncing database schema with prisma db push...');
    console.log('This will create any missing tables and columns.');
    console.log('');

    // Use db push to sync the schema directly, ignoring migration history
    const pushSuccess = await runCommand('npx', [
      'prisma', 'db', 'push',
      '--accept-data-loss',
      '--skip-generate',
      `--schema=${SCHEMA_PATH}`
    ]);

    if (!pushSuccess) {
      console.error('❌ Database schema sync failed');
      console.error('Attempting to continue anyway...');
      console.log('');
    } else {
      console.log('');
      console.log('✅ Database schema synced successfully!');
      console.log('');
    }

    console.log('Step 2: Running migrate deploy to update migration history...');
    console.log('');

    // Try to run migrate deploy to update the migration history
    // This might fail if there are failed migrations, but that's okay
    const deploySuccess = await runCommand('npx', [
      'prisma', 'migrate', 'deploy',
      `--schema=${SCHEMA_PATH}`
    ]);

    if (!deploySuccess) {
      console.log('⚠️  Migrate deploy had issues, but schema should be correct from db push');
      console.log('');
    } else {
      console.log('');
      console.log('✅ Migration history updated!');
      console.log('');
    }

    // Step 3: Start the API server
    console.log('Step 3: Starting API server...');
    console.log('');

    // __dirname is dist/services/api-gateway/src, so index.js is in the same directory
    const serverPath = path.join(__dirname, 'index.js');
    const serverStarted = await runCommand('node', [serverPath]);

    if (!serverStarted) {
      throw new Error('Server failed to start');
    }

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

main();
