import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function checkDocuments() {
  console.log('📄 Checking document status in detail...\n');

  const documents = await prisma.importedDocument.findMany({
    select: {
      id: true,
      filename: true,
      status: true,
      textExtractionStatus: true,
      textExtractedAt: true,
      textExtractionError: true,
      localFileUrl: true,
      extractedText: true,
      importedAt: true,
    },
    orderBy: {
      importedAt: 'desc',
    },
    take: 10,
  });

  if (documents.length === 0) {
    console.log('No documents found in database.');
    console.log('This might indicate a database connection issue.');
    return;
  }

  console.log(`Found ${documents.length} recent documents:\n`);

  for (const doc of documents) {
    console.log(`\n📎 ${doc.filename}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Status: ${doc.status}`);
    console.log(`   Text Extraction Status: ${doc.textExtractionStatus}`);
    console.log(`   Has localFileUrl: ${!!doc.localFileUrl}`);
    console.log(`   Has extracted text: ${!!doc.extractedText} (${doc.extractedText?.length || 0} chars)`);
    console.log(`   Imported at: ${doc.importedAt.toLocaleString()}`);

    if (doc.textExtractedAt) {
      console.log(`   Text extracted at: ${doc.textExtractedAt.toLocaleString()}`);
    }

    if (doc.textExtractionError) {
      console.log(`   ❌ Extraction Error: ${doc.textExtractionError}`);
    }

    // Check if extraction would trigger
    const wouldTrigger =
      !!doc.localFileUrl &&
      doc.textExtractionStatus === 'pending' &&
      doc.status === 'completed';

    console.log(`   🔧 Would trigger extraction: ${wouldTrigger}`);
    if (!wouldTrigger) {
      const reasons = [];
      if (!doc.localFileUrl) reasons.push('missing localFileUrl');
      if (doc.textExtractionStatus !== 'pending') reasons.push(`textExtractionStatus is '${doc.textExtractionStatus}' not 'pending'`);
      if (doc.status !== 'completed') reasons.push(`status is '${doc.status}' not 'completed'`);
      console.log(`   ⚠️  Why not: ${reasons.join(', ')}`);
    }
  }

  // Check argument attachments
  console.log('\n\n📋 Recent Argument Attachments:\n');

  const attachments = await prisma.argumentDocument.findMany({
    take: 10,
    orderBy: {
      attachedAt: 'desc',
    },
    include: {
      document: {
        select: {
          filename: true,
          textExtractionStatus: true,
        },
      },
      argument: {
        select: {
          title: true,
        },
      },
    },
  });

  if (attachments.length === 0) {
    console.log('No argument attachments found.');
  } else {
    for (const att of attachments) {
      console.log(`\n🔗 ${att.document.filename}`);
      console.log(`   → Attached to: "${att.argument.title}"`);
      console.log(`   → Text Status: ${att.document.textExtractionStatus}`);
      console.log(`   → Attached at: ${att.attachedAt.toLocaleString()}`);
    }
  }

  await prisma.$disconnect();
}

checkDocuments().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
