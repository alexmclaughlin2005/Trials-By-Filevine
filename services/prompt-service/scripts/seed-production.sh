#!/bin/bash

# Seed all prompts in production via Railway CLI
# Usage: ./scripts/seed-production.sh

echo "🚀 Seeding prompts in production Railway database..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

echo "📦 Seeding extract-key-points prompt..."
railway run --service prompt-service npm run seed:key-points

echo ""
echo "📦 Seeding roundtable-takeaways prompt..."
railway run --service prompt-service npm run seed:takeaways

echo ""
echo "📦 Seeding archetype-classifier prompt..."
railway run --service prompt-service npm run seed:archetype

echo ""
echo "✅ All prompts seeded successfully in production!"
echo ""
echo "💡 To seed individual prompts in the future, run:"
echo "   railway run --service prompt-service npm run seed:key-points"
echo "   railway run --service prompt-service npm run seed:takeaways"
echo "   railway run --service prompt-service npm run seed:archetype"
