/**
 * Utility functions for mapping database personas to image files
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Find the personas directory (V1 format)
function findPersonasDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'generated'),
    path.join(__dirname, '..', '..', '..', 'Juror Personas', 'generated'),
  ];

  // Use sync access for initialization
  const fsSync = require('fs');
  for (const dirPath of possiblePaths) {
    try {
      fsSync.accessSync(dirPath);
      return dirPath;
    } catch {
      // Continue
    }
  }

  return possiblePaths[0] || path.join(process.cwd(), 'Juror Personas', 'generated');
}

// Find the Persona Updates directory (V2 format)
function findPersonaUpdatesDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Persona Updates'),
    path.join(process.cwd(), '..', 'Persona Updates'),
    path.join(process.cwd(), '..', '..', 'Persona Updates'),
    path.join(__dirname, '..', '..', '..', 'Persona Updates'),
  ];

  // Use sync access for initialization
  const fsSync = require('fs');
  for (const dirPath of possiblePaths) {
    try {
      fsSync.accessSync(dirPath);
      return dirPath;
    } catch {
      // Continue
    }
  }

  return possiblePaths[0] || path.join(process.cwd(), 'Persona Updates');
}

// Find the images directory
function findImagesDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Juror Personas', 'images'),
    path.join(process.cwd(), '..', 'Juror Personas', 'images'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'images'),
    path.join(__dirname, '..', '..', '..', 'Juror Personas', 'images'),
  ];

  // Use sync access for initialization
  const fsSync = require('fs');
  for (const dirPath of possiblePaths) {
    try {
      fsSync.accessSync(dirPath);
      return dirPath;
    } catch {
      // Continue
    }
  }

  return possiblePaths[0] || path.join(process.cwd(), 'Juror Personas', 'images');
}

const PERSONAS_DIR = findPersonasDir();
const PERSONA_UPDATES_DIR = findPersonaUpdatesDir();
const IMAGES_DIR = findImagesDir();

// Log directory paths on initialization
console.log('[persona-image-utils] PERSONAS_DIR:', PERSONAS_DIR);
console.log('[persona-image-utils] IMAGES_DIR:', IMAGES_DIR);

// Verify directories exist
const fsSync = require('fs');
try {
  fsSync.accessSync(PERSONAS_DIR);
  console.log('[persona-image-utils] ✓ PERSONAS_DIR exists and is accessible');
} catch (error) {
  console.error('[persona-image-utils] ✗ PERSONAS_DIR does not exist or is not accessible:', PERSONAS_DIR);
}

try {
  fsSync.accessSync(IMAGES_DIR);
  console.log('[persona-image-utils] ✓ IMAGES_DIR exists and is accessible');
} catch (error) {
  console.warn('[persona-image-utils] ⚠ IMAGES_DIR does not exist (images will be created here):', IMAGES_DIR);
}

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
  full_name?: string; // V1 format
  name?: string; // V2 format
  image_url?: string;
}

interface PersonaFile {
  archetype: string;
  personas: PersonaJSON[];
}

/**
 * List all available personas from JSON files (for debugging)
 */
export async function listAvailableJsonPersonas(
  filterArchetype: string | null = null
): Promise<PersonaJSON[]> {
  const allPersonas: PersonaJSON[] = [];
  const errors: string[] = [];

  // Check both V1 (generated) and V2 (Persona Updates) directories
  const searchDirs = [
    { dir: PERSONAS_DIR, format: 'v1' },
    { dir: PERSONA_UPDATES_DIR, format: 'v2' },
  ];

  for (const { dir, format } of searchDirs) {
    for (const filename of PERSONA_FILES) {
      // V2 uses 'scarred.json' instead of 'scarreds.json'
      const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
      const actualFilename = format === 'v2' ? v2Filename : filename;
      
      try {
        const filePath = path.join(dir, actualFilename);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: PersonaFile = JSON.parse(fileContent);

        if (filterArchetype && data.archetype?.toLowerCase() !== filterArchetype.toLowerCase()) {
          continue;
        }

        allPersonas.push(...data.personas);
      } catch (error) {
        // File doesn't exist in this directory, skip silently
        continue;
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`[listAvailableJsonPersonas] Encountered ${errors.length} errors while reading persona files`);
  }

  return allPersonas;
}

// Cache for persona mappings (persona_id -> image filename)
let personaImageCache: Map<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load persona image mappings from JSON files
 */
export async function loadPersonaImageMappings(): Promise<Map<string, string>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (personaImageCache && (now - cacheTimestamp) < CACHE_TTL) {
    return personaImageCache;
  }

  const mappings = new Map<string, string>();

  // Check both V1 (generated) and V2 (Persona Updates) directories
  const searchDirs = [
    { dir: PERSONAS_DIR, format: 'v1' },
    { dir: PERSONA_UPDATES_DIR, format: 'v2' },
  ];

  for (const { dir, format } of searchDirs) {
    for (const filename of PERSONA_FILES) {
      // V2 uses 'scarred.json' instead of 'scarreds.json'
      const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
      const actualFilename = format === 'v2' ? v2Filename : filename;
      
      try {
        const filePath = path.join(dir, actualFilename);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: PersonaFile = JSON.parse(fileContent);

        for (const persona of data.personas) {
          const personaId = persona.persona_id || persona.id;
          if (!personaId) continue;
          
          // Use image_url from JSON if available, otherwise construct from persona_id/id
          if (persona.image_url) {
            mappings.set(personaId, persona.image_url);
          } else {
            // Construct image filename from persona_id/id
            mappings.set(personaId, `images/${personaId}.png`);
          }
        }
      } catch (error) {
        // File doesn't exist in this directory, skip silently
        continue;
      }
    }
  }

  personaImageCache = mappings;
  cacheTimestamp = now;
  return mappings;
}

/**
 * Invalidate the persona image cache (call after generating/updating images)
 */
export function invalidatePersonaImageCache(): void {
  personaImageCache = null;
  cacheTimestamp = 0;
}

/**
 * Find persona_id from JSON files by matching name/nickname/archetype
 */
export async function findPersonaIdFromDatabase(
  name: string,
  nickname: string | null | undefined,
  archetype: string | null | undefined
): Promise<string | null> {
  // Normalize inputs for comparison
  const normalizedName = name?.toLowerCase().trim();
  const normalizedNickname = nickname?.toLowerCase().trim();

  // Only log in debug mode or when searching fails (reduces noise)
  const DEBUG = process.env.DEBUG_PERSONA_MATCHING === 'true';
  if (DEBUG) {
    console.log('[findPersonaIdFromDatabase] Searching for persona:', {
      name: normalizedName,
      nickname: normalizedNickname,
      archetype: archetype?.toLowerCase(),
      personasDir: PERSONAS_DIR,
    });
  }

  // Search through all persona files in both V1 (generated) and V2 (Persona Updates) directories
  const searchDirs = [
    { dir: PERSONAS_DIR, format: 'v1' },
    { dir: PERSONA_UPDATES_DIR, format: 'v2' },
  ];

  for (const { dir, format } of searchDirs) {
    for (const filename of PERSONA_FILES) {
      // V2 uses 'scarred.json' instead of 'scarreds.json'
      const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
      const actualFilename = format === 'v2' ? v2Filename : filename;
      
      try {
        const filePath = path.join(dir, actualFilename);
        
        // Check if file exists
        try {
          await fs.access(filePath);
        } catch {
          if (DEBUG) {
            console.log(`[findPersonaIdFromDatabase] File not found: ${filePath}`);
          }
          continue;
        }
        
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: PersonaFile = JSON.parse(fileContent);
      
      if (DEBUG) {
        console.log(`[findPersonaIdFromDatabase] Checking file ${actualFilename} (${format}), archetype: ${data.archetype}, personas count: ${data.personas?.length || 0}`);
      }

        // Filter by archetype if provided (normalize to lowercase for comparison)
        if (archetype && data.archetype?.toLowerCase() !== archetype.toLowerCase()) {
          continue;
        }

      // Try to find matching persona
      // Priority: nickname match > full_name match > name match > persona_id/id extraction
      const persona = data.personas.find(
        (p) => {
          // Handle both V1 (persona_id, full_name) and V2 (id, name) formats
          const pPersonaId = p.persona_id || p.id; // V1 uses persona_id, V2 uses id
          const pNickname = p.nickname?.toLowerCase().trim();
          const pFullName = p.full_name?.toLowerCase().trim(); // V1 format
          const pName = p.name?.toLowerCase().trim(); // V2 format (also used in V1 sometimes)
          
          // Extract name from persona_id/id (e.g., "BOOT_1.1_GaryHendricks" -> "garyhendricks" or "BOOT_03" -> "boot03")
          let pPersonaIdName: string | null = null;
          if (pPersonaId) {
            // Extract the name part after the last underscore
            const parts = pPersonaId.split('_');
            if (parts.length > 2) {
              pPersonaIdName = parts.slice(2).join('_').toLowerCase().trim();
            } else if (parts.length === 2) {
              // V2 format like "BOOT_03" - use the number part
              pPersonaIdName = parts[1].toLowerCase().trim();
            }
          }

          // 1. Exact nickname match (most specific)
          if (normalizedNickname && pNickname === normalizedNickname) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: nickname "${normalizedNickname}" === "${pNickname}"`);
            return true;
          }

          // 2. Database name matches JSON full_name (common case)
          if (normalizedName && pFullName === normalizedName) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: name "${normalizedName}" === full_name "${pFullName}"`);
            return true;
          }

          // 3. Database name matches JSON nickname (when full_name wasn't available)
          if (normalizedName && pNickname === normalizedName) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: name "${normalizedName}" === nickname "${pNickname}"`);
            return true;
          }

          // 4. Database nickname matches JSON name field
          if (normalizedNickname && pName === normalizedNickname) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: nickname "${normalizedNickname}" === name "${pName}"`);
            return true;
          }

          // 5. Database name matches JSON name field
          if (normalizedName && pName === normalizedName) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: name "${normalizedName}" === name "${pName}"`);
            return true;
          }

          // 6. Extract name from database name and match against persona_id name
          // e.g., "Gary Hendricks" -> "garyhendricks" matches "BOOT_1.1_GaryHendricks"
          if (normalizedName && pPersonaIdName) {
            // Remove spaces, hyphens, apostrophes for comparison
            const dbNameClean = normalizedName.replace(/\s+/g, '').replace(/-/g, '').replace(/'/g, '');
            const pPersonaIdNameClean = pPersonaIdName.replace(/-/g, '').replace(/'/g, '');
            if (dbNameClean === pPersonaIdNameClean) {
              if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: name "${normalizedName}" (cleaned) === persona_id name "${pPersonaIdName}"`);
              return true;
            }
            // Also try partial match (e.g., "DoctorsDaughterDiana" contains "Diana")
            if (dbNameClean.length > 3 && pPersonaIdNameClean.includes(dbNameClean)) {
              if (DEBUG) console.log(`[findPersonaIdFromDatabase] Partial match found: "${dbNameClean}" in persona_id "${pPersonaIdNameClean}"`);
              return true;
            }
            if (pPersonaIdNameClean.length > 3 && dbNameClean.includes(pPersonaIdNameClean)) {
              if (DEBUG) console.log(`[findPersonaIdFromDatabase] Partial match found: persona_id "${pPersonaIdNameClean}" in "${dbNameClean}"`);
              return true;
            }
          }

          // 7. Fallback: check if database name contains JSON nickname or vice versa
          if (normalizedNickname && pNickname && (
            pNickname.includes(normalizedNickname) || 
            normalizedNickname.includes(pNickname)
          )) {
            if (DEBUG) console.log(`[findPersonaIdFromDatabase] Partial match found: nickname "${normalizedNickname}" ~= "${pNickname}"`);
            return true;
          }

          // 8. Fallback: check if database name (without spaces/hyphens) matches persona_id name
          if (normalizedName && pPersonaIdName) {
            const dbNameNoSpaces = normalizedName.replace(/\s+/g, '').replace(/-/g, '').replace(/'/g, '');
            const pPersonaIdNameClean = pPersonaIdName.replace(/-/g, '').replace(/'/g, '');
            if (dbNameNoSpaces === pPersonaIdNameClean) {
              if (DEBUG) console.log(`[findPersonaIdFromDatabase] Match found: name "${normalizedName}" (cleaned) === persona_id name "${pPersonaIdName}"`);
              return true;
            }
            if (dbNameNoSpaces.includes(pPersonaIdNameClean) || pPersonaIdNameClean.includes(dbNameNoSpaces)) {
              if (DEBUG) console.log(`[findPersonaIdFromDatabase] Partial match found: name "${normalizedName}" (cleaned) ~= persona_id name "${pPersonaIdName}"`);
              return true;
            }
          }

          // 9. Advanced: Check if first name + last name match (e.g., "Diana" from "Doctors-Are-Heroes Diana" vs "Doctor's-Daughter Diana")
          // BUT: Be more strict to avoid false matches (e.g., "Fran" matching both "Francine" and "Frank")
          if (normalizedName) {
            // Split by spaces AND hyphens to handle "Stoic-Farm-Wife Fran"
            const nameParts = normalizedName.split(/[\s-]+/).filter(p => p.length > 0);
            const lastName = nameParts[nameParts.length - 1]; // Last part is usually the last name
            const otherParts = nameParts.slice(0, -1); // All parts except last name
            
            if (lastName && lastName.length >= 3) {
              // First, try to match with multiple parts (more reliable)
              // e.g., "Stoic-Farm-Wife Fran" should match "Farm-Raised Francine" because both have "Farm" and "Fran"
              if (otherParts.length > 0) {
                let matchingParts = 0;
                let lastNameMatch = false;
                
                // Check if last name matches (but be careful about "Fran" vs "Frank" vs "Francine")
                const lastNameRegex = new RegExp(`\\b${lastName}`, 'i');
                if (pFullName && lastNameRegex.test(pFullName)) {
                  // Check what comes after "Fran" - if it's "cine" it's Francine, if it's "k" it's Frank
                  const franMatch = pFullName.toLowerCase().match(/fran([ck]|cine)?/i);
                  if (franMatch) {
                    const afterFran = franMatch[1] || '';
                    // If searching for "Fran" and we find "Francine", that's a good match
                    // If searching for "Fran" and we find "Frank", that's ambiguous
                    if (lastName.toLowerCase() === 'fran') {
                      if (afterFran === 'cine' || afterFran === '') {
                        lastNameMatch = true; // "Fran" matches "Francine" or standalone "Fran"
                      }
                      // Don't match "Fran" to "Frank" - too ambiguous
                    } else {
                      lastNameMatch = true; // For longer names, use normal matching
                    }
                  }
                }
                
                // Check if other parts match (like "Farm", "Stoic", "Wife")
                for (const part of otherParts) {
                  if (part.length > 2) {
                    const partLower = part.toLowerCase();
                    if (pFullName && pFullName.toLowerCase().includes(partLower)) {
                      matchingParts++;
                    }
                    // Also check persona_id
                    if (pPersonaIdName && pPersonaIdName.toLowerCase().includes(partLower)) {
                      matchingParts++;
                    }
                  }
                }
                
                // If we have multiple matching parts AND last name matches, it's a strong match
                if (lastNameMatch && matchingParts > 0) {
                  if (DEBUG) console.log(`[findPersonaIdFromDatabase] Multi-part match found: "${matchingParts} parts + last name "${lastName}" in "${pFullName}"`);
                  return true;
                }
              }
              
              // Fallback: Check if last name matches as a complete word in full_name
              const lastNameRegex = new RegExp(`\\b${lastName}\\b`, 'i');
              
              if (pFullName && lastNameRegex.test(pFullName)) {
                // Also check if any other part matches (like "Diana" or "Farm")
                let otherPartMatch = false;
                for (const part of otherParts) {
                  if (part.length > 2 && pFullName.toLowerCase().includes(part.toLowerCase())) {
                    otherPartMatch = true;
                    break;
                  }
                }
                if (otherPartMatch) {
                  if (DEBUG) console.log(`[findPersonaIdFromDatabase] Name part match found: last name "${lastName}" and other parts in "${pFullName}"`);
                  return true;
                }
              }
              
              // For persona_id matching, be VERY strict to avoid false positives
              // Only match if the last name is at least 4 characters OR it's an exact match
              if (pPersonaIdName && lastName.length >= 4) {
                const pPersonaIdNameClean = pPersonaIdName.replace(/-/g, '').replace(/'/g, '').toLowerCase();
                const lastNameClean = lastName.toLowerCase().replace(/-/g, '').replace(/'/g, '');
                
                // Exact match
                if (pPersonaIdNameClean === lastNameClean) {
                  if (DEBUG) console.log(`[findPersonaIdFromDatabase] Persona ID exact last name match: "${lastName}" === "${pPersonaIdName}"`);
                  return true;
                }
                
                // Starts with match (e.g., "francine" starts with "franc" but not "fran")
                // Only if the last name is long enough to be unambiguous
                if (lastNameClean.length >= 5 && pPersonaIdNameClean.startsWith(lastNameClean)) {
                  if (DEBUG) console.log(`[findPersonaIdFromDatabase] Persona ID starts with last name: "${lastName}" in "${pPersonaIdName}"`);
                  return true;
                }
                
                // Contains match but only if it's unambiguous
                // Avoid "fran" matching both "frank" and "francine"
                if (pPersonaIdNameClean.includes(lastNameClean)) {
                  // Check if this could be ambiguous (e.g., "fran" in both "frank" and "francine")
                  // Only match if the next character after the match makes it unambiguous
                  const matchIndex = pPersonaIdNameClean.indexOf(lastNameClean);
                  const nextChar = pPersonaIdNameClean[matchIndex + lastNameClean.length];
                  
                  // If it's a complete word (next char is end of string or underscore), it's safe
                  if (!nextChar || nextChar === '_') {
                    if (DEBUG) console.log(`[findPersonaIdFromDatabase] Persona ID contains unambiguous last name: "${lastName}" in "${pPersonaIdName}"`);
                    return true;
                  }
                }
              }
            }
          }

          return false;
        }
      );

      if (persona) {
        if (DEBUG) {
          console.log('[findPersonaIdFromDatabase] Found matching persona:', {
            persona_id: persona.persona_id || persona.id,
            nickname: persona.nickname,
            full_name: persona.full_name,
            name: persona.name,
            file: actualFilename,
            format,
          });
        }
        // Return the persona_id (V1) or id (V2)
        return persona.persona_id || persona.id || null;
      }
      } catch (error) {
        // Log error but continue searching other files
        if (DEBUG) {
          console.warn(`Error reading persona file ${actualFilename} from ${dir}:`, error);
        }
        continue;
      }
    }
  }

  // If archetype was provided and no match found, try searching without archetype filter
  if (archetype) {
    if (DEBUG) {
      console.log('[findPersonaIdFromDatabase] No match found with archetype filter, trying without archetype filter...');
    }
    
    // Search both directories without archetype filter
    for (const { dir, format } of searchDirs) {
      for (const filename of PERSONA_FILES) {
        // V2 uses 'scarred.json' instead of 'scarreds.json'
        const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
        const actualFilename = format === 'v2' ? v2Filename : filename;
        
        try {
          const filePath = path.join(dir, actualFilename);
          
          try {
            await fs.access(filePath);
          } catch {
            continue;
          }
          
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const data: PersonaFile = JSON.parse(fileContent);

          // Try to find matching persona without archetype filter
          const persona = data.personas.find(
            (p) => {
              // Handle both V1 and V2 formats
              const pPersonaId = p.persona_id || p.id;
              const pNickname = p.nickname?.toLowerCase().trim();
              const pFullName = p.full_name?.toLowerCase().trim();
              const pName = p.name?.toLowerCase().trim();
              
              // Extract name from persona_id/id
              let pPersonaIdName: string | null = null;
              if (pPersonaId) {
                const parts = pPersonaId.split('_');
                if (parts.length > 2) {
                  pPersonaIdName = parts.slice(2).join('_').toLowerCase().trim();
                } else if (parts.length === 2) {
                  pPersonaIdName = parts[1].toLowerCase().trim();
                }
              }

              if (normalizedNickname && pNickname === normalizedNickname) {
                return true;
              }
              if (normalizedName && pFullName === normalizedName) {
                return true;
              }
              if (normalizedName && pNickname === normalizedName) {
                return true;
              }
              if (normalizedNickname && pName === normalizedNickname) {
                return true;
              }
              if (normalizedName && pName === normalizedName) {
                return true;
              }
              // Match against persona_id/id name
              if (normalizedName && pPersonaIdName) {
                const dbNameNoSpaces = normalizedName.replace(/\s+/g, '');
                if (dbNameNoSpaces === pPersonaIdName || dbNameNoSpaces.includes(pPersonaIdName) || pPersonaIdName.includes(dbNameNoSpaces)) {
                  return true;
                }
              }
              if (normalizedNickname && pNickname && (
                pNickname.includes(normalizedNickname) || 
                normalizedNickname.includes(pNickname)
              )) {
                return true;
              }
              return false;
            }
          );

          if (persona) {
            if (DEBUG) {
              console.log('[findPersonaIdFromDatabase] Found matching persona (without archetype filter):', {
                persona_id: persona.persona_id || persona.id,
                nickname: persona.nickname,
                full_name: persona.full_name,
                name: persona.name,
                archetype: data.archetype,
                file: actualFilename,
                format,
              });
            }
            // Return the persona_id (V1) or id (V2)
            return persona.persona_id || persona.id || null;
          }
        } catch (error) {
          if (DEBUG) {
            console.warn(`Error reading persona file ${actualFilename} from ${dir} (fallback search):`, error);
          }
          continue;
        }
      }
    }
  }

  // Only log if DEBUG mode is enabled (reduces noise in production)
  if (DEBUG) {
    console.log('[findPersonaIdFromDatabase] No matching persona found after all searches');
  }
  return null;
}

/**
 * Get image path for a persona
 * Returns the full path to the image file, or null if not found
 */
export async function getPersonaImagePath(
  personaId: string,
  name: string,
  nickname: string | null | undefined,
  archetype: string | null | undefined
): Promise<string | null> {
  try {
    // First, try to find the JSON persona_id
    const jsonPersonaId = await findPersonaIdFromDatabase(name, nickname, archetype);
    
    if (!jsonPersonaId) {
      return null;
    }

    // Get image URL from mappings
    const mappings = await loadPersonaImageMappings();
    const imageUrl = mappings.get(jsonPersonaId);

    if (!imageUrl) {
      return null;
    }

    // Extract filename from image_url (e.g., "images/BOOT_1.1_GaryHendricks.png" -> "BOOT_1.1_GaryHendricks.png")
    const filename = imageUrl.replace('images/', '');
    const imagePath = path.join(IMAGES_DIR, filename);

    // Check if file exists
    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      return null;
    }
  } catch (error) {
    // Log error but return null gracefully (don't break persona fetching)
    console.warn('[getPersonaImagePath] Error getting image path:', error);
    return null;
  }
}

/**
 * Get image URL for API response
 * Returns a relative URL path like "/personas/images/{personaId}" or a Vercel Blob URL if stored there
 * The frontend will prepend the API base URL (which already includes /api)
 */
export async function getPersonaImageUrl(
  personaId: string,
  name: string,
  nickname: string | null | undefined,
  archetype: string | null | undefined
): Promise<string | null> {
  try {
    // First check if we have a Vercel Blob URL in the JSON mappings
    const jsonPersonaId = await findPersonaIdFromDatabase(name, nickname, archetype);
    if (jsonPersonaId) {
      const mappings = await loadPersonaImageMappings();
      const imageUrl = mappings.get(jsonPersonaId);
      
      // If image_url is a Vercel Blob URL (starts with https://), return it directly
      if (imageUrl && imageUrl.startsWith('https://')) {
        return imageUrl;
      }
    }
    
    // Fallback to filesystem-based serving
    const imagePath = await getPersonaImagePath(personaId, name, nickname, archetype);
    
    if (!imagePath) {
      return null;
    }

    // Return API endpoint URL (relative path without /api prefix since baseUrl already has it)
    return `/personas/images/${personaId}`;
  } catch (error) {
    // Log error but return null gracefully (don't break persona fetching)
    console.warn('[getPersonaImageUrl] Error getting image URL:', error);
    return null;
  }
}
