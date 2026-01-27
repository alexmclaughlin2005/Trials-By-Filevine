/**
 * PDF Generation Utilities
 *
 * Core functions for generating PDF documents from React-PDF components
 */

import { renderToStream } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocument = ReactElement<any>;

/**
 * Generate a PDF from a React-PDF document component
 * Returns a Buffer that can be sent as a response or saved to disk
 */
export async function generatePDFBuffer(document: PDFDocument): Promise<Buffer> {
  try {
    const stream = await renderToStream(document);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate PDF and return as base64 string (useful for email attachments)
 */
export async function generatePDFBase64(document: PDFDocument): Promise<string> {
  const buffer = await generatePDFBuffer(document);
  return buffer.toString('base64');
}

/**
 * Generate PDF filename with timestamp
 */
export function generatePDFFilename(
  prefix: string,
  caseName?: string,
  extension: string = 'pdf'
): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeCaseName = caseName
    ? `-${caseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
    : '';

  return `${prefix}${safeCaseName}-${timestamp}.${extension}`;
}

/**
 * Get content-disposition header value for PDF download
 */
export function getPDFContentDisposition(filename: string): string {
  // Encode filename to handle special characters
  const encodedFilename = encodeURIComponent(filename);
  return `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`;
}

/**
 * Error handling wrapper for PDF generation
 */
export async function safeGeneratePDF(
  documentGenerator: () => PDFDocument,
  errorMessage: string = 'Failed to generate PDF'
): Promise<{ success: true; buffer: Buffer } | { success: false; error: string }> {
  try {
    const document = documentGenerator();
    const buffer = await generatePDFBuffer(document);
    return { success: true, buffer };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}
