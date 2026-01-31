#!/bin/bash

# Script to seed the Railway production database
# This creates test users and sample data

echo "🌱 Seeding Railway Production Database..."
echo ""
echo "This will create:"
echo "  - 1 Organization (Sample Law Firm)"
echo "  - 2 Users (attorney@example.com, paralegal@example.com)"
echo "  - 3 System Personas"
echo "  - 1 Sample Case with 5 Jurors"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Running seed script on Railway..."
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
cd packages/database
railway run --service api-gateway tsx prisma/seed.ts

echo ""
echo "✅ Done! You should now be able to log in with:"
echo "   Email: attorney@example.com"
echo "   Password: password123"
echo ""
