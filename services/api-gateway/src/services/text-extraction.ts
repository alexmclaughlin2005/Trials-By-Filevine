import pdfParse from 'pdf-parse';

/**
 * Text Extraction Service
 * Extracts text from PDF documents for AI processing
 */
export class TextExtractionService {
  /**
   * Extract text from a PDF document URL
   * @param fileUrl - URL to the PDF file (e.g., Vercel Blob URL)
   * @returns Extracted text content
   */
  async extractTextFromPdf(fileUrl: string): Promise<string> {
    try {
      console.log(`[TEXT_EXTRACTION] Downloading PDF from: ${fileUrl}`);

      // Download the PDF file using native fetch
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[TEXT_EXTRACTION] Downloaded ${buffer.length} bytes`);

      // Parse the PDF (handle both default and named exports)
      const parser = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
      if (typeof parser !== 'function') {
        console.error('[TEXT_EXTRACTION] pdfParse is not a function:', typeof pdfParse, Object.keys(pdfParse || {}));
        throw new Error('PDF parser not properly imported');
      }

      const data = await parser(buffer);

      console.log(`[TEXT_EXTRACTION] Extracted ${data.text.length} characters from ${data.numpages} pages`);

      return data.text;
    } catch (error: any) {
      console.error('[TEXT_EXTRACTION] Error extracting text:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Determine if a file is a PDF based on filename
   */
  isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Extract text from a document based on its file type
   * Currently only supports PDFs, but can be extended for other formats
   */
  async extractText(fileUrl: string, filename: string): Promise<string | null> {
    if (this.isPdfFile(filename)) {
      return await this.extractTextFromPdf(fileUrl);
    }

    // For non-PDF files, return null (no extraction available)
    console.log(`[TEXT_EXTRACTION] No extraction available for file type: ${filename}`);
    return null;
  }
}
