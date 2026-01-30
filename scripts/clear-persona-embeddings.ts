#!/usr/bin/env tsx
/**
 * Clear Persona Embeddings
 * 
 * Clears all persona embeddings from the database to force regeneration
 * with updated embedding text (includes verdict prediction stance).
 * 
 * Usage:
 *   npm run clear-persona-embeddings
 *   DATABASE_URL="postgresql://..." npm run clear-persona-embeddings
 */

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@juries/database';

dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing persona embeddings to force regeneration...\n');

  try {
    // Count personas with embeddings
    const withEmbeddings = await prisma.persona.count({
      where: {
        embedding: { not: null },
        isActive: true,
        version: 2,
      },
    });

    console.log(`📊 Found ${withEmbeddings} V2 personas with embeddings\n`);

    if (withEmbeddings === 0) {
      console.log('✅ No embeddings to clear');
      await prisma.$disconnect();
      return;
    }

    // Clear all embeddings
    const result = await prisma.persona.updateMany({
      where: {
        isActive: true,
        version: 2,
        embedding: { not: null },
      },
      data: {
        embedding: null,
        embeddingModel: null,
        embeddingUpdatedAt: null,
      },
    });

    console.log(`✅ Cleared ${result.count} persona embeddings`);
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the API Gateway server');
    console.log('   2. Preload will automatically regenerate embeddings with new format');
    console.log('   3. Embeddings will include verdict prediction stance');
    console.log('\n⏱️  Expected time: ~20-30 minutes for 60 personas (due to rate limits)');
  } catch (error: any) {
    console.error('❌ Error clearing embeddings:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
