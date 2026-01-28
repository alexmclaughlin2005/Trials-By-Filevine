/**
 * Archetype System V2.0 - Type Definitions
 *
 * Updated archetype and persona structure with clearer definitions
 * and more memorable persona names.
 */

// ============================================
// ARCHETYPE MASTER REFERENCE
// ============================================

export interface ArchetypeMasterReference {
  meta: {
    version: string;
    description: string;
    last_updated: string;
  };
  archetypes: ArchetypeDefinition[];
  quick_reference: {
    must_strike_for_plaintiff: string[];
    must_strike_for_defense: string[];
    both_sides_want: string[];
    depends_on_composition: string[];
    challenge_for_cause: string[];
  };
}

export interface ArchetypeDefinition {
  id: string; // "bootstrapper", "crusader", etc.
  display_name: string; // "The Bootstrapper"
  one_liner: string; // Brief tagline
  verdict_lean: string; // "STRONG DEFENSE", "STRONG PLAINTIFF", "NEUTRAL", etc.
  danger_rating: {
    for_plaintiff: number | string; // 1-5 or "Varies"
    for_defense: number | string; // 1-5 or "Varies"
  };
  core_belief: string; // What they fundamentally believe
  in_deliberation: string; // How they behave in deliberations
  recognize_by: string[]; // Array of detection indicators
  plaintiff_strategy?: string; // Strategy for plaintiff side
  defense_strategy?: string; // Strategy for defense side
  key_insight?: string; // Special notes (for Captain, Trojan Horse, etc.)
  subtypes?: string[]; // For Scarred and Maverick
  strategy?: string; // Generic strategy (for Trojan Horse)
}

// ============================================
// PERSONA FILES (bootstrappers.json, etc.)
// ============================================

export interface PersonaFile {
  archetype: string; // "bootstrapper", "crusader", etc.
  display_name: string; // "The Bootstrapper"
  tagline: string; // Brief description
  verdict_lean: string; // "STRONG DEFENSE", etc.
  danger_for_plaintiff: number; // 1-5
  danger_for_defense: number; // 1-5
  what_they_believe: string; // Core beliefs
  how_they_behave_in_deliberation: string; // Deliberation behavior
  how_to_spot_them: string[]; // Recognition indicators
  personas: PersonaV2[];
}

export interface PersonaV2 {
  id: string; // "BOOT_01", "CRUS_01", etc.
  name: string; // "Bootstrap Bob", "Woke Wendy"
  tagline: string; // Characteristic phrase
  instant_read: string; // One-sentence summary

  demographics: PersonaDemographics;
  backstory: string;
  phrases_youll_hear: string[];
  verdict_prediction: VerdictPrediction;
  strike_or_keep: StrikeOrKeep;

  // Optional field for Captain personas
  secondary_archetype?: string;
}

export interface PersonaDemographics {
  age: number;
  gender: string;
  race: string;
  location: string; // "City, State (urban/suburban/rural)"
  education: string;
  occupation: string;
  income: number;
  family: string;
  religion: string;
  politics: string;
}

export interface VerdictPrediction {
  liability_finding_probability: number; // 0.0 - 1.0
  damages_if_liability: string; // Description of expected damages
  role_in_deliberation: string; // How they'll participate
}

export interface StrikeOrKeep {
  plaintiff_strategy: string; // e.g., "MUST STRIKE. Dream juror who will do your work for you."
  defense_strategy: string; // e.g., "KEEP. Will fight for maximum verdict."
}

// ============================================
// DATABASE MAPPING TYPES
// ============================================

/**
 * Type for inserting personas into database
 */
export interface PersonaInsert {
  // Basic Information
  name: string;
  nickname?: string;
  description: string;
  tagline?: string;

  // Archetype Classification
  archetype: string;
  archetypeStrength?: number;
  secondaryArchetype?: string;

  // NEW: Archetype-level guidance (copied from persona file)
  archetypeVerdictLean?: string;
  archetypeWhatTheyBelieve?: string;
  archetypeDeliberationBehavior?: string;
  archetypeHowToSpot?: string[]; // JSON array

  // NEW: Persona-specific fields
  instantRead?: string;
  phrasesYoullHear?: string[]; // JSON array
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strikeOrKeep?: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };

  // Demographics and other existing fields
  demographics?: PersonaDemographics;
  dimensions?: any;
  lifeExperiences?: any;
  characteristicPhrases?: string[];
  voirDireResponses?: any;
  deliberationBehavior?: any;

  // Strategic Guidance
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  causeChallenge?: any;
  strategyGuidance?: any;

  // Metadata
  sourceType: 'system' | 'ai_generated' | 'user_created';
  organizationId?: string; // NULL for system personas
  isActive?: boolean;
  version?: number;
}

// ============================================
// VALIDATION RULES
// ============================================

export const VALID_ARCHETYPES = [
  'bootstrapper',
  'crusader',
  'scale_balancer',
  'captain',
  'chameleon',
  'scarred',
  'calculator',
  'heart',
  'trojan_horse',
  'maverick'
] as const;

export type ArchetypeId = typeof VALID_ARCHETYPES[number];

export const VERDICT_LEANS = [
  'STRONG DEFENSE',
  'STRONG PLAINTIFF',
  'SLIGHT DEFENSE',
  'SLIGHT PLAINTIFF',
  'NEUTRAL',
  'DEPENDS ON SECONDARY TYPE',
  'DEPENDS ON THEIR EXPERIENCE',
  'FOLLOWS THE ROOM',
  'HIDDEN (varies)',
  'UNPREDICTABLE'
] as const;

export type VerdictLean = typeof VERDICT_LEANS[number];

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Mapping from old persona IDs to new persona IDs
 */
export interface PersonaIdMapping {
  oldId: string; // e.g., "BOOT_1.1_BootstrapBob"
  newId: string; // e.g., "BOOT_01"
  newName: string; // e.g., "Bootstrap Bob"
  archetype: ArchetypeId;
}

/**
 * Validation functions
 */
export function isValidArchetype(archetype: string): archetype is ArchetypeId {
  return VALID_ARCHETYPES.includes(archetype as ArchetypeId);
}

export function isValidVerdictLean(lean: string): lean is VerdictLean {
  return VERDICT_LEANS.includes(lean as VerdictLean);
}

export function validatePersonaV2(persona: PersonaV2): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!persona.id) errors.push('Missing required field: id');
  if (!persona.name) errors.push('Missing required field: name');
  if (!persona.instant_read) errors.push('Missing required field: instant_read');
  if (!persona.demographics) errors.push('Missing required field: demographics');
  if (!persona.verdict_prediction) errors.push('Missing required field: verdict_prediction');
  if (!persona.strike_or_keep) errors.push('Missing required field: strike_or_keep');

  // Validate liability probability range
  if (persona.verdict_prediction) {
    const prob = persona.verdict_prediction.liability_finding_probability;
    if (prob < 0 || prob > 1) {
      errors.push(`liability_finding_probability must be 0.0-1.0, got ${prob}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validatePersonaFile(file: PersonaFile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate archetype
  if (!isValidArchetype(file.archetype)) {
    errors.push(`Invalid archetype: ${file.archetype}`);
  }

  // Validate danger ratings
  if (typeof file.danger_for_plaintiff === 'number' && (file.danger_for_plaintiff < 1 || file.danger_for_plaintiff > 5)) {
    errors.push(`danger_for_plaintiff must be 1-5, got ${file.danger_for_plaintiff}`);
  }
  if (typeof file.danger_for_defense === 'number' && (file.danger_for_defense < 1 || file.danger_for_defense > 5)) {
    errors.push(`danger_for_defense must be 1-5, got ${file.danger_for_defense}`);
  }

  // Validate all personas
  if (!file.personas || file.personas.length === 0) {
    errors.push('PersonaFile must contain at least one persona');
  } else {
    file.personas.forEach((persona, index) => {
      const validation = validatePersonaV2(persona);
      if (!validation.valid) {
        errors.push(`Persona ${index + 1} (${persona.name || 'unnamed'}): ${validation.errors.join(', ')}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
