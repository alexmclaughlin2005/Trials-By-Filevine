# Persona Headshot Generation

This directory contains generated headshot images for all juror personas.

## Generating Headshots

To generate headshots for all personas using OpenAI's DALL-E API:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Generate images (without updating JSON files)
npm run generate-persona-headshots

# Generate images and update JSON files with image URLs
UPDATE_JSON=true npm run generate-persona-headshots
```

## Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `UPDATE_JSON` (optional): Set to `"true"` to update persona JSON files with image URLs

## How It Works

1. **Reads persona files**: The script reads all persona JSON files from `Juror Personas/generated/`
2. **Creates prompts**: For each persona, it generates a descriptive prompt based on:
   - Demographics (age, gender, race/ethnicity)
   - Occupation and professional appearance
   - Archetype characteristics and expression
   - Location and background
3. **Generates images**: Uses OpenAI DALL-E 3 to create professional headshots
4. **Saves images**: Downloads and saves images to `Juror Personas/images/` directory
5. **Updates JSON** (optional): If `UPDATE_JSON=true`, updates persona JSON files with relative image paths

## Image Naming

Images are named using the persona ID format: `{PERSONA_ID}.png`

Example: `BOOT_1.1_GaryHendricks.png`

## Cost Considerations

- DALL-E 3 pricing: ~$0.04 per image (1024x1024, standard quality)
- For ~100 personas: approximately $4-5 total
- Rate limiting: Script includes 2-second delays between requests to respect API limits

## Skipping Existing Images

The script automatically skips personas that already have images. To regenerate all images, delete the `Juror Personas/images/` directory first.

## Image Storage

Images are stored locally in `Juror Personas/images/`. This directory is gitignored by default since images can be regenerated.

For production use, you may want to:
1. Upload images to cloud storage (S3, Vercel Blob, etc.)
2. Update image URLs in persona JSON files to point to cloud storage
3. Serve images via CDN for better performance

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Make sure you've set the environment variable before running the script
- You can also add it to your `.env` file (make sure it's loaded)

### Rate limit errors
- DALL-E 3 has rate limits. The script includes delays, but if you hit limits, wait a few minutes and retry
- The script will continue processing remaining personas even if some fail

### Image generation fails
- Check your OpenAI API key is valid and has credits
- Verify your OpenAI account has access to DALL-E 3
- Check network connectivity

## Example Output

```
🎨 Persona Headshot Generator
================================================================================
📂 Personas directory: /path/to/Juror Personas/generated
📂 Images directory: /path/to/Juror Personas/images
🔄 Update JSON files: No
================================================================================

📁 Processing The Bootstrapper (10 personas)
================================================================================
  🎨 Gary (BOOT_1.1_GaryHendricks)
     Prompt: Professional headshot portrait of a mature adult Caucasian man, confident, determined, no-nonsense expression...
  📸 Generating image for BOOT_1.1_GaryHendricks...
  ✅ Generated and saved: images/BOOT_1.1_GaryHendricks.png
  ...
```
