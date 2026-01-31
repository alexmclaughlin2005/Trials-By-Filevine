#!/bin/bash

echo "🔧 Fixing Swagger UI dependencies..."
echo ""

# Go to project root
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

echo "📦 Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

echo ""
echo "🔄 Regenerating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

echo ""
echo "📦 Installing compatible Swagger packages in api-gateway..."
cd services/api-gateway
npm install @fastify/swagger@^8.15.0 @fastify/swagger-ui@^4.1.0

echo ""
echo "✅ Dependencies fixed!"
echo ""
echo "🚀 Starting API Gateway..."
npm run dev
