# Session Summary: Persona Image Generation Fix
**Date:** January 29, 2026  
**Issue:** Persona images not generating correctly, wrong images being displayed, and difficulty identifying which persona an image belongs to.

## Problem Statement

1. **404 Errors**: "Persona not found in JSON files" errors when generating images for V2 personas (e.g., "Fox-News Frank", "Stoic-Farm-Wife Fran")
2. **Wrong Images**: Images were being generated for the wrong personas (e.g., "Stoic-Farm-Wife Fran" showing a man's image)
3. **Cache Issues**: Regenerated images not appearing in the UI due to aggressive caching
4. **Identification Difficulty**: Hard to verify which persona an image belongs to without clear identifiers

## Root Causes Identified

### 1. Missing `jsonPersonaId` in Database
- **Problem**: V2 personas imported through "Persona V2 setup" didn't have `jsonPersonaId` populated
- **Impact**: System fell back to fuzzy matching, which was unreliable
- **Solution**: Created backfill script to populate `jsonPersonaId` for all system personas

### 2. Image Generation Only Checking V1 Directory
- **Problem**: `persona-image-utils.ts` and `persona-headshot-service.ts` only searched `Juror Personas/generated/` (V1)
- **Impact**: V2 personas in `Persona Updates/` directory weren't found
- **Solution**: Updated both services to search both V1 and V2 directories

### 3. V1 vs V2 Format Differences
- **Problem**: V1 uses `persona_id` and `full_name`, V2 uses `id` and `name` with different demographic keys
- **Impact**: Matching logic failed for V2 personas
- **Solution**: Updated interfaces and matching logic to handle both formats

### 4. Aggressive Caching
- **Problem**: Next.js Image component and proxy route used `force-cache`, preventing updated images from appearing
- **Impact**: Regenerated images didn't show in UI even after generation succeeded
- **Solution**: Changed to `no-store` and added timestamp-based cache busting

### 5. No Visual Identification
- **Problem**: Generated images looked similar, making it hard to verify correctness
- **Impact**: Difficult to debug which persona an image belonged to
- **Solution**: Added initials overlay watermark to images

## Solutions Implemented

### 1. Database Schema Enhancement
**File:** `packages/database/prisma/schema.prisma`
- Added `jsonPersonaId` field to `Persona` model with unique constraint
- Enables 1:1 mapping between database personas and JSON personas

### 2. Backfill Script for `jsonPersonaId`
**File:** `scripts/backfill-json-persona-ids.ts`
- Updated to check both V1 (`Juror Personas/generated/`) and V2 (`Persona Updates/`) directories
- Matches database personas to JSON personas and populates `jsonPersonaId`
- Handles both V1 and V2 JSON formats

### 3. Image Utilities - V2 Support
**File:** `services/api-gateway/src/services/persona-image-utils.ts`
- Added `findPersonaUpdatesDir()` function
- Updated `PersonaJSON` interface to support both V1 and V2 formats
- Modified `loadPersonaImageMappings()` to load from both directories
- Updated `findPersonaIdFromDatabase()` to search both directories
- Handles `scarred.json` vs `scarreds.json` filename difference

### 4. Image Generation Service - V2 Support
**File:** `services/api-gateway/src/services/persona-headshot-service.ts`
- Updated to search both V1 and V2 directories
- Modified `Persona` interface to support both formats
- Updated `generateSinglePersonaHeadshot()` to handle both `persona_id` (V1) and `id` (V2)
- Normalized demographic fields (e.g., `race` → `race_ethnicity`, `politics` → `political_affiliation`)
- Added cache invalidation after image generation

### 5. Image Serving Endpoint Optimization
**File:** `services/api-gateway/src/routes/personas.ts`
- Updated `/api/personas/images/:personaId` endpoint to use `jsonPersonaId` directly
- Constructs filename from `jsonPersonaId` (e.g., `BOOT_09` → `BOOT_09.png`)
- Added comprehensive logging for debugging
- Falls back to fuzzy matching only if direct lookup fails

### 6. Initials Overlay Feature
**File:** `services/api-gateway/src/services/persona-headshot-service.ts`
- Added `getInitials()` function to extract initials from persona names
- Updated DALL-E prompt to include initials in description
- Modified `downloadAndSaveImage()` to add initials watermark using `sharp`
- Watermark appears in bottom right corner with semi-transparent background
- Example: "Fox-News Frank" → "FF", "Stoic-Farm-Wife Fran" → "SF"

### 7. Cache Busting
**Files:**
- `apps/web/components/persona-card-v2.tsx`
- `apps/web/app/api/personas/images/[personaId]/route.ts`

**Changes:**
- Added timestamp query parameter to image URLs (`?t=${Date.now()}`)
- Changed Next.js proxy route from `force-cache` to `no-store`
- Updated cache headers to allow revalidation
- Cleared Next.js build cache (`.next` directory)

### 8. Frontend Improvements
**File:** `apps/web/components/persona-card-v2.tsx`
- Removed page refresh after image generation
- Uses React state (`localImageUrl`) to update images immediately
- Added `useEffect` to sync with persona prop changes
- Improved error handling and user feedback

## Key Files Modified

1. `packages/database/prisma/schema.prisma` - Added `jsonPersonaId` field
2. `scripts/backfill-json-persona-ids.ts` - V2 directory support
3. `scripts/check-persona-json-ids.ts` - New debugging script
4. `services/api-gateway/src/services/persona-image-utils.ts` - V2 support, cache invalidation
5. `services/api-gateway/src/services/persona-headshot-service.ts` - V2 support, initials overlay
6. `services/api-gateway/src/routes/personas.ts` - Direct `jsonPersonaId` lookup, logging
7. `apps/web/components/persona-card-v2.tsx` - Cache busting, no page refresh
8. `apps/web/app/api/personas/images/[personaId]/route.ts` - Cache busting

## Dependencies Added

- `sharp` - For adding initials watermark overlay to images

## Testing & Verification

### Verification Steps
1. Check database `jsonPersonaId` values match JSON files
2. Verify images are generated with correct persona data
3. Confirm initials overlay appears on generated images
4. Test that regenerated images appear immediately in UI
5. Verify cache busting works correctly

### Debugging Tools Created
- `scripts/check-persona-json-ids.ts` - Check `jsonPersonaId` mappings for specific personas
- Enhanced logging throughout image generation pipeline
- Console logs showing which persona is found and what prompt is used

## Current State

✅ **Working:**
- V1 and V2 personas can generate images
- `jsonPersonaId` provides reliable 1:1 mapping
- Images include initials watermark for identification
- Cache busting ensures fresh images appear
- No page refresh needed after generation

✅ **Image Generation Flow:**
1. User clicks "Generate Image" on persona card
2. Frontend calls `/api/personas/:personaId/generate-image`
3. Backend uses `jsonPersonaId` to find persona in JSON files
4. DALL-E generates image with correct demographics
5. Image downloaded and initials overlay added
6. Image saved as `{jsonPersonaId}.png`
7. JSON file updated with `image_url`
8. Cache invalidated
9. Frontend updates with new image URL (timestamped)
10. Image appears immediately without page refresh

## Known Limitations

1. **Initials Overlay**: Uses `sharp` library - if it fails, image saves without overlay (graceful fallback)
2. **Cache**: Browser may still cache images - hard refresh (Cmd+Shift+R) may be needed
3. **V2 Format**: Assumes V2 personas use `id` field and `name` field (not `persona_id`/`full_name`)

## Future Improvements

1. Consider storing image URLs in database for faster lookups
2. Add image regeneration queue for batch operations
3. Add image preview/confirmation before saving
4. Consider using CDN for image serving in production
5. Add image optimization/compression
6. Consider adding persona name text overlay instead of just initials

## Related Documentation

- `PERSONA_HEADSHOT_DISPLAY_PLAN.md` - Original image display plan
- `scripts/backfill-json-persona-ids.ts` - Backfill script documentation
- `services/api-gateway/src/services/persona-headshot-service.ts` - Image generation service

## Commands Reference

### Check Persona Mappings
```bash
npx tsx scripts/check-persona-json-ids.ts "Persona Name"
```

### Backfill jsonPersonaId
```bash
npx tsx scripts/backfill-json-persona-ids.ts
```

### View Logs
```bash
# Backend
tail -f /tmp/api-gateway.log

# Frontend  
tail -f /tmp/nextjs.log
```

### Restart Servers
```bash
# Kill existing
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Start backend
cd services/api-gateway && npm run dev

# Start frontend
cd apps/web && npm run dev
```
