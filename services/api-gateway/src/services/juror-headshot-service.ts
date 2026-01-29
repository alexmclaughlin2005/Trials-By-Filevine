import * as fs from 'fs/promises';
import * as path from 'path';

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

// Directory paths for juror images
function findJurorImagesDir(): string {
  const possiblePaths = [
    process.env.JUROR_IMAGES_DIR,
    path.join(process.cwd(), 'juror-images'),
    path.join(process.cwd(), '..', '..', 'juror-images'),
    path.join(__dirname, '..', '..', '..', '..', 'juror-images'),
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
  
  return possiblePaths[0] || path.join(process.cwd(), 'juror-images');
}

const JUROR_IMAGES_DIR = findJurorImagesDir();

export interface JurorImageData {
  id: string;
  firstName: string;
  lastName: string;
  age?: number | null;
  gender?: string | null;
  hairColor?: string | null;
  height?: string | null;
  weight?: string | null;
  skinTone?: string | null;
  race?: string | null;
  physicalDescription?: string | null;
  occupation?: string | null;
  shirtColor?: string | null;
}

/**
 * Create a descriptive prompt for DALL-E based on juror physical description
 */
export function createJurorImagePrompt(juror: JurorImageData, style: 'realistic' | 'avatar' = 'realistic'): string {
  // Build age description
  let ageDesc = '';
  if (juror.age) {
    if (juror.age < 25) ageDesc = `young adult in their early ${juror.age}s`;
    else if (juror.age < 35) ageDesc = `young adult in their ${juror.age}s`;
    else if (juror.age < 45) ageDesc = `middle-aged person in their ${juror.age}s`;
    else if (juror.age < 60) ageDesc = `mature adult in their ${juror.age}s`;
    else ageDesc = `senior citizen in their ${juror.age}s`;
  } else {
    ageDesc = 'middle-aged person';
  }
  
  // Build gender description
  const gender = (juror.gender || '').toLowerCase();
  const pronoun = gender === 'female' || gender === 'f' ? 'woman' : 
                  gender === 'male' || gender === 'm' ? 'man' : 
                  'person';
  
  // Build ethnicity/race description
  let ethnicityDesc = '';
  if (juror.race) {
    const race = juror.race.toLowerCase();
    if (race.includes('white') || race.includes('caucasian')) {
      ethnicityDesc = 'Caucasian';
    } else if (race.includes('black') || race.includes('african')) {
      ethnicityDesc = 'African American';
    } else if (race.includes('latino') || race.includes('hispanic') || race.includes('mexican')) {
      ethnicityDesc = 'Latino/Hispanic';
    } else if (race.includes('asian')) {
      ethnicityDesc = 'Asian';
    } else if (race.includes('native') || race.includes('indian')) {
      ethnicityDesc = 'Native American';
    } else {
      ethnicityDesc = juror.race;
    }
  } else {
    ethnicityDesc = 'diverse';
  }
  
  // Build skin tone description
  let skinToneDesc = '';
  if (juror.skinTone) {
    const tone = juror.skinTone.toLowerCase();
    if (tone.includes('light') || tone.includes('fair')) {
      skinToneDesc = 'light skin tone';
    } else if (tone.includes('medium')) {
      skinToneDesc = 'medium skin tone';
    } else if (tone.includes('dark') || tone.includes('deep')) {
      skinToneDesc = 'dark skin tone';
    } else {
      skinToneDesc = `${juror.skinTone} skin tone`;
    }
  }
  
  // Build hair color description
  let hairDesc = '';
  if (juror.hairColor) {
    const hair = juror.hairColor.toLowerCase();
    if (hair.includes('blonde') || hair.includes('blond')) {
      hairDesc = 'blonde hair';
    } else if (hair.includes('brown') || hair.includes('brunette')) {
      hairDesc = 'brown hair';
    } else if (hair.includes('black')) {
      hairDesc = 'black hair';
    } else if (hair.includes('red') || hair.includes('auburn')) {
      hairDesc = 'red or auburn hair';
    } else if (hair.includes('gray') || hair.includes('grey') || hair.includes('silver')) {
      hairDesc = 'gray or silver hair';
    } else {
      hairDesc = `${juror.hairColor} hair`;
    }
  } else {
    hairDesc = 'natural hair color';
  }
  
  // Build build/body type from height and weight
  let buildDesc = '';
  if (juror.height && juror.weight) {
    // Try to extract numbers from height/weight strings
    const heightMatch = juror.height.match(/(\d+)/);
    const weightMatch = juror.weight.match(/(\d+)/);
    
    if (heightMatch && weightMatch) {
      const heightInches = parseInt(heightMatch[1]);
      const weightLbs = parseInt(weightMatch[1]);
      
      // Convert height to inches if needed (assume feet'inches" format if > 10)
      let heightInchesActual = heightInches;
      if (heightInches < 10) {
        // Might be in feet, try to parse feet'inches" format
        const feetInchesMatch = juror.height.match(/(\d+)['"]?\s*(\d+)/);
        if (feetInchesMatch) {
          heightInchesActual = parseInt(feetInchesMatch[1]) * 12 + parseInt(feetInchesMatch[2]);
        }
      }
      
      // Calculate BMI approximation
      const heightMeters = heightInchesActual * 0.0254;
      const weightKg = weightLbs * 0.453592;
      const bmi = weightKg / (heightMeters * heightMeters);
      
      if (bmi < 18.5) {
        buildDesc = 'slender build';
      } else if (bmi < 25) {
        buildDesc = 'average build';
      } else if (bmi < 30) {
        buildDesc = 'stocky build';
      } else {
        buildDesc = 'larger build';
      }
    } else {
      buildDesc = 'average build';
    }
  } else if (juror.height) {
    buildDesc = 'average build';
  } else if (juror.weight) {
    const weightMatch = juror.weight.match(/(\d+)/);
    if (weightMatch) {
      const weightLbs = parseInt(weightMatch[1]);
      if (weightLbs < 120) buildDesc = 'slender build';
      else if (weightLbs < 180) buildDesc = 'average build';
      else if (weightLbs < 220) buildDesc = 'stocky build';
      else buildDesc = 'larger build';
    } else {
      buildDesc = 'average build';
    }
  } else {
    buildDesc = 'average build';
  }
  
  // Build occupation-based appearance
  let occupationDesc = '';
  let clothingDesc = '';
  let styleDesc = '';
  
  if (juror.occupation) {
    const occ = (juror.occupation || '').toString().toLowerCase();
    
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
    // Sales/Business
    else if (occ.includes('sales') || occ.includes('manager') || occ.includes('executive') || occ.includes('business') || occ.includes('vp') || occ.includes('director')) {
      occupationDesc = 'business professional';
      clothingDesc = 'wearing business casual attire, button-down shirt or blouse';
      styleDesc = 'professional, approachable appearance';
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
    // Technical/Engineering
    else if (occ.includes('engineer') || occ.includes('technical') || occ.includes('programmer') || occ.includes('developer') || occ.includes('software')) {
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
      occupationDesc = 'working professional';
      clothingDesc = 'wearing casual professional or clean casual attire';
      styleDesc = 'practical, approachable appearance';
    }
  } else {
    occupationDesc = 'person';
    clothingDesc = 'wearing casual professional attire';
    styleDesc = 'approachable appearance';
  }
  
  // Add shirt color/clothing if specified
  if (juror.shirtColor) {
    const shirtColor = juror.shirtColor.trim();
    if (shirtColor) {
      // If clothingDesc already exists, enhance it with color; otherwise create new description
      if (clothingDesc) {
        clothingDesc = `${clothingDesc}, ${shirtColor} colored shirt or top`;
      } else {
        clothingDesc = `wearing a ${shirtColor} colored shirt or top`;
      }
    }
  }
  
  // Extract initials from name for identification
  const getInitials = (firstName: string, lastName: string): string => {
    const first = firstName ? firstName[0].toUpperCase() : '';
    const last = lastName ? lastName[0].toUpperCase() : '';
    return first + last;
  };
  
  const initials = getInitials(juror.firstName, juror.lastName);
  
  // Build the comprehensive prompt
  let prompt = `Realistic portrait photograph of a ${ageDesc} ${ethnicityDesc} ${pronoun}`;
  
  if (skinToneDesc) {
    prompt += ` with ${skinToneDesc}`;
  }
  
  prompt += `, ${hairDesc}`;
  
  if (buildDesc) {
    prompt += `, ${buildDesc}`;
  }
  
  prompt += `. ${occupationDesc} with ${styleDesc}, ${clothingDesc}.`;
  
  // Add physical description notes if provided
  if (juror.physicalDescription) {
    prompt += ` ${juror.physicalDescription}.`;
  }
  
  prompt += ` The person should be centered in the frame, facing forward with their head and shoulders visible.`;
  
  // Add style-specific instructions
  if (style === 'avatar') {
    prompt += ` Create a clean, professional avatar-style portrait. Simple, minimalist design with a neutral or solid color background. The image should be more generic and stylized, like a professional avatar or icon, rather than a realistic photograph. Use a modern, clean aesthetic with soft lighting.`;
  } else {
    prompt += ` Neutral background. Natural lighting, authentic candid portrait style, not a corporate headshot. The person should look like a real, everyday juror - authentic, diverse, and representative of their actual physical characteristics. Avoid overly polished or corporate appearance.`;
  }
  
  if (initials) {
    prompt += ` In the bottom right corner of the image, add a small, subtle watermark with the initials "${initials}" in a clean, professional font.`;
  }
  
  return prompt;
}

/**
 * Generate image using DALL-E
 */
async function generateImage(prompt: string, jurorId: string, style: 'realistic' | 'avatar' = 'realistic'): Promise<string> {
  const client = getOpenAIClient();
  
  // Map our style to DALL-E 3 style parameter
  // DALL-E 3 supports 'vivid' (more dramatic) and 'natural' (more realistic)
  const dalleStyle: 'vivid' | 'natural' = style === 'avatar' ? 'vivid' : 'natural';
  
  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: dalleStyle,
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
 * Generate headshot for a single juror
 */
export async function generateJurorHeadshot(
  juror: JurorImageData,
  options: {
    regenerate?: boolean;
    imageStyle?: 'realistic' | 'avatar';
  } = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const regenerate = options.regenerate ?? false;
  const imageStyle = (options.imageStyle === 'avatar' ? 'avatar' : 'realistic') as 'realistic' | 'avatar';

  try {
    // Create images directory if it doesn't exist
    try {
      await fs.mkdir(JUROR_IMAGES_DIR, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Generate image filename from juror ID
    const imageFileName = `${juror.id}.png`;
    const imagePath = path.join(JUROR_IMAGES_DIR, imageFileName);

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
        imageUrl: `/api/jurors/images/${juror.id}`,
      };
    }

    // Create prompt
    const prompt = createJurorImagePrompt(juror, imageStyle);
    
    console.log(`[generateJurorHeadshot] Generating image with prompt:`, {
      jurorId: juror.id,
      jurorName: `${juror.firstName} ${juror.lastName}`,
      age: juror.age,
      gender: juror.gender,
      hairColor: juror.hairColor,
      imageStyle,
      promptPreview: prompt.substring(0, 200) + '...',
    });

    // Generate image
    const imageUrl = await generateImage(prompt, juror.id, imageStyle);

    // Get initials for overlay
    const getInitials = (firstName: string, lastName: string): string => {
      const first = firstName ? firstName[0].toUpperCase() : '';
      const last = lastName ? lastName[0].toUpperCase() : '';
      return first + last;
    };
    
    const jurorInitials = getInitials(juror.firstName, juror.lastName);
    console.log(`[generateJurorHeadshot] Adding initials overlay: "${jurorInitials}"`);

    // Download and save image with initials overlay
    await downloadAndSaveImage(imageUrl, imagePath, jurorInitials);

    console.log(`[generateJurorHeadshot] Image saved successfully:`, {
      jurorId: juror.id,
      imagePath,
    });

    return {
      success: true,
      imageUrl: `/api/jurors/images/${juror.id}`,
    };
  } catch (error: any) {
    console.error(`[generateJurorHeadshot] Error generating image:`, {
      error: error.message,
      stack: error.stack,
      jurorId: juror.id,
      imageStyle,
    });
    return {
      success: false,
      error: error.message || 'Failed to generate image',
    };
  }
}

/**
 * Get the path to a juror's image file
 */
export async function getJurorImagePath(jurorId: string): Promise<string | null> {
  try {
    const imageFileName = `${jurorId}.png`;
    const imagePath = path.join(JUROR_IMAGES_DIR, imageFileName);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      return null;
    }
  } catch (error) {
    console.error(`[getJurorImagePath] Error getting image path:`, error);
    return null;
  }
}
