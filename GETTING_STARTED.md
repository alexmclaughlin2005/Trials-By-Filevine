# Getting Started with TrialForge AI Development

This guide will help you set up your local development environment and start building TrialForge AI.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** - [Download](https://nodejs.org/)
- [ ] **Python 3.11+** - [Download](https://www.python.org/)
- [ ] **PostgreSQL 16+** - [Download](https://www.postgresql.org/) or use [Railway](https://railway.app)
- [ ] **Redis 7+** - [Download](https://redis.io/) or use [Railway](https://railway.app)
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **VS Code** (recommended) - [Download](https://code.visualstudio.com/)
- [ ] **Anthropic API Key** - [Get one](https://console.anthropic.com)
- [ ] **Auth0 Account** - [Sign up](https://auth0.com)

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd trialforge-ai

# Run the automated setup script
./scripts/setup-dev.sh
```

The setup script will:
- Check your Node.js and Python versions
- Install all npm dependencies
- Create `.env.local` from template
- Initialize Prisma
- Create Python virtual environment

### 2. Set Up External Services

#### Option A: Local Development (Recommended for beginners)

**PostgreSQL:**
```bash
# macOS (with Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb trialforge

# Your DATABASE_URL will be:
# postgresql://localhost:5432/trialforge
```

**Redis:**
```bash
# macOS (with Homebrew)
brew install redis
brew services start redis

# Your REDIS_URL will be:
# redis://localhost:6379
```

#### Option B: Railway (Recommended for production-like setup)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL plugin
4. Add Redis plugin
5. Copy connection strings to `.env.local`

### 3. Configure Environment Variables

Edit `.env.local` with your values:

```env
# Database (from step 2)
DATABASE_URL="postgresql://localhost:5432/trialforge"
REDIS_URL="redis://localhost:6379"

# Anthropic API (get from console.anthropic.com)
ANTHROPIC_API_KEY="sk-ant-your-key-here"
AI_MODEL_VERSION="claude-sonnet-4-5-20250929"

# Auth0 (we'll set this up next)
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
AUTH0_AUDIENCE="https://api.trialforge.ai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 4. Set Up Auth0

1. Go to [auth0.com](https://auth0.com) and sign up/login
2. Create a new application (Regular Web Application)
3. Configure callback URLs:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Copy Client ID and Client Secret to `.env.local`
5. Create an API:
   - Name: "TrialForge AI API"
   - Identifier: `https://api.trialforge.ai`
6. Enable RBAC in API settings

### 5. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

This creates:
- Sample organization
- Test users
- System personas
- Example case with jurors

### 6. Start Development Servers

**Option A: Start everything at once**
```bash
npm run dev
```

This starts all services using Turborepo. You'll see output from:
- Web app (Next.js)
- API Gateway
- All microservices

**Option B: Start services individually** (useful for debugging)

Terminal 1 - Web App:
```bash
cd apps/web
npm run dev
```

Terminal 2 - API Gateway:
```bash
cd services/api-gateway
npm run dev
```

Terminal 3 - AI Service (example):
```bash
cd ai-services/persona-suggester
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8002
```

### 7. Access the Application

Open your browser to:
- **Web App:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs (if implemented)

Login with seeded test account:
- Email: `attorney@example.com`
- Password: `TestPassword123!`

## Your First Feature

Let's create a simple feature to understand the codebase.

### Example: Add a "Notes" field to Jurors

**1. Update Database Schema**

Edit `packages/database/prisma/schema.prisma`:

```prisma
model Juror {
  id          String   @id @default(uuid())
  // ... existing fields
  notes       String?  // Add this line
  // ... rest of fields
}
```

**2. Run Migration**

```bash
cd packages/database
npx prisma migrate dev --name add_juror_notes
npx prisma generate
```

**3. Update API Endpoint**

Edit `services/jury-panel-service/src/routes/jurors.ts`:

```typescript
// Add notes to the update schema
const updateJurorSchema = z.object({
  notes: z.string().optional(),
  // ... other fields
});

// Update will automatically include notes
```

**4. Update Frontend Component**

Edit `apps/web/src/components/jurors/JurorDetailPanel.tsx`:

```tsx
export function JurorDetailPanel({ juror }) {
  const [notes, setNotes] = useState(juror.notes || '');

  const handleSaveNotes = async () => {
    await updateJuror(juror.id, { notes });
  };

  return (
    <div>
      {/* ... existing UI */}
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this juror..."
      />
      <Button onClick={handleSaveNotes}>Save Notes</Button>
    </div>
  );
}
```

**5. Test Your Changes**

```bash
# Run tests
npm test

# Test in browser
# Navigate to a juror detail page
# Add notes and save
# Refresh to verify persistence
```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Update code
   - Add/update tests
   - Update relevant README files

3. **Test locally**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

5. **Create pull request**
   - Go to GitHub
   - Create PR from your branch to `main`
   - Wait for review and CI checks

### Common Tasks

**Add a new npm package:**
```bash
# Add to specific service
cd services/api-gateway
npm install package-name

# Add to shared package
cd packages/utils
npm install package-name
```

**Add a new Python package:**
```bash
cd ai-services/persona-suggester
source .venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

**Reset database:**
```bash
cd packages/database
npx prisma migrate reset  # WARNING: Deletes all data
npm run db:seed           # Re-seed with sample data
```

**View database:**
```bash
cd packages/database
npx prisma studio
# Opens at http://localhost:5555
```

## Debugging

### VS Code Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web App",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug API Gateway",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/services/api-gateway",
      "console": "integratedTerminal"
    }
  ]
}
```

### Viewing Logs

```bash
# Web app logs (in browser console)
# API logs (in terminal where service is running)

# Database queries (enable in Prisma)
# Add to .env:
DEBUG="prisma:query"
```

### Common Issues

**"Module not found"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
cd packages/database
npx prisma generate
```

**Database connection error**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL
```

**Port already in use**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

## Next Steps

Now that you have the basics set up:

1. **Read the architecture docs:**
   - [TrialForge_AI_Architecture.md](./TrialForge_AI_Architecture.md)
   - [TrialForge_AI_PRD.md](./TrialForge_AI_PRD.md)
   - [TrialForge_AI_Technical_Design.md](./TrialForge_AI_Technical_Design.md)

2. **Explore the codebase:**
   - Start with `apps/web` (frontend)
   - Look at `services/api-gateway` (backend entry point)
   - Check out `ai-services/persona-suggester` (AI integration)

3. **Pick up a task:**
   - Check GitHub Issues for "good first issue" label
   - Ask the team what needs to be built
   - Refer to the PRD for feature requirements

4. **Join the team:**
   - Slack/Discord channel
   - Daily standups
   - Code review process

## Resources

- **Documentation:** `/docs` directory
- **API Reference:** See service README files
- **Architecture Diagrams:** `/docs/architecture`
- **Team Wiki:** [Link to team wiki]

## Getting Help

Stuck? Here's how to get help:

1. Check service README files
2. Search GitHub Issues
3. Ask in team chat
4. Review the PRD and architecture docs
5. Pair program with a team member

## Welcome to the Team! 🎉

You're now ready to start contributing to TrialForge AI. Happy coding!

---

**Last Updated:** 2026-01-21
