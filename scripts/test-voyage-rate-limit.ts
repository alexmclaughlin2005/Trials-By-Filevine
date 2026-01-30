#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', 'services', 'api-gateway', '.env') });

import { VoyageAIClient } from 'voyageai';

const apiKey = process.env.VOYAGE_API_KEY;
if (!apiKey) {
  console.error('❌ VOYAGE_API_KEY not set');
  process.exit(1);
}

const client = new VoyageAIClient({ apiKey });

async function test() {
  console.log('🧪 Testing Voyage AI rate limits...\n');
  
  try {
    // Try 3 quick requests in succession
    for (let i = 1; i <= 3; i++) {
      console.log(`Request ${i}/3...`);
      const start = Date.now();
      const response = await client.embed({
        input: [`Test text ${i}`],
        model: 'voyage-law-2',
      });
      const elapsed = Date.now() - start;
      console.log(`  ✅ Success (${elapsed}ms)`);
      
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between requests
      }
    }
    
    console.log('\n✅ Rate limits appear to be updated!');
    console.log('💡 You can restart the server to complete preload faster.');
  } catch (error: any) {
    if (error.statusCode === 429) {
      console.log('\n⚠️  Still hitting rate limits (429)');
      console.log('⏳ Rate limits may need more time to propagate.');
      console.log('💡 Wait a few more minutes and try again.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  }
}

test();
