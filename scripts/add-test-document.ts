#!/usr/bin/env tsx
/**
 * Local Testing Script: Add Document with Extracted Text
 * 
 * This script allows you to add a document directly to the database for local testing
 * without needing Vercel Blob storage configured.
 * 
 * Usage:
 *   tsx scripts/add-test-document.ts <caseId> <filePath> [argumentId] [notes]
 * 
 * Example:
 *   tsx scripts/add-test-document.ts abc-123 ./test-document.pdf def-456 "Test document for focus group"
 */

import { PrismaClient } from '@juries/database';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TextExtractionService } from '../services/api-gateway/src/services/text-extraction';

const prisma = new PrismaClient();

async function addTestDocument(
  caseId: string,
  filePath: string,
  argumentId?: string,
  notes?: string
) {
  try {
    console.log('📄 Adding test document...');
    console.log(`   Case ID: ${caseId}`);
    console.log(`   File: ${filePath}`);
    if (argumentId) console.log(`   Argument ID: ${argumentId}`);
    if (notes) console.log(`   Notes: ${notes}`);

    // Verify case exists
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        filevineProject: true
      }
    });

    if (!caseData) {
      throw new Error(`Case not found: ${caseId}`);
    }

    // Get or create a Filevine project link for this case
    let filevineProject = caseData.filevineProject;
    if (!filevineProject) {
      console.log('   Creating Filevine project link...');
      filevineProject = await prisma.caseFilevineProject.create({
        data: {
          caseId,
          organizationId: caseData.organizationId,
          filevineProjectId: `local-test-${Date.now()}`,
          projectName: 'Local Testing',
          projectTypeName: 'Test',
        },
      });
    }

    // Read file
    const fullPath = join(process.cwd(), filePath);
    console.log(`   Reading file: ${fullPath}`);
    const fileBuffer = readFileSync(fullPath);
    const filename = filePath.split('/').pop() || 'test-document.pdf';

    // Create document record first (with pending extraction status)
    console.log('   Creating document record...');
    const document = await prisma.importedDocument.create({
      data: {
        caseFilevineProjectId: filevineProject.id,
        filevineDocumentId: `local-test-${Date.now()}`,
        fivevineFolderId: 'local-test',
        filename,
        folderName: 'Local Test Documents',
        size: BigInt(fileBuffer.length),
        importedBy: caseData.createdBy || 'system',
        status: 'completed',
        localFileUrl: `file://${fullPath}`, // Local file URL
        textExtractionStatus: 'pending', // Start as pending, will be processed
      },
    });

    console.log(`   ✅ Document created: ${document.id}`);

    // Now run through the actual extraction flow
    console.log('   Running text extraction flow...');
    const textExtractionService = new TextExtractionService();
    
    // Check if this file type needs extraction
    if (textExtractionService.isPdfFile(filename) || textExtractionService.isWordFile(filename)) {
      // Update status to processing
      await prisma.importedDocument.update({
        where: { id: document.id },
        data: { textExtractionStatus: 'processing' },
      });

      // Extract text directly from buffer
      const textResult = await textExtractionService.extractTextFromBuffer(fileBuffer, filename);
      if (textResult) {
        const extractedText = textResult.text;
        
        // For local testing, store extracted text in a temp file
        // This simulates what the extraction service does
        const textFilename = `extracted-text-${document.id}.txt`;
        const textPath = join(process.cwd(), 'temp', textFilename);
        
        // Create temp directory if it doesn't exist
        const { mkdirSync, writeFileSync } = require('fs');
        try {
          mkdirSync(join(process.cwd(), 'temp'), { recursive: true });
        } catch (e) {
          // Directory might already exist
        }
        
        writeFileSync(textPath, extractedText);
        const extractedTextUrl = `file://${textPath}`;
        
        // Update document with extracted text (matching production flow)
        await prisma.importedDocument.update({
          where: { id: document.id },
          data: {
            extractedTextUrl: extractedTextUrl,
            extractedTextChars: extractedText.length,
            textExtractionStatus: 'completed',
            textExtractedAt: new Date(),
          },
        });
        
        console.log(`   ✅ Extracted ${extractedText.length.toLocaleString()} characters`);
        console.log(`   Text stored at: ${textPath}`);
        console.log(`   Document updated with extraction results`);
      } else {
        // Not a supported file type
        await prisma.importedDocument.update({
          where: { id: document.id },
          data: {
            textExtractionStatus: 'not_needed',
            textExtractedAt: new Date(),
          },
        });
        console.log(`   ⏭️ No extraction needed for this file type`);
      }
    } else {
      // Not a supported file type
      await prisma.importedDocument.update({
        where: { id: document.id },
        data: {
          textExtractionStatus: 'not_needed',
          textExtractedAt: new Date(),
        },
      });
      console.log(`   ⏭️ No extraction needed for this file type`);
    }

    // Re-fetch document to get updated extraction status
    const finalDocument = await prisma.importedDocument.findUnique({
      where: { id: document.id },
    });

    if (!finalDocument) {
      throw new Error('Document not found after creation');
    }

    // If argumentId provided, attach to argument
    if (argumentId) {
      // Verify argument exists
      const argument = await prisma.caseArgument.findFirst({
        where: {
          id: argumentId,
          caseId,
        },
      });

      if (!argument) {
        console.warn(`   ⚠️ Argument not found: ${argumentId} - skipping attachment`);
      } else {
        console.log(`   Attaching to argument: ${argument.title}`);
        const attachment = await prisma.argumentDocument.create({
          data: {
            argumentId,
            documentId: finalDocument.id,
            attachedBy: caseData.createdBy || 'system',
            notes: notes || 'Added via test script',
          },
        });
        console.log(`   ✅ Attached to argument: ${attachment.id}`);
      }
    }

    console.log('\n✅ Success! Document added for testing.');
    console.log(`\nDocument ID: ${finalDocument.id}`);
    console.log(`Filename: ${filename}`);
    console.log(`Text Extraction Status: ${finalDocument.textExtractionStatus}`);
    if (finalDocument.extractedTextUrl) {
      console.log(`Extracted text URL: ${finalDocument.extractedTextUrl}`);
      console.log(`Extracted text chars: ${finalDocument.extractedTextChars?.toLocaleString() || 'N/A'}`);
    }
    if (argumentId) {
      console.log(`Attached to argument: ${argumentId}`);
    }

    return finalDocument;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: tsx scripts/add-test-document.ts <caseId> <filePath> [argumentId] [notes]');
  console.error('\nExample:');
  console.error('  tsx scripts/add-test-document.ts abc-123 ./test.pdf def-456 "Test document"');
  process.exit(1);
}

const [caseId, filePath, argumentId, notes] = args;

addTestDocument(caseId, filePath, argumentId, notes)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
