import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding a confirmed candidate for testing...\n');

  const candidates = await prisma.candidate.findMany({
    where: { isConfirmed: true },
    include: {
      juror: {
        include: {
          panel: {
            include: { case: true },
          },
        },
      },
    },
    take: 1,
  });

  if (candidates.length === 0) {
    console.log('❌ No confirmed candidates found. Creating test data...\n');

    // Find any candidate and confirm it
    const anyCandidate = await prisma.candidate.findFirst({
      include: {
        juror: {
          include: {
            panel: {
              include: { case: true },
            },
          },
        },
      },
    });

    if (!anyCandidate) {
      console.log('❌ No candidates found in database. Please run seed data first.');
      process.exit(1);
    }

    // Confirm it
    await prisma.candidate.update({
      where: { id: anyCandidate.id },
      data: { isConfirmed: true, confirmedBy: 'test', confirmedAt: new Date() },
    });

    console.log(`✅ Confirmed candidate: ${anyCandidate.fullName} (${anyCandidate.id})\n`);

    candidates.push({
      ...anyCandidate,
      isConfirmed: true,
      confirmedBy: 'test',
      confirmedAt: new Date(),
    } as any);
  }

  const candidate = candidates[0];
  console.log(`✅ Found confirmed candidate: ${candidate.fullName}`);
  console.log(`   Candidate ID: ${candidate.id}`);
  console.log(`   Case ID: ${candidate.juror.panel.case.id}`);
  console.log(`   Case Name: ${candidate.juror.panel.case.name}\n`);

  // Get a JWT token (using existing user)
  console.log('🔐 Getting authentication token...\n');
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'attorney@example.com',
      password: 'password',
    }),
  });

  if (!loginResponse.ok) {
    console.log('❌ Failed to authenticate. Response:', await loginResponse.text());
    process.exit(1);
  }

  const { token } = await loginResponse.json();
  console.log('✅ Authenticated successfully\n');

  // Start synthesis
  console.log('🚀 Starting synthesis...\n');
  const synthesisResponse = await fetch(
    `http://localhost:3001/api/candidates/${candidate.id}/synthesize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        case_context: {
          case_type: 'personal injury - medical malpractice',
          key_issues: ['hospital negligence', 'damages valuation'],
          client_position: 'plaintiff',
        },
      }),
    }
  );

  if (!synthesisResponse.ok) {
    console.log('❌ Failed to start synthesis. Response:', await synthesisResponse.text());
    process.exit(1);
  }

  const synthesisJob = await synthesisResponse.json();
  console.log('✅ Synthesis job started:');
  console.log(`   Job ID: ${synthesisJob.job_id}`);
  console.log(`   Status: ${synthesisJob.status}\n`);

  // Poll for completion
  console.log('⏳ Polling for completion (this may take 10-20 seconds)...\n');
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await fetch(
      `http://localhost:3001/api/candidates/${candidate.id}/synthesis`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!statusResponse.ok) {
      console.log('❌ Failed to get status. Response:', await statusResponse.text());
      break;
    }

    const status = await statusResponse.json();
    console.log(`   [${attempts + 1}/${maxAttempts}] Status: ${status.status}`);

    if (status.status === 'completed') {
      console.log('\n✅ Synthesis completed!\n');
      console.log(`   Profile ID: ${status.profile_id}\n`);

      // Get the full profile
      const profileResponse = await fetch(
        `http://localhost:3001/api/synthesis/${status.profile_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!profileResponse.ok) {
        console.log('❌ Failed to get profile. Response:', await profileResponse.text());
        break;
      }

      const profile = await profileResponse.json();
      console.log('📊 Profile Summary:');
      console.log(`   Data Richness: ${profile.data_richness}`);
      console.log(`   Confidence: ${profile.confidence_overall}`);
      console.log(`   Concerns Count: ${profile.concerns_count}`);
      console.log(`   Favorable Count: ${profile.favorable_count}`);
      console.log(`   Web Searches: ${profile.web_search_count}`);
      console.log(`   Input Tokens: ${profile.input_tokens}`);
      console.log(`   Output Tokens: ${profile.output_tokens}`);
      console.log(`   Processing Time: ${profile.processing_time_ms}ms\n`);

      if (profile.profile?.summary) {
        console.log('📝 Summary:');
        console.log(`   ${profile.profile.summary}\n`);
      }

      if (profile.profile?.voir_dire_recommendations?.suggested_questions) {
        console.log('❓ Sample Voir Dire Questions:');
        profile.profile.voir_dire_recommendations.suggested_questions
          .slice(0, 2)
          .forEach((q: any, i: number) => {
            console.log(`   ${i + 1}. ${q.question}`);
            console.log(`      Rationale: ${q.rationale}\n`);
          });
      }

      break;
    } else if (status.status === 'failed') {
      console.log('\n❌ Synthesis failed:');
      console.log(`   Error: ${status.error}\n`);
      break;
    }

    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.log('\n⚠️  Synthesis did not complete within timeout period\n');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
