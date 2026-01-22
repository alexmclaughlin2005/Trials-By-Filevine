/**
 * OCR Service using Claude Vision API
 *
 * Extracts juror information from images using Claude's vision capabilities.
 * Supports:
 * - Jury lists/rosters
 * - Individual questionnaires
 * - Handwritten notes
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@trialforge/database';

export interface OCRResult {
  success: boolean;
  extractedJurors: ExtractedJuror[];
  confidence: number;
  rawResponse: string;
  errorMessage?: string;
}

export interface ExtractedJuror {
  jurorNumber?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  city?: string;
  zipCode?: string;
  occupation?: string;
  employer?: string;
  confidence: number;
  needsReview: boolean;
}

export class OCRService {
  private anthropic: Anthropic;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.prisma = prisma;
  }

  /**
   * Process an image and extract juror information
   */
  async processImage(
    captureId: string,
    imageUrl: string,
    documentType: string
  ): Promise<OCRResult> {
    console.log(`[OCR] Processing capture ${captureId} (${documentType})`);

    try {
      // Read image as base64
      const imageData = await this.fetchImageAsBase64(imageUrl);

      // Create prompt based on document type
      const prompt = this.createPrompt(documentType);

      // Call Claude Vision API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageData.mediaType,
                  data: imageData.base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Parse response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const result = this.parseResponse(textContent.text);

      console.log(`[OCR] Extracted ${result.extractedJurors.length} jurors`);

      return result;
    } catch (error) {
      console.error('[OCR] Processing failed:', error);
      return {
        success: false,
        extractedJurors: [],
        confidence: 0,
        rawResponse: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch image from URL and convert to base64
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<{
    base64: string;
    mediaType: string;
  }> {
    // If it's a local file path, read it directly
    if (imageUrl.startsWith('/') || imageUrl.startsWith('file://')) {
      const fs = await import('fs/promises');
      const path = imageUrl.replace('file://', '');
      const buffer = await fs.readFile(path);
      const base64 = buffer.toString('base64');

      // Determine media type from file extension
      const ext = path.split('.').pop()?.toLowerCase();
      const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';

      return { base64, mediaType };
    }

    // Otherwise, fetch from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mediaType = response.headers.get('content-type') || 'image/jpeg';

    return { base64, mediaType };
  }

  /**
   * Create prompt based on document type
   */
  private createPrompt(documentType: string): string {
    const baseInstructions = `You are an expert at extracting juror information from legal documents. Analyze this ${documentType} image and extract all juror information.

Extract the following fields for each juror (if available):
- Juror Number
- First Name (required)
- Last Name (required)
- Age
- City
- ZIP Code
- Occupation
- Employer

Return your response in JSON format with this structure:
{
  "jurors": [
    {
      "jurorNumber": "1",
      "firstName": "John",
      "lastName": "Doe",
      "age": 35,
      "city": "Los Angeles",
      "zipCode": "90001",
      "occupation": "Engineer",
      "employer": "Tech Corp",
      "confidence": 95
    }
  ]
}

Important:
- confidence: 0-100 scale indicating how confident you are in the extraction
- Set confidence to 100 for printed text that is clearly readable
- Set confidence to 50-80 for handwritten text or low quality images
- Set confidence to <50 for uncertain extractions
- Only include fields you can actually see - omit fields with no data
- For names, extract exactly as shown, preserving capitalization
- If you see a table, extract each row as a separate juror
- If multiple pages are visible, extract from all pages`;

    if (documentType === 'questionnaire') {
      return baseInstructions + '\n\nNote: This is a single juror questionnaire. Extract one juror\'s information.';
    } else if (documentType === 'panel_list') {
      return baseInstructions + '\n\nNote: This is a jury panel list/roster. Extract all jurors from the table/list.';
    } else {
      return baseInstructions + '\n\nNote: Extract any juror information you can identify from this document.';
    }
  }

  /**
   * Parse Claude's JSON response
   */
  private parseResponse(text: string): OCRResult {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.jurors || !Array.isArray(parsed.jurors)) {
        throw new Error('Invalid response format: missing jurors array');
      }

      // Process each juror
      const extractedJurors: ExtractedJuror[] = parsed.jurors.map((j: any) => {
        const confidence = j.confidence || 80;
        return {
          jurorNumber: j.jurorNumber?.toString(),
          firstName: j.firstName,
          lastName: j.lastName,
          age: j.age ? parseInt(j.age, 10) : undefined,
          city: j.city,
          zipCode: j.zipCode,
          occupation: j.occupation,
          employer: j.employer,
          confidence,
          needsReview: confidence < 80,
        };
      });

      // Calculate overall confidence (average of all juror confidences)
      const avgConfidence = extractedJurors.length > 0
        ? Math.round(
            extractedJurors.reduce((sum, j) => sum + j.confidence, 0) / extractedJurors.length
          )
        : 0;

      return {
        success: true,
        extractedJurors,
        confidence: avgConfidence,
        rawResponse: text,
      };
    } catch (error) {
      console.error('[OCR] Failed to parse response:', error);
      return {
        success: false,
        extractedJurors: [],
        confidence: 0,
        rawResponse: text,
        errorMessage: error instanceof Error ? error.message : 'Parse error',
      };
    }
  }

  /**
   * Update capture with OCR results
   */
  async updateCapture(
    captureId: string,
    result: OCRResult
  ): Promise<void> {
    await this.prisma.capture.update({
      where: { id: captureId },
      data: {
        status: result.success ? 'completed' : 'failed',
        ocrProvider: 'claude-vision',
        extractedJurors: result.extractedJurors,
        jurorCount: result.extractedJurors.length,
        confidence: result.confidence,
        needsReview: result.confidence < 80 || result.extractedJurors.some((j) => j.needsReview),
        rawOcrResult: { response: result.rawResponse },
        errorMessage: result.errorMessage,
        processedAt: new Date(),
      },
    });
  }
}
