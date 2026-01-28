import { PromptClient } from '@juries/prompt-client';
import type { ContentBlock } from '@anthropic-ai/sdk/resources';

interface ArgumentInput {
  id: string;
  title: string;
  content: string;
  argumentType: string;
}

interface CaseContextInput {
  caseName: string;
  caseType: string;
  ourSide: string;
  facts?: Array<{
    content: string;
    factType: string;
  }>;
}

interface GenerateQuestionsInput {
  caseContext: CaseContextInput;
  arguments: ArgumentInput[];
}

export interface SuggestedQuestion {
  id: string; // Generated client-side ID
  question: string;
  purpose: string;
  targetArchetypes: string[];
  argumentId: string;
  argumentTitle: string;
  isAISuggested: true;
}

interface QuestionGenerationResult {
  questionsByArgument: Array<{
    argumentId: string;
    argumentTitle: string;
    questions: Array<{
      question: string;
      purpose: string;
      targetArchetypes: string[];
    }>;
  }>;
}

/**
 * Service for generating AI-suggested questions for focus group simulations
 *
 * Uses the Prompt Management Service to generate strategic questions that
 * attorneys can ask virtual focus group personas about trial arguments.
 */
export class FocusGroupQuestionGeneratorService {
  private promptClient: PromptClient;

  constructor(anthropicApiKey: string) {
    const promptServiceUrl = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';

    this.promptClient = new PromptClient({
      serviceUrl: promptServiceUrl,
      anthropicApiKey,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
    });
  }

  /**
   * Generate suggested questions for focus group arguments
   */
  async generateQuestions(input: GenerateQuestionsInput): Promise<SuggestedQuestion[]> {
    try {
      console.log('[FocusGroupQuestionGenerator] Starting question generation');
      console.log('[FocusGroupQuestionGenerator] Input:', {
        caseName: input.caseContext.caseName,
        argumentCount: input.arguments.length,
      });

      // Format case context for prompt
      const caseContextText = this.formatCaseContext(input.caseContext);

      console.log('[FocusGroupQuestionGenerator] Calling prompt service...');
      console.log('[FocusGroupQuestionGenerator] Prompt service URL:', process.env.PROMPT_SERVICE_URL || 'http://localhost:3002');

      // Execute prompt via Prompt Service
      const { result, promptMeta } = await this.promptClient.execute('focus-group-questions', {
        variables: {
          caseContext: caseContextText,
          arguments: input.arguments.map((arg) => ({
            id: arg.id,
            title: arg.title,
            content: arg.content,
            argumentType: arg.argumentType,
          })),
        },
      });

      console.log('[FocusGroupQuestionGenerator] Received response from prompt service');
      console.log('[FocusGroupQuestionGenerator] Token usage:', result.usage);
      console.log('[FocusGroupQuestionGenerator] Response content blocks:', result.content.length);

      // Extract text content from response
      const textContent = result.content
        .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('');

      console.log('[FocusGroupQuestionGenerator] Extracted text content length:', textContent.length);
      console.log('[FocusGroupQuestionGenerator] Text content preview:', textContent.substring(0, 200));

      // Parse response
      const parsedResult = this.parseResponse(textContent);
      
      console.log('[FocusGroupQuestionGenerator] Parsed result:', {
        argumentCount: parsedResult.questionsByArgument.length,
        totalQuestions: parsedResult.questionsByArgument.reduce((sum, arg) => sum + arg.questions.length, 0),
      });

      // Track result with analytics
      await this.promptClient.trackResult('focus-group-questions', {
        versionId: promptMeta.versionId,
        abTestId: promptMeta.abTestId,
        success: true,
        tokensUsed: result.usage.input_tokens + result.usage.output_tokens,
        latencyMs: 0, // Already tracked by execute()
        metadata: {
          argumentCount: input.arguments.length,
          questionCount: parsedResult.questionsByArgument.reduce(
            (sum, arg) => sum + arg.questions.length,
            0
          ),
        },
      });

      // Convert to SuggestedQuestion format
      const suggestedQuestions: SuggestedQuestion[] = [];

      for (const argResult of parsedResult.questionsByArgument) {
        for (const question of argResult.questions) {
          suggestedQuestions.push({
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            question: question.question,
            purpose: question.purpose,
            targetArchetypes: question.targetArchetypes,
            argumentId: argResult.argumentId,
            argumentTitle: argResult.argumentTitle,
            isAISuggested: true,
          });
        }
      }

      console.log('[FocusGroupQuestionGenerator] Generated', suggestedQuestions.length, 'questions');
      return suggestedQuestions;
    } catch (error) {
      console.error('[FocusGroupQuestionGenerator] ERROR:', error);
      console.error('[FocusGroupQuestionGenerator] Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Track failure
      try {
        await this.promptClient.trackResult('focus-group-questions', {
          versionId: 'unknown',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (trackError) {
        console.error('[FocusGroupQuestionGenerator] Failed to track error:', trackError);
      }

      // Return empty array on error (graceful degradation)
      console.log('[FocusGroupQuestionGenerator] Returning empty array due to error');
      return [];
    }
  }

  /**
   * Format case context as readable text
   */
  private formatCaseContext(context: CaseContextInput): string {
    const parts = [
      `**Case Name:** ${context.caseName}`,
      `**Case Type:** ${context.caseType}`,
      `**Our Position:** ${context.ourSide}`,
    ];

    if (context.facts && context.facts.length > 0) {
      parts.push('\n**Key Facts:**');
      context.facts.forEach((fact) => {
        parts.push(`- [${fact.factType}] ${fact.content}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Parse AI response into structured format
   */
  private parseResponse(content: string): QuestionGenerationResult {
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonContent.trim());

      // Validate structure
      if (!parsed.questionsByArgument || !Array.isArray(parsed.questionsByArgument)) {
        throw new Error('Invalid response structure: missing questionsByArgument array');
      }

      return {
        questionsByArgument: parsed.questionsByArgument.map((argData: any) => ({
          argumentId: argData.argumentId || '',
          argumentTitle: argData.argumentTitle || '',
          questions: Array.isArray(argData.questions)
            ? argData.questions.map((q: any) => ({
                question: q.question || '',
                purpose: q.purpose || '',
                targetArchetypes: Array.isArray(q.targetArchetypes) ? q.targetArchetypes : ['all'],
              }))
            : [],
        })),
      };
    } catch (error) {
      console.error('Failed to parse question generation response:', error);
      console.error('Raw content:', content);

      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
