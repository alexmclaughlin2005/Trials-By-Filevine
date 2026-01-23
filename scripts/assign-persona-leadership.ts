/**
 * Script to assign leadership levels to existing personas
 *
 * Run with: npx tsx scripts/assign-persona-leadership.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

/**
 * Leadership level assignment based on archetype
 *
 * Default mappings:
 * - LEADER: Captain (authority-focused), Crusader (cause-oriented)
 * - INFLUENCER: Calculator (analytical), Bootstrapper (opinionated)
 * - FOLLOWER: Scale-Balancer (fair-minded), Chameleon (conformist), Heart (empathetic)
 * - PASSIVE: Scarred (cynical), Trojan Horse (hidden), Maverick (independent)
 */
const ARCHETYPE_LEADERSHIP_MAP: Record<string, string> = {
  'captain': 'LEADER',
  'crusader': 'LEADER',
  'calculator': 'INFLUENCER',
  'bootstrapper': 'INFLUENCER',
  'scale_balancer': 'FOLLOWER',
  'chameleon': 'FOLLOWER',
  'heart': 'FOLLOWER',
  'scarred': 'PASSIVE',
  'trojan_horse': 'PASSIVE',
  'maverick': 'PASSIVE'
};

/**
 * Communication style based on archetype
 */
const ARCHETYPE_COMMUNICATION_MAP: Record<string, string> = {
  'captain': 'Direct and authoritative. Speaks with confidence and expects others to follow.',
  'crusader': 'Passionate and persuasive. Appeals to values and systemic thinking.',
  'calculator': 'Analytical and fact-driven. Uses data and logic to make points.',
  'bootstrapper': 'Straightforward and personal responsibility-focused. Emphasizes individual accountability.',
  'scale_balancer': 'Measured and fair-minded. Seeks balance and considers all sides.',
  'chameleon': 'Agreeable and harmonious. Builds consensus and avoids conflict.',
  'heart': 'Empathetic and emotional. Connects through personal stories and feelings.',
  'scarred': 'Cynical and guarded. Questions motives and expresses skepticism.',
  'trojan_horse': 'Subtle and strategic. Appears neutral but has hidden biases.',
  'maverick': 'Independent and contrarian. Challenges authority and conventional thinking.'
};

/**
 * Persuasion susceptibility based on archetype
 */
const ARCHETYPE_PERSUASION_MAP: Record<string, string> = {
  'captain': 'Moved by authority, credentials, and structured procedures.',
  'crusader': 'Responds to moral arguments, systemic solutions, and causes.',
  'calculator': 'Convinced by data, statistics, and logical reasoning.',
  'bootstrapper': 'Persuaded by personal responsibility narratives and self-made success stories.',
  'scale_balancer': 'Influenced by balanced arguments that consider all perspectives.',
  'chameleon': 'Swayed by group consensus and what others think.',
  'heart': 'Moved by emotional appeals, personal stories, and empathy.',
  'scarred': 'Difficult to persuade; requires overcoming deep skepticism.',
  'trojan_horse': 'Appears open but has preset biases that are hard to shift.',
  'maverick': 'Resistant to authority; persuaded by anti-establishment arguments.'
};

async function main() {
  console.log('🎭 Assigning leadership levels to personas...\n');

  // Get all personas
  const personas = await prisma.persona.findMany({
    where: {
      archetype: { not: null }
    }
  });

  console.log(`Found ${personas.length} personas with archetypes\n`);

  let updated = 0;
  let skipped = 0;

  for (const persona of personas) {
    const archetype = persona.archetype?.toLowerCase();

    if (!archetype) {
      console.log(`⏭️  Skipped ${persona.name}: No archetype`);
      skipped++;
      continue;
    }

    const leadershipLevel = ARCHETYPE_LEADERSHIP_MAP[archetype];
    const communicationStyle = ARCHETYPE_COMMUNICATION_MAP[archetype];
    const persuasionSusceptibility = ARCHETYPE_PERSUASION_MAP[archetype];

    if (!leadershipLevel) {
      console.log(`⚠️  Skipped ${persona.name}: Unknown archetype "${archetype}"`);
      skipped++;
      continue;
    }

    // Update persona
    await prisma.persona.update({
      where: { id: persona.id },
      data: {
        leadershipLevel,
        communicationStyle,
        persuasionSusceptibility
      }
    });

    console.log(`✅ ${persona.name}: ${leadershipLevel}`);
    updated++;
  }

  console.log('\n📊 Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${personas.length}`);

  // Show distribution
  const distribution = await prisma.persona.groupBy({
    by: ['leadershipLevel'],
    _count: true
  });

  console.log('\n📈 Leadership Level Distribution:');
  distribution.forEach(d => {
    if (d.leadershipLevel) {
      console.log(`  ${d.leadershipLevel}: ${d._count} personas`);
    }
  });

  console.log('\n✨ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
