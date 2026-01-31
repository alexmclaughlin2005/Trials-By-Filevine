#!/bin/bash
# Script to run Prisma migrations on Railway database
# Make sure you have the Railway DATABASE_URL set in your environment

set -e

echo "🚀 Running Prisma migrations on Railway database..."
echo ""
echo "⚠️  Make sure you have set the Railway DATABASE_URL environment variable!"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "To get your Railway DATABASE_URL:"
  echo "  1. Go to Railway dashboard"
  echo "  2. Select your database service"
  echo "  3. Go to Variables tab"
  echo "  4. Copy the DATABASE_URL value"
  echo ""
  echo "Then run:"
  echo '  export DATABASE_URL="postgresql://..."'
  echo "  ./migrate-railway.sh"
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""
echo "Running migrations..."
echo ""

# Run migrations (specify schema path for monorepo)
cd packages/database
npx prisma migrate deploy
cd ../..

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "You can now test your Filevine connection in production."
