#!/usr/bin/env tsx
/**
 * Clear Juror Image URLs
 * 
 * Clears all imageUrl fields from jurors table.
 * Use this when images are lost due to ephemeral filesystem (Railway restarts).
 * 
 * Usage:
 *   npm run clear-juror-image-urls
 *   DATABASE_URL="postgresql://..." npm run clear-juror-image-urls
 */

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@juries/database';

dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing juror imageUrl fields...\n');

  try {
    // Count jurors with imageUrl
    const withImages = await prisma.juror.count({
      where: {
        imageUrl: { not: null },
      },
    });

    console.log(`📊 Found ${withImages} jurors with imageUrl set\n`);

    if (withImages === 0) {
      console.log('✅ No imageUrl fields to clear');
      await prisma.$disconnect();
      return;
    }

    // Clear all imageUrl fields
    const result = await prisma.juror.updateMany({
      where: {
        imageUrl: { not: null },
      },
      data: {
        imageUrl: null,
      },
    });

    console.log(`✅ Cleared imageUrl from ${result.count} jurors`);
    console.log('\n💡 Next steps:');
    console.log('   - Images can be regenerated using the "Generate Image" button');
    console.log('   - Note: Railway uses ephemeral filesystem - images will be lost on restart');
    console.log('   - Consider migrating to cloud storage (S3/Vercel Blob) for persistence');
  } catch (error: any) {
    console.error('❌ Error clearing imageUrl fields:', error.message);
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
