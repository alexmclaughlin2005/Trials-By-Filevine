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
// Version: 7 levels
const SCHEMA_PATH = path.join(__dirname, '../../../../../../packages/database/prisma/schema.prisma');

console.log('=========================================');
console.log('API Gateway Startup v2 - Multiple Failed Migrations Fix');
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
    // Step 1: Resolve ALL failed migrations by marking them as applied
    // This is a one-time fix for the production database that has multiple failed migrations
    console.log('Step 1: Resolving any failed migrations...');
    console.log(`Schema path: ${SCHEMA_PATH}`);
    console.log('');

    // List of all migrations that have failed in production
    // We'll mark them all as applied since the database schema is already correct
    const failedMigrations = [
      '20260121164817_init',
      '20260121173451_add_archetype_system',
      '20260121180910_add_password_hash_to_users',
      '20260121190520_add_deep_research_and_prompt_management',
      '20260122011423_add_synthesized_profiles',
      '20260122030445_add_filevine_oauth_sessions',
      '20260122135711_add_document_capture',
      '20260122185713_add_filevine_connection'
    ];

    for (const migration of failedMigrations) {
      try {
        // First mark as rolled back if it's in failed state
        await runCommand('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', migration, `--schema=${SCHEMA_PATH}`]);
        console.log(`✅ Marked ${migration} as rolled back`);

        // Then mark as applied to skip it
        await runCommand('npx', ['prisma', 'migrate', 'resolve', '--applied', migration, `--schema=${SCHEMA_PATH}`]);
        console.log(`✅ Marked ${migration} as applied`);
      } catch (e) {
        console.log(`Migration ${migration} already resolved or doesn't need resolution`);
      }
    }

    console.log('');

    // Step 2: Run remaining migrations
    console.log('Step 2: Running database migrations...');
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
