/**
 * Get Test JWT Token
 *
 * Generates a test JWT token for API testing
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function getTestToken() {
  console.log('\n🔐 Getting Test Token...\n');

  // Get or create a test user
  const testOrg = await prisma.organization.findFirst({
    where: { slug: 'test-org' }
  });

  if (!testOrg) {
    console.log('❌ No test organization found');
    console.log('💡 You need to run database seed first: npm run db:seed');
    return;
  }

  const testUser = await prisma.user.findFirst({
    where: {
      organizationId: testOrg.id,
      email: { contains: 'test' }
    }
  });

  if (!testUser) {
    console.log('❌ No test user found');
    console.log('💡 You need to run database seed first: npm run db:seed');
    return;
  }

  console.log('✅ Test User Found:');
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Org: ${testOrg.name}`);
  console.log(`\n📋 User Info for Token Generation:`);
  console.log(`   userId: ${testUser.id}`);
  console.log(`   organizationId: ${testOrg.id}`);
  console.log(`   role: ${testUser.role}`);

  console.log(`\n💡 To test API endpoints, you'll need to:`);
  console.log(`   1. Login via POST /api/auth/login with email: ${testUser.email}`);
  console.log(`   2. Use the returned JWT token in Authorization header`);
  console.log(`\n   Or use Prisma Studio to view data directly (no auth needed):`);
  console.log(`   cd packages/database && npx prisma studio`);
}

getTestToken()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
