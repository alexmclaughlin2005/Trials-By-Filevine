/**
 * Document Download Worker
 *
 * Processes pending document imports by:
 * 1. Downloading files from Filevine
 * 2. Uploading to Vercel Blob storage
 * 3. Updating database with blob URL and status
 * 4. Triggering text extraction for PDFs
 */

import { PrismaClient } from '@juries/database';
import { put } from '@vercel/blob';
import { createFilevineService } from '../services/filevine.js';
import { TextExtractionService } from '../services/text-extraction.js';

// Check for Vercel Blob token
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.warn('[DOWNLOAD] WARNING: BLOB_READ_WRITE_TOKEN not set - document downloads will fail');
}

const prisma = new PrismaClient();

interface DownloadJob {
  documentId: string;
  filevineDocumentId: string;
  filevineProjectId: string;
  filename: string;
  organizationId: string;
}

/**
 * Process a single document download
 */
async function processDocument(job: DownloadJob): Promise<void> {
  const { documentId, filevineDocumentId, filevineProjectId, filename, organizationId } = job;

  console.log(`[DOWNLOAD] Processing document ${documentId}: ${filename}`);

  try {
    // Update status to downloading
    await prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        status: 'downloading',
        downloadAttempts: { increment: 1 },
      },
    });

    // Get Filevine service for this organization
    const filevineService = createFilevineService(organizationId);

    // Get download URL from Filevine
    console.log(`[DOWNLOAD] Getting download URL for Filevine document ${filevineDocumentId} in project ${filevineProjectId}`);
    const downloadUrl = await filevineService.getDocumentDownloadUrl(filevineDocumentId, filevineProjectId);
    console.log(`[DOWNLOAD] Got download URL: ${downloadUrl.substring(0, 50)}...`);

    // Download file from Filevine
    console.log(`[DOWNLOAD] Downloading file from Filevine...`);
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download from Filevine: ${response.status} ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);
    console.log(`[DOWNLOAD] Downloaded ${fileBlob.size} bytes`);

    // Upload to Vercel Blob
    console.log(`[DOWNLOAD] Uploading to Vercel Blob...`);
    const blobResult = await put(filename, fileBlob, {
      access: 'public',
      addRandomSuffix: true,
    });
    console.log(`[DOWNLOAD] Uploaded to Vercel Blob: ${blobResult.url}`);

    // Update database with success
    await prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        status: 'completed',
        localFileUrl: blobResult.url,
        errorMessage: null,
      },
    });

    console.log(`[DOWNLOAD] ✅ Successfully processed document ${documentId}`);

    // Trigger text extraction for supported document types immediately
    const textExtractionService = new TextExtractionService();
    if (textExtractionService.isPdfFile(filename) || textExtractionService.isWordFile(filename)) {
      console.log(`[DOWNLOAD] Triggering text extraction for ${filename}`);
      extractTextInBackground(textExtractionService, documentId, blobResult.url, filename);
    }
  } catch (error: any) {
    console.error(`[DOWNLOAD] ❌ Error processing document ${documentId}:`, error);

    // Update database with failure
    await prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
      },
    });
  }
}

/**
 * Find and process pending documents
 */
export async function processPendingDocuments(): Promise<void> {
  console.log('[DOWNLOAD] Checking for pending documents...');

  try {
    // Find all pending documents (limit to 10 at a time)
    const pendingDocs = await prisma.importedDocument.findMany({
      where: {
        status: 'pending',
        downloadAttempts: { lt: 3 }, // Max 3 attempts
      },
      include: {
        caseFilevineProject: true,
      },
      take: 10,
      orderBy: { importedAt: 'asc' },
    });

    if (pendingDocs.length === 0) {
      console.log('[DOWNLOAD] No pending documents found');
      return;
    }

    console.log(`[DOWNLOAD] Found ${pendingDocs.length} pending documents`);

    // Process documents sequentially (to avoid overwhelming Filevine API)
    for (const doc of pendingDocs) {
      await processDocument({
        documentId: doc.id,
        filevineDocumentId: doc.filevineDocumentId,
        filevineProjectId: doc.caseFilevineProject.filevineProjectId,
        filename: doc.filename,
        organizationId: doc.caseFilevineProject.organizationId,
      });

      // Wait 1 second between downloads to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('[DOWNLOAD] Finished processing batch');
  } catch (error) {
    console.error('[DOWNLOAD] Error in processPendingDocuments:', error);
  }
}

/**
 * Start the document download worker
 * Runs every 30 seconds
 */
export function startDocumentDownloader(): NodeJS.Timeout {
  console.log('[DOWNLOAD] Starting document download worker...');

  // Process immediately on startup
  processPendingDocuments().catch(console.error);

  // Then process every 30 seconds
  return setInterval(() => {
    processPendingDocuments().catch(console.error);
  }, 30000); // 30 seconds
}

/**
 * Stop the document download worker
 */
export function stopDocumentDownloader(interval: NodeJS.Timeout): void {
  console.log('[DOWNLOAD] Stopping document download worker...');
  clearInterval(interval);
}

/**
 * Background worker to extract text from a document
 * Runs asynchronously without blocking the download worker
 */
async function extractTextInBackground(
  textExtractionService: TextExtractionService,
  documentId: string,
  fileUrl: string,
  filename: string
): Promise<void> {
  try {
    console.log(`[TEXT_EXTRACTION] Starting extraction for document ${documentId}`);

    // Update status to processing
    await prisma.importedDocument.update({
      where: { id: documentId },
      data: { textExtractionStatus: 'processing' },
    });

    // Extract text and upload to Vercel Blob
    const result = await textExtractionService.extractAndUploadText(fileUrl, filename, documentId);

    if (result) {
      // Save text URL and character count
      await prisma.importedDocument.update({
        where: { id: documentId },
        data: {
          extractedTextUrl: result.textUrl,
          extractedTextChars: result.charCount,
          textExtractionStatus: 'completed',
          textExtractedAt: new Date(),
        },
      });

      console.log(`[TEXT_EXTRACTION] Successfully extracted ${result.charCount} characters from document ${documentId}`);
      console.log(`[TEXT_EXTRACTION] Text stored at: ${result.textUrl}`);
    } else {
      // Not a supported file type
      await prisma.importedDocument.update({
        where: { id: documentId },
        data: {
          textExtractionStatus: 'not_needed',
          textExtractedAt: new Date(),
        },
      });

      console.log(`[TEXT_EXTRACTION] No extraction needed for document ${documentId}`);
    }
  } catch (error: any) {
    console.error(`[TEXT_EXTRACTION] Failed to extract text from document ${documentId}:`, error);

    // Update status to failed
    await prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        textExtractionStatus: 'failed',
        textExtractionError: error.message,
      },
    });
  }
}
