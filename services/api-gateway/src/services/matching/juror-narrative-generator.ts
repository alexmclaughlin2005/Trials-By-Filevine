/**
 * Juror Narrative Generator
 * 
 * Generates a natural language narrative from all juror data
 * for use in embedding similarity matching.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';

export class JurorNarrativeGenerator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a comprehensive narrative describing the juror
   */
  async generateNarrative(jurorId: string): Promise<string> {
    const juror = await this.prisma.juror.findUnique({
      where: { id: jurorId },
      include: {
        researchArtifacts: {
          where: {
            userAction: { in: ['confirmed', 'pending'] },
          },
          orderBy: {
            retrievedAt: 'desc',
          },
          take: 10, // Limit to most recent
        },
        extractedSignals: {
          include: {
            signal: true,
          },
          orderBy: {
            extractedAt: 'desc',
          },
        },
        voirDireResponses: {
          orderBy: {
            responseTimestamp: 'desc',
          },
          take: 20, // Get more, then filter to those with answers
        },
        panel: {
          include: {
            case: {
              select: {
                caseType: true,
              },
            },
          },
        },
      },
    });

    if (!juror) {
      throw new Error(`Juror ${jurorId} not found`);
    }

    const parts: string[] = [];

    // Basic demographics
    parts.push('Demographics:');
    if (juror.age) parts.push(`Age: ${juror.age}`);
    if (juror.occupation) parts.push(`Occupation: ${juror.occupation}`);
    if (juror.employer) parts.push(`Employer: ${juror.employer}`);
    if (juror.city) parts.push(`Location: ${juror.city}`);
    if (juror.questionnaireData) {
      const qData = juror.questionnaireData as Record<string, any>;
      if (qData.education) parts.push(`Education: ${qData.education}`);
      if (qData.maritalStatus) parts.push(`Marital Status: ${qData.maritalStatus}`);
      if (qData.children !== undefined) parts.push(`Has Children: ${qData.children}`);
      if (qData.priorJuryService !== undefined) {
        parts.push(`Prior Jury Service: ${qData.priorJuryService ? 'Yes' : 'No'}`);
      }
    }

    // Extracted signals (grouped by category)
    const signalsByCategory = new Map<string, Array<{ signal: { category: string; name: string } }>>();
    for (const js of juror.extractedSignals) {
      const category = js.signal.category;
      if (!signalsByCategory.has(category)) {
        signalsByCategory.set(category, []);
      }
      signalsByCategory.get(category)!.push(js);
    }

    if (signalsByCategory.size > 0) {
      parts.push('\nBehavioral Indicators:');
      for (const [category, signals] of signalsByCategory) {
        const signalNames = signals
          .map((js: { signal: { name: string } }) => js.signal.name)
          .filter((name: string, idx: number, arr: string[]) => arr.indexOf(name) === idx); // Unique
        if (signalNames.length > 0) {
          parts.push(`${category}: ${signalNames.join(', ')}`);
        }
      }
    }

    // Research findings
    if (juror.researchArtifacts.length > 0) {
      parts.push('\nResearch Findings:');
      for (const artifact of juror.researchArtifacts.slice(0, 3)) {
        // Use summary if available, otherwise truncate raw content
        const content =
          (artifact.extractedSnippets as any)?.summary ||
          artifact.rawContent?.substring(0, 200) ||
          '';
        if (content) {
          parts.push(`[${artifact.sourceType}]: ${content}`);
        }
      }
    }

    // Voir dire responses (only include responses with answers)
    const voirDireWithAnswers = juror.voirDireResponses.filter(
      (r: { responseSummary: string | null; yesNoAnswer: boolean | null }) => r.responseSummary || r.yesNoAnswer !== null
    );
    
    if (voirDireWithAnswers.length > 0) {
      parts.push('\nVoir Dire Responses:');
      for (const response of voirDireWithAnswers) {
        const questionPreview = response.questionText.substring(0, 100);
        let answerText = '';
        
        if (response.yesNoAnswer !== null) {
          answerText = response.yesNoAnswer ? 'Yes' : 'No';
          if (response.responseSummary) {
            answerText += ` - ${response.responseSummary.substring(0, 100)}`;
          }
        } else {
          answerText = response.responseSummary.substring(0, 150);
        }
        
        parts.push(`Q: ${questionPreview}`);
        parts.push(`A: ${answerText}`);
      }
    }

    // Case context (if available)
    if (juror.panel?.case) {
      parts.push('\nCase Context:');
      if (juror.panel.case.caseType) {
        parts.push(`Case Type: ${juror.panel.case.caseType}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Generate a shorter summary narrative (for caching)
   */
  async generateSummary(jurorId: string): Promise<string> {
    const juror = await this.prisma.juror.findUnique({
      where: { id: jurorId },
      include: {
        extractedSignals: {
          include: {
            signal: true,
          },
          take: 10, // Top signals only
        },
      },
    });

    if (!juror) {
      throw new Error(`Juror ${jurorId} not found`);
    }

    const parts: string[] = [];

    if (juror.occupation) parts.push(juror.occupation);
    if (juror.age) parts.push(`age ${juror.age}`);
    if (juror.questionnaireData) {
      const qData = juror.questionnaireData as Record<string, any>;
      if (qData.education) parts.push(qData.education);
    }

    const topSignals = juror.extractedSignals
      .slice(0, 5)
      .map((js) => js.signal.name)
      .join(', ');

    if (topSignals) {
      parts.push(`Key traits: ${topSignals}`);
    }

    return parts.join(', ');
  }
}
