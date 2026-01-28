/**
 * Test Persona V2 API Endpoints
 *
 * Tests the updated API endpoints to ensure they return V2 fields correctly
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Mock JWT token (you'll need a real one for actual testing)
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || '';

async function testEndpoints() {
  console.log('\n🧪 Testing Persona V2 API Endpoints\n');
  console.log('=' .repeat(60));

  // Test 1: GET /api/personas (all personas)
  console.log('\n1️⃣  Testing GET /api/personas');
  try {
    const response = await fetch(`${API_BASE}/personas`, {
      headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
    });

    if (response.status === 401) {
      console.log('   ⚠️  Authentication required - skipping authenticated endpoints');
      console.log('   💡 Set TEST_JWT_TOKEN environment variable to test authenticated routes');
    } else {
      const data = await response.json() as any;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Total personas: ${data.personas?.length || 0}`);

      if (data.personas && data.personas.length > 0) {
        const sample = data.personas[0];
        console.log(`   📋 Sample persona: ${sample.name}`);
        console.log(`   🔹 Has instantRead: ${!!sample.instantRead}`);
        console.log(`   🔹 Has phrasesYoullHear: ${!!sample.phrasesYoullHear}`);
        console.log(`   🔹 Has verdictPrediction: ${!!sample.verdictPrediction}`);
        console.log(`   🔹 Has strikeOrKeep: ${!!sample.strikeOrKeep}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 2: GET /api/personas?version=2
  console.log('\n2️⃣  Testing GET /api/personas?version=2');
  try {
    const response = await fetch(`${API_BASE}/personas?version=2`, {
      headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
    });

    if (response.status !== 401) {
      const data = await response.json() as any;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 V2 personas: ${data.personas?.length || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 3: GET /api/personas?archetype=bootstrapper
  console.log('\n3️⃣  Testing GET /api/personas?archetype=bootstrapper');
  try {
    const response = await fetch(`${API_BASE}/personas?archetype=bootstrapper`, {
      headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
    });

    if (response.status !== 401) {
      const data = await response.json() as any;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Bootstrapper personas: ${data.personas?.length || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 4: GET /api/personas/archetypes (NEW endpoint)
  console.log('\n4️⃣  Testing GET /api/personas/archetypes (NEW)');
  try {
    const response = await fetch(`${API_BASE}/personas/archetypes`, {
      headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
    });

    if (response.status !== 401) {
      const data = await response.json() as any;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Archetypes found: ${data.archetypes?.length || 0}`);

      if (data.archetypes && data.archetypes.length > 0) {
        console.log(`\n   📋 Sample Archetype:`);
        const sample = data.archetypes[0];
        console.log(`      Name: ${sample.display_name}`);
        console.log(`      ID: ${sample.id}`);
        console.log(`      Verdict Lean: ${sample.verdict_lean}`);
        console.log(`      Persona Count: ${sample.persona_count}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 5: GET /api/personas/archetypes/:archetype/personas (NEW endpoint)
  console.log('\n5️⃣  Testing GET /api/personas/archetypes/bootstrapper/personas (NEW)');
  try {
    const response = await fetch(`${API_BASE}/personas/archetypes/bootstrapper/personas`, {
      headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
    });

    if (response.status !== 401) {
      const data = await response.json() as any;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Personas in archetype: ${data.personas?.length || 0}`);

      if (data.archetype) {
        console.log(`\n   📋 Archetype Info:`);
        console.log(`      Name: ${data.archetype.display_name}`);
        console.log(`      Verdict Lean: ${data.archetype.verdict_lean}`);
      }

      if (data.personas && data.personas.length > 0) {
        console.log(`\n   👤 First Persona:`);
        const first = data.personas[0];
        console.log(`      Name: ${first.name}`);
        console.log(`      Instant Read: ${first.instantRead}`);
        console.log(`      Danger Levels: P=${first.plaintiffDangerLevel} D=${first.defenseDangerLevel}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ API Endpoint Testing Complete!\n');

  if (!TEST_TOKEN) {
    console.log('💡 Note: Most endpoints require authentication.');
    console.log('   To test authenticated routes, run:');
    console.log('   TEST_JWT_TOKEN=your-token npm run test:persona-api-v2\n');
  }
}

testEndpoints().catch(console.error);
