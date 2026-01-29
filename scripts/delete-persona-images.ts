#!/usr/bin/env tsx
/**
 * Delete all existing persona headshot images
 * 
 * Usage:
 *   npx tsx scripts/delete-persona-images.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Find the images directory
function findImagesDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'Juror Personas', 'images'),
    path.join(process.cwd(), '..', 'Juror Personas', 'images'),
    path.join(process.cwd(), '..', '..', 'Juror Personas', 'images'),
    path.join(__dirname, '..', 'Juror Personas', 'images'),
  ];

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

const IMAGES_DIR = findImagesDir();

async function deleteAllImages() {
  try {
    console.log(`\n🗑️  Deleting all persona images from: ${IMAGES_DIR}\n`);

    // Check if directory exists
    try {
      await fs.access(IMAGES_DIR);
    } catch {
      console.log('Images directory does not exist. Nothing to delete.');
      return;
    }

    // Read all files in directory
    const files = await fs.readdir(IMAGES_DIR);
    const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

    if (imageFiles.length === 0) {
      console.log('No image files found to delete.');
      return;
    }

    console.log(`Found ${imageFiles.length} image files to delete:\n`);

    let deleted = 0;
    let errors = 0;

    for (const file of imageFiles) {
      try {
        const filePath = path.join(IMAGES_DIR, file);
        await fs.unlink(filePath);
        console.log(`  ✓ Deleted: ${file}`);
        deleted++;
      } catch (error) {
        console.error(`  ✗ Error deleting ${file}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log(`\n✅ Deletion complete!`);
    console.log(`   Deleted: ${deleted} files`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} files`);
    }
    console.log(`\n💡 Next step: Go to /admin page and click "Regenerate All Headshots" to create new images with improved prompts.\n`);
  } catch (error) {
    console.error('Error deleting images:', error);
    process.exit(1);
  }
}

deleteAllImages();
