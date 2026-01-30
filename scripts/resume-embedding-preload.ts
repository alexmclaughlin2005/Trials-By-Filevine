#!/usr/bin/env tsx

/**
 * Resume Embedding Preload
 * 
 * Manually resumes preloading of persona embeddings that weren't cached.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { EmbeddingScorer } from '../services/api-gateway/src/services/matching/embedding-scorer';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resuming persona embedding preload...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const claudeClient = new ClaudeClient({ apiKey });
  const scorer = new EmbeddingScorer(prisma, claudeClient);

  // Check current status
  const statsBefore = scorer.getCacheStats();
  const totalPersonas = await prisma.persona.count({ 
    where: { isActive: true, version: 2 } 
  });

  console.log(`📊 Current status: ${statsBefore.personaEmbeddingsCached}/${totalPersonas} cached`);
  console.log('');

  // Resume preload
  await scorer.resumePreload();

  // Check final status
  const statsAfter = scorer.getCacheStats();
  console.log(`\n📊 Final status: ${statsAfter.personaEmbeddingsCached}/${totalPersonas} cached`);
  console.log(`✅ Loaded ${statsAfter.personaEmbeddingsCached - statsBefore.personaEmbeddingsCached} new embeddings`);

  await prisma.$disconnect();
}

main().catch(console.error);
