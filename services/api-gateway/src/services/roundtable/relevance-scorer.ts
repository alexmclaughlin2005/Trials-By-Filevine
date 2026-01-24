/**
 * RelevanceScorer - Computes relevance scores for personas against arguments
 *
 * Implements rule-based relevance scoring using:
 * - Topic matching (keyword overlap between persona and argument)
 * - Emotional trigger detection (persona-specific trigger keywords)
 * - Experience matching (life experiences relevant to argument domain)
 * - Values alignment (value conflicts/resonance with argument)
 */

export interface PersonaInfo {
  id: string;
  name: string;
  description: string;
  demographics?: any;
  worldview?: string;
  lifeExperiences?: any;
  dimensions?: any;
}

export interface ArgumentInfo {
  id: string;
  title: string;
  content: string;
}

export interface RelevanceScore {
  personaId: string;
  argumentId: string;
  topicMatch: number;          // 0.0 - 1.0
  emotionalTrigger: number;    // 0.0 - 1.0
  experienceMatch: number;     // 0.0 - 1.0
  valuesAlignment: number;     // 0.0 - 1.0
  compositeRelevance: number;  // Weighted average
}

/**
 * Domain keyword categories for matching personas to arguments
 */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  medical: ['hospital', 'medical', 'doctor', 'nurse', 'patient', 'healthcare', 'surgery', 'treatment', 'diagnosis', 'medicine'],
  legal: ['law', 'attorney', 'court', 'judge', 'lawsuit', 'legal', 'trial', 'verdict'],
  business: ['company', 'business', 'profit', 'revenue', 'corporate', 'shareholders', 'management', 'executive'],
  technical: ['technology', 'software', 'engineering', 'technical', 'system', 'computer', 'data'],
  construction: ['construction', 'building', 'contractor', 'safety', 'worksite', 'architect', 'engineer'],
  financial: ['money', 'financial', 'investment', 'bank', 'accounting', 'budget', 'cost'],
  safety: ['safety', 'danger', 'risk', 'harm', 'injury', 'death', 'accident', 'negligence'],
  fairness: ['unfair', 'unjust', 'discrimination', 'bias', 'inequality', 'rights', 'justice']
};

/**
 * Emotional trigger keywords that indicate strong relevance
 */
const EMOTIONAL_TRIGGERS: Record<string, string[]> = {
  healthcare: ['hospital', 'medical', 'doctor', 'nurse', 'patient', 'healthcare'],
  corporate: ['company', 'profit', 'business', 'corporation', 'shareholders'],
  safety: ['safety', 'danger', 'risk', 'harm', 'injury', 'death'],
  fairness: ['unfair', 'unjust', 'discrimination', 'bias', 'inequality']
};

export class RelevanceScorer {
  /**
   * Compute relevance score for persona against argument
   */
  scoreRelevance(persona: PersonaInfo, argument: ArgumentInfo): RelevanceScore {
    const topicMatch = this.computeTopicMatch(persona, argument);
    const emotionalTrigger = this.detectEmotionalTriggers(persona, argument);
    const experienceMatch = this.matchExperience(persona, argument);
    const valuesAlignment = this.assessValuesAlignment(persona, argument);

    // Weighted composite (adjust weights as needed)
    const compositeRelevance = (
      topicMatch * 0.35 +
      emotionalTrigger * 0.25 +
      experienceMatch * 0.25 +
      valuesAlignment * 0.15
    );

    return {
      personaId: persona.id,
      argumentId: argument.id,
      topicMatch,
      emotionalTrigger,
      experienceMatch,
      valuesAlignment,
      compositeRelevance
    };
  }

  /**
   * Compute topic match using keyword overlap
   */
  private computeTopicMatch(persona: PersonaInfo, argument: ArgumentInfo): number {
    // Create text representation of persona
    const personaText = [
      persona.description,
      persona.worldview || '',
      JSON.stringify(persona.lifeExperiences || {})
    ].join(' ').toLowerCase();

    const argumentText = argument.content.toLowerCase();

    // Extract keywords from both
    const personaKeywords = this.extractSignificantKeywords(personaText);
    const argumentKeywords = this.extractSignificantKeywords(argumentText);

    // Compute Jaccard similarity
    const intersection = new Set([...personaKeywords].filter(k => argumentKeywords.has(k)));
    const union = new Set([...personaKeywords, ...argumentKeywords]);

    if (union.size === 0) return 0.3; // Neutral baseline

    return Math.min(intersection.size / union.size + 0.2, 1.0); // Add baseline boost
  }

  /**
   * Detect if argument contains emotional trigger keywords for persona
   */
  private detectEmotionalTriggers(persona: PersonaInfo, argument: ArgumentInfo): number {
    const argumentLower = argument.content.toLowerCase();

    // Identify persona categories from their background
    const personaCategories = this.identifyPersonaCategories(persona);

    let triggerScore = 0;
    let maxTriggers = 0;

    for (const category of personaCategories) {
      const triggers = EMOTIONAL_TRIGGERS[category] || [];
      maxTriggers += triggers.length;

      for (const trigger of triggers) {
        if (argumentLower.includes(trigger)) {
          triggerScore++;
        }
      }
    }

    // If no categories matched, return neutral
    if (maxTriggers === 0) return 0.4;

    return Math.min(triggerScore / maxTriggers + 0.2, 1.0); // Add baseline boost
  }

  /**
   * Match persona's life experiences to argument domain
   */
  private matchExperience(persona: PersonaInfo, argument: ArgumentInfo): number {
    const experiences = persona.lifeExperiences || {};
    const experienceText = JSON.stringify(experiences).toLowerCase();

    // Extract domains from argument
    const argumentDomains = this.extractDomains(argument.content);

    let matchCount = 0;
    for (const domain of argumentDomains) {
      const keywords = DOMAIN_KEYWORDS[domain] || [];
      for (const keyword of keywords) {
        if (experienceText.includes(keyword)) {
          matchCount++;
          break; // Count domain match once
        }
      }
    }

    if (argumentDomains.length === 0) return 0.4; // Neutral baseline

    return Math.min((matchCount / argumentDomains.length) + 0.2, 1.0); // Add baseline boost
  }

  /**
   * Assess how argument aligns with persona's core values
   * Both positive and negative alignment create relevance
   */
  private assessValuesAlignment(persona: PersonaInfo, argument: ArgumentInfo): number {
    const worldview = (persona.worldview || '').toLowerCase();
    const description = (persona.description || '').toLowerCase();
    const argumentLower = argument.content.toLowerCase();

    // Value markers that indicate strong opinions
    const valueMarkers = {
      'pro-business': ['profit', 'business', 'economic', 'market', 'company'],
      'pro-regulation': ['safety', 'regulation', 'oversight', 'accountability', 'protect'],
      'individualist': ['personal', 'individual', 'freedom', 'choice', 'responsibility'],
      'collectivist': ['community', 'society', 'public', 'common', 'together']
    };

    let alignmentScore = 0.5; // Neutral baseline
    let matchedValues = 0;

    // Check for value conflicts/resonance
    for (const [value, markers] of Object.entries(valueMarkers)) {
      const personaHasValue = markers.some(m => worldview.includes(m) || description.includes(m));
      const argumentMentionsValue = markers.some(m => argumentLower.includes(m));

      if (personaHasValue && argumentMentionsValue) {
        alignmentScore += 0.15; // Relevance increased
        matchedValues++;
      }
    }

    // Cap at 1.0
    return Math.min(alignmentScore, 1.0);
  }

  /**
   * Identify persona categories from life experiences and worldview
   */
  private identifyPersonaCategories(persona: PersonaInfo): string[] {
    const categories: string[] = [];
    const text = [
      persona.description,
      persona.worldview || '',
      JSON.stringify(persona.lifeExperiences || {})
    ].join(' ').toLowerCase();

    if (/health|medical|nurse|doctor|hospital/.test(text)) {
      categories.push('healthcare');
    }
    if (/business|corporate|company|executive/.test(text)) {
      categories.push('corporate');
    }
    if (/safety|military|police|security/.test(text)) {
      categories.push('safety');
    }
    if (/fair|justice|rights|equal/.test(text)) {
      categories.push('fairness');
    }

    return categories;
  }

  /**
   * Extract domain keywords from argument text
   */
  private extractDomains(text: string): string[] {
    const domains: string[] = [];
    const textLower = text.toLowerCase();

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (keywords.some(k => textLower.includes(k))) {
        domains.push(domain);
      }
    }

    return domains;
  }

  /**
   * Extract significant keywords from text (remove stopwords)
   */
  private extractSignificantKeywords(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their',
      'my', 'your', 'his', 'her', 'its', 'our', 'who', 'what', 'when', 'where'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));

    return new Set(words);
  }
}
