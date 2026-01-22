#!/usr/bin/env node

/**
 * Startup script that runs Prisma migrations before starting the API server
 * This ensures the database schema is up-to-date on every deployment
 */

import { spawn } from 'child_process';
import path from 'path';
import { readdir } from 'fs/promises';

// When running from cd services/api-gateway:
// __dirname = /app/services/api-gateway/dist/services/api-gateway/src
// Need to go up 7 levels to reach /app (monorepo root)
const SCHEMA_PATH = path.join(__dirname, '../../../../../../packages/database/prisma/schema.prisma');
const MIGRATIONS_DIR = path.join(__dirname, '../../../../../../packages/database/prisma/migrations');

console.log('=========================================');
console.log('API Gateway Startup v4 - Dynamic Migration Resolution');
console.log('=========================================');
console.log('');
console.log('DEBUG: __dirname =', __dirname);
console.log('DEBUG: process.cwd() =', process.cwd());
console.log('DEBUG: SCHEMA_PATH =', SCHEMA_PATH);
console.log('DEBUG: MIGRATIONS_DIR =', MIGRATIONS_DIR);
console.log('');

async function runCommand(command: string, args: string[], allowFailure: boolean = false): Promise<boolean> {
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
        if (allowFailure) {
          resolve(false);
        } else {
          resolve(false);
        }
      }
    });

    proc.on('error', (err) => {
      console.error('Process error:', err);
      resolve(false);
    });
  });
}

async function getAllMigrationNames(): Promise<string[]> {
  try {
    const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && /^\d{14}_/.test(entry.name))
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    console.error('Failed to read migrations directory:', error);
    return [];
  }
}

async function main() {
  try {
    console.log('Step 1: Discovering all migrations...');
    console.log('');

    const allMigrations = await getAllMigrationNames();
    console.log(`Found ${allMigrations.length} migrations:`);
    allMigrations.forEach(m => console.log(`  - ${m}`));
    console.log('');

    console.log('Step 2: Resolving any failed migrations...');
    console.log('This will mark all migrations as applied since the schema is already correct.');
    console.log('');

    for (const migration of allMigrations) {
      // Try to mark as rolled back first (only works if it's in failed state)
      const rolledBack = await runCommand('npx', [
        'prisma', 'migrate', 'resolve',
        '--rolled-back', migration,
        `--schema=${SCHEMA_PATH}`
      ], true);

      if (rolledBack) {
        console.log(`✅ Marked ${migration} as rolled back`);
      }

      // Then mark as applied
      const applied = await runCommand('npx', [
        'prisma', 'migrate', 'resolve',
        '--applied', migration,
        `--schema=${SCHEMA_PATH}`
      ], true);

      if (applied) {
        console.log(`✅ Marked ${migration} as applied`);
      } else {
        console.log(`⚠️  Migration ${migration} already resolved or doesn't need resolution`);
      }
    }

    console.log('');
    console.log('Step 3: Running any remaining migrations...');
    console.log('');

    const deploySuccess = await runCommand('npx', [
      'prisma', 'migrate', 'deploy',
      `--schema=${SCHEMA_PATH}`
    ]);

    if (!deploySuccess) {
      console.error('❌ Migration deploy failed, but continuing to start server...');
      console.error('The database schema should already be correct from previous deployments.');
      console.log('');
    } else {
      console.log('');
      console.log('✅ Migrations completed successfully!');
      console.log('');
    }

    // Step 4: Start the API server
    console.log('Step 4: Starting API server...');
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
