/**
 * Combined Juror Research Data Seeder
 *
 * Runs all juror research data seeders:
 * - Voter records
 * - FEC donations
 */

import { execSync } from 'child_process';

async function runSeeder(script: string, description: string) {
  console.log(`\n📦 Running: ${description}`);
  console.log('━'.repeat(60));

  try {
    execSync(`tsx ${script}`, {
      stdio: 'inherit',
      cwd: __dirname,
    });
  } catch (error) {
    console.error(`\n❌ Failed to run ${description}`);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 Seeding Juror Research Data');
  console.log('═'.repeat(60));

  try {
    await runSeeder(
      './seed-voter-records.ts',
      'Voter Records Seeder'
    );

    await runSeeder(
      './seed-fec-donations.ts',
      'FEC Donations Seeder'
    );

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All juror research data seeded successfully!');
    console.log('═'.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
