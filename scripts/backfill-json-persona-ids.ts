/**
 * Backfill script to populate json_persona_id for existing personas
 * This matches database personas to JSON personas and updates the json_persona_id field
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

// Find the personas directory (V1)
function findPersonasDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'generated'),
  ];

  const fsSync = require('fs');
  for (const dirPath of possiblePaths) {
    try {
      fsSync.accessSync(dirPath);
      return dirPath;
    } catch {
      // Continue
    }
  }

  return possiblePaths[0]; // Return default even if not found
}

// Find the Persona Updates directory (V2)
function findPersonaUpdatesDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Persona Updates'),
    path.join(process.cwd(), '..', 'Persona Updates'),
    path.join(process.cwd(), '..', '..', 'Persona Updates'),
  ];

  const fsSync = require('fs');
  for (const dirPath of possiblePaths) {
    try {
      fsSync.accessSync(dirPath);
      return dirPath;
    } catch {
      // Continue
    }
  }

  return possiblePaths[0]; // Return default even if not found
}

const PERSONAS_DIR = findPersonasDir();
const PERSONA_UPDATES_DIR = findPersonaUpdatesDir();
const PERSONA_FILES = [
  'bootstrappers.json',
  'crusaders.json',
  'scale_balancers.json',
  'captains.json',
  'chameleons.json',
  'scarreds.json',
  'calculators.json',
  'hearts.json',
  'trojan_horses.json',
  'mavericks.json',
];

interface PersonaJSON {
  persona_id?: string; // V1 format
  id?: string; // V2 format
  nickname?: string;
  full_name?: string;
  name?: string;
}

interface PersonaFile {
  archetype: string;
  personas: PersonaJSON[];
}

/**
 * Normalize a string for comparison (lowercase, trim, remove special chars)
 */
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[-\s']/g, '');
}

/**
 * Find matching JSON persona for a database persona
 */
function findMatchingJsonPersona(
  dbPersona: { name: string; nickname: string | null; archetype: string | null },
  jsonPersonas: PersonaJSON[]
): string | null {
  const normalizedName = normalize(dbPersona.name);
  const normalizedNickname = dbPersona.nickname ? normalize(dbPersona.nickname) : null;

  for (const jsonPersona of jsonPersonas) {
    const jsonNickname = jsonPersona.nickname ? normalize(jsonPersona.nickname) : null;
    const jsonFullName = jsonPersona.full_name ? normalize(jsonPersona.full_name) : null;
    const jsonName = jsonPersona.name ? normalize(jsonPersona.name) : null;

    // Extract name from persona_id (V1) or id (V2) (e.g., "BOOT_1.1_GaryHendricks" -> "garyhendricks" or "BOOT_08" -> "boot08")
    let jsonPersonaIdName: string | null = null;
    const jsonPersonaId = jsonPersona.persona_id || jsonPersona.id;
    if (!jsonPersonaId) continue; // Skip if no ID
    
    if (jsonPersonaId) {
      const parts = jsonPersonaId.split('_');
      if (parts.length > 2) {
        jsonPersonaIdName = normalize(parts.slice(2).join('_'));
      } else if (parts.length === 2) {
        // V2 format like "BOOT_08"
        jsonPersonaIdName = normalize(parts[1]);
      }
    }

    // Priority matching:
    // 1. Exact nickname match
    if (normalizedNickname && jsonNickname === normalizedNickname) {
      return jsonPersonaId;
    }

    // 2. Database name matches JSON full_name
    if (normalizedName === jsonFullName) {
      return jsonPersonaId;
    }

    // 3. Database name matches JSON nickname
    if (normalizedName === jsonNickname) {
      return jsonPersonaId;
    }

    // 4. Database nickname matches JSON name
    if (normalizedNickname && normalizedNickname === jsonName) {
      return jsonPersonaId;
    }

    // 5. Database name matches JSON name
    if (normalizedName === jsonName) {
      return jsonPersonaId;
    }

    // 6. Match against persona_id name (e.g., "GaryHendricks" matches "Gary Hendricks")
    if (normalizedName && jsonPersonaIdName) {
      if (normalizedName === jsonPersonaIdName) {
        return jsonPersonaId;
      }
      // Partial match (e.g., "DoctorsDaughterDiana" contains "Diana")
      if (normalizedName.length > 3 && jsonPersonaIdName.includes(normalizedName)) {
        return jsonPersonaId;
      }
      if (jsonPersonaIdName.length > 3 && normalizedName.includes(jsonPersonaIdName)) {
        return jsonPersonaId;
      }
    }

    // 7. Partial nickname match
    if (normalizedNickname && jsonNickname) {
      if (jsonNickname.includes(normalizedNickname) || normalizedNickname.includes(jsonNickname)) {
        return jsonPersonaId;
      }
    }
  }

  return null;
}

async function main() {
  console.log('🔄 Starting json_persona_id backfill...\n');
  console.log(`📁 Using V1 personas directory: ${PERSONAS_DIR}`);
  console.log(`📁 Using V2 personas directory: ${PERSONA_UPDATES_DIR}\n`);

  // Load all JSON personas from both V1 and V2 directories
  const allJsonPersonas: PersonaJSON[] = [];
  const jsonPersonasByArchetype: Record<string, PersonaJSON[]> = {};

  // Load from V1 directory
  for (const filename of PERSONA_FILES) {
    try {
      const filePath = path.join(PERSONAS_DIR, filename);
      await fs.access(filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: PersonaFile = JSON.parse(fileContent);

      if (!jsonPersonasByArchetype[data.archetype]) {
        jsonPersonasByArchetype[data.archetype] = [];
      }

      for (const persona of data.personas) {
        allJsonPersonas.push(persona);
        jsonPersonasByArchetype[data.archetype].push(persona);
      }

      console.log(`✅ Loaded ${data.personas.length} personas from V1/${filename}`);
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Load from V2 directory (Persona Updates)
  // V2 uses different filenames (singular, lowercase) and 'scarred.json' instead of 'scarreds.json'
  const v2FileMap: Record<string, string> = {
    'bootstrappers.json': 'bootstrappers.json',
    'crusaders.json': 'crusaders.json',
    'scale_balancers.json': 'scale_balancers.json',
    'captains.json': 'captains.json',
    'chameleons.json': 'chameleons.json',
    'scarreds.json': 'scarred.json',
    'calculators.json': 'calculators.json',
    'hearts.json': 'hearts.json',
    'trojan_horses.json': 'trojan_horses.json',
    'mavericks.json': 'mavericks.json',
  };

  for (const [v1Filename, v2Filename] of Object.entries(v2FileMap)) {
    try {
      const filePath = path.join(PERSONA_UPDATES_DIR, v2Filename);
      await fs.access(filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: PersonaFile = JSON.parse(fileContent);

      // Extract archetype from filename or use a default
      const archetype = data.archetype || v2Filename.replace('.json', '').replace('_', '');
      
      if (!jsonPersonasByArchetype[archetype]) {
        jsonPersonasByArchetype[archetype] = [];
      }

      for (const persona of data.personas) {
        allJsonPersonas.push(persona);
        jsonPersonasByArchetype[archetype].push(persona);
      }

      console.log(`✅ Loaded ${data.personas.length} personas from V2/${v2Filename}`);
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  console.log(`\n📊 Total JSON personas loaded: ${allJsonPersonas.length}\n`);

  // Get all system personas without json_persona_id
  const dbPersonas = await prisma.persona.findMany({
    where: {
      sourceType: 'system',
      jsonPersonaId: null,
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      archetype: true,
    },
  });

  console.log(`📋 Found ${dbPersonas.length} database personas without json_persona_id\n`);

  let matched = 0;
  let unmatched = 0;
  let skipped = 0;
  const unmatchedPersonas: Array<{ id: string; name: string; nickname: string | null; archetype: string | null }> = [];
  const usedJsonPersonaIds = new Set<string>();

  for (const dbPersona of dbPersonas) {
    // First try matching within the same archetype
    let jsonPersonaId: string | null = null;
    
    if (dbPersona.archetype && jsonPersonasByArchetype[dbPersona.archetype]) {
      jsonPersonaId = findMatchingJsonPersona(
        dbPersona,
        jsonPersonasByArchetype[dbPersona.archetype]
      );
    }

    // If no match in archetype, try all personas
    if (!jsonPersonaId) {
      jsonPersonaId = findMatchingJsonPersona(dbPersona, allJsonPersonas);
    }

    if (jsonPersonaId) {
      // Check if this json_persona_id is already used by another persona
      const existing = await prisma.persona.findFirst({
        where: {
          jsonPersonaId,
          id: { not: dbPersona.id },
        },
      });

      if (existing) {
        skipped++;
        console.log(`⚠️  Skipped: "${dbPersona.name}" → ${jsonPersonaId} (already used by "${existing.name}")`);
      } else if (usedJsonPersonaIds.has(jsonPersonaId)) {
        skipped++;
        console.log(`⚠️  Skipped: "${dbPersona.name}" → ${jsonPersonaId} (already matched in this run)`);
      } else {
        await prisma.persona.update({
          where: { id: dbPersona.id },
          data: { jsonPersonaId },
        });
        usedJsonPersonaIds.add(jsonPersonaId);
        matched++;
        console.log(`✅ Matched: "${dbPersona.name}" → ${jsonPersonaId}`);
      }
    } else {
      unmatched++;
      unmatchedPersonas.push(dbPersona);
      console.log(`❌ No match found for: "${dbPersona.name}" (${dbPersona.nickname || 'no nickname'}, ${dbPersona.archetype || 'no archetype'})`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Matched: ${matched}`);
  console.log(`   ⚠️  Skipped (duplicate): ${skipped}`);
  console.log(`   ❌ Unmatched: ${unmatched}`);

  if (unmatchedPersonas.length > 0) {
    console.log(`\n⚠️  Unmatched personas (these may not exist in JSON files):`);
    for (const persona of unmatchedPersonas) {
      console.log(`   - "${persona.name}" (${persona.nickname || 'no nickname'}, ${persona.archetype || 'no archetype'})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
