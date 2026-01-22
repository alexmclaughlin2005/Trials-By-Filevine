import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample organization
  const org = await prisma.organization.upsert({
    where: { slug: 'sample-law-firm' },
    update: {},
    create: {
      name: 'Sample Law Firm',
      slug: 'sample-law-firm',
      subscriptionTier: 'pro',
      settings: {
        retentionDays: 365,
        enabledFeatures: ['research', 'focus_groups', 'trial_mode'],
      },
    },
  });
  console.log('✅ Created organization:', org.name);

  // Hash default password for demo users
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Create sample users
  const attorney = await prisma.user.upsert({
    where: { email: 'attorney@example.com' },
    update: {},
    create: {
      email: 'attorney@example.com',
      name: 'John Attorney',
      role: 'attorney',
      organizationId: org.id,
      passwordHash: defaultPasswordHash,
      authProviderId: 'auth0|sample-attorney',
    },
  });

  const paralegal = await prisma.user.upsert({
    where: { email: 'paralegal@example.com' },
    update: {},
    create: {
      email: 'paralegal@example.com',
      name: 'Sarah Paralegal',
      role: 'paralegal',
      organizationId: org.id,
      passwordHash: defaultPasswordHash,
      authProviderId: 'auth0|sample-paralegal',
    },
  });
  console.log('✅ Created users:', attorney.name, paralegal.name);

  // Create system personas
  const personas = [
    {
      name: 'Tech Pragmatist',
      description: 'Analytical thinker with technical background, values data and logic over emotion',
      sourceType: 'system',
      attributes: {
        decisionStyle: 'analytical',
        valueSystem: 'rationalist',
        communicationPreference: 'direct',
      },
      signals: {
        occupations: ['engineer', 'software developer', 'data analyst', 'scientist'],
        education: ['STEM degrees', 'technical certifications'],
        indicators: ['values evidence', 'asks for data', 'skeptical of emotion'],
      },
      persuasionLevers: {
        effective: ['Data-driven arguments', 'Expert testimony', 'Technical explanations'],
        ineffective: ['Emotional appeals', 'Anecdotes without data', 'Authority without evidence'],
      },
      pitfalls: ['Overly complex arguments', 'Appeals to emotion', 'Lack of concrete evidence'],
    },
    {
      name: 'Community Caretaker',
      description: 'Empathetic, values relationships and community welfare, driven by compassion',
      sourceType: 'system',
      attributes: {
        decisionStyle: 'collaborative',
        valueSystem: 'humanist',
        communicationPreference: 'narrative',
      },
      signals: {
        occupations: ['teacher', 'nurse', 'social worker', 'nonprofit'],
        indicators: ['volunteers', 'community involvement', 'family-focused'],
      },
      persuasionLevers: {
        effective: ['Impact on people', 'Fairness', 'Community values', 'Personal stories'],
        ineffective: ['Cold statistics', 'Corporate interests', 'Technical jargon'],
      },
      pitfalls: ['Ignoring human element', 'Purely financial arguments', 'Lack of empathy'],
    },
    {
      name: 'Business Realist',
      description: 'Practical decision-maker focused on outcomes, understands commerce and contracts',
      sourceType: 'system',
      attributes: {
        decisionStyle: 'pragmatic',
        valueSystem: 'utilitarian',
        communicationPreference: 'results-oriented',
      },
      signals: {
        occupations: ['business owner', 'manager', 'sales', 'executive'],
        indicators: ['understands contracts', 'risk-aware', 'practical'],
      },
      persuasionLevers: {
        effective: ['Risk analysis', 'Business implications', 'Practical outcomes', 'Common sense'],
        ineffective: ['Theoretical arguments', 'Idealism', 'Complexity without clarity'],
      },
      pitfalls: ['Overly academic arguments', 'Ignoring practicality', 'Unclear outcomes'],
    },
  ];

  for (const personaData of personas) {
    await prisma.persona.create({
      data: {
        ...personaData,
        organizationId: null, // System persona
      },
    });
  }
  console.log('✅ Created', personas.length, 'system personas');

  // Create sample case
  const sampleCase = await prisma.case.create({
    data: {
      organizationId: org.id,
      name: 'Johnson v. TechCorp Industries',
      caseNumber: '2024-CV-12345',
      jurisdiction: 'Superior Court of California, County of San Francisco',
      venue: 'San Francisco',
      trialDate: new Date('2026-03-15'),
      caseType: 'civil',
      plaintiffName: 'Robert Johnson',
      defendantName: 'TechCorp Industries, Inc.',
      ourSide: 'plaintiff',
      createdBy: attorney.id,
      status: 'active',
    },
  });
  console.log('✅ Created sample case:', sampleCase.name);

  // Add case facts
  await prisma.caseFact.createMany({
    data: [
      {
        caseId: sampleCase.id,
        factType: 'background',
        content: 'Plaintiff was employed as Senior Software Engineer at defendant company from 2020-2023',
        sortOrder: 1,
      },
      {
        caseId: sampleCase.id,
        factType: 'disputed',
        content: 'Plaintiff alleges wrongful termination based on age discrimination (45 years old)',
        sortOrder: 2,
      },
      {
        caseId: sampleCase.id,
        factType: 'undisputed',
        content: 'Defendant hired three engineers under 30 years old within 6 months of plaintiff termination',
        sortOrder: 3,
      },
    ],
  });

  // Create jury panel
  const juryPanel = await prisma.juryPanel.create({
    data: {
      caseId: sampleCase.id,
      panelDate: new Date('2026-02-01'),
      source: 'Court-provided jury list',
      version: 1,
      totalJurors: 5,
      status: 'active',
    },
  });

  // Add sample jurors
  const jurors = await prisma.juror.createMany({
    data: [
      {
        panelId: juryPanel.id,
        jurorNumber: '001',
        firstName: 'Michael',
        lastName: 'Chen',
        age: 42,
        occupation: 'Software Engineer',
        employer: 'StartupCo',
        city: 'San Francisco',
        zipCode: '94103',
        questionnaireData: {
          priorJuryService: false,
          techIndustryExperience: true,
        },
        status: 'available',
      },
      {
        panelId: juryPanel.id,
        jurorNumber: '002',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        age: 38,
        occupation: 'Teacher',
        employer: 'Lincoln High School',
        city: 'Oakland',
        zipCode: '94612',
        questionnaireData: {
          priorJuryService: true,
          employmentLawExperience: false,
        },
        status: 'available',
      },
      {
        panelId: juryPanel.id,
        jurorNumber: '003',
        firstName: 'David',
        lastName: 'Thompson',
        age: 55,
        occupation: 'Business Consultant',
        employer: 'Self-employed',
        city: 'Berkeley',
        zipCode: '94704',
        questionnaireData: {
          priorJuryService: false,
          businessOwner: true,
        },
        status: 'available',
      },
      {
        panelId: juryPanel.id,
        jurorNumber: '004',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        age: 29,
        occupation: 'Social Worker',
        employer: 'Bay Area Community Services',
        city: 'San Francisco',
        zipCode: '94110',
        questionnaireData: {
          priorJuryService: false,
          nonprofitExperience: true,
        },
        status: 'available',
      },
      {
        panelId: juryPanel.id,
        jurorNumber: '005',
        firstName: 'Robert',
        lastName: 'Williams',
        age: 61,
        occupation: 'Retired Engineer',
        employer: 'Retired',
        city: 'Palo Alto',
        zipCode: '94301',
        questionnaireData: {
          priorJuryService: true,
          techIndustryExperience: true,
        },
        status: 'available',
      },
    ],
  });

  console.log('✅ Created', 5, 'sample jurors');

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Sample credentials:');
  console.log('  Attorney: attorney@example.com / password123');
  console.log('  Paralegal: paralegal@example.com / password123');
  console.log('');
  console.log('Sample case created:', sampleCase.name);
  console.log('Jury panel created with 5 jurors');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
