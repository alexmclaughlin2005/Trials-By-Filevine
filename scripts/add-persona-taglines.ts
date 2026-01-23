import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Taglines crafted based on each persona's full profile, demographics, and characteristic phrases
const taglines: Record<string, string> = {
  // HEART ARCHETYPE
  'Sergeant First Class (Ret.) Jose Ramirez': 'In the Army, if you didn\'t follow procedures, people died.',
  'Jennifer Martinez': 'Think about how this affected their family. There\'s a human being behind these facts.',
  'Nurse Patricia': 'I\'ve sat with patients through worse than this. Pain is real—I see it every day.',

  // BOOTSTRAPPER ARCHETYPE
  'Linda Kowalski': 'I pulled myself up, why can\'t they? I\'ve had hard times too, and I didn\'t sue anyone.',
  'Marcus Thompson': 'Let\'s look at the numbers. Success leaves clues, so does failure.',
  'Donna Fratelli': 'Offer it up. God doesn\'t give you more than you can handle.',
  'Robert Callahan': 'In my experience running a company, the plaintiff hasn\'t proven their case.',
  'Reverend Dorothy Hayes': 'Justice requires us to stand with those who suffer.',
  'Colonel (Ret.) Frank Morrison': 'Let\'s establish the facts and proceed systematically.',
  'Dr. Steven Park': 'What\'s the basis for that number? I need to see the methodology.',
  'Christine Walsh': 'Let\'s look at the actual financial impact. The numbers don\'t add up.',
  'Reverend Carlton James': 'The law isn\'t always just. I\'ve seen unjust laws before.',

  // CHAMELEON ARCHETYPE
  'Betty Sullivan': 'I think you\'re right. Whatever the group decides is fine with me.',
  'Michael Tran': 'Yeah, that makes sense. I haven\'t really thought about it.',

  // CRUSADER ARCHETYPE
  'Rachel Greenberg': 'There\'s a power imbalance here. Money is the only language corporations understand.',
  'DeShawn Williams': 'I\'ve been fighting these fights for 20 years. The company knew. They always know.',
  'Professor Elena Vasquez': 'The research is clear. This reflects broader patterns of corporate impunity.',
  'Tommy O\'Brien': 'The system is rigged. Big companies don\'t give a shit about regular people.',

  // TROJAN HORSE ARCHETYPE
  'Gregory Hunt': 'Let me play devil\'s advocate here. I want to be fair to both sides.',
  'Richard Blackwell': 'I\'ve covered these stories as a journalist. There\'s always another side.',
  'Grievance-Hiding Gina': 'I think we need to be reasonable here and look at all the facts.',

  // SCALE-BALANCER ARCHETYPE
  'Karen Chen': 'I can see both sides of this. Let me think about the evidence before deciding.',
  'James Okonkwo': 'Let\'s look at the documentation. In my experience, there\'s usually truth on both sides.',
  'Maria Santos': 'I want to understand the full picture. There\'s usually more to the story.',

  // SCARRED ARCHETYPE
  'Sandra Mitchell': 'Hospitals cover things up—I\'ve seen it. If I hadn\'t sued, they would have gotten away with it.',
  'Harold Jennings': 'I was hurt bad and I didn\'t sue anybody. What ever happened to toughing it out?',
  'Andrea Simmons': 'I wish I had done what this person is doing. Nobody told me I had rights.',

  // GENERIC/TEMPLATE PERSONAS
  'Tech Pragmatist': 'Show me the data, not the emotions. Logic drives my decisions.',
  'Community Caretaker': 'When someone in our community hurts, we all hurt. We take care of our own.',
  'Business Realist': 'I understand contracts and commerce. Let\'s be practical about what happened here.',
  'Albert Kowalski (Copy)': 'Lawsuits are destroying this country. I won\'t be part of it.',
  'Gary Hendricks (Copy)': 'Nobody owes you anything. You control your own fate.',
};

async function addTaglines() {
  console.log('Starting tagline updates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [personaName, tagline] of Object.entries(taglines)) {
    try {
      const result = await prisma.persona.updateMany({
        where: {
          name: personaName,
          isActive: true
        },
        data: { tagline }
      });

      if (result.count > 0) {
        console.log(`✓ Updated: ${personaName}`);
        console.log(`  Tagline: "${tagline}"\n`);
        successCount++;
      } else {
        console.log(`⚠ Not found: ${personaName}\n`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ Error updating ${personaName}:`, error);
      errorCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Errors/Not found: ${errorCount}`);
  console.log(`Total processed: ${Object.keys(taglines).length}`);

  await prisma.$disconnect();
}

addTaglines();
