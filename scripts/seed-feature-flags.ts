import { PrismaClient } from '@juries/database';

async function seedFeatureFlags() {
  const prisma = new PrismaClient();

  try {
    console.log('Seeding feature flags...');

    const defaultFlags = [
      {
        key: 'personas_v2',
        name: 'Persona V2 Data',
        description:
          'Use enhanced V2 persona data with instant reads, danger levels, and strike/keep strategies',
        enabled: false,
      },
      {
        key: 'focus_groups_v2',
        name: 'Focus Groups V2',
        description: 'Use V2 persona data in focus group simulations with realistic language patterns',
        enabled: false,
      },
      {
        key: 'voir_dire_v2',
        name: 'Voir Dire Generator V2',
        description: 'Enable V2 voir dire question generation using "Phrases You\'ll Hear" data',
        enabled: false,
      },
    ];

    for (const flagData of defaultFlags) {
      // Check if flag already exists
      const existing = await prisma.featureFlag.findFirst({
        where: {
          key: flagData.key,
          organizationId: null,
        },
      });

      let flag;
      if (existing) {
        // Update existing flag
        flag = await prisma.featureFlag.update({
          where: { id: existing.id },
          data: {
            name: flagData.name,
            description: flagData.description,
          },
        });
        console.log(`✓ Updated flag: ${flag.key} (${flag.enabled ? 'enabled' : 'disabled'})`);
      } else {
        // Create new flag
        flag = await prisma.featureFlag.create({
          data: {
            ...flagData,
            organizationId: null,
          },
        });
        console.log(`✓ Created flag: ${flag.key} (${flag.enabled ? 'enabled' : 'disabled'})`);
      }
    }

    console.log('\n✅ Successfully seeded all feature flags!');
  } catch (error) {
    console.error('❌ Error seeding feature flags:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedFeatureFlags();
