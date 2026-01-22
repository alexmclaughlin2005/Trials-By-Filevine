/**
 * Clear all candidates for Michael Brown test juror
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCandidates() {
  console.log('🧹 Clearing candidates for test juror...');

  // Find Michael Brown juror
  const juror = await prisma.juror.findFirst({
    where: {
      firstName: 'Michael',
      lastName: 'Brown',
      jurorNumber: '999',
    },
  });

  if (!juror) {
    console.log('❌ Test juror not found');
    process.exit(1);
  }

  // Delete candidates
  const deleted = await prisma.candidate.deleteMany({
    where: { jurorId: juror.id },
  });

  console.log(`✓ Deleted ${deleted.count} candidates`);

  // Delete search jobs
  const deletedJobs = await prisma.searchJob.deleteMany({
    where: { jurorId: juror.id },
  });

  console.log(`✓ Deleted ${deletedJobs.count} search jobs`);

  // Reset search timestamps
  await prisma.juror.update({
    where: { id: juror.id },
    data: {
      searchStartedAt: null,
      searchCompletedAt: null,
    },
  });

  console.log('✅ Test juror is ready for a fresh search!');
}

async function main() {
  try {
    await clearCandidates();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
