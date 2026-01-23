import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function checkTextExtraction() {
  console.log('📄 Checking text extraction status...\n');

  const documents = await prisma.importedDocument.findMany({
    select: {
      id: true,
      filename: true,
      textExtractionStatus: true,
      textExtractedAt: true,
      textExtractionError: true,
      extractedText: true,
    },
    orderBy: {
      importedAt: 'desc',
    },
    take: 20,
  });

  if (documents.length === 0) {
    console.log('No documents found.');
    return;
  }

  console.log(`Found ${documents.length} recent documents:\n`);

  for (const doc of documents) {
    const textLength = doc.extractedText?.length || 0;
    const status = doc.textExtractionStatus;

    console.log(`📎 ${doc.filename}`);
    console.log(`   Status: ${status}`);

    if (status === 'completed') {
      console.log(`   ✅ Extracted ${textLength.toLocaleString()} characters`);
      console.log(`   📅 Extracted at: ${doc.textExtractedAt?.toLocaleString()}`);
      if (textLength > 0) {
        const preview = doc.extractedText!.substring(0, 100).replace(/\n/g, ' ');
        console.log(`   Preview: "${preview}..."`);
      }
    } else if (status === 'failed') {
      console.log(`   ❌ Error: ${doc.textExtractionError}`);
    } else if (status === 'processing') {
      console.log(`   ⏳ Currently processing...`);
    } else if (status === 'pending') {
      console.log(`   ⏸️  Waiting to be processed`);
    } else if (status === 'not_needed') {
      console.log(`   ℹ️  Not a PDF or already extracted`);
    }

    console.log('');
  }

  // Summary stats
  const stats = await prisma.importedDocument.groupBy({
    by: ['textExtractionStatus'],
    _count: true,
  });

  console.log('\n📊 Extraction Status Summary:');
  stats.forEach(stat => {
    console.log(`   ${stat.textExtractionStatus}: ${stat._count} documents`);
  });

  await prisma.$disconnect();
}

checkTextExtraction().catch(console.error);
