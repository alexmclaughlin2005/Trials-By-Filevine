#!/bin/bash

# Script to seed API chat prompt to Railway production database
# Usage: ./scripts/seed-api-chat-production.sh

echo "🌱 Seeding API Chat Prompt to Railway Production..."
echo ""

# Check if DATABASE_URL is set in environment
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo ""
  echo "To run this script:"
  echo "1. Get DATABASE_URL from Railway dashboard"
  echo "2. Run: DATABASE_URL='your-url' ./scripts/seed-api-chat-production.sh"
  echo ""
  exit 1
fi

# Run the seed script
npx tsx scripts/seed-api-chat-prompt.ts

echo ""
echo "✅ Done! The api-chat-assistant prompt should now be available in production."
