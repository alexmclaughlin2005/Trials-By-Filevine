#!/bin/bash

# Script to seed roundtable prompts in Railway production database
# This adds the 5 prompts needed for roundtable conversations

echo "🎭 Seeding Roundtable Prompts to Railway Production..."
echo ""
echo "This will create:"
echo "  - roundtable-initial-reaction"
echo "  - roundtable-conversation-turn"
echo "  - roundtable-statement-analysis"
echo "  - roundtable-conversation-synthesis"
echo "  - roundtable-persona-system"
echo ""
echo "Model: claude-sonnet-4-20250514"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Running roundtable prompt seed script on Railway..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

# Run the seed script
railway run --service api-gateway npx tsx scripts/add-roundtable-prompts.ts

echo ""
echo "✅ Done! Roundtable prompts have been seeded."
echo ""
echo "Test by:"
echo "  1. Go to production app"
echo "  2. Navigate to any case → Focus Groups"
echo "  3. Start a roundtable discussion"
echo "  4. Should see real AI responses (not mock data)"
echo ""
