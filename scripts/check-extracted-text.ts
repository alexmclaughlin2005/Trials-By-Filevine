/**
 * Quick script to check extracted text from documents
 * Shows which documents have text extracted and preview of content
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function checkExtractedText() {
  try {
    console.log('📄 Checking extracted text from documents...\n');

    // Get all imported documents with their text extraction status
    const documents = await prisma.importedDocument.findMany({
      select: {
        id: true,
        filename: true,
        textExtractionStatus: true,
        extractedText: true,
        textExtractedAt: true,
        textExtractionError: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Show last 20 documents
    });

    if (documents.length === 0) {
      console.log('No documents found.');
      return;
    }

    console.log(`Found ${documents.length} documents:\n`);

    for (const doc of documents) {
      console.log('─'.repeat(80));
      console.log(`📄 ${doc.filename}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Status: ${doc.textExtractionStatus}`);
      console.log(`   Created: ${doc.createdAt.toLocaleString()}`);

      if (doc.textExtractedAt) {
        console.log(`   Extracted: ${doc.textExtractedAt.toLocaleString()}`);
      }

      if (doc.extractedText) {
        const textLength = doc.extractedText.length;
        const preview = doc.extractedText.substring(0, 200).replace(/\n/g, ' ');
        console.log(`   ✅ Text extracted: ${textLength} characters`);
        console.log(`   Preview: "${preview}..."`);
      } else if (doc.textExtractionStatus === 'completed') {
        console.log(`   ⚠️  Status is completed but no text found`);
      } else if (doc.textExtractionStatus === 'failed') {
        console.log(`   ❌ Extraction failed: ${doc.textExtractionError || 'Unknown error'}`);
      } else if (doc.textExtractionStatus === 'not_needed') {
        console.log(`   ℹ️  Unsupported file type (text extraction not needed)`);
      } else {
        console.log(`   ⏳ Text extraction ${doc.textExtractionStatus}`);
      }
      console.log('');
    }

    // Summary statistics
    const stats = {
      total: documents.length,
      completed: documents.filter(d => d.textExtractionStatus === 'completed').length,
      withText: documents.filter(d => d.extractedText && d.extractedText.length > 0).length,
      processing: documents.filter(d => d.textExtractionStatus === 'processing').length,
      pending: documents.filter(d => d.textExtractionStatus === 'pending').length,
      failed: documents.filter(d => d.textExtractionStatus === 'failed').length,
      notNeeded: documents.filter(d => d.textExtractionStatus === 'not_needed').length,
    };

    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total documents: ${stats.total}`);
    console.log(`✅ Completed: ${stats.completed} (${stats.withText} have text content)`);
    console.log(`⏳ Processing: ${stats.processing}`);
    console.log(`⏳ Pending: ${stats.pending}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`ℹ️  Not needed: ${stats.notNeeded}`);
    console.log('');

    // Show total characters extracted
    const totalChars = documents.reduce((sum, doc) => sum + (doc.extractedText?.length || 0), 0);
    console.log(`📝 Total extracted text: ${totalChars.toLocaleString()} characters`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExtractedText().catch(console.error);
