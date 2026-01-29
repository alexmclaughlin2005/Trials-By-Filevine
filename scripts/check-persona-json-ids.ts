/**
 * Script to check and verify jsonPersonaId mappings for specific personas
 * Usage: npx tsx scripts/check-persona-json-ids.ts "Fox-News Frank" "Stoic-Farm-Wife Fran"
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

async function findPersonasDir(): Promise<string> {
  const possiblePaths = [
    path.join(process.cwd(), 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'generated'),
  ];

  for (const dirPath of possiblePaths) {
    try {
      await fs.access(dirPath);
      return dirPath;
    } catch {
      continue;
    }
  }

  return possiblePaths[0];
}

async function findPersonaUpdatesDir(): Promise<string> {
  const possiblePaths = [
    path.join(process.cwd(), 'Persona Updates'),
    path.join(process.cwd(), '..', 'Persona Updates'),
    path.join(process.cwd(), '..', '..', 'Persona Updates'),
  ];

  for (const dirPath of possiblePaths) {
    try {
      await fs.access(dirPath);
      return dirPath;
    } catch {
      continue;
    }
  }

  return possiblePaths[0];
}

async function loadAllJsonPersonas(): Promise<Array<{ id: string; name?: string; full_name?: string; nickname?: string; file: string }>> {
  const personasDir = await findPersonasDir();
  const updatesDir = await findPersonaUpdatesDir();
  
  const allPersonas: Array<{ id: string; name?: string; full_name?: string; nickname?: string; file: string }> = [];
  
  const personaFiles = [
    'bootstrapper.json',
    'crusader.json',
    'scale_balancer.json',
    'captain.json',
    'chameleon.json',
    'heart.json',
    'calculator.json',
    'scarreds.json',
    'scarred.json', // V2 version
    'trojan_horse.json',
    'maverick.json',
  ];

  // Load from V1 directory
  for (const filename of personaFiles) {
    if (filename === 'scarred.json') continue; // Skip V2 version in V1 dir
    try {
      const filePath = path.join(personasDir, filename);
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      for (const persona of data.personas || []) {
        allPersonas.push({
          id: persona.persona_id || persona.id || '',
          name: persona.name,
          full_name: persona.full_name,
          nickname: persona.nickname,
          file: `V1/${filename}`,
        });
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Load from V2 directory
  for (const filename of personaFiles) {
    const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
    try {
      const filePath = path.join(updatesDir, v2Filename);
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      for (const persona of data.personas || []) {
        allPersonas.push({
          id: persona.persona_id || persona.id || '',
          name: persona.name,
          full_name: persona.full_name,
          nickname: persona.nickname,
          file: `V2/${v2Filename}`,
        });
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  return allPersonas;
}

async function main() {
  const personaNames = process.argv.slice(2);
  
  if (personaNames.length === 0) {
    console.log('Usage: npx tsx scripts/check-persona-json-ids.ts "Persona Name 1" "Persona Name 2" ...');
    process.exit(1);
  }

  console.log('🔍 Checking persona JSON ID mappings...\n');

  // Load all JSON personas
  const jsonPersonas = await loadAllJsonPersonas();
  console.log(`📁 Loaded ${jsonPersonas.length} personas from JSON files\n`);

  // Find database personas
  for (const personaName of personaNames) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Checking: "${personaName}"`);
    console.log('='.repeat(80));

    const dbPersona = await prisma.persona.findFirst({
      where: {
        name: {
          contains: personaName,
          mode: 'insensitive',
        },
        sourceType: 'system',
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        archetype: true,
        jsonPersonaId: true,
      },
    });

    if (!dbPersona) {
      console.log(`❌ Persona "${personaName}" not found in database`);
      continue;
    }

    console.log(`\n📊 Database Persona:`);
    console.log(`   ID: ${dbPersona.id}`);
    console.log(`   Name: ${dbPersona.name}`);
    console.log(`   Nickname: ${dbPersona.nickname || '(none)'}`);
    console.log(`   Archetype: ${dbPersona.archetype || '(none)'}`);
    console.log(`   jsonPersonaId: ${dbPersona.jsonPersonaId || '(NOT SET)'}`);

    if (dbPersona.jsonPersonaId) {
      // Find the JSON persona
      const jsonPersona = jsonPersonas.find(p => p.id === dbPersona.jsonPersonaId);
      
      if (jsonPersona) {
        console.log(`\n✅ Found JSON Persona:`);
        console.log(`   ID: ${jsonPersona.id}`);
        console.log(`   Name: ${jsonPersona.name || '(none)'}`);
        console.log(`   Full Name: ${jsonPersona.full_name || '(none)'}`);
        console.log(`   Nickname: ${jsonPersona.nickname || '(none)'}`);
        console.log(`   File: ${jsonPersona.file}`);
        
        // Check if this is the right match
        const nameMatch = dbPersona.name.toLowerCase().includes(jsonPersona.name?.toLowerCase() || '') ||
                         jsonPersona.name?.toLowerCase().includes(dbPersona.name.toLowerCase()) ||
                         dbPersona.name.toLowerCase().includes(jsonPersona.full_name?.toLowerCase() || '') ||
                         jsonPersona.full_name?.toLowerCase().includes(dbPersona.name.toLowerCase());
        
        const nicknameMatch = dbPersona.nickname && jsonPersona.nickname &&
          (dbPersona.nickname.toLowerCase().includes(jsonPersona.nickname.toLowerCase()) ||
           jsonPersona.nickname.toLowerCase().includes(dbPersona.nickname.toLowerCase()));
        
        if (nameMatch || nicknameMatch) {
          console.log(`\n✅ Match looks correct`);
        } else {
          console.log(`\n⚠️  WARNING: Match might be incorrect!`);
          console.log(`   Database name "${dbPersona.name}" doesn't clearly match JSON name "${jsonPersona.name || jsonPersona.full_name}"`);
        }
      } else {
        console.log(`\n❌ JSON persona with ID "${dbPersona.jsonPersonaId}" not found in JSON files!`);
      }
    } else {
      console.log(`\n⚠️  jsonPersonaId is not set - this persona needs to be matched`);
      
      // Try to find a match
      const possibleMatches = jsonPersonas.filter(p => {
        const pName = (p.name || p.full_name || '').toLowerCase();
        const dbName = dbPersona.name.toLowerCase();
        const pNickname = (p.nickname || '').toLowerCase();
        const dbNickname = (dbPersona.nickname || '').toLowerCase();
        
        return pName.includes(dbName) || dbName.includes(pName) ||
               (dbNickname && pNickname && (pNickname.includes(dbNickname) || dbNickname.includes(pNickname)));
      });
      
      if (possibleMatches.length > 0) {
        console.log(`\n💡 Possible matches found:`);
        possibleMatches.slice(0, 5).forEach(match => {
          console.log(`   - ${match.id}: ${match.name || match.full_name} (${match.nickname || 'no nickname'}) in ${match.file}`);
        });
      }
    }
  }

  // Check for duplicate jsonPersonaIds
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('Checking for duplicate jsonPersonaIds...');
  console.log('='.repeat(80));
  
  const duplicates = await prisma.persona.groupBy({
    by: ['jsonPersonaId'],
    where: {
      jsonPersonaId: {
        not: null,
      },
      sourceType: 'system',
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate jsonPersonaIds:`);
    for (const dup of duplicates) {
      const personas = await prisma.persona.findMany({
        where: {
          jsonPersonaId: dup.jsonPersonaId,
          sourceType: 'system',
        },
        select: {
          id: true,
          name: true,
          nickname: true,
        },
      });
      console.log(`\n   jsonPersonaId: ${dup.jsonPersonaId} (used by ${personas.length} personas)`);
      personas.forEach(p => {
        console.log(`     - ${p.name} (${p.nickname || 'no nickname'}) [${p.id}]`);
      });
    }
  } else {
    console.log(`\n✅ No duplicate jsonPersonaIds found`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
