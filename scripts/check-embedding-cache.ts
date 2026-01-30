#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { EmbeddingScorer } from '../services/api-gateway/src/services/matching/embedding-scorer';

const prisma = new PrismaClient();

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const claudeClient = new ClaudeClient({ apiKey });
  const scorer = new EmbeddingScorer(prisma, claudeClient);

  const stats = scorer.getCacheStats();
  const totalPersonas = await prisma.persona.count({ where: { isActive: true, version: 2 } });

  console.log('\n📊 Embedding Cache Status:');
  console.log('='.repeat(60));
  console.log(`✅ Cached: ${stats.personaEmbeddingsCached}/${totalPersonas} personas`);
  console.log(`📝 Juror narratives cached: ${stats.jurorNarrativesCached}`);
  console.log(`📈 Cache completion: ${((stats.personaEmbeddingsCached / totalPersonas) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (stats.personaEmbeddingsCached < totalPersonas) {
    console.log(`\n💡 To resume preload, restart the server or call resumePreload()`);
  }

  await prisma.$disconnect();
}

main();
