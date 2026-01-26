/**
 * Text Extraction Service
 * Extracts text from various document formats for AI processing
 *
 * Supported formats:
 * - PDF (via pdf-parse v1.1.1)
 * - DOCX (via mammoth)
 * - DOC (via word-extractor)
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

      // Load pdf-parse v1.1.1 - exports as a direct function
      const pdfParse = require('pdf-parse');

      // Parse the PDF (v1.1.1 works with direct function call)
      const data = await pdfParse(buffer);

      console.log(`[TEXT_EXTRACTION] Extracted ${data.text.length} characters from ${data.numpages} pages`);

      return data.text;
    } catch (error: any) {
      console.error('[TEXT_EXTRACTION] Error extracting text:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from a DOCX document (modern Word format)
   * @param fileUrl - URL to the DOCX file
   * @returns Extracted text content
   */
  async extractTextFromDocx(fileUrl: string): Promise<string> {
    try {
      console.log(`[TEXT_EXTRACTION] Downloading DOCX from: ${fileUrl}`);

      // Download the DOCX file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download DOCX: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[TEXT_EXTRACTION] Downloaded ${buffer.length} bytes`);

      // Load mammoth for DOCX parsing
      const mammoth = require('mammoth');

      // Extract raw text (ignores formatting)
      const result = await mammoth.extractRawText({ buffer });

      console.log(`[TEXT_EXTRACTION] Extracted ${result.value.length} characters from DOCX`);

      if (result.messages.length > 0) {
        console.log(`[TEXT_EXTRACTION] Mammoth messages:`, result.messages);
      }

      return result.value;
    } catch (error: any) {
      console.error('[TEXT_EXTRACTION] Error extracting text from DOCX:', error);
      throw new Error(`DOCX text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from a DOC document (legacy Word format)
   * @param fileUrl - URL to the DOC file
   * @returns Extracted text content
   */
  async extractTextFromDoc(fileUrl: string): Promise<string> {
    try {
      console.log(`[TEXT_EXTRACTION] Downloading DOC from: ${fileUrl}`);

      // Download the DOC file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download DOC: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[TEXT_EXTRACTION] Downloaded ${buffer.length} bytes`);

      // Load word-extractor for DOC parsing
      const WordExtractor = require('word-extractor');
      const extractor = new WordExtractor();

      // Extract text from buffer
      const extracted = await extractor.extract(buffer);
      const text = extracted.getBody();

      console.log(`[TEXT_EXTRACTION] Extracted ${text.length} characters from DOC`);

      return text;
    } catch (error: any) {
      console.error('[TEXT_EXTRACTION] Error extracting text from DOC:', error);
      throw new Error(`DOC text extraction failed: ${error.message}`);
    }
  }

  /**
   * Determine if a file is a PDF based on filename
   */
  isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Determine if a file is a DOCX based on filename
   */
  isDocxFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.docx');
  }

  /**
   * Determine if a file is a DOC based on filename
   */
  isDocFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.doc');
  }

  /**
   * Determine if a file is a Word document (DOC or DOCX)
   */
  isWordFile(filename: string): boolean {
    return this.isDocFile(filename) || this.isDocxFile(filename);
  }

  /**
   * Extract text from a document based on its file type
   * Supports PDF, DOCX, and DOC formats
   */
  async extractText(fileUrl: string, filename: string): Promise<string | null> {
    try {
      if (this.isPdfFile(filename)) {
        return await this.extractTextFromPdf(fileUrl);
      }

      if (this.isDocxFile(filename)) {
        return await this.extractTextFromDocx(fileUrl);
      }

      if (this.isDocFile(filename)) {
        return await this.extractTextFromDoc(fileUrl);
      }

      // For unsupported file types, return null (no extraction available)
      console.log(`[TEXT_EXTRACTION] No extraction available for file type: ${filename}`);
      return null;
    } catch (error: any) {
      console.error(`[TEXT_EXTRACTION] Failed to extract text from ${filename}:`, error);
      throw error;
    }
  }
}
