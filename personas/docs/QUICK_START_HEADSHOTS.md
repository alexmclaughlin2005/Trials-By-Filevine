# Quick Start: Generate Persona Headshots

## Prerequisites

1. **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
2. **Node.js**: Version 20+ (already installed if you can run other scripts)

## Quick Steps

1. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY=sk-your-key-here
   ```

2. **Generate images (without updating JSON):**
   ```bash
   npm run generate-persona-headshots
   ```

3. **Generate images AND update JSON files:**
   ```bash
   UPDATE_JSON=true npm run generate-persona-headshots
   ```

## What Happens

- ✅ Reads all persona files from `Juror Personas/generated/`
- ✅ Creates descriptive prompts based on persona demographics
- ✅ Generates professional headshots using DALL-E 3
- ✅ Saves images to `Juror Personas/images/`
- ✅ (Optional) Updates JSON files with image URLs

## Cost Estimate

- ~$0.04 per image
- ~100 personas = ~$4-5 total
- Script includes rate limiting (2 second delays)

## Output Location

Images are saved to: `Juror Personas/images/{PERSONA_ID}.png`

Example: `Juror Personas/images/BOOT_1.1_GaryHendricks.png`

## Skipping Existing Images

The script automatically skips personas that already have images. To regenerate:
```bash
rm -rf "Juror Personas/images"
npm run generate-persona-headshots
```

## Troubleshooting

**"OPENAI_API_KEY environment variable is required"**
- Make sure you exported the variable: `export OPENAI_API_KEY=...`
- Or add it to your `.env` file

**Rate limit errors**
- Wait a few minutes and retry
- The script will continue with remaining personas

**See full documentation:** `Juror Personas/README_HEADSHOTS.md`
