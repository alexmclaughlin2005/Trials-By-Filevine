#!/usr/bin/env tsx
/**
 * IMPROVED Markdown to JSON Persona Converter (v2)
 *
 * This version handles the detailed persona format from juror_personas_seed_data.md
 * which uses ## Persona X.Y: "Name" format with comprehensive sections.
 *
 * Usage: npm run convert-personas-v2
 */

import * as fs from 'fs';
import * as path from 'path';

const ARCHETYPE_MAPPING: Record<string, any> = {
  'bootstrapper': {
    code: 'BOOT',
    key: 'PERSONAL_RESPONSIBILITY_ENFORCER',
    display_name: 'The Bootstrapper',
    tagline: 'Pull yourself up by your bootstraps',
    plaintiff_danger: 5,
    defense_danger: 1,
  },
  'crusader': {
    code: 'CRUS',
    key: 'SYSTEMIC_THINKER',
    display_name: 'The Crusader',
    tagline: 'Fight the power',
    plaintiff_danger: 1,
    defense_danger: 5,
  },
  'scale_balancer': {
    code: 'SCALE',
    key: 'FAIR_MINDED_EVALUATOR',
    display_name: 'The Scale-Balancer',
    tagline: 'Show me the evidence',
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'captain': {
    code: 'CAPT',
    key: 'AUTHORITATIVE_LEADER',
    display_name: 'The Captain',
    tagline: "I'll take it from here",
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'chameleon': {
    code: 'CHAM',
    key: 'COMPLIANT_FOLLOWER',
    display_name: 'The Chameleon',
    tagline: 'Whatever you think',
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'scarred': {
    code: 'SCAR',
    key: 'WOUNDED_VETERAN',
    display_name: 'The Scarred',
    tagline: "I've been there",
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'calculator': {
    code: 'CALC',
    key: 'NUMBERS_PERSON',
    display_name: 'The Calculator',
    tagline: 'Show me the data',
    plaintiff_danger: 4,
    defense_danger: 2,
  },
  'heart': {
    code: 'HEART',
    key: 'EMPATHIC_CONNECTOR',
    display_name: 'The Heart',
    tagline: 'I feel your pain',
    plaintiff_danger: 2,
    defense_danger: 4,
  },
  'trojan_horse': {
    code: 'TROJAN',
    key: 'STEALTH_JUROR',
    display_name: 'The Trojan Horse',
    tagline: 'Hidden agenda',
    plaintiff_danger: 5,
    defense_danger: 1,
  },
  'maverick': {
    code: 'MAVE',
    key: 'NULLIFIER',
    display_name: 'The Maverick',
    tagline: 'I answer to a higher law',
    plaintiff_danger: 3,
    defense_danger: 3,
  },
};

interface PersonaData {
  persona_id: string;
  nickname: string;
  full_name: string;
  tagline: string;
  archetype: string;
  archetype_strength: number;
  secondary_archetype: string | null;
  variant: string | null;
  demographics: Record<string, any>;
  dimensions: Record<string, any>;
  life_experiences: string[];
  legal_experience?: Record<string, any>;
  characteristic_phrases: string[];
  voir_dire_responses: Record<string, any>;
  deliberation_behavior: Record<string, any>;
  simulation_parameters: Record<string, any>;
  case_type_predictions: Record<string, any>;
  strategy_guidance: Record<string, any>;
  regional_notes: Record<string, any>;
}

/**
 * Extract text between two headers
 */
function extractSection(content: string, startPattern: RegExp, endPattern?: RegExp): string {
  const match = content.match(startPattern);
  if (!match) return '';

  const startIndex = match.index! + match[0].length;
  let endIndex = content.length;

  if (endPattern) {
    const endMatch = content.slice(startIndex).match(endPattern);
    if (endMatch) {
      endIndex = startIndex + endMatch.index!;
    }
  }

  return content.slice(startIndex, endIndex).trim();
}

/**
 * Parse demographics from bullet list
 */
function parseDemographics(section: string): Record<string, any> {
  const demographics: Record<string, any> = {};

  const patterns = {
    age: /Age[:\*\s]+(\d+)/i,
    gender: /Gender[:\*\s]+(\w+)/i,
    race_ethnicity: /Race\/Ethnicity[:\*\s]+([^\n]+)/i,
    location: /Location[:\*\s]+([^\n]+)/i,
    location_city: /Location[:\*\s]+([^(,\n]+)/i,
    location_state: /Location[:\*\s]+[^(]*\(([A-Z]{2})/i,
    education: /Education[:\*\s]+([^\n]+)/i,
    education_level: /Education[:\*\s]+([^,\n]+)/i,
    occupation: /Occupation[:\*\s]+([^\n]+)/i,
    income: /Income[:\*\s]+\$?([\d,]+)/i,
    marital_status: /Marital Status[:\*\s]+([^,\n]+)/i,
    children: /children|kids/i,
    religion: /Religion[:\*\s]+([^,\n]+)/i,
    religion_activity: /Religion[:\*\s]+[^,]+,\s*([^\n]+)/i,
    political_affiliation: /Political Affiliation[:\*\s]+([^,\n]+)/i,
    political_engagement: /Political Affiliation[:\*\s]+[^,]+,\s*([^\n]+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = section.match(pattern);
    if (match && match[1]) {
      let value: any = match[1].trim();

      // Type conversions
      if (key === 'age') value = parseInt(value);
      if (key === 'income') value = parseInt(value.replace(/,/g, ''));
      if (key === 'gender') value = value.toLowerCase();

      demographics[key] = value;
    }
  }

  return demographics;
}

/**
 * Parse psychological dimensions with better parsing
 */
function parseDimensions(section: string): Record<string, any> {
  const dimensions: Record<string, any> = {};

  // Handle both inline and structured formats
  const lines = section.split('\n');

  for (const line of lines) {
    // Match "Dimension Name: Value (description)"
    const match = line.match(/([A-Z][^:]+?):\s*([\d.]+)/i);
    if (match) {
      const key = match[1]
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '');
      const value = parseFloat(match[2]);

      if (!isNaN(value) && value >= 0 && value <= 5) {
        dimensions[key] = value;
      }
    }

    // Handle institutional trust sub-items
    const trustMatch = line.match(/[-•]\s*([A-Z][^:]+?):\s*([\d.]+)/i);
    if (trustMatch) {
      const key = 'institutional_trust_' + trustMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
      dimensions[key] = parseFloat(trustMatch[2]);
    }
  }

  return dimensions;
}

/**
 * Extract bullet points from section
 */
function extractBullets(section: string): string[] {
  const bullets: string[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    // Match bullet points: -, •, or * at start
    const match = line.match(/^[-•*]\s+(.+)$/);
    if (match) {
      const text = match[1].trim();
      // Filter out meta-commentary
      if (text.length > 10 && !text.startsWith('**') && !text.match(/^[A-Z][a-z]+ uses:/)) {
        bullets.push(text.replace(/^[""]|[""]$/g, ''));
      }
    }
  }

  return bullets;
}

/**
 * Parse voir dire Q&A
 */
function parseVoirDire(section: string): Record<string, any> {
  const voirDire: Record<string, any> = {};

  // Split by **Q: pattern
  const qaSections = section.split(/\*\*Q:/);

  let qNum = 1;
  for (const qa of qaSections) {
    if (!qa.trim()) continue;

    // Extract question
    const qMatch = qa.match(/[""]([^"""]+)[""]|^([^\n*>]+)/);
    if (!qMatch) continue;

    const question = (qMatch[1] || qMatch[2]).trim();

    // Extract response (usually after > or **A: or just a quote)
    const rMatch = qa.match(/>\s+[""]([^"""]+)[""]|>\s+([^*\n][^\n]+)/);
    if (!rMatch) continue;

    const response = (rMatch[1] || rMatch[2]).trim();

    if (question && response) {
      voirDire[`question_${qNum}`] = {
        question: question,
        response: response,
      };
      qNum++;
    }
  }

  return voirDire;
}

/**
 * Parse simulation parameters JSON with better error handling
 */
function parseSimulationParams(section: string): Record<string, any> {
  const jsonMatch = section.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return {};

  try {
    // Clean up non-standard JSON
    let jsonStr = jsonMatch[1];

    // Fix common issues
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1'); // Trailing commas
    jsonStr = jsonStr.replace(/\+(\d)/g, '$1'); // Remove + signs
    jsonStr = jsonStr.replace(/: (\d+\.\d+),/g, ': "$1",'); // Quote decimals if needed

    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn('   ⚠️  Failed to parse simulation JSON, using empty object');
    return {};
  }
}

/**
 * Parse deliberation behavior into structured format
 */
function parseDeliberationBehavior(section: string): Record<string, any> {
  const behavior: Record<string, any> = {};

  // Extract key fields
  const roleMatch = section.match(/\*\*Role[:\*\s]+(.+?)(?=\*\*|$)/is);
  if (roleMatch) behavior.predicted_role = roleMatch[1].trim();

  const styleMatch = section.match(/\*\*Style[:\*\s]+(.+?)(?=\*\*|$)/is);
  if (styleMatch) behavior.deliberation_style = styleMatch[1].trim();

  const influenceMatch = section.match(/\*\*Influence tactics[:\*\s]+([\s\S]+?)(?=\*\*[A-Z]|$)/i);
  if (influenceMatch) behavior.influence_tactics = extractBullets(influenceMatch[1]);

  const statementsMatch = section.match(/\*\*Likely statements[:\*\s]+([\s\S]+?)(?=\*\*[A-Z]|$)/i);
  if (statementsMatch) behavior.likely_statements = extractBullets(statementsMatch[1]);

  const persuadabilityMatch = section.match(/\*\*Persuadability[:\*\s]+([^*\n]+)/i);
  if (persuadabilityMatch) behavior.persuadability = persuadabilityMatch[1].trim();

  const factionMatch = section.match(/\*\*Faction behavior[:\*\s]+(.+?)(?=###|$)/is);
  if (factionMatch) behavior.faction_behavior = factionMatch[1].trim();

  return behavior;
}

/**
 * Extract a single persona from markdown section
 */
function extractPersona(section: string, archetypeKey: string, personaNumber: string): PersonaData | null {
  // Extract full name from header - handles both straight quotes "..." and curly quotes "..."
  const headerMatch = section.match(
    /##\s+Persona\s+[\d.]+:\s+[""]([^"""]+)[""]|##\s+Persona\s+[\d.]+:\s+"([^"]+)"|##\s+New Persona:\s+[""]([^"""]+)[""]|^###?\s+Demographics[\s\S]{0,500}Full Name[:\*\s]+([^\n]+)/im
  );

  if (!headerMatch || !(headerMatch[1] || headerMatch[2] || headerMatch[3] || headerMatch[4])) {
    console.warn(`   ⚠️  Could not extract name from persona ${personaNumber}, skipping`);
    return null;
  }

  const fullName = (headerMatch[1] || headerMatch[2] || headerMatch[3] || headerMatch[4] || '').trim();

  // Extract nickname (if different from full name)
  // Try to find explicit nickname, otherwise use first name or full name
  const nicknameMatch = section.match(/Nickname[:\*\s]+[""]([^"""]+)[""]|persona_id[:\s]+[A-Z_]+[\d.]+_([A-Za-z]+)/i);
  let nickname = nicknameMatch ? (nicknameMatch[1] || nicknameMatch[2]) : fullName;

  // If no nickname found, use first name from full name
  if (nickname === fullName && fullName.includes(' ')) {
    nickname = fullName.split(' ')[0];
  }

  // Generate persona ID
  const config = ARCHETYPE_MAPPING[archetypeKey];
  const cleanName = fullName.replace(/[^A-Za-z]/g, '');
  const personaId = `${config.code}_${personaNumber}_${cleanName}`;

  // Extract tagline
  const taglineMatch = section.match(/Tagline[:\*\s]+[""]([^"""]+)[""]|Key Trait[:\*\s]+([^\n]+)/i);
  const tagline = taglineMatch ? (taglineMatch[1] || taglineMatch[2]).trim() : '';

  // Extract archetype strength
  const strengthMatch = section.match(/archetype_strength["':\s]+([0-9.]+)/i);
  const archetypeStrength = strengthMatch ? parseFloat(strengthMatch[1]) : 0.8;

  // Extract secondary archetype
  const secondaryMatch = section.match(/secondary_archetype["':\s]+["']([A-Z_]+)["']/i);
  const secondaryArchetype = secondaryMatch ? secondaryMatch[1].toLowerCase() : null;

  // Extract sections
  const demographicsSection = extractSection(section, /###?\s+Demographics/i, /###?\s+/);
  const dimensionsSection = extractSection(section, /###?\s+Psychological Dimension Scores/i, /###?\s+/);
  const lifeSection = extractSection(section, /###?\s+Life (?:History|Story|Experiences)/i, /###?\s+/);
  const phrasesSection = extractSection(section, /###?\s+Characteristic Speech/i, /###?\s+/);
  const voirDireSection = extractSection(section, /###?\s+Predicted Voir Dire/i, /###?\s+/);
  const deliberationSection = extractSection(section, /###?\s+Deliberation Behavior/i, /###?\s+/);
  const caseTypeSection = extractSection(section, /###?\s+Case-Type Specific/i, /###?\s+/);
  const simulationSection = extractSection(section, /###?\s+Simulation Parameters/i, /---/);

  // Parse each section
  const demographics = parseDemographics(demographicsSection);
  const dimensions = parseDimensions(dimensionsSection);
  const lifeExperiences = extractBullets(lifeSection);
  const characteristicPhrases = extractBullets(phrasesSection);
  const voirDireResponses = parseVoirDire(voirDireSection);
  const deliberationBehavior = parseDeliberationBehavior(deliberationSection);
  const simulationParameters = parseSimulationParams(simulationSection);

  // Extract legal experience if present
  const legalExpMatch = section.match(/\*\*Experience with legal system[:\*\s]+([\s\S]+?)(?=###|\*\*[A-Z][a-z]+ [a-z])|legal_experience/i);
  const legalExperience = legalExpMatch ? { notes: extractBullets(legalExpMatch[1] || '') } : undefined;

  return {
    persona_id: personaId,
    nickname: nickname.replace(/^[""]|[""]$/g, ''),
    full_name: fullName.replace(/^[""]|[""]$/g, ''),
    tagline: tagline.replace(/^[""]|[""]$/g, ''),
    archetype: archetypeKey,
    archetype_strength: archetypeStrength,
    secondary_archetype: secondaryArchetype,
    variant: null,
    demographics,
    dimensions,
    life_experiences: lifeExperiences,
    legal_experience: legalExperience,
    characteristic_phrases: characteristicPhrases,
    voir_dire_responses: voirDireResponses,
    deliberation_behavior: deliberationBehavior,
    simulation_parameters: simulationParameters,
    case_type_predictions: {},
    strategy_guidance: {},
    regional_notes: {},
  };
}

/**
 * Parse entire markdown file
 */
function parseMarkdownFile(filePath: string): Record<string, PersonaData[]> {
  console.log(`\n📂 Reading: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const personasByArchetype: Record<string, PersonaData[]> = {};

  // Split by archetype sections: # ARCHETYPE 1: PERSONAL RESPONSIBILITY ENFORCER
  const archetypeSections = content.split(/^#\s+ARCHETYPE\s+\d+:/gm);

  for (let i = 1; i < archetypeSections.length; i++) {
    const archetypeSection = archetypeSections[i];

    // Identify archetype by section header or first persona
    let archetypeKey = '';
    let archetypeNumber = i;

    // Try to match by archetype key names
    for (const [key, config] of Object.entries(ARCHETYPE_MAPPING)) {
      if (archetypeSection.toUpperCase().includes(config.key) ||
          archetypeSection.toLowerCase().includes(key.replace('_', ' '))) {
        archetypeKey = key;
        break;
      }
    }

    if (!archetypeKey) {
      console.warn(`   ⚠️  Could not identify archetype ${archetypeNumber}, skipping`);
      continue;
    }

    console.log(`   Found archetype: ${archetypeKey}`);

    // Split into individual personas: ## Persona X.Y:
    // Use positive lookahead to keep the delimiter and filter out non-persona sections
    const personaSections = archetypeSection
      .split(/(?=##\s+Persona\s+\d+\.\d+:|##\s+New Persona:)/)
      .filter(section => section.match(/##\s+Persona\s+\d+\.\d+:|##\s+New Persona:/));

    let personaCount = 0;
    for (const personaSection of personaSections) {
      if (personaSection.trim().length < 200) continue;

      // Extract persona number from section header
      const numberMatch = personaSection.match(/##\s+Persona\s+(\d+\.\d+):|##\s+New Persona:/);
      const personaNumber = numberMatch && numberMatch[1] ? numberMatch[1] : `${archetypeNumber}.${personaCount + 1}`;

      const persona = extractPersona(personaSection, archetypeKey, personaNumber);

      if (persona && persona.full_name) {
        if (!personasByArchetype[archetypeKey]) {
          personasByArchetype[archetypeKey] = [];
        }
        personasByArchetype[archetypeKey].push(persona);
        console.log(`      ✓ ${persona.nickname} (${persona.full_name})`);
        personaCount++;
      }
    }

    console.log(`   Total extracted: ${personaCount} personas`);
  }

  return personasByArchetype;
}

/**
 * Generate JSON files
 */
function generateJsonFiles(personasByArchetype: Record<string, PersonaData[]>, outputDir: string) {
  console.log(`\n📝 Generating JSON files in ${outputDir}...`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [archetypeKey, personas] of Object.entries(personasByArchetype)) {
    const config = ARCHETYPE_MAPPING[archetypeKey];
    if (!config) continue;

    const fileName = `${archetypeKey}s.json`;
    const filePath = path.join(outputDir, fileName);

    // Calculate archetype centroids from first persona's dimensions
    const centroids = personas[0]?.dimensions || {};

    const archetypeData = {
      archetype: archetypeKey,
      archetype_display_name: config.display_name,
      archetype_tagline: config.tagline,
      plaintiff_danger_level: config.plaintiff_danger,
      defense_danger_level: config.defense_danger,
      archetype_centroids: centroids,
      personas: personas,
    };

    fs.writeFileSync(filePath, JSON.stringify(archetypeData, null, 2));
    console.log(`   ✅ ${fileName} (${personas.length} personas)`);
  }
}

async function main() {
  console.log('🚀 Converting Markdown Personas to JSON (v2 - Improved Parser)\n');
  console.log('='.repeat(80));

  const docsDir = path.join(__dirname, '..', 'Juror Personas', 'Juror Persona docs v2');
  const outputDir = path.join(__dirname, '..', 'Juror Personas', 'generated');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Directory not found: ${docsDir}`);
    process.exit(1);
  }

  const files = [
    'juror_personas_seed_data.md',
    'juror_personas_named_expanded.md',
    'juror_personas_extended_variations.md',
  ];

  let allPersonas: Record<string, PersonaData[]> = {};

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping missing file: ${file}`);
      continue;
    }

    const personas = parseMarkdownFile(filePath);

    // Merge personas by archetype
    for (const [archetype, personaList] of Object.entries(personas)) {
      if (!allPersonas[archetype]) {
        allPersonas[archetype] = [];
      }
      allPersonas[archetype].push(...personaList);
    }
  }

  // Remove duplicates by full name
  for (const archetype of Object.keys(allPersonas)) {
    const seen = new Set<string>();
    allPersonas[archetype] = allPersonas[archetype].filter(p => {
      const key = `${p.full_name}_${p.archetype}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Generate JSON files
  generateJsonFiles(allPersonas, outputDir);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Conversion Summary:');
  let totalCount = 0;
  for (const [archetype, personas] of Object.entries(allPersonas)) {
    console.log(`   ${archetype}: ${personas.length} personas`);
    totalCount += personas.length;
  }
  console.log(`\nTotal: ${totalCount} personas converted`);
  console.log(`Output directory: ${outputDir}`);
  console.log('\n✨ Conversion complete!');
  console.log('\nNext step: npm run import-personas\n');
}

main().catch(console.error);
