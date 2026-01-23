/**
 * Text Extraction Service
 * Extracts text from PDF documents for AI processing
 */
export class TextExtractionService {
  private pdfParser: any;

  constructor() {
    // Use require for better CommonJS compatibility
    try {
      const pdfParseModule = require('pdf-parse');

      // pdf-parse exports a function directly, but might be wrapped
      // Try different export patterns
      if (typeof pdfParseModule === 'function') {
        this.pdfParser = pdfParseModule;
      } else if (typeof pdfParseModule.default === 'function') {
        this.pdfParser = pdfParseModule.default;
      } else {
        // Log what we actually got
        console.error('[TEXT_EXTRACTION] pdf-parse structure:', {
          type: typeof pdfParseModule,
          keys: Object.keys(pdfParseModule),
          hasDefault: !!pdfParseModule.default,
          defaultType: typeof pdfParseModule.default
        });
        throw new Error('Could not find pdf-parse function in module exports');
      }

      console.log('[TEXT_EXTRACTION] Successfully loaded pdf-parse');
    } catch (error) {
      console.error('[TEXT_EXTRACTION] Failed to load pdf-parse:', error);
      throw new Error('PDF parser could not be loaded');
    }
  }
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

      // Parse the PDF using the loaded parser
      const data = await this.pdfParser(buffer);

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
