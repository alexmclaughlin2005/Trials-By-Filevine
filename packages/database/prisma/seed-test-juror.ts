/**
 * Create a test juror that matches seeded data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestJuror() {
  console.log('🧪 Creating test juror...');

  // Get the first case
  const firstCase = await prisma.case.findFirst({
    include: {
      juryPanels: true,
    },
  });

  if (!firstCase) {
    console.error('❌ No case found. Please create a case first.');
    process.exit(1);
  }

  // Get or create a jury panel
  let panel = firstCase.juryPanels[0];
  if (!panel) {
    panel = await prisma.juryPanel.create({
      data: {
        caseId: firstCase.id,
        panelNumber: 1,
        venueLocation: 'Los Angeles Superior Court',
        date: new Date(),
      },
    });
    console.log('✓ Created jury panel');
  }

  // Create test juror that matches our seeded data
  const testJuror = await prisma.juror.create({
    data: {
      panelId: panel.id,
      jurorNumber: '999',
      firstName: 'Michael',
      lastName: 'Brown',
      age: 26,
      city: 'Hollywood',
      zipCode: '90028',
      occupation: 'Barista',
      employer: 'Starbucks',
      status: 'available',
    },
  });

  console.log('✅ Test juror created successfully!');
  console.log(`   Name: ${testJuror.firstName} ${testJuror.lastName}`);
  console.log(`   Age: ${testJuror.age}`);
  console.log(`   City: ${testJuror.city}`);
  console.log(`   Juror ID: ${testJuror.id}`);
  console.log('');
  console.log('🔍 This juror should match:');
  console.log('   - Mock data: Michael Brown (Barista)');
  console.log('   - Voter records: Michael Brown (age 28)');
  console.log('');
  console.log(`Navigate to: http://localhost:3000/jurors/${testJuror.id}`);
}

async function main() {
  try {
    await createTestJuror();
  } catch (error) {
    console.error('❌ Error creating test juror:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
