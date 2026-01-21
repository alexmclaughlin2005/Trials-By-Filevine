#!/bin/bash

# TrialForge AI - Development Environment Setup Script
# This script sets up the local development environment

set -e  # Exit on error

echo "🚀 TrialForge AI - Development Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
REQUIRED_VERSION="v18"

if [[ "$NODE_VERSION" < "$REQUIRED_VERSION" ]]; then
  echo -e "${RED}❌ Node.js version must be >= 18.0.0${NC}"
  echo "   Current version: $NODE_VERSION"
  exit 1
else
  echo -e "${GREEN}✅ Node.js version OK: $NODE_VERSION${NC}"
fi

# Check if .env.local exists
echo ""
echo "🔐 Checking environment variables..."
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
  cp .env.example .env.local
  echo -e "${YELLOW}⚠️  Please edit .env.local with your actual values before continuing${NC}"
  echo "   Press Enter when ready..."
  read
else
  echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install Turbo globally if not present
if ! command -v turbo &> /dev/null; then
  echo "📦 Installing Turborepo CLI globally..."
  npm install -g turbo
fi

# Set up database package
echo ""
echo "🗄️  Setting up database package..."
cd packages/database

if [ ! -f "prisma/schema.prisma" ]; then
  echo "📝 Initializing Prisma..."
  npx prisma init
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

cd ../..

# Check if PostgreSQL is running
echo ""
echo "🐘 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
  # Try to connect to database
  if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"

    echo ""
    echo "🔄 Running database migrations..."
    cd packages/database
    npx prisma migrate dev --name init
    cd ../..
  else
    echo -e "${YELLOW}⚠️  Could not connect to PostgreSQL${NC}"
    echo "   Make sure PostgreSQL is running and DATABASE_URL is correct in .env.local"
    echo "   You can skip migrations for now and run them manually later:"
    echo "   cd packages/database && npx prisma migrate dev"
  fi
else
  echo -e "${YELLOW}⚠️  PostgreSQL not found in PATH${NC}"
  echo "   Install PostgreSQL or use a hosted database (Railway, Supabase, etc.)"
fi

# Check Redis
echo ""
echo "🔴 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
  if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis connection successful${NC}"
  else
    echo -e "${YELLOW}⚠️  Redis is not running${NC}"
    echo "   Start Redis with: redis-server"
    echo "   Or use a hosted Redis (Railway, Upstash, etc.)"
  fi
else
  echo -e "${YELLOW}⚠️  Redis not found${NC}"
  echo "   Install Redis or use a hosted service"
fi

# Check Python for AI services
echo ""
echo "🐍 Checking Python for AI services..."
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version)
  echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"

  # Check if virtual environment exists
  if [ ! -d "ai-services/.venv" ]; then
    echo "📦 Creating Python virtual environment for AI services..."
    python3 -m venv ai-services/.venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Python 3 not found${NC}"
  echo "   Install Python 3.11+ for AI services"
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure environment variables in .env.local:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - REDIS_URL (Redis connection string)"
echo "   - ANTHROPIC_API_KEY (get from https://console.anthropic.com)"
echo "   - AUTH0_* variables (get from Auth0 dashboard)"
echo ""
echo "2. Run database migrations:"
echo "   npm run db:migrate"
echo ""
echo "3. Seed the database with sample data:"
echo "   npm run db:seed"
echo ""
echo "4. Start development servers:"
echo "   npm run dev"
echo ""
echo "5. Access the application:"
echo "   - Web App: http://localhost:3000"
echo "   - API Gateway: http://localhost:3000/api"
echo ""
echo "📚 Documentation:"
echo "   - See ai_instructions.md for project structure"
echo "   - See README.md files in each service directory"
echo ""
echo "❓ Need help? Check the docs/ directory or contact the team"
echo ""
