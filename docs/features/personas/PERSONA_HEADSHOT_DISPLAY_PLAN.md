# Persona Headshot Display Implementation Plan

## Overview
Plan for displaying AI-generated persona headshots on the personas page. This document outlines the implementation strategy without making changes that would interrupt the current generation process.

## Current State

### Image Storage
- **Location**: `Juror Personas/images/{PERSONA_ID}.png`
- **Format**: PNG files, ~1.4-1.5MB each
- **Naming**: Uses persona_id from JSON (e.g., `BOOT_1.1_GaryHendricks.png`)
- **JSON Updates**: When `UPDATE_JSON=true`, JSON files are updated with `image_url: "images/{PERSONA_ID}.png"`

### Current Persona Display
- **Component**: `PersonaCardV2` in `apps/web/components/persona-card-v2.tsx`
- **Layout**: Card-based grid layout (1-3 columns)
- **Current Fields**: Name, nickname, archetype badges, instant read, danger levels, verdict prediction
- **No Images**: Currently no image display

## Implementation Plan

### Phase 1: Image Serving Strategy

#### Option A: Next.js Static Files (Recommended for Development)
- Copy images to `apps/web/public/personas/` directory
- Serve via Next.js static file serving: `/personas/{PERSONA_ID}.png`
- **Pros**: Simple, works immediately, no API needed
- **Cons**: Requires copying files, not ideal for production

#### Option B: API Endpoint (Recommended for Production)
- Create API route: `GET /api/personas/:id/image` or `GET /api/personas/images/:personaId`
- Serve images from `Juror Personas/images/` directory
- **Pros**: Centralized, can add caching/optimization later
- **Cons**: Requires API endpoint

#### Option C: Vercel Blob/S3 (Future Production)
- Upload images to cloud storage during generation
- Serve via CDN URLs
- **Pros**: Scalable, fast, production-ready
- **Cons**: Requires cloud storage setup

**Recommendation**: Start with Option A for quick implementation, plan migration to Option B/C for production.

### Phase 2: Data Model Updates

#### Frontend Persona Interface
Add `imageUrl` field to Persona interface:
```typescript
interface Persona {
  // ... existing fields
  imageUrl?: string; // e.g., "images/BOOT_1.1_GaryHendricks.png" or full URL
}
```

#### Backend API Response
Ensure personas API includes image URLs:
- Check if persona JSON has `image_url` field
- Map to `imageUrl` in API response
- Handle personas without images gracefully

### Phase 3: UI Component Updates

#### PersonaCardV2 Component
1. **Add Image Display**:
   - Show headshot at top of card (circular or rounded square)
   - Size: ~80-100px for card view
   - Fallback: Initials or archetype icon if no image
   - Lazy loading for performance

2. **Layout Options**:
   - **Option 1**: Image on left, content on right (horizontal card)
   - **Option 2**: Image at top, content below (vertical card) - **RECOMMENDED**
   - **Option 3**: Small avatar next to name

3. **Image Component**:
   ```tsx
   {persona.imageUrl && (
     <Image
       src={`/personas/${persona.imageUrl.replace('images/', '')}`}
       alt={persona.name}
       width={100}
       height={100}
       className="rounded-full"
     />
   )}
   ```

#### Persona Detail Modal
- Larger headshot (200-300px) at top of modal
- Professional presentation
- Show full image with persona details

### Phase 4: Image Path Resolution

#### Development (Local Files)
- Images stored in: `Juror Personas/images/`
- Copy to: `apps/web/public/personas/` (or serve via API)
- URL format: `/personas/{PERSONA_ID}.png`

#### Production (Cloud Storage)
- Images in Vercel Blob or S3
- Full URL in `imageUrl` field
- CDN delivery for performance

### Phase 5: Implementation Steps (Non-Blocking)

1. **Create Image Serving Endpoint** (if using API approach)
   - `GET /api/personas/images/:personaId`
   - Reads from `Juror Personas/images/` directory
   - Returns image with proper content-type headers
   - Handles missing images gracefully (404)

2. **Update Persona API Response**
   - Check persona JSON for `image_url` field
   - Include in API response as `imageUrl`
   - Map relative paths to full URLs if needed

3. **Update PersonaCardV2 Component**
   - Add image display section
   - Handle missing images with fallback
   - Add loading states
   - Optimize with Next.js Image component

4. **Update Persona Detail Modal**
   - Add larger headshot display
   - Position at top of modal

5. **Add Image Copy Script** (if using static files)
   - Script to copy images from `Juror Personas/images/` to `apps/web/public/personas/`
   - Run after generation completes
   - Or automate during generation

## File Structure

```
Juror Personas/
├── images/
│   ├── BOOT_1.1_GaryHendricks.png
│   ├── BOOT_1.2_LindaKowalski.png
│   └── ...
└── generated/
    ├── bootstrappers.json (with image_url fields)
    └── ...

apps/web/
├── public/
│   └── personas/  (if using static files)
│       ├── BOOT_1.1_GaryHendricks.png
│       └── ...
└── app/
    └── api/
        └── personas/
            └── images/
                └── [personaId]/
                    └── route.ts  (if using API endpoint)
```

## Component Design Mockup

### PersonaCardV2 with Image
```
┌─────────────────────────────┐
│  [🖼️ Headshot]  Name        │
│              (Nickname)     │
│  [Archetype Badge]          │
│  "Instant read quote..."    │
│                             │
│  [Danger Levels]            │
│  [Verdict Prediction]       │
│  [Show More ▼]              │
└─────────────────────────────┘
```

### Persona Detail Modal with Image
```
┌─────────────────────────────────────┐
│         [Large Headshot]            │
│         Name (Nickname)             │
│         Archetype Badge             │
│                                     │
│  [Instant Read Section]             │
│  [Danger Levels]                    │
│  [Verdict Prediction]               │
│  ...                                │
└─────────────────────────────────────┘
```

## Technical Considerations

### Performance
- Use Next.js Image component for optimization
- Lazy load images below the fold
- Consider image compression/optimization
- CDN delivery for production

### Fallbacks
- Show initials if image missing: `{persona.name.charAt(0)}`
- Show archetype icon as fallback
- Graceful degradation

### Image Loading
- Show skeleton/placeholder while loading
- Handle 404 errors gracefully
- Cache images in browser

### Responsive Design
- Image sizes adapt to screen size
- Mobile: smaller images
- Desktop: larger, more prominent

## Database Schema (Future)

If we want to store image URLs in database:
```prisma
model Persona {
  // ... existing fields
  imageUrl String? // Full URL or relative path
  imageUpdatedAt DateTime? // When image was last generated
}
```

## Migration Path

1. **Phase 1** (Now): Display images from JSON `image_url` field
2. **Phase 2** (Later): Store image URLs in database
3. **Phase 3** (Future): Move to cloud storage (Vercel Blob/S3)

## Testing Checklist

- [ ] Images display correctly for personas with `image_url`
- [ ] Fallback displays for personas without images
- [ ] Images load efficiently (lazy loading works)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Image serving endpoint works (if using API)
- [ ] Error handling for missing/broken images
- [ ] Performance: page load time acceptable with images

## Next Steps (After Generation Completes)

1. Verify images are generated and JSON files updated
2. Choose image serving strategy (static files vs API)
3. Implement image display in PersonaCardV2
4. Update persona detail modal
5. Test and optimize
6. Deploy

## Notes

- **Don't interrupt generation**: All changes should be non-blocking
- **Backward compatible**: Personas without images should still work
- **Progressive enhancement**: Images enhance but don't break if missing
- **Performance first**: Optimize image loading and delivery
