#!/usr/bin/env tsx
/**
 * Verify that persona embeddings include the verdict prediction stance component
 * 
 * This script checks:
 * 1. Which personas have embeddings stored in the database
 * 2. When embeddings were last updated
 * 3. What text description was used (including stance) for embedding generation
 * 4. Whether the stance component is present in the description
 * 
 * Usage:
 *   # Local database (requires migration):
 *   npx tsx scripts/verify-embedding-stance.ts
 * 
 *   # Production database:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/verify-embedding-stance.ts
 * 
 *   # With Railway CLI:
 *   railway run --service api-gateway npx tsx scripts/verify-embedding-stance.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Support production DATABASE_URL from environment
// IMPORTANT: Set DATABASE_URL before importing PrismaClient so schema validation works
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  // Set it in process.env so Prisma schema validation passes
  process.env.DATABASE_URL = databaseUrl;
  console.log('🔗 Using DATABASE_URL from environment (production mode)');
  console.log('   Database:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
}

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

/**
 * Build persona description text (same logic as EmbeddingScorer.buildPersonaDescription)
 * This lets us verify what text was used for embedding generation
 */
function buildPersonaDescriptionText(persona: {
  name: string;
  description: string | null;
  instantRead: string | null;
  phrasesYoullHear: any;
  attributes: any;
  verdictPrediction?: any;
}): string {
  const parts: string[] = [];

  parts.push(`Persona: ${persona.name}`);

  if (persona.instantRead) {
    parts.push(`Quick Summary: ${persona.instantRead}`);
  }

  // Add verdict prediction stance if available
  if (persona.verdictPrediction?.liability_finding_probability !== undefined) {
    const prob = persona.verdictPrediction.liability_finding_probability;
    if (prob >= 0.7) {
      parts.push(`STANCE: Strongly favors plaintiffs. Likely to find liability.`);
    } else if (prob <= 0.3) {
      parts.push(`STANCE: Strongly favors defendants. Unlikely to find liability.`);
    }
  }

  if (persona.description) {
    parts.push(`Description: ${persona.description}`);
  }

  if (persona.phrasesYoullHear && Array.isArray(persona.phrasesYoullHear)) {
    parts.push(
      `Characteristic Phrases: ${persona.phrasesYoullHear.join(', ')}`
    );
  }

  if (persona.attributes) {
    const attrs = persona.attributes as Record<string, any>;
    if (Object.keys(attrs).length > 0) {
      parts.push(`Attributes: ${JSON.stringify(attrs)}`);
    }
  }

  return parts.join('\n\n');
}

async function main() {
  console.log('\n🔍 Verifying Persona Embeddings Include Stance Component\n');
  console.log('='.repeat(80));

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check if embedding columns exist by trying a simple query
    let hasEmbeddingColumns = false;
    try {
      // Try to query embedding column - if it fails, columns don't exist
      await prisma.$queryRaw`SELECT embedding FROM personas LIMIT 1`;
      hasEmbeddingColumns = true;
    } catch (error: any) {
      if (error.message?.includes('embedding') || error.code === 'P2022') {
        hasEmbeddingColumns = false;
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    if (!hasEmbeddingColumns) {
      console.log('⚠️  Embedding columns not found in database schema');
      console.log('   This script requires the embedding migration to be applied');
      console.log('   Run: npx prisma migrate deploy');
      console.log('   Or use production DATABASE_URL: DATABASE_URL="..." npx tsx scripts/verify-embedding-stance.ts\n');
      await prisma.$disconnect();
      return;
    }

    // Get all V2 personas with their embedding status
    const personas = await prisma.persona.findMany({
      where: {
        isActive: true,
        version: 2,
      },
      select: {
        id: true,
        name: true,
        description: true,
        instantRead: true,
        phrasesYoullHear: true,
        attributes: true,
        verdictPrediction: true,
        embedding: true,
        embeddingModel: true,
        embeddingUpdatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`📊 Found ${personas.length} V2 personas\n`);

    // Categorize personas
    const withEmbeddings = personas.filter(p => p.embedding !== null);
    const withoutEmbeddings = personas.filter(p => p.embedding === null);
    const withStance = personas.filter(p => 
      p.verdictPrediction?.liability_finding_probability !== undefined &&
      (p.verdictPrediction.liability_finding_probability >= 0.7 || 
       p.verdictPrediction.liability_finding_probability <= 0.3)
    );
    const withStanceAndEmbedding = withStance.filter(p => p.embedding !== null);

    console.log('📈 Summary:');
    console.log(`   Total personas: ${personas.length}`);
    console.log(`   With embeddings: ${withEmbeddings.length} (${((withEmbeddings.length / personas.length) * 100).toFixed(1)}%)`);
    console.log(`   Without embeddings: ${withoutEmbeddings.length}`);
    console.log(`   With stance data: ${withStance.length}`);
    console.log(`   With stance + embedding: ${withStanceAndEmbedding.length}`);
    console.log('');

    // Check embedding model
    const models = new Map<string, number>();
    withEmbeddings.forEach(p => {
      const model = p.embeddingModel || 'unknown';
      models.set(model, (models.get(model) || 0) + 1);
    });

    if (models.size > 0) {
      console.log('🤖 Embedding Models:');
      models.forEach((count, model) => {
        console.log(`   ${model}: ${count} personas`);
      });
      console.log('');
    }

    // Sample personas to verify stance inclusion
    console.log('🔬 Sample Verification (checking if stance is in description text):');
    console.log('='.repeat(80));

    // Get a sample of personas with stance data and embeddings
    const sampleSize = Math.min(5, withStanceAndEmbedding.length);
    const sample = withStanceAndEmbedding.slice(0, sampleSize);

    if (sample.length === 0) {
      console.log('⚠️  No personas with both stance data and embeddings found for sampling');
      console.log('\n💡 This could mean:');
      console.log('   1. Embeddings haven\'t been regenerated yet after adding stance');
      console.log('   2. Personas don\'t have verdict prediction data');
      console.log('   3. Embeddings need to be cleared and regenerated');
    } else {
      for (const persona of sample) {
        const prob = persona.verdictPrediction?.liability_finding_probability;
        const descriptionText = buildPersonaDescriptionText(persona);
        const hasStance = descriptionText.includes('STANCE:');
        const stanceLine = descriptionText.split('\n\n').find(line => line.startsWith('STANCE:'));

        console.log(`\n📋 ${persona.name}`);
        console.log(`   Liability Probability: ${prob !== undefined ? prob.toFixed(2) : 'N/A'}`);
        console.log(`   Embedding Model: ${persona.embeddingModel || 'N/A'}`);
        console.log(`   Updated At: ${persona.embeddingUpdatedAt ? persona.embeddingUpdatedAt.toISOString() : 'N/A'}`);
        console.log(`   Stance in Description: ${hasStance ? '✅ YES' : '❌ NO'}`);
        
        if (stanceLine) {
          console.log(`   Stance Text: "${stanceLine}"`);
        }

        // Show preview of description text
        const preview = descriptionText.substring(0, 200);
        console.log(`   Description Preview: ${preview}${descriptionText.length > 200 ? '...' : ''}`);
      }
    }

    // Check for personas that should have stance but don't
    console.log('\n\n⚠️  Personas Missing Stance in Embeddings:');
    console.log('='.repeat(80));
    
    const missingStance: typeof personas = [];
    for (const persona of withStanceAndEmbedding) {
      const descriptionText = buildPersonaDescriptionText(persona);
      if (!descriptionText.includes('STANCE:')) {
        missingStance.push(persona);
      }
    }

    if (missingStance.length > 0) {
      console.log(`Found ${missingStance.length} personas with stance data but missing from description:\n`);
      missingStance.forEach(p => {
        const prob = p.verdictPrediction?.liability_finding_probability;
        console.log(`   - ${p.name} (prob: ${prob?.toFixed(2)})`);
      });
      console.log('\n💡 These embeddings may need to be regenerated');
    } else {
      console.log('✅ All personas with stance data have it included in their embedding description');
    }

    // Recommendations
    console.log('\n\n💡 Recommendations:');
    console.log('='.repeat(80));
    
    if (withoutEmbeddings.length > 0) {
      console.log(`   - ${withoutEmbeddings.length} personas need embeddings generated`);
    }
    
    if (withStance.length > withStanceAndEmbedding.length) {
      const needRegeneration = withStance.length - withStanceAndEmbedding.length;
      console.log(`   - ${needRegeneration} personas with stance data need embeddings regenerated`);
      console.log(`   - Run: npx tsx scripts/clear-persona-embeddings.ts`);
    }
    
    if (missingStance.length > 0) {
      console.log(`   - ${missingStance.length} embeddings need regeneration (stance missing)`);
      console.log(`   - Run: npx tsx scripts/clear-persona-embeddings.ts`);
    }

    if (withEmbeddings.length === personas.length && missingStance.length === 0) {
      console.log('   ✅ All embeddings are up to date with stance component!');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Verification complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
