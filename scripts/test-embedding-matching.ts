#!/usr/bin/env tsx

/**
 * Test Embedding Matching System
 * 
 * Tests the Voyage AI embedding system with various test jurors
 * to verify embeddings are working correctly and producing diverse scores.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { EnsembleMatcher } from '../services/api-gateway/src/services/matching/ensemble-matcher';

const prisma = new PrismaClient();

// Test jurors with expected archetypes
const testJurors = [
  {
    name: 'Business Owner',
    data: {
      firstName: 'Test',
      lastName: 'BusinessOwner',
      age: 55,
      occupation: 'Small Business Owner',
      employer: 'Self-employed',
      education: "Bachelor's",
      city: 'Austin',
      zipCode: '78701',
      questionnaireData: {
        education: "Bachelor's",
        notes: 'Built business from scratch, believes in hard work and personal responsibility',
      },
      expectedArchetype: 'bootstrapper',
    },
  },
  {
    name: 'Social Worker',
    data: {
      firstName: 'Test',
      lastName: 'SocialWorker',
      age: 35,
      occupation: 'Social Worker',
      employer: 'Nonprofit Organization',
      education: "Master's",
      city: 'Portland',
      zipCode: '97201',
      questionnaireData: {
        education: "Master's",
        notes: 'Volunteers at multiple nonprofits, passionate about helping others',
      },
      expectedArchetype: 'heart', // or crusader
    },
  },
  {
    name: 'Accountant',
    data: {
      firstName: 'Test',
      lastName: 'Accountant',
      age: 45,
      occupation: 'Accountant',
      employer: 'CPA Firm',
      education: "Bachelor's",
      city: 'Chicago',
      zipCode: '60601',
      questionnaireData: {
        education: "Bachelor's",
        notes: 'Show me the evidence, numbers don\'t lie, very analytical',
      },
      expectedArchetype: 'calculator',
    },
  },
  {
    name: 'Retired Nurse',
    data: {
      firstName: 'Test',
      lastName: 'Nurse',
      age: 60,
      occupation: 'Retired Nurse',
      employer: 'Retired',
      education: "Associate's",
      city: 'Miami',
      zipCode: '33101',
      questionnaireData: {
        education: "Associate's",
        notes: 'Lost spouse to medical error, very skeptical of healthcare system',
      },
      expectedArchetype: 'scarred',
    },
  },
];

async function createTestJuror(testJuror: typeof testJurors[0], caseId: string, panelId: string) {
  return await prisma.juror.create({
    data: {
      panelId,
      jurorNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      firstName: testJuror.data.firstName,
      lastName: testJuror.data.lastName,
      age: testJuror.data.age,
      occupation: testJuror.data.occupation,
      employer: testJuror.data.employer,
      city: testJuror.data.city,
      zipCode: testJuror.data.zipCode,
      questionnaireData: testJuror.data.questionnaireData as any,
      status: 'available',
    },
  });
}

async function loadAllPersonas() {
  return await prisma.persona.findMany({
    where: {
      isActive: true,
      version: 2,
    },
    select: {
      id: true,
      name: true,
      archetype: true,
    },
  });
}

async function matchJurorToPersonas(jurorId: string, personaIds: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const claudeClient = new ClaudeClient({ apiKey });
  const matcher = new EnsembleMatcher(prisma, claudeClient);

  return await matcher.matchJuror(jurorId, personaIds);
}

async function main() {
  console.log('🧪 Testing Embedding Matching System\n');
  console.log('=' .repeat(80));

  try {
    // Get or create test case and panel
    let testCase = await prisma.case.findFirst({
      where: { name: { contains: 'Test' } },
      include: { juryPanels: true },
    });

    if (!testCase) {
      // Create test organization first
      const org = await prisma.organization.findFirst();
      if (!org) {
        throw new Error('No organization found. Please seed database first.');
      }

      // Get or create a test user
      let testUser = await prisma.user.findFirst({
        where: { organizationId: org.id },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            organizationId: org.id,
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
          },
        });
      }

      testCase = await prisma.case.create({
        data: {
          organizationId: org.id,
          name: 'Test Case - Embedding Matching',
          caseNumber: 'TEST-EMB-001',
          status: 'active',
          createdBy: testUser.id,
          juryPanels: {
            create: {
              panelDate: new Date(),
              source: 'test',
              status: 'active',
            },
          },
        },
        include: { juryPanels: true },
      });
      console.log('✅ Created test case');
    }

    const panel = testCase.juryPanels[0];
    if (!panel) {
      throw new Error('No panel found');
    }

    // Load all personas
    console.log('\n📦 Loading personas...');
    const personas = await loadAllPersonas();
    console.log(`✅ Loaded ${personas.length} personas\n`);

    const personaIds = personas.map((p) => p.id);
    const personaMap = new Map(personas.map((p) => [p.id, p]));

    // Test each juror
    for (const testJuror of testJurors) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Testing: ${testJuror.name}`);
      console.log(`   Expected Archetype: ${testJuror.expectedArchetype || 'N/A'}`);
      console.log(`   Age: ${testJuror.data.age}, Occupation: ${testJuror.data.occupation}`);
      console.log('-'.repeat(80));

      // Create juror
      const juror = await createTestJuror(testJuror, testCase.id, panel.id);
      console.log(`✅ Created juror: ${juror.id}`);

      // Run matching
      console.log('🔄 Running matching...');
      const matches = await matchJurorToPersonas(juror.id, personaIds);

      // Get top 5 matches
      const top5 = matches.slice(0, 5);

      console.log('\n📊 Top 5 Matches:');
      console.log('-'.repeat(80));
      
      let embeddingScores: number[] = [];
      let hasExpectedArchetype = false;

      for (let i = 0; i < top5.length; i++) {
        const match = top5[i];
        const persona = personaMap.get(match.personaId);
        const isExpected = persona?.archetype === testJuror.expectedArchetype;

        if (isExpected) {
          hasExpectedArchetype = true;
        }

        embeddingScores.push(match.methodScores.embedding);

        console.log(
          `${i + 1}. ${persona?.name || 'Unknown'} (${persona?.archetype || 'unknown'})${isExpected ? ' ⭐ EXPECTED' : ''}`
        );
        console.log(`   Combined Score: ${(match.probability * 100).toFixed(1)}%`);
        console.log(
          `   Methods: embedding=${match.methodScores.embedding.toFixed(3)}, signal=${match.methodScores.signalBased.toFixed(3)}, bayesian=${match.methodScores.bayesian.toFixed(3)}`
        );
        console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        console.log('');
      }

      // Check embedding diversity
      const uniqueEmbeddingScores = new Set(embeddingScores.map((s) => s.toFixed(3))).size;
      const embeddingRange = Math.max(...embeddingScores) - Math.min(...embeddingScores);

      console.log('🔍 Analysis:');
      console.log(`   ✅ Embedding scores are diverse: ${uniqueEmbeddingScores} unique values`);
      console.log(`   ✅ Embedding score range: ${embeddingRange.toFixed(3)}`);
      
      if (uniqueEmbeddingScores === 1) {
        console.log('   ⚠️  WARNING: All embedding scores are identical! Voyage AI may not be working.');
      } else if (embeddingRange < 0.1) {
        console.log('   ⚠️  WARNING: Embedding scores are very similar (range < 0.1)');
      } else {
        console.log('   ✅ Embedding scores show good diversity');
      }

      // Check method agreement
      const avgEmbedding = embeddingScores.reduce((a, b) => a + b, 0) / embeddingScores.length;
      const avgSignal = top5.reduce((sum, m) => sum + m.methodScores.signalBased, 0) / top5.length;
      const avgBayesian = top5.reduce((sum, m) => sum + m.methodScores.bayesian, 0) / top5.length;

      const embeddingSignalDiff = Math.abs(avgEmbedding - avgSignal);
      const embeddingBayesianDiff = Math.abs(avgEmbedding - avgBayesian);

      console.log(`\n   Method Agreement:`);
      console.log(`   - Embedding avg: ${avgEmbedding.toFixed(3)}`);
      console.log(`   - Signal avg: ${avgSignal.toFixed(3)} (diff: ${embeddingSignalDiff.toFixed(3)})`);
      console.log(`   - Bayesian avg: ${avgBayesian.toFixed(3)} (diff: ${embeddingBayesianDiff.toFixed(3)})`);

      if (embeddingSignalDiff > 0.3 || embeddingBayesianDiff > 0.3) {
        console.log('   ⚠️  WARNING: Methods show significant disagreement (>0.3 difference)');
      } else {
        console.log('   ✅ Methods show reasonable agreement');
      }

      // Check if expected archetype is in top 5
      if (testJuror.expectedArchetype) {
        if (hasExpectedArchetype) {
          console.log(`\n   ✅ Expected archetype "${testJuror.expectedArchetype}" found in top 5!`);
        } else {
          console.log(`\n   ⚠️  Expected archetype "${testJuror.expectedArchetype}" NOT in top 5`);
          
          // Find where it ranks
          const expectedMatch = matches.find(
            (m) => personaMap.get(m.personaId)?.archetype === testJuror.expectedArchetype
          );
          if (expectedMatch) {
            const rank = matches.indexOf(expectedMatch) + 1;
            console.log(`   📍 Found at rank ${rank} with score ${(expectedMatch.probability * 100).toFixed(1)}%`);
          } else {
            console.log(`   ❌ Expected archetype not found in any matches`);
          }
        }
      }

      // Clean up test juror
      await prisma.juror.delete({ where: { id: juror.id } });
      console.log(`\n🧹 Cleaned up test juror`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
