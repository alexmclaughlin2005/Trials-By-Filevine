# Juror Image Generation Implementation

## Overview

Integrated AI-powered image generation for jurors based on their physical description fields. Uses the same DALL-E 3 system as persona images, but generates images specifically based on juror physical characteristics.

## Implementation Summary

### Backend Changes

1. **`services/api-gateway/src/services/juror-headshot-service.ts`** (NEW)
   - Created juror image generation service
   - `createJurorImagePrompt()` - Builds detailed prompts from physical description fields
   - `generateJurorHeadshot()` - Generates and saves juror images
   - `getJurorImagePath()` - Retrieves image file paths
   - Uses DALL-E 3 API (same as persona images)
   - Adds initials overlay to images for identification
   - Stores images in `juror-images/` directory

2. **`services/api-gateway/src/routes/jurors.ts`**
   - Added `POST /api/jurors/:jurorId/generate-image` endpoint
     - Generates image based on juror's physical description
     - Updates juror record with imageUrl
     - Returns image URL for frontend use
   - Added `GET /api/jurors/images/:jurorId` endpoint
     - Serves juror image files
     - Includes authentication and organization checks
   - Updated jury-box endpoint to include `imageUrl` in responses

3. **`packages/database/prisma/schema.prisma`**
   - Added `imageUrl` field to `Juror` model
   - Migration created: `20260129160000_add_juror_image_url/migration.sql`

### Frontend Changes

1. **`apps/web/components/case/juror-card.tsx`**
   - Added image display in juror cards
   - Shows juror photo if available (64x64px rounded)
   - Falls back to icon if no image

2. **`apps/web/components/case/jurors-tab.tsx`**
   - Added image display in juror list view
   - Added "Generate Image" button in expanded juror section
   - Shows juror photo section with generate button
   - Displays large image (128x128px) when available
   - Added `generateImageMutation` for API calls
   - Updated juror interface to include `imageUrl`

3. **`apps/web/components/case/jury-box-view.tsx`**
   - Updated types to include `imageUrl` in juror data
   - Images display in juror cards via JurorCard component

## Image Generation Process

### Prompt Generation

The system creates detailed prompts based on:
- **Age** - Specific age with age group description
- **Gender** - Male, female, or person
- **Race/Ethnicity** - From race field
- **Skin Tone** - Light, medium, dark
- **Hair Color** - Blonde, brown, black, red, gray, etc.
- **Build** - Calculated from height and weight (slender, average, stocky, larger)
- **Occupation** - Influences clothing and style
- **Physical Description** - Additional notes from user

### Example Prompt

```
Realistic portrait photograph of a middle-aged person in their 45s Caucasian man with medium skin tone, brown hair, average build. Business professional with professional, approachable appearance, wearing business casual attire, button-down shirt or blouse. Neutral background. Natural lighting, authentic candid portrait style, not a corporate headshot. The person should look like a real, everyday juror - authentic, diverse, and representative of their actual physical characteristics. Avoid overly polished or corporate appearance. In the bottom right corner of the image, add a small, subtle watermark with the initials "JD" in a clean, professional font.
```

## API Endpoints

### Generate Image
```
POST /api/jurors/:jurorId/generate-image
Body: { regenerate?: boolean }
Response: { success: boolean, imageUrl: string, message: string }
```

### Serve Image
```
GET /api/jurors/images/:jurorId?t=<timestamp>
Response: Image file (PNG)
```

## Usage

1. **Add Physical Description Fields**
   - Fill in age, gender, hair color, height, weight, skin tone, race
   - Optionally add physical description notes

2. **Generate Image**
   - Click "Generate Image" button in expanded juror section
   - System creates prompt from physical description fields
   - DALL-E 3 generates realistic portrait
   - Image saved with initials overlay
   - Image URL stored in juror record

3. **View Images**
   - Images display in juror cards (jury box view)
   - Images display in juror list view
   - Large image shown in expanded juror section

## Image Storage

- **Local Development**: `juror-images/` directory in project root
- **Production**: Same directory structure (can be migrated to cloud storage later)
- **File Naming**: `{jurorId}.png`
- **Format**: PNG with initials overlay watermark

## Database Migration

Run migration to add `imageUrl` field:
```bash
cd packages/database
npx prisma migrate deploy
```

Or use `prisma db push` for development:
```bash
npx prisma db push
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for DALL-E 3 access

## Cost Considerations

- DALL-E 3 pricing: ~$0.04 per image (1024x1024, standard quality)
- Images are cached - regenerating requires `regenerate: true` flag
- Consider rate limiting for bulk generation

## Future Enhancements

- [ ] Cloud storage integration (S3, Vercel Blob)
- [ ] Batch image generation for multiple jurors
- [ ] Image regeneration with updated physical description
- [ ] Image editing/cropping interface
- [ ] Multiple image variants per juror

## Related Files

- `DEPLOYMENT_SUMMARY_2026-01-29_PERSONA_IMAGES.md` - Persona image system reference
- `services/api-gateway/src/services/persona-headshot-service.ts` - Persona image generation (reference)
- `apps/web/components/case/jurors-tab.tsx` - Juror management UI
- `apps/web/components/case/juror-card.tsx` - Juror card component with images
