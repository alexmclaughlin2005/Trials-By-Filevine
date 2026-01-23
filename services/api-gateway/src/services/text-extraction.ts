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

      // Load pdf-parse dynamically at runtime
      const pdfParseModule = require('pdf-parse');

      // Log what we actually got to debug
      console.log(`[TEXT_EXTRACTION] pdf-parse module type: ${typeof pdfParseModule}`);
      console.log(`[TEXT_EXTRACTION] pdf-parse keys:`, Object.keys(pdfParseModule).slice(0, 10));

      // Try to find the actual parse function
      let pdfParse;
      if (typeof pdfParseModule === 'function') {
        pdfParse = pdfParseModule;
      } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
        pdfParse = pdfParseModule.default;
      } else if (pdfParseModule.PDFParse && typeof pdfParseModule.PDFParse === 'function') {
        pdfParse = pdfParseModule.PDFParse;
      } else {
        throw new Error(`Cannot find pdf-parse function. Module type: ${typeof pdfParseModule}, keys: ${Object.keys(pdfParseModule).join(', ')}`);
      }

      // Parse the PDF
      const data = await pdfParse(buffer);

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
