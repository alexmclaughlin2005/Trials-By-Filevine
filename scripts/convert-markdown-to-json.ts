#!/usr/bin/env tsx
/**
 * Convert persona definitions from markdown files to JSON format
 *
 * This script reads the markdown persona documentation files and converts
 * them into structured JSON files that can be imported into the database.
 *
 * Usage: npm run convert-personas
 */

import * as fs from 'fs';
import * as path from 'path';

const ARCHETYPE_MAPPING = {
  'bootstrapper': {
    code: 'BOOT',
    display_name: 'The Bootstrapper',
    tagline: 'Pull yourself up by your bootstraps',
    plaintiff_danger: 5,
    defense_danger: 1,
  },
  'crusader': {
    code: 'CRUS',
    display_name: 'The Crusader',
    tagline: 'Fight the power',
    plaintiff_danger: 1,
    defense_danger: 5,
  },
  'scale_balancer': {
    code: 'SCALE',
    display_name: 'The Scale-Balancer',
    tagline: 'Show me the evidence',
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'captain': {
    code: 'CAPT',
    display_name: 'The Captain',
    tagline: "I'll take it from here",
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'chameleon': {
    code: 'CHAM',
    display_name: 'The Chameleon',
    tagline: 'Whatever you think',
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'scarred': {
    code: 'SCAR',
    display_name: 'The Scarred',
    tagline: "I've been there",
    plaintiff_danger: 3,
    defense_danger: 3,
  },
  'calculator': {
    code: 'CALC',
    display_name: 'The Calculator',
    tagline: 'Show me the data',
    plaintiff_danger: 4,
    defense_danger: 2,
  },
  'heart': {
    code: 'HEART',
    display_name: 'The Heart',
    tagline: 'I feel your pain',
    plaintiff_danger: 2,
    defense_danger: 4,
  },
  'trojan_horse': {
    code: 'TROJAN',
    display_name: 'The Trojan Horse',
    tagline: 'Hidden agenda',
    plaintiff_danger: 5,
    defense_danger: 1,
  },
  'maverick': {
    code: 'MAVE',
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
  demographics: any;
  dimensions: any;
  life_experiences: string[];
  characteristic_phrases: string[];
  voir_dire_responses: any;
  deliberation_behavior: any;
  simulation_parameters: any;
  case_type_predictions: any;
  strategy_guidance: any;
  regional_notes: any;
}

/**
 * Parse dimension scores from markdown text
 */
function parseDimensions(text: string): any {
  const dimensionRegex = /(\w+[\w\s]*?):\s*([0-9.]+)/g;
  const dimensions: any = {};

  let match;
  while ((match = dimensionRegex.exec(text)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, '_');
    const value = parseFloat(match[2]);
    dimensions[key] = value;
  }

  return dimensions;
}

/**
 * Parse JSON code block from markdown
 */
function parseJsonBlock(text: string): any {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.warn('Failed to parse JSON block:', error);
    return {};
  }
}

/**
 * Extract persona from markdown section
 */
function extractPersona(section: string, archetypeKey: string): PersonaData | null {
  // Extract nickname and full name
  const nicknameMatch = section.match(/Nickname[:\*\s]+[""]([^"""]+)[""]|Persona\s+\d+\.\d+:\s+[""]([^"""]+)[""]|##\s+Persona\s+\d+\.\d+:\s+[""]([^"""]+)[""]/);;
  const fullNameMatch = section.match(/Full Name[:\*\s]+([^\n]+)|##\s+Persona\s+\d+\.\d+:\s+[""]([^"""]+)[""]/);;
  const taglineMatch = section.match(/Tagline[:\*\s]+[""]([^"""]+)[""]|Key Trait[:\*\s]+([^\n]+)/);

  if (!nicknameMatch && !fullNameMatch) {
    return null;
  }

  const nickname = nicknameMatch?.[1] || nicknameMatch?.[2] || nicknameMatch?.[3] || '';
  const fullName = fullNameMatch?.[1]?.trim() || fullNameMatch?.[2]?.trim() || nickname;
  const tagline = taglineMatch?.[1] || taglineMatch?.[2] || '';

  // Extract persona ID
  const personaIdMatch = section.match(/persona_id["':\s]+["']([A-Z_0-9.]+)["']|Persona\s+ID[:\*\s]+([A-Z_0-9.]+)/i);
  const personaId = personaIdMatch?.[1] || personaIdMatch?.[2] ||
    `${ARCHETYPE_MAPPING[archetypeKey as keyof typeof ARCHETYPE_MAPPING].code}_AUTO_${nickname.replace(/\s+/g, '')}`;

  // Extract archetype strength
  const strengthMatch = section.match(/archetype_strength["':\s]+([0-9.]+)|Archetype Strength[:\*\s]+([0-9.]+)/i);
  const archetypeStrength = strengthMatch ? parseFloat(strengthMatch[1] || strengthMatch[2]) : 0.8;

  // Parse dimensions section
  const dimensionsMatch = section.match(/###?\s+Psychological Dimension Scores[\s\S]*?```([\s\S]*?)```/);
  const dimensions = dimensionsMatch ? parseDimensions(dimensionsMatch[1]) : {};

  // Extract demographic info
  const demographics: any = {};
  const ageMatch = section.match(/Age[:\*\s]+(\d+)/i);
  const genderMatch = section.match(/Gender[:\*\s]+(\w+)/i);
  const locationMatch = section.match(/Location[:\*\s]+([^\n]+)/i);
  const occupationMatch = section.match(/Occupation[:\*\s]+([^\n]+)/i);
  const incomeMatch = section.match(/Income[:\*\s]+\$?([\d,]+)/i);

  if (ageMatch) demographics.age = parseInt(ageMatch[1]);
  if (genderMatch) demographics.gender = genderMatch[1].toLowerCase();
  if (locationMatch) demographics.location = locationMatch[1].trim();
  if (occupationMatch) demographics.occupation = occupationMatch[1].trim();
  if (incomeMatch) demographics.income = parseInt(incomeMatch[1].replace(/,/g, ''));

  // Extract characteristic phrases
  const phrasesSection = section.match(/###?\s+Characteristic (?:Speech Patterns|Phrases)[\s\S]*?(?=###|$)/i);
  const phrases: string[] = [];
  if (phrasesSection) {
    const bulletMatches = phrasesSection[0].matchAll(/[-•]\s+[""]([^"""]+)[""]|[-•]\s+([^\n]+)/g);
    for (const match of bulletMatches) {
      const phrase = match[1] || match[2];
      if (phrase && !phrase.match(/^(Phrases|Speech|Direct|Uses)/)) {
        phrases.push(phrase.trim());
      }
    }
  }

  // Extract life experiences
  const experiencesSection = section.match(/###?\s+Life (?:History|Story|Experiences)[\s\S]*?(?=###|$)/i);
  const experiences: string[] = [];
  if (experiencesSection) {
    const bulletMatches = experiencesSection[0].matchAll(/[-•]\s+([^\n]+)/g);
    for (const match of bulletMatches) {
      const exp = match[1];
      if (exp && exp.length > 20) {
        experiences.push(exp.trim());
      }
    }
  }

  // Extract voir dire responses
  const voirDireSection = section.match(/###?\s+(?:Predicted )?Voir Dire(?: Responses)?[\s\S]*?(?=###|$)/i);
  const voirDire: any = {};
  if (voirDireSection) {
    const qaPairs = voirDireSection[0].matchAll(/\*\*Q:\s+[""]([^"""]+)[""].*?\n>\s+[""]([^"""]+)[""]|Question[:\s]+([^\n]+).*?Response[:\s]+([^\n]+)/gs);
    let qNum = 1;
    for (const match of qaPairs) {
      const question = match[1] || match[3];
      const response = match[2] || match[4];
      if (question && response) {
        voirDire[`question_${qNum}`] = {
          question: question.trim(),
          response: response.trim(),
        };
        qNum++;
      }
    }
  }

  // Extract simulation parameters from JSON block
  const simParamsMatch = section.match(/###?\s+Simulation Parameters[\s\S]*?```json([\s\S]*?)```/);
  const simulationParams = simParamsMatch ? parseJsonBlock(simParamsMatch[0]) : {};

  return {
    persona_id: personaId,
    nickname: nickname.replace(/^[""]|[""]$/g, ''),
    full_name: fullName.replace(/^[""]|[""]$/g, ''),
    tagline: tagline.replace(/^[""]|[""]$/g, ''),
    archetype: archetypeKey,
    archetype_strength: archetypeStrength,
    secondary_archetype: null,
    variant: null,
    demographics,
    dimensions,
    life_experiences: experiences,
    characteristic_phrases: phrases,
    voir_dire_responses: voirDire,
    deliberation_behavior: {},
    simulation_parameters: simulationParams,
    case_type_predictions: {},
    strategy_guidance: {},
    regional_notes: {},
  };
}

/**
 * Parse personas from markdown file
 */
function parseMarkdownFile(filePath: string): Record<string, PersonaData[]> {
  console.log(`\n📂 Reading: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const personasByArchetype: Record<string, PersonaData[]> = {};

  // Split by archetype sections
  const archetypeSections = content.split(/^#\s+ARCHETYPE\s+\d+:/gm);

  for (const archetypeSection of archetypeSections) {
    if (!archetypeSection.trim()) continue;

    // Identify archetype
    let archetypeKey = '';
    for (const [key, config] of Object.entries(ARCHETYPE_MAPPING)) {
      if (archetypeSection.toLowerCase().includes(key.replace('_', ' ')) ||
          archetypeSection.toLowerCase().includes(config.display_name.toLowerCase())) {
        archetypeKey = key;
        break;
      }
    }

    if (!archetypeKey) {
      // Try to extract from section header
      const headerMatch = archetypeSection.match(/PERSONAL RESPONSIBILITY|BOOTSTRAPPER/i);
      if (headerMatch) archetypeKey = 'bootstrapper';
      else continue;
    }

    console.log(`   Found archetype: ${archetypeKey}`);

    // Split into individual personas
    const personaSections = archetypeSection.split(/^##\s+(?:Persona|New Persona)/gm);

    for (const personaSection of personaSections) {
      if (personaSection.trim().length < 100) continue;

      const persona = extractPersona(personaSection, archetypeKey);
      if (persona && persona.nickname) {
        if (!personasByArchetype[archetypeKey]) {
          personasByArchetype[archetypeKey] = [];
        }
        personasByArchetype[archetypeKey].push(persona);
        console.log(`      ✓ ${persona.nickname}`);
      }
    }
  }

  return personasByArchetype;
}

/**
 * Generate JSON files for each archetype
 */
function generateJsonFiles(personasByArchetype: Record<string, PersonaData[]>, outputDir: string) {
  console.log(`\n📝 Generating JSON files...`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [archetypeKey, personas] of Object.entries(personasByArchetype)) {
    const config = ARCHETYPE_MAPPING[archetypeKey as keyof typeof ARCHETYPE_MAPPING];
    if (!config) continue;

    const fileName = `${archetypeKey}s.json`;
    const filePath = path.join(outputDir, fileName);

    const archetypeData = {
      archetype: archetypeKey,
      archetype_display_name: config.display_name,
      archetype_tagline: config.tagline,
      plaintiff_danger_level: config.plaintiff_danger,
      defense_danger_level: config.defense_danger,
      archetype_centroids: personas[0]?.dimensions || {},
      personas: personas,
    };

    fs.writeFileSync(filePath, JSON.stringify(archetypeData, null, 2));
    console.log(`   ✅ ${fileName} (${personas.length} personas)`);
  }
}

async function main() {
  console.log('🚀 Converting Markdown Personas to JSON\n');
  console.log('='.repeat(80));

  const docsDir = path.join(__dirname, '..', 'Juror Personas', 'Juror Persona docs v2');
  const outputDir = path.join(__dirname, '..', 'Juror Personas', 'generated');

  // Check if directory exists
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
