#!/usr/bin/env tsx

import { PromptClient } from '../../packages/prompt-client/src/index.js';

async function testClient() {
  console.log('Testing Prompt Client Library...\n');

  const client = new PromptClient({
    serviceUrl: 'http://localhost:3002',
  });

  try {
    // Test 1: Get prompt metadata
    console.log('1. Getting prompt metadata...');
    const metadata = await client.getPromptMetadata('archetype-classifier');
    console.log('   ✓ Prompt name:', metadata.name);
    console.log('   ✓ Category:', metadata.category);
    console.log();

    // Test 2: Get and render prompt
    console.log('2. Rendering prompt with variables...');
    const prompt = await client.getPrompt('archetype-classifier', {
      variables: {
        jurorData: 'Name: Jane Smith\nAge: 38\nOccupation: Teacher',
        archetypeDefinitions: 'Test archetypes...',
      },
    });
    console.log('   ✓ Version:', prompt.version);
    console.log('   ✓ Model:', prompt.config.model);
    console.log('   ✓ Max tokens:', prompt.config.maxTokens);
    console.log('   ✓ Temperature:', prompt.config.temperature);
    console.log('   ✓ User prompt length:', prompt.userPrompt.length, 'chars');
    console.log();

    // Test 3: Track result
    console.log('3. Tracking execution result...');
    await client.trackResult('archetype-classifier', {
      versionId: prompt.versionId,
      success: true,
      tokensUsed: 4200,
      latencyMs: 1800,
      confidence: 0.92,
    });
    console.log('   ✓ Result tracked successfully');
    console.log();

    // Test 4: Get analytics
    console.log('4. Getting analytics...');
    const analytics = await client.getAnalytics(
      'archetype-classifier',
      prompt.versionId,
      10
    );
    console.log('   ✓ Total executions:', analytics.total);
    console.log('   ✓ Success rate:', (analytics.successRate * 100).toFixed(1) + '%');
    console.log('   ✓ Avg tokens:', analytics.avgTokens);
    console.log('   ✓ Avg latency:', analytics.avgLatencyMs + 'ms');
    console.log('   ✓ Avg confidence:', analytics.avgConfidence.toFixed(2));
    console.log();

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testClient();
