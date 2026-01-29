import * as fs from 'fs/promises';
import * as path from 'path';
import { invalidatePersonaImageCache } from './persona-image-utils';

// Lazy load OpenAI to avoid errors if not configured
let openai: any = null;
let OPENAI_API_KEY: string | undefined;

function getOpenAIClient() {
  if (!openai) {
    // Try multiple sources for the API key
    OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    // If not found, try loading from .env file directly
    if (!OPENAI_API_KEY) {
      try {
        const dotenv = require('dotenv');
        const path = require('path');
        // Try loading from api-gateway .env
        const result = dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
        if (!result.error) {
          OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        }
        // Also try root .env
        if (!OPENAI_API_KEY) {
          dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
          OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        }
      } catch (e) {
        // dotenv might not be available, continue
      }
    }
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required. Make sure it is set in services/api-gateway/.env');
    }
    
    // Dynamic import to avoid loading if not needed
    const OpenAI = require('openai').default;
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openai;
}

// Directory paths - adjust based on where the service runs
// Try multiple possible paths to find the correct location
function findPersonasDir(): string {
  const possiblePaths = [
    process.env.PERSONAS_DIR,
    path.join(process.cwd(), 'Juror Personas', 'generated'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'generated'),
    path.join(__dirname, '..', '..', '..', '..', 'Juror Personas', 'generated'),
  ].filter(Boolean) as string[];
  
  // Return first path that exists, or first one as fallback
  for (const dir of possiblePaths) {
    try {
      if (require('fs').existsSync(dir)) {
        return dir;
      }
    } catch {
      // Continue
    }
  }
  
  return possiblePaths[0] || path.join(process.cwd(), 'Juror Personas', 'generated');
}

// Find Persona Updates directory (V2 format)
function findPersonaUpdatesDir(): string {
  const possiblePaths = [
    process.env.PERSONA_UPDATES_DIR,
    path.join(process.cwd(), 'Persona Updates'),
    path.join(process.cwd(), '..', '..', 'Persona Updates'),
    path.join(__dirname, '..', '..', '..', '..', 'Persona Updates'),
  ].filter(Boolean) as string[];
  
  // Return first path that exists, or first one as fallback
  for (const dir of possiblePaths) {
    try {
      if (require('fs').existsSync(dir)) {
        return dir;
      }
    } catch {
      // Continue
    }
  }
  
  return possiblePaths[0] || path.join(process.cwd(), 'Persona Updates');
}

function findImagesDir(): string {
  const possiblePaths = [
    process.env.IMAGES_DIR,
    path.join(process.cwd(), 'Juror Personas', 'images'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'images'),
    path.join(__dirname, '..', '..', '..', '..', 'Juror Personas', 'images'),
  ].filter(Boolean) as string[];
  
  // Return first path that exists, or first one as fallback
  for (const dir of possiblePaths) {
    try {
      if (require('fs').existsSync(dir)) {
        return dir;
      }
    } catch {
      // Continue
    }
  }
  
  return possiblePaths[0] || path.join(process.cwd(), 'Juror Personas', 'images');
}

const PERSONAS_DIR = findPersonasDir();
const PERSONA_UPDATES_DIR = findPersonaUpdatesDir();
const IMAGES_DIR = findImagesDir();

// Persona JSON files
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

export interface Persona {
  persona_id?: string; // V1 format
  id?: string; // V2 format
  nickname?: string;
  name?: string; // V2 format (also used as nickname)
  full_name?: string; // V1 format
  tagline?: string;
  archetype: string;
  demographics: {
    age?: number;
    gender?: string;
    race_ethnicity?: string;
    race?: string; // V2 format
    location?: string;
    location_city?: string;
    location_state?: string;
    education?: string;
    occupation?: string;
    income?: number;
    marital_status?: string;
    family?: string; // V2 format
    religion?: string;
    religion_activity?: string;
    political_affiliation?: string;
    politics?: string; // V2 format
  };
  image_url?: string;
}

export interface PersonaFile {
  archetype: string;
  archetype_display_name: string;
  personas: Persona[];
}

export interface GenerationProgress {
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  current?: {
    personaId: string;
    nickname: string;
    archetype: string;
  };
}

/**
 * Create a descriptive prompt for DALL-E based on persona characteristics
 * Uses full persona profile to generate realistic, diverse images
 */
export function createImagePrompt(persona: Persona): string {
  // Normalize demographics to handle both V1 and V2 formats
  // Ensure demographics exists (V2 might have it structured differently)
  const baseDemographics = persona.demographics || {};
  const demo = {
    ...baseDemographics,
    race_ethnicity: baseDemographics.race_ethnicity || baseDemographics.race,
    marital_status: baseDemographics.marital_status || (baseDemographics.family ? 'Married' : undefined),
    political_affiliation: baseDemographics.political_affiliation || baseDemographics.politics,
  };
  
  // Build age description with specific age
  let ageDesc = '';
  if (demo.age) {
    if (demo.age < 25) ageDesc = `young adult in their early ${demo.age}s`;
    else if (demo.age < 35) ageDesc = `young adult in their ${demo.age}s`;
    else if (demo.age < 45) ageDesc = `middle-aged person in their ${demo.age}s`;
    else if (demo.age < 60) ageDesc = `mature adult in their ${demo.age}s`;
    else ageDesc = `senior citizen in their ${demo.age}s`;
  } else {
    ageDesc = 'middle-aged person';
  }
  
  // Build gender description
  const gender = demo.gender?.toLowerCase() || 'person';
  const pronoun = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  
  // Build ethnicity/race description
  const ethnicity = (demo.race_ethnicity || '').toString();
  let ethnicityDesc = '';
  if (ethnicity.toLowerCase().includes('white') || ethnicity.toLowerCase().includes('caucasian')) {
    ethnicityDesc = 'Caucasian';
  } else if (ethnicity.toLowerCase().includes('black') || ethnicity.toLowerCase().includes('african')) {
    ethnicityDesc = 'African American';
  } else if (ethnicity.toLowerCase().includes('latino') || ethnicity.toLowerCase().includes('hispanic') || ethnicity.toLowerCase().includes('mexican')) {
    ethnicityDesc = 'Latino/Hispanic';
  } else if (ethnicity.toLowerCase().includes('asian')) {
    ethnicityDesc = 'Asian';
  } else if (ethnicity.toLowerCase().includes('jewish')) {
    ethnicityDesc = 'Jewish';
  } else if (ethnicity.toLowerCase().includes('native') || ethnicity.toLowerCase().includes('indian')) {
    ethnicityDesc = 'Native American';
  } else {
    ethnicityDesc = ethnicity || 'diverse';
  }
  
  // Build location context
  let locationContext = '';
  const location = (demo.location || demo.location_city || '').toString();
  const locationType = ((demo as any).location_type || '').toString();
  if (location.toLowerCase().includes('rural') || locationType === 'rural') {
    locationContext = 'rural, small-town';
  } else if (location.toLowerCase().includes('suburban') || locationType === 'suburban') {
    locationContext = 'suburban';
  } else if (location.toLowerCase().includes('urban') || locationType === 'urban') {
    locationContext = 'urban';
  }
  
  // Extract initials from name for identification
  const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.split(/[\s-]+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '';
  };
  
  const personaName = persona.name || persona.full_name || persona.nickname || '';
  const initials = getInitials(personaName);
  
  // Build detailed occupation-based appearance
  let occupationDesc = '';
  let clothingDesc = '';
  let styleDesc = '';
  
  if (demo.occupation) {
    const occ = (demo.occupation || '').toString().toLowerCase();
    const income = demo.income || 0;
    
    // Construction/Manual Labor
    if (occ.includes('construction') || occ.includes('contractor') || occ.includes('laborer') || occ.includes('worker') || occ.includes('mechanic') || occ.includes('plumber') || occ.includes('electrician')) {
      occupationDesc = 'blue-collar worker';
      clothingDesc = 'wearing a work shirt or casual button-down, possibly with a company logo, or a clean t-shirt';
      styleDesc = 'practical, working-class appearance';
    }
    // Medical
    else if (occ.includes('nurse') || occ.includes('medical') || occ.includes('healthcare') || occ.includes('doctor') || occ.includes('physician')) {
      occupationDesc = 'healthcare professional';
      clothingDesc = 'wearing scrubs or business casual medical attire';
      styleDesc = 'professional, caring appearance';
    }
    // Education
    else if (occ.includes('teacher') || occ.includes('educator') || occ.includes('professor') || occ.includes('principal')) {
      occupationDesc = 'educator';
      clothingDesc = 'wearing business casual or professional educator attire, possibly a cardigan or blazer';
      styleDesc = 'approachable, professional appearance';
    }
    // Clergy
    else if (occ.includes('pastor') || occ.includes('reverend') || occ.includes('chaplain') || occ.includes('minister') || occ.includes('priest')) {
      occupationDesc = 'clergy member';
      clothingDesc = 'wearing professional clergy attire or conservative business attire';
      styleDesc = 'respectable, trustworthy appearance';
    }
    // Sales/Business
    else if (occ.includes('sales') || occ.includes('manager') || occ.includes('executive') || occ.includes('business')) {
      if (income > 100000) {
        occupationDesc = 'business professional';
        clothingDesc = 'wearing a business suit or professional business attire';
        styleDesc = 'polished, corporate appearance';
      } else {
        occupationDesc = 'sales professional';
        clothingDesc = 'wearing business casual attire, button-down shirt or blouse';
        styleDesc = 'professional, approachable appearance';
      }
    }
    // Retired
    else if (occ.includes('retired')) {
      occupationDesc = 'retired person';
      clothingDesc = 'wearing comfortable, casual professional attire or nice casual clothing';
      styleDesc = 'relaxed, experienced appearance';
    }
    // Service Industry
    else if (occ.includes('retail') || occ.includes('cashier') || occ.includes('server') || occ.includes('waiter') || occ.includes('waitress') || occ.includes('service')) {
      occupationDesc = 'service industry worker';
      clothingDesc = 'wearing casual professional attire or clean, presentable casual clothing';
      styleDesc = 'friendly, approachable appearance';
    }
    // Union/Labor
    else if (occ.includes('union') || occ.includes('labor')) {
      occupationDesc = 'union worker';
      clothingDesc = 'wearing work attire or clean casual professional clothing';
      styleDesc = 'practical, working-class appearance';
    }
    // Technical/Engineering
    else if (occ.includes('engineer') || occ.includes('technical') || occ.includes('programmer') || occ.includes('developer')) {
      occupationDesc = 'technical professional';
      clothingDesc = 'wearing business casual or casual professional attire, possibly a polo shirt or casual button-down';
      styleDesc = 'professional, practical appearance';
    }
    // Legal
    else if (occ.includes('attorney') || occ.includes('lawyer') || occ.includes('legal')) {
      occupationDesc = 'legal professional';
      clothingDesc = 'wearing professional business attire or business suit';
      styleDesc = 'polished, professional appearance';
    }
    // Default
    else {
      if (income > 80000) {
        occupationDesc = 'professional';
        clothingDesc = 'wearing business casual or professional attire';
        styleDesc = 'professional appearance';
      } else {
        occupationDesc = 'working professional';
        clothingDesc = 'wearing casual professional or clean casual attire';
        styleDesc = 'practical, approachable appearance';
      }
    }
  } else {
    occupationDesc = 'person';
    clothingDesc = 'wearing casual professional attire';
    styleDesc = 'approachable appearance';
  }
  
  // Build expression based on archetype
  let expressionDesc = '';
  const archetype = (persona.archetype || '').toLowerCase();
  if (archetype.includes('bootstrapper')) {
    expressionDesc = 'confident, determined expression with a no-nonsense, self-reliant demeanor';
  } else if (archetype.includes('crusader')) {
    expressionDesc = 'passionate, determined expression with a justice-oriented, activist demeanor';
  } else if (archetype.includes('scale') || archetype.includes('balancer')) {
    expressionDesc = 'thoughtful, analytical expression with a fair-minded, contemplative demeanor';
  } else if (archetype.includes('captain')) {
    expressionDesc = 'authoritative, confident expression with a natural leadership presence';
  } else if (archetype.includes('chameleon')) {
    expressionDesc = 'agreeable, pleasant expression with a deferential, accommodating demeanor';
  } else if (archetype.includes('scarred')) {
    expressionDesc = 'experienced, empathetic expression showing understanding and life experience';
  } else if (archetype.includes('calculator')) {
    expressionDesc = 'analytical, precise expression with a data-focused, methodical demeanor';
  } else if (archetype.includes('heart')) {
    expressionDesc = 'warm, empathetic expression with a compassionate, caring demeanor';
  } else if (archetype.includes('trojan')) {
    expressionDesc = 'neutral, unassuming expression with an ordinary, everyday appearance';
  } else if (archetype.includes('maverick')) {
    expressionDesc = 'independent, thoughtful expression with a principled, individualistic demeanor';
  } else {
    expressionDesc = 'neutral, approachable expression';
  }
  
  // Build background context
  let backgroundDesc = 'neutral background';
  if (locationContext) {
    backgroundDesc = `${locationContext} setting, neutral background`;
  }
  
  // Build the comprehensive prompt - include initials in the image for identification
  const prompt = `Realistic portrait photograph of a ${ageDesc} ${ethnicityDesc} ${pronoun}, ${expressionDesc}. ${occupationDesc} with ${styleDesc}, ${clothingDesc}. ${backgroundDesc}. Natural lighting, authentic candid portrait style, not a corporate headshot. The person should look like a real, everyday juror - authentic, diverse, and representative of their actual demographic background and occupation. Avoid overly polished or corporate appearance.${initials ? ` In the bottom right corner of the image, add a small, subtle watermark with the initials "${initials}" in a clean, professional font.` : ''}`;
  
  return prompt;
}

/**
 * Generate image using DALL-E
 */
async function generateImage(prompt: string, personaId: string): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'natural',
  });
  
  const imageUrl = response.data[0]?.url;
  if (!imageUrl) {
    throw new Error('No image URL returned from OpenAI');
  }
  
  return imageUrl;
}

/**
 * Download image from URL and save locally with initials overlay
 */
async function downloadAndSaveImage(imageUrl: string, filePath: string, initials?: string): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  
  // If initials provided, add text overlay using sharp
  if (initials) {
    try {
      const sharp = require('sharp');
      const imageBuffer = Buffer.from(buffer);
      
      // Create SVG with text overlay - initials in bottom right corner
      // Use a semi-transparent background for better visibility
      const svgOverlay = Buffer.from(`
        <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <rect x="850" y="950" width="150" height="60" fill="rgba(0,0,0,0.6)" rx="5"/>
          <text x="925" y="990" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${initials}
          </text>
        </svg>
      `);
      
      const finalImage = await sharp(imageBuffer)
        .composite([
          {
            input: svgOverlay,
            top: 0,
            left: 0,
          }
        ])
        .png()
        .toBuffer();
      
      await fs.writeFile(filePath, finalImage);
      console.log(`[downloadAndSaveImage] Added initials overlay "${initials}" to image`);
      return;
    } catch (error: any) {
      // If sharp fails, fall back to saving without overlay
      console.warn(`[downloadAndSaveImage] Failed to add initials overlay, saving without overlay:`, error.message);
    }
  }
  
  // Save without overlay (fallback or if no initials)
  await fs.writeFile(filePath, Buffer.from(buffer));
}

/**
 * Generate headshots for all personas
 */
export async function generatePersonaHeadshots(
  options: {
    regenerate?: boolean;
    updateJson?: boolean;
    onProgress?: (progress: GenerationProgress) => void;
  } = {}
): Promise<{ processed: number; skipped: number; failed: number; errors: string[] }> {
  const { regenerate = false, updateJson = false, onProgress } = options;
  
  // Create images directory if it doesn't exist
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  let totalPersonas = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];
  
  // Count total personas first (check both directories)
  const searchDirs = [
    { dir: PERSONAS_DIR, format: 'v1' },
    { dir: PERSONA_UPDATES_DIR, format: 'v2' },
  ];
  
  for (const { dir, format } of searchDirs) {
    for (const filename of PERSONA_FILES) {
      const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
      const actualFilename = format === 'v2' ? v2Filename : filename;
      
      try {
        const filePath = path.join(dir, actualFilename);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: PersonaFile = JSON.parse(fileContent);
        totalPersonas += data.personas.length;
      } catch {
        // File doesn't exist, skip
      }
    }
  }
  
  // Process each persona file (check both directories)
  for (const { dir, format } of searchDirs) {
    for (const filename of PERSONA_FILES) {
      const v2Filename = filename === 'scarreds.json' ? 'scarred.json' : filename;
      const actualFilename = format === 'v2' ? v2Filename : filename;
      
      try {
        const filePath = path.join(dir, actualFilename);
        await fs.access(filePath);
        
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: PersonaFile = JSON.parse(fileContent);
        const updatedPersonas: Persona[] = [];
        
        for (const persona of data.personas) {
          try {
            const personaIdForImage = persona.persona_id || persona.id || '';
            if (!personaIdForImage) {
              // Skip personas without an ID
              continue;
            }
            
            const imageFileName = `${personaIdForImage}.png`;
            const imagePath = path.join(IMAGES_DIR, imageFileName);
            
            // Check if image already exists
            let imageExists = false;
            try {
              await fs.access(imagePath);
              imageExists = true;
            } catch {
              // Image doesn't exist
            }
            
            // Skip if exists and not regenerating
            if (imageExists && !regenerate) {
              updatedPersonas.push(persona);
              skipped++;
              if (onProgress) {
                onProgress({
                  total: totalPersonas,
                  processed,
                  skipped,
                  failed,
                  current: {
                    personaId: personaIdForImage,
                    nickname: persona.nickname || persona.name || '',
                    archetype: data.archetype_display_name || data.archetype || '',
                  },
                });
              }
              continue;
            }
          
          // Update progress
          if (onProgress) {
            onProgress({
              total: totalPersonas,
              processed,
              skipped,
              failed,
              current: {
                personaId: personaIdForImage,
                nickname: persona.nickname || persona.name || '',
                archetype: data.archetype_display_name || data.archetype || '',
              },
            });
          }
          
          // Normalize persona for prompt generation
          const normalizedPersona: Persona = {
            ...persona,
            persona_id: personaIdForImage,
            nickname: persona.nickname || persona.name,
            full_name: persona.full_name || persona.name,
            demographics: {
              ...persona.demographics,
              race_ethnicity: persona.demographics.race_ethnicity || persona.demographics.race,
              marital_status: persona.demographics.marital_status || (persona.demographics.family ? 'Married' : undefined),
              political_affiliation: persona.demographics.political_affiliation || persona.demographics.politics,
            },
          };
          
          // Create prompt
          const prompt = createImagePrompt(normalizedPersona);
          
          // Generate image
          const imageUrl = await generateImage(prompt, personaIdForImage);
          
          // Get initials for overlay
          const getInitials = (name: string): string => {
            if (!name) return '';
            const parts = name.split(/[\s-]+/).filter(p => p.length > 0);
            if (parts.length >= 2) {
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (parts.length === 1) {
              return parts[0].substring(0, 2).toUpperCase();
            }
            return '';
          };
          const personaInitials = getInitials(persona.name || persona.full_name || persona.nickname || '');
          
          // Download and save image with initials overlay
          await downloadAndSaveImage(imageUrl, imagePath, personaInitials);
          
          // Update persona with relative image path
          const relativeImagePath = `images/${imageFileName}`;
          const updatedPersona: Persona = {
            ...persona,
            image_url: relativeImagePath,
          };
          
          updatedPersonas.push(updatedPersona);
          processed++;
          
          // Rate limiting - DALL-E 3 has rate limits
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          
        } catch (error: any) {
          const personaIdForError = persona.persona_id || persona.id || 'unknown';
          const personaName = persona.nickname || persona.name || 'Unknown';
          const errorMsg = `Failed to process ${personaName} (${personaIdForError}): ${error.message}`;
          errors.push(errorMsg);
          updatedPersonas.push(persona);
          failed++;
          
          if (onProgress) {
            onProgress({
              total: totalPersonas,
              processed,
              skipped,
              failed,
            });
          }
        }
      }
      
        // Update JSON file if requested
        if (updateJson) {
          const updatedData: PersonaFile = {
            ...data,
            personas: updatedPersonas,
          };
          await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
        }
        
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File not found, skip
          continue;
        } else {
          errors.push(`Error processing ${actualFilename}: ${error.message}`);
          failed++;
        }
      }
    }
  }
  
  return { processed, skipped, failed, errors };
}

/**
 * Generate headshot for a single persona by persona_id
 */
export async function generateSinglePersonaHeadshot(
  personaId: string,
  options: {
    regenerate?: boolean;
    updateJson?: boolean;
  } = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const { regenerate = false, updateJson = false } = options;

  try {
    // Create images directory if it doesn't exist
    try {
      await fs.mkdir(IMAGES_DIR, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Find persona in JSON files (check both V1 and V2 directories)
    let persona: Persona | null = null;
    let personaFile: PersonaFile | null = null;
    let filePath: string | null = null;

    // Search both V1 (generated) and V2 (Persona Updates) directories
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
          const currentFilePath = path.join(dir, actualFilename);
          await fs.access(currentFilePath);
          const fileContent = await fs.readFile(currentFilePath, 'utf-8');
          const data: PersonaFile = JSON.parse(fileContent);
          
          // Handle both V1 (persona_id) and V2 (id) formats
          const foundPersona = data.personas.find(p => 
            (p.persona_id === personaId) || (p.id === personaId)
          );
          if (foundPersona) {
            persona = foundPersona;
            personaFile = data;
            filePath = currentFilePath;
            console.log(`[generateSinglePersonaHeadshot] Found persona:`, {
              searchedFor: personaId,
              foundPersonaId: foundPersona.persona_id || foundPersona.id,
              foundName: foundPersona.name || foundPersona.full_name,
              foundNickname: foundPersona.nickname,
              file: actualFilename,
            });
            break;
          }
        } catch {
          // Continue to next file
        }
      }
      if (persona) break; // Found persona, stop searching
    }

    if (!persona || !personaFile || !filePath) {
      return {
        success: false,
        error: `Persona with ID ${personaId} not found in JSON files`,
      };
    }

    // Use persona_id (V1) or id (V2) for image filename
    const actualPersonaId = persona.persona_id || persona.id || personaId;
    const imageFileName = `${actualPersonaId}.png`;
    const imagePath = path.join(IMAGES_DIR, imageFileName);

    // Check if image already exists
    let imageExists = false;
    try {
      await fs.access(imagePath);
      imageExists = true;
    } catch {
      // Image doesn't exist
    }

    // Skip if exists and not regenerating
    if (imageExists && !regenerate) {
      return {
        success: true,
        imageUrl: `images/${imageFileName}`,
      };
    }

    // Create prompt (normalize persona for prompt generation)
    // Ensure archetype is set (V2 personas have it at file level, not persona level)
    const normalizedPersona: Persona = {
      ...persona,
      persona_id: actualPersonaId,
      archetype: persona.archetype || personaFile.archetype || '',
      nickname: persona.nickname || persona.name,
      full_name: persona.full_name || persona.name,
      demographics: {
        ...persona.demographics,
        race_ethnicity: persona.demographics?.race_ethnicity || persona.demographics?.race,
        marital_status: persona.demographics?.marital_status || (persona.demographics?.family ? 'Married' : undefined),
        political_affiliation: persona.demographics?.political_affiliation || persona.demographics?.politics,
      },
    };
    const prompt = createImagePrompt(normalizedPersona);
    
    console.log(`[generateSinglePersonaHeadshot] Generating image with prompt:`, {
      searchedForPersonaId: personaId,
      actualPersonaId,
      personaName: normalizedPersona.name || normalizedPersona.full_name,
      personaNickname: normalizedPersona.nickname,
      gender: normalizedPersona.demographics?.gender,
      promptPreview: prompt.substring(0, 200) + '...',
    });

    // Generate image
    const imageUrl = await generateImage(prompt, actualPersonaId);

    // Get initials for overlay
    const getInitials = (name: string): string => {
      if (!name) return '';
      const parts = name.split(/[\s-]+/).filter(p => p.length > 0);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return '';
    };
    const personaInitials = getInitials(persona.name || persona.full_name || persona.nickname || '');
    
    console.log(`[generateSinglePersonaHeadshot] Adding initials overlay: "${personaInitials}"`);

    // Download and save image with initials overlay
    await downloadAndSaveImage(imageUrl, imagePath, personaInitials);

    // Update persona with relative image path
    const relativeImagePath = `images/${imageFileName}`;
    const updatedPersona: Persona = {
      ...persona,
      image_url: relativeImagePath,
    };

    // Update JSON file if requested
    if (updateJson) {
      const updatedPersonas = personaFile.personas.map(p =>
        (p.persona_id === personaId || p.id === personaId) ? updatedPersona : p
      );
      const updatedData: PersonaFile = {
        ...personaFile,
        personas: updatedPersonas,
      };
      await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
      
      // Invalidate cache so the new image is picked up immediately
      invalidatePersonaImageCache();
    }

    return {
      success: true,
      imageUrl: relativeImagePath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
