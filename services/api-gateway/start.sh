#!/bin/bash
# Startup script for API Gateway
# Runs migrations before starting the server

set -e

echo "========================================="
echo "API Gateway Startup"
echo "========================================="
echo ""

echo "Step 1: Running database migrations..."
echo "Schema path: ../../packages/database/prisma/schema.prisma"
echo ""

npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

echo ""
echo "✅ Migrations completed successfully!"
echo ""

echo "Step 2: Starting API server..."
echo ""

node dist/services/api-gateway/src/index.js
