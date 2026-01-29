#!/usr/bin/env tsx
/**
 * Generate headshot images for all personas using OpenAI DALL-E
 * 
 * This script:
 * 1. Reads all persona JSON files from Juror Personas/generated/
 * 2. Generates descriptive prompts based on persona demographics and characteristics
 * 3. Uses OpenAI DALL-E API to generate professional headshots
 * 4. Saves images to Juror Personas/images/
 * 5. Optionally updates persona JSON files with image URLs
 * 
 * Usage:
 *   npm run generate-persona-headshots
 * 
 * Environment Variables:
 *   OPENAI_API_KEY - Required: Your OpenAI API key
 *   UPDATE_JSON - Optional: Set to "true" to update JSON files with image URLs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UPDATE_JSON = process.env.UPDATE_JSON === 'true';

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  console.error('   Set it in your .env file or export it before running this script');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Directory paths
const PERSONAS_DIR = path.join(process.cwd(), 'Juror Personas', 'generated');
const IMAGES_DIR = path.join(process.cwd(), 'Juror Personas', 'images');

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

interface Persona {
  persona_id: string;
  nickname: string;
  full_name?: string;
  tagline?: string;
  archetype: string;
  demographics: {
    age?: number;
    gender?: string;
    race_ethnicity?: string;
    location?: string;
    location_city?: string;
    location_state?: string;
    education?: string;
    occupation?: string;
    income?: number;
    marital_status?: string;
    religion?: string;
    religion_activity?: string;
    political_affiliation?: string;
  };
  image_url?: string;
}

interface PersonaFile {
  archetype: string;
  archetype_display_name: string;
  personas: Persona[];
}

/**
 * Create a descriptive prompt for DALL-E based on persona characteristics
 */
function createImagePrompt(persona: Persona): string {
  const demo = persona.demographics;
  
  // Build age description
  let ageDesc = '';
  if (demo.age) {
    if (demo.age < 30) ageDesc = 'young adult';
    else if (demo.age < 45) ageDesc = 'middle-aged';
    else if (demo.age < 60) ageDesc = 'mature adult';
    else ageDesc = 'senior';
  }
  
  // Build gender description
  const gender = demo.gender?.toLowerCase() || 'person';
  const pronoun = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  
  // Build ethnicity/race description
  const ethnicity = demo.race_ethnicity || '';
  let ethnicityDesc = '';
  if (ethnicity.toLowerCase().includes('white')) ethnicityDesc = 'Caucasian';
  else if (ethnicity.toLowerCase().includes('black') || ethnicity.toLowerCase().includes('african')) ethnicityDesc = 'African American';
  else if (ethnicity.toLowerCase().includes('latino') || ethnicity.toLowerCase().includes('hispanic') || ethnicity.toLowerCase().includes('mexican')) ethnicityDesc = 'Latino/Hispanic';
  else if (ethnicity.toLowerCase().includes('asian')) ethnicityDesc = 'Asian';
  else if (ethnicity.toLowerCase().includes('jewish')) ethnicityDesc = 'Jewish';
  else ethnicityDesc = ethnicity || '';
  
  // Build professional appearance based on occupation
  let professionalDesc = 'professional';
  if (demo.occupation) {
    const occ = demo.occupation.toLowerCase();
    if (occ.includes('teacher') || occ.includes('educator')) professionalDesc = 'professional educator';
    else if (occ.includes('nurse') || occ.includes('medical')) professionalDesc = 'medical professional';
    else if (occ.includes('engineer') || occ.includes('technical')) professionalDesc = 'technical professional';
    else if (occ.includes('attorney') || occ.includes('lawyer') || occ.includes('legal')) professionalDesc = 'legal professional';
    else if (occ.includes('retired')) professionalDesc = 'retired professional';
    else if (occ.includes('manager') || occ.includes('executive') || occ.includes('ceo')) professionalDesc = 'business professional';
    else if (occ.includes('union') || occ.includes('labor')) professionalDesc = 'working professional';
    else if (occ.includes('pastor') || occ.includes('reverend') || occ.includes('chaplain')) professionalDesc = 'clergy';
    else if (occ.includes('construction') || occ.includes('contractor') || occ.includes('worker')) professionalDesc = 'working class';
  }
  
  // Build expression based on archetype
  let expressionDesc = 'neutral, approachable';
  const archetype = persona.archetype.toLowerCase();
  if (archetype.includes('bootstrapper')) expressionDesc = 'confident, determined, no-nonsense';
  else if (archetype.includes('crusader')) expressionDesc = 'passionate, determined, justice-oriented';
  else if (archetype.includes('scale') || archetype.includes('balancer')) expressionDesc = 'thoughtful, analytical, fair-minded';
  else if (archetype.includes('captain')) expressionDesc = 'authoritative, confident, leadership';
  else if (archetype.includes('chameleon')) expressionDesc = 'agreeable, deferential, pleasant';
  else if (archetype.includes('scarred')) expressionDesc = 'experienced, empathetic, understanding';
  else if (archetype.includes('calculator')) expressionDesc = 'analytical, precise, data-focused';
  else if (archetype.includes('heart')) expressionDesc = 'warm, empathetic, compassionate';
  else if (archetype.includes('trojan')) expressionDesc = 'neutral, unassuming, ordinary';
  else if (archetype.includes('maverick')) expressionDesc = 'independent, thoughtful, principled';
  
  // Build clothing description based on profession and archetype
  let clothingDesc = 'professional business attire';
  if (demo.occupation) {
    const occ = demo.occupation.toLowerCase();
    if (occ.includes('nurse') || occ.includes('medical')) clothingDesc = 'professional medical attire or business casual';
    else if (occ.includes('teacher') || occ.includes('educator')) clothingDesc = 'professional educator attire, business casual';
    else if (occ.includes('construction') || occ.includes('contractor') || occ.includes('worker')) clothingDesc = 'work attire or casual professional';
    else if (occ.includes('union') || occ.includes('labor')) clothingDesc = 'working professional attire';
    else if (occ.includes('retired')) clothingDesc = 'comfortable professional or casual professional';
    else if (occ.includes('pastor') || occ.includes('reverend')) clothingDesc = 'professional clergy attire or business professional';
  }
  
  // Build the full prompt
  const prompt = `Professional headshot portrait of a ${ageDesc} ${ethnicityDesc} ${pronoun}, ${expressionDesc} expression. ${professionalDesc} appearance, ${clothingDesc}. Clean background, professional lighting, high quality portrait photography style. The person should look like a real juror - authentic, diverse, and representative of their demographic background.`;
  
  return prompt;
}

/**
 * Generate image using DALL-E
 */
async function generateImage(prompt: string, personaId: string): Promise<string> {
  console.log(`  📸 Generating image for ${personaId}...`);
  
  try {
    const response = await openai.images.generate({
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
  } catch (error: any) {
    console.error(`  ❌ Error generating image: ${error.message}`);
    throw error;
  }
}

/**
 * Download image from URL and save locally
 */
async function downloadAndSaveImage(imageUrl: string, filePath: string): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buffer));
}

/**
 * Process a single persona file
 */
async function processPersonaFile(filename: string): Promise<{processed: number; skipped: number; failed: number}> {
  const filePath = path.join(PERSONAS_DIR, filename);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data: PersonaFile = JSON.parse(fileContent);
  
  console.log(`\n📁 Processing ${data.archetype_display_name} (${data.personas.length} personas)`);
  console.log('='.repeat(80));
  
  const updatedPersonas: Persona[] = [];
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const persona of data.personas) {
    try {
      // Skip if image already exists
      const imageFileName = `${persona.persona_id}.png`;
      const imagePath = path.join(IMAGES_DIR, imageFileName);
      
      // Check if image already exists
      try {
        await fs.access(imagePath);
        console.log(`  ⏭️  Skipping ${persona.nickname} - image already exists`);
        updatedPersonas.push(persona);
        skipped++;
        continue;
      } catch {
        // Image doesn't exist, proceed with generation
      }
      
      // Create prompt
      const prompt = createImagePrompt(persona);
      console.log(`  🎨 ${persona.nickname} (${persona.persona_id})`);
      console.log(`     Prompt: ${prompt.substring(0, 100)}...`);
      
      // Generate image
      const imageUrl = await generateImage(prompt, persona.persona_id);
      
      // Download and save image
      await downloadAndSaveImage(imageUrl, imagePath);
      
      // Update persona with relative image path
      const relativeImagePath = `images/${imageFileName}`;
      const updatedPersona: Persona = {
        ...persona,
        image_url: relativeImagePath,
      };
      
      updatedPersonas.push(updatedPersona);
      processed++;
      
      console.log(`  ✅ Generated and saved: ${relativeImagePath}`);
      
      // Rate limiting - DALL-E 3 has rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests
      
    } catch (error: any) {
      console.error(`  ❌ Failed to process ${persona.nickname}: ${error.message}`);
      // Continue with next persona even if this one fails
      updatedPersonas.push(persona);
      failed++;
    }
  }
  
  // Update JSON file if requested
  if (UPDATE_JSON) {
    const updatedData: PersonaFile = {
      ...data,
      personas: updatedPersonas,
    };
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log(`  💾 Updated ${filename} with image URLs`);
  }
  
  return { processed, skipped, failed };
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Persona Headshot Generator');
  console.log('='.repeat(80));
  console.log(`📂 Personas directory: ${PERSONAS_DIR}`);
  console.log(`📂 Images directory: ${IMAGES_DIR}`);
  console.log(`🔄 Update JSON files: ${UPDATE_JSON ? 'Yes' : 'No'}`);
  console.log('='.repeat(80));
  
  // Create images directory if it doesn't exist
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log(`✅ Created images directory: ${IMAGES_DIR}`);
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Process each persona file
  let totalPersonas = 0;
  let processedPersonas = 0;
  let skippedPersonas = 0;
  let failedPersonas = 0;
  
  for (const filename of PERSONA_FILES) {
    try {
      const filePath = path.join(PERSONAS_DIR, filename);
      await fs.access(filePath);
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: PersonaFile = JSON.parse(fileContent);
      const filePersonaCount = data.personas.length;
      totalPersonas += filePersonaCount;
      
      // Process file and get counts
      const result = await processPersonaFile(filename);
      processedPersonas += result.processed;
      skippedPersonas += result.skipped;
      failedPersonas += result.failed;
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️  File not found: ${filename}, skipping...`);
      } else {
        console.error(`❌ Error processing ${filename}: ${error.message}`);
        failedPersonas++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 Summary');
  console.log('='.repeat(80));
  console.log(`Total personas: ${totalPersonas}`);
  console.log(`Processed: ${processedPersonas}`);
  console.log(`Skipped (already exist): ${skippedPersonas}`);
  console.log(`Failed: ${failedPersonas}`);
  console.log('='.repeat(80));
  
  if (!UPDATE_JSON) {
    console.log('\n💡 Tip: Set UPDATE_JSON=true to update JSON files with image URLs');
  }
  
  console.log('\n✅ Headshot generation complete!');
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
