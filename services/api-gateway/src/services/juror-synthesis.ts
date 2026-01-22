import { ClaudeClient } from '@juries/ai-client';
import { PrismaClient } from '@juries/database';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface CaseContext {
  case_type: string;
  key_issues: string[];
  client_position: string;
}

export interface SynthesisInput {
  candidateId: string;
  caseId: string;
  caseContext: CaseContext;
}

export interface SynthesisJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  profileId?: string;
  error?: string;
}

/**
 * Service for synthesizing juror profiles using Claude API with web search
 */
export class JurorSynthesisService extends EventEmitter {
  private claudeClient: ClaudeClient;
  private anthropicClient: Anthropic;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    // Use ClaudeClient for simple calls
    this.claudeClient = new ClaudeClient({
      apiKey,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
    });

    // Use direct Anthropic client for web search tool
    this.anthropicClient = new Anthropic({
      apiKey,
    });
  }

  /**
   * Start a synthesis job for a candidate
   */
  async startSynthesis(input: SynthesisInput): Promise<SynthesisJob> {
    const { candidateId, caseId, caseContext } = input;

    // Verify candidate exists and belongs to the case's organization
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        juror: {
          include: {
            panel: {
              include: {
                case: true,
              },
            },
          },
        },
        sources: true,
      },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    if (candidate.juror.panel.case.id !== caseId) {
      throw new Error('Candidate does not belong to the specified case');
    }

    // Calculate context hash
    const contextHash = this.calculateContextHash(caseContext);

    // Check if we already have a synthesis for this candidate + context
    const existingProfile = await this.prisma.synthesizedProfile.findFirst({
      where: {
        candidateId,
        contextHash,
        status: 'completed',
      },
    });

    if (existingProfile) {
      return {
        id: existingProfile.id,
        status: 'completed',
        profileId: existingProfile.id,
      };
    }

    // Create a new synthesis profile (processing)
    const profile = await this.prisma.synthesizedProfile.create({
      data: {
        candidateId,
        caseId,
        caseContext: caseContext as any,
        contextHash,
        model: 'claude-sonnet-4-20250514',
        inputTokens: 0,
        outputTokens: 0,
        status: 'processing',
        profile: {},
      },
    });

    // Start the synthesis asynchronously
    this.executeSynthesis(profile.id, candidate, caseContext).catch((error) => {
      console.error('[JurorSynthesis] Synthesis failed:', error);
    });

    return {
      id: profile.id,
      status: 'processing',
    };
  }

  /**
   * Get synthesis status
   */
  async getSynthesisStatus(candidateId: string): Promise<SynthesisJob | null> {
    const profile = await this.prisma.synthesizedProfile.findFirst({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      status: profile.status as 'processing' | 'completed' | 'failed',
      profileId: profile.status === 'completed' ? profile.id : undefined,
      error: profile.errorMessage || undefined,
    };
  }

  /**
   * Get synthesized profile by ID
   */
  async getProfile(profileId: string) {
    return await this.prisma.synthesizedProfile.findUnique({
      where: { id: profileId },
    });
  }

  /**
   * Execute the synthesis with Claude API
   */
  private async executeSynthesis(
    profileId: string,
    candidate: any,
    caseContext: CaseContext
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Build the corpus from candidate data
      const corpus = this.buildCorpus(candidate);

      // Build the user message
      const userMessage = this.buildUserMessage(corpus, caseContext);

      // Build the system prompt
      const systemPrompt = this.buildSystemPrompt();

      // Call Claude API with web search tool
      const response = await this.anthropicClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        tools: [
          {
            type: 'web_search_20250305' as any,
            name: 'web_search',
            max_uses: 10,
          },
        ],
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      // Parse the JSON response
      let profileData;
      try {
        profileData = JSON.parse(textContent);
      } catch (parseError) {
        // Retry once with a note to return valid JSON
        console.warn('[JurorSynthesis] Invalid JSON response, retrying...');
        const retryResponse = await this.anthropicClient.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt + '\n\nIMPORTANT: Your previous response was not valid JSON. Please ensure you return ONLY valid JSON with no markdown formatting.',
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        });

        const retryText = retryResponse.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('');

        profileData = JSON.parse(retryText);
      }

      // Count web searches performed
      const webSearchCount = this.countWebSearches(response);

      // Extract metrics from profile
      const concernsCount = profileData.voir_dire_recommendations?.potential_concerns?.length || 0;
      const favorableCount = profileData.voir_dire_recommendations?.favorable_indicators?.length || 0;

      // Update the profile with the results
      const updatedProfile = await this.prisma.synthesizedProfile.update({
        where: { id: profileId },
        data: {
          profile: profileData as any,
          status: 'completed',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          webSearchCount,
          dataRichness: profileData.data_quality?.data_richness || null,
          confidenceOverall: profileData.data_quality?.confidence_overall || null,
          concernsCount,
          favorableCount,
          processingTimeMs: Date.now() - startTime,
        },
      });

      console.log(`[JurorSynthesis] Synthesis completed for profile ${profileId} in ${Date.now() - startTime}ms`);

      // Emit WebSocket event
      this.emit('synthesis_complete', {
        type: 'synthesis_complete',
        candidate_id: candidate.id,
        juror_id: candidate.jurorId,
        profile_id: profileId,
        data_richness: updatedProfile.dataRichness,
        confidence_overall: updatedProfile.confidenceOverall,
        concerns_count: updatedProfile.concernsCount,
        favorable_count: updatedProfile.favorableCount,
      });
    } catch (error: any) {
      console.error('[JurorSynthesis] Synthesis failed:', error);

      await this.prisma.synthesizedProfile.update({
        where: { id: profileId },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          processingTimeMs: Date.now() - startTime,
        },
      });
    }
  }

  /**
   * Build the system prompt for synthesis
   */
  private buildSystemPrompt(): string {
    return `You are a jury research analyst producing structured intelligence for trial attorneys.

Your task is to synthesize all available information about a potential juror into a structured profile that helps attorneys make informed decisions during jury selection.

Guidelines:
- Use null for unknown fields—never fabricate or speculate without evidence
- Every non-null claim must be supported by the provided data or your web searches
- Set confidence: "confirmed" only for facts directly stated in sources
- Set confidence: "inferred" for reasonable conclusions (and note the reasoning)
- Voir dire recommendations must reference specific findings
- Include both concerns AND favorable indicators—attorneys need balanced assessments
- Be conservative: sparse data should produce sparse output
- The summary should be 2-3 sentences highlighting factors most relevant to the client's position

You have access to web search. Use it to:
- Verify social media profiles
- Find news mentions
- Look up organizational affiliations
- Research employers or professional backgrounds

Do NOT search for information that would be inappropriate or unavailable through legitimate public sources.

Return ONLY valid JSON matching the provided schema. No markdown formatting, no explanations outside the JSON.`;
  }

  /**
   * Build the user message with juror data and case context
   */
  private buildUserMessage(corpus: string, caseContext: CaseContext): string {
    const schema = this.getOutputSchema();

    return `<juror_data>
${corpus}
</juror_data>

<case_context>
Case type: ${caseContext.case_type}
Key issues: ${caseContext.key_issues.join(', ')}
Client position: ${caseContext.client_position}
</case_context>

<schema>
${JSON.stringify(schema, null, 2)}
</schema>

Research this juror and return a structured profile as JSON.`;
  }

  /**
   * Build corpus from candidate data
   */
  private buildCorpus(candidate: any): string {
    const sections: string[] = [];

    sections.push(`Name: ${candidate.fullName}`);

    if (candidate.age) {
      sections.push(`Age: ${candidate.age}`);
    }

    if (candidate.city) {
      sections.push(`Location: ${candidate.city}${candidate.state ? `, ${candidate.state}` : ''}`);
    }

    if (candidate.occupation) {
      sections.push(`Occupation: ${candidate.occupation}`);
    }

    if (candidate.employer) {
      sections.push(`Employer: ${candidate.employer}`);
    }

    // Add voter registration if available from sources
    const voterSources = candidate.sources.filter((s: any) => s.sourceType === 'voter_record');
    if (voterSources.length > 0) {
      sections.push('\nVoter Registration:');
      for (const source of voterSources) {
        if (source.rawData) {
          const data = source.rawData;
          if (data.party) sections.push(`  Party: ${data.party}`);
          if (data.registrationDate) sections.push(`  Registered: ${data.registrationDate}`);
        }
      }
    }

    // Add FEC donations if available from sources
    const fecSources = candidate.sources.filter((s: any) => s.sourceType === 'fec_donation');
    if (fecSources.length > 0) {
      sections.push('\nPolitical Donations:');
      for (const source of fecSources) {
        if (source.rawData) {
          const data = source.rawData;
          sections.push(`  - $${data.amount} to ${data.recipientName} (${data.transactionDate})`);
        }
      }
    }

    // Add profile data if available
    if (candidate.profile) {
      const profile = candidate.profile;

      if (profile.socialProfiles && Array.isArray(profile.socialProfiles)) {
        sections.push('\nSocial Profiles:');
        for (const social of profile.socialProfiles) {
          sections.push(`  - ${social.platform}: ${social.url}`);
        }
      }

      if (profile.courtRecords && Array.isArray(profile.courtRecords)) {
        sections.push('\nCourt Records:');
        for (const record of profile.courtRecords) {
          sections.push(`  - ${record.caseType || 'Case'}: ${record.role || ''} (${record.year || ''})`);
        }
      }
    }

    return sections.join('\n');
  }

  /**
   * Get the output schema for the juror profile
   */
  private getOutputSchema() {
    return {
      schema_version: '1.0',
      juror_profile: {
        name: 'string',
        name_variations: ['string'],
        age: 'number | null',
        gender: 'string | null',
        photo_url: 'string | null',
        profile_urls: {
          linkedin: 'string | null',
          facebook: 'string | null',
          twitter: 'string | null',
          other: ['string'],
        },
        location: {
          city: 'string | null',
          county: 'string | null',
          state: 'string | null',
          residence_type: 'string | null',
          years_in_area: 'number | null',
        },
        occupation: {
          current_title: 'string | null',
          employer: 'string | null',
          industry: 'string | null',
          years_employed: 'number | null',
          management_level: 'none | individual_contributor | manager | executive | owner | null',
        },
        education: {
          highest_level: 'high_school | some_college | associates | bachelors | masters | doctorate | professional | unknown',
          field_of_study: 'string | null',
          institutions: ['string'],
        },
        family: {
          marital_status: 'string | null',
          children: 'number | null',
          household_notes: 'string | null',
        },
      },
      attitudes_and_affiliations: {
        political_indicators: {
          party_registration: 'democrat | republican | independent | libertarian | green | none | unknown',
          donation_history: [
            {
              recipient: 'string',
              amount: 'number',
              year: 'number',
              party: 'string | null',
            },
          ],
          public_statements: ['string'],
          confidence: 'confirmed | inferred | none',
        },
        organizational_memberships: [
          {
            organization: 'string',
            type: 'religious | professional | civic | political | union | fraternal | other',
            role: 'string | null',
            source: 'string',
          },
        ],
        community_involvement: ['string'],
        social_media_presence: {
          platforms_identified: ['string'],
          activity_level: 'high | moderate | low | none | unknown',
          notable_content: [
            {
              content: 'string',
              platform: 'string',
              relevance: 'string',
            },
          ],
        },
        worldview_indicators: [
          {
            indicator: 'string',
            source: 'string',
            source_url: 'string | null',
            confidence: 'confirmed | inferred',
          },
        ],
      },
      litigation_relevance: {
        prior_jury_service: {
          served: 'yes | no | unknown',
          details: 'string | null',
        },
        lawsuit_history: [
          {
            role: 'plaintiff | defendant | witness | party',
            case_type: 'string | null',
            outcome: 'string | null',
            year: 'number | null',
            source: 'string',
          },
        ],
        law_enforcement_connection: {
          has_connection: 'boolean',
          details: 'string | null',
        },
        legal_profession_connection: {
          has_connection: 'boolean',
          details: 'string | null',
        },
        medical_profession_connection: {
          has_connection: 'boolean',
          details: 'string | null',
        },
        industry_relevance: {
          relevant_experience: 'boolean',
          details: 'string | null',
        },
      },
      voir_dire_recommendations: {
        suggested_questions: [
          {
            question: 'string',
            rationale: 'string',
          },
        ],
        areas_to_probe: ['string'],
        potential_concerns: [
          {
            concern: 'string',
            evidence: 'string',
            severity: 'low | medium | high',
          },
        ],
        favorable_indicators: [
          {
            indicator: 'string',
            evidence: 'string',
          },
        ],
      },
      data_quality: {
        sources_consulted: ['string'],
        sources_count: 'number',
        data_richness: 'sparse | moderate | comprehensive',
        confidence_overall: 'low | medium | high',
        gaps_identified: ['string'],
      },
      summary: 'string',
    };
  }

  /**
   * Count the number of web searches performed in the response
   */
  private countWebSearches(response: any): number {
    // Count tool_use blocks of type web_search
    let count = 0;
    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === 'web_search') {
        count++;
      }
    }
    return count;
  }

  /**
   * Calculate a hash of the case context for cache invalidation
   */
  private calculateContextHash(caseContext: CaseContext): string {
    const str = JSON.stringify(caseContext);
    return createHash('sha256').update(str).digest('hex');
  }
}
