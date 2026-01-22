import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...\n');

  // Get the first organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Run the main seed first.');
    return;
  }

  // Get the first user
  const user = await prisma.user.findFirst({
    where: { organizationId: org.id },
  });
  if (!user) {
    console.error('❌ No user found. Run the main seed first.');
    return;
  }

  // Create a test case
  console.log('📁 Creating test case...');
  const testCase = await prisma.case.create({
    data: {
      organizationId: org.id,
      name: 'Johnson v. TechCorp Industries',
      caseNumber: '2024-CV-12345',
      caseType: 'civil',
      plaintiffName: 'Maria Johnson',
      defendantName: 'TechCorp Industries Inc.',
      ourSide: 'plaintiff',
      jurisdiction: 'Los Angeles County',
      venue: 'Central District Courthouse',
      trialDate: new Date('2026-03-15'),
      status: 'active',
      createdBy: user.id,
    },
  });
  console.log(`✅ Created case: ${testCase.name}\n`);

  // Create a jury panel
  console.log('👥 Creating jury panel...');
  const panel = await prisma.juryPanel.create({
    data: {
      caseId: testCase.id,
      panelDate: new Date('2026-03-10'),
      source: 'voir_dire',
      status: 'active',
    },
  });
  console.log(`✅ Created panel for case\n`);

  // Create test jurors with diverse profiles
  console.log('⚖️  Creating test jurors...\n');

  const jurors = [
    {
      jurorNumber: '001',
      firstName: 'Robert',
      lastName: 'Martinez',
      age: 52,
      occupation: 'Small Business Owner',
      employer: 'Martinez Construction LLC',
      city: 'Los Angeles',
      zipCode: '90012',
      education: 'High School',
      maritalStatus: 'Married',
      notes: 'Self-employed contractor. Built his business from the ground up. Strong work ethic. Skeptical of large corporations.',
    },
    {
      jurorNumber: '002',
      firstName: 'Jennifer',
      lastName: 'Chen',
      age: 34,
      occupation: 'Software Engineer',
      employer: 'Google',
      city: 'Mountain View',
      zipCode: '94043',
      education: 'Masters Degree',
      maritalStatus: 'Single',
      notes: 'Works in tech industry. Analytical thinker. Values data and evidence. Experience with corporate culture.',
    },
    {
      jurorNumber: '003',
      firstName: 'Margaret',
      lastName: 'O\'Brien',
      age: 67,
      occupation: 'Retired Teacher',
      employer: 'LAUSD (Retired)',
      city: 'Pasadena',
      zipCode: '91101',
      education: 'Bachelors Degree',
      maritalStatus: 'Widowed',
      notes: 'Taught elementary school for 35 years. Patient and fair-minded. Community volunteer. Strong sense of right and wrong.',
    },
    {
      jurorNumber: '004',
      firstName: 'James',
      lastName: 'Thompson',
      age: 29,
      occupation: 'Financial Analyst',
      employer: 'Morgan Stanley',
      city: 'Santa Monica',
      zipCode: '90401',
      education: 'MBA',
      maritalStatus: 'Single',
      notes: 'Works in finance. Detail-oriented. Comfortable with complex data. May favor corporate perspective.',
    },
    {
      jurorNumber: '005',
      firstName: 'Rosa',
      lastName: 'Hernandez',
      age: 41,
      occupation: 'Nurse',
      employer: 'Cedars-Sinai Medical Center',
      city: 'Los Angeles',
      zipCode: '90048',
      education: 'Associates Degree',
      maritalStatus: 'Married',
      notes: 'ICU nurse. Compassionate and empathetic. Sees suffering daily. Strong sense of justice for injured parties.',
    },
    {
      jurorNumber: '006',
      firstName: 'David',
      lastName: 'Kim',
      age: 38,
      occupation: 'Attorney',
      employer: 'Self-Employed',
      city: 'Beverly Hills',
      zipCode: '90210',
      education: 'Juris Doctor',
      maritalStatus: 'Married',
      notes: 'Defense attorney in private practice. Understands legal process. May be sympathetic to defense. Leadership potential.',
    },
    {
      jurorNumber: '007',
      firstName: 'Patricia',
      lastName: 'Williams',
      age: 55,
      occupation: 'Accountant',
      employer: 'Deloitte',
      city: 'Glendale',
      zipCode: '91201',
      education: 'Bachelors Degree',
      maritalStatus: 'Divorced',
      notes: 'Corporate accountant. Risk-averse. Follows rules carefully. Uncomfortable with ambiguity.',
    },
    {
      jurorNumber: '008',
      firstName: 'Michael',
      lastName: 'Brown',
      age: 26,
      occupation: 'Barista',
      employer: 'Starbucks',
      city: 'Hollywood',
      zipCode: '90028',
      education: 'Some College',
      maritalStatus: 'Single',
      notes: 'Service worker. Progressive values. Distrustful of corporations. Empathetic to working people.',
    },
  ];

  for (const jurorData of jurors) {
    const juror = await prisma.juror.create({
      data: {
        panel: {
          connect: { id: panel.id },
        },
        jurorNumber: jurorData.jurorNumber,
        firstName: jurorData.firstName,
        lastName: jurorData.lastName,
        age: jurorData.age,
        occupation: jurorData.occupation,
        employer: jurorData.employer,
        city: jurorData.city,
        zipCode: jurorData.zipCode,
        status: 'active',
        notes: jurorData.notes,
        questionnaireData: {
          education: jurorData.education,
          maritalStatus: jurorData.maritalStatus,
        },
      },
    });
    console.log(`   ✅ Juror ${juror.jurorNumber}: ${juror.firstName} ${juror.lastName} - ${juror.occupation}`);
  }

  console.log('\n🎉 Test data seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 case created: "${testCase.name}"`);
  console.log(`   - 1 jury panel created`);
  console.log(`   - ${jurors.length} jurors created`);
  console.log('\n🧪 Ready to test AI features!');
  console.log(`   1. Navigate to: http://localhost:3000/cases/${testCase.id}`);
  console.log('   2. Click on any juror to classify them');
  console.log('   3. Test the Archetype Classifier with real AI analysis\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
