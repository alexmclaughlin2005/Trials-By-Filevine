# Prompt Admin UI

Web-based admin interface for managing AI prompts across all services.

## Features

✅ **Prompt List View**
- View all prompts in the system
- See current deployment status
- Quick access to edit each prompt

✅ **Monaco Code Editor**
- VS Code-like editing experience
- Syntax highlighting for Handlebars templates
- Line numbers and word wrap
- Dark theme

✅ **Version Management**
- View complete version history
- See what changed in each version
- Deploy any version with one click
- Rollback to previous versions
- Version notes for tracking changes

✅ **Real-time Updates**
- React Query for data fetching
- Automatic cache invalidation
- Optimistic UI updates

## Running Locally

### Prerequisites

- Prompt Service running on port 3002
- Node.js 18+

### Installation

```bash
# From root of monorepo
npm install

# Or from this directory
npm install
```

### Development

```bash
npm run dev
```

The admin UI will start on **http://localhost:3003**

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_PROMPT_SERVICE_URL=http://localhost:3002
```

## Usage Guide

### Viewing Prompts

1. Open http://localhost:3003
2. You'll see a list of all prompts
3. Each card shows:
   - Prompt name and description
   - Service ID
   - Category (classification, suggestion, etc.)
   - Current version
   - Deployment status (Active/Inactive)

### Editing a Prompt

1. Click on a prompt card
2. Click **"Edit Prompt"** button
3. Make changes in the Monaco editor
4. Add version notes (optional but recommended)
5. Click **"Save New Version"**
6. The new version is created but NOT deployed yet

### Deploying a Version

1. In the version history sidebar, find the version you want to deploy
2. Click the 🚀 (Rocket) icon
3. The version is immediately deployed
4. Current version indicator (✓) updates

### Rolling Back

1. In the version history sidebar, find the previous version
2. Click the ↺ (Rotate) icon
3. Confirm the rollback
4. The version is immediately deployed

## Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Editor:** Monaco Editor (VS Code)
- **Data Fetching:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **UI:** Tailwind CSS
- **Icons:** Lucide React
- **Date Formatting:** date-fns

### Directory Structure

```
apps/prompt-admin/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Prompt list page
│   │   ├── prompts/
│   │   │   └── [serviceId]/
│   │   │       └── page.tsx            # Prompt detail/editor page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── providers.tsx               # React Query provider
│   │   └── globals.css                 # Global styles
│   ├── components/
│   │   └── PromptEditor.tsx            # Monaco editor wrapper
│   ├── hooks/
│   │   └── usePrompts.ts               # React Query hooks
│   └── lib/
│       └── api.ts                      # API client & types
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

### API Integration

The UI connects to the Prompt Service API:

```typescript
// List all prompts
GET /api/v1/admin/prompts

// Get prompt versions
GET /api/v1/admin/prompts/:id/versions

// Create new version
POST /api/v1/admin/prompts/:id/versions

// Deploy version
POST /api/v1/admin/prompts/:serviceId/deploy

// Rollback version
POST /api/v1/admin/prompts/:serviceId/rollback
```

## Components

### PromptEditor

Wrapper around Monaco Editor with customizations:

```typescript
<PromptEditor
  value={promptText}
  onChange={setPromptText}
  language="handlebars"
  height="400px"
  readOnly={false}
/>
```

**Props:**
- `value`: Current prompt text
- `onChange`: Callback when text changes
- `language`: Syntax highlighting ('handlebars', 'typescript', etc.)
- `height`: Editor height (default: '500px')
- `readOnly`: Disable editing (default: false)

### Custom Hooks

#### usePrompts()
Fetches list of all prompts

```typescript
const { data: prompts, isLoading, error } = usePrompts();
```

#### usePrompt(serviceId)
Fetches single prompt by service ID

```typescript
const { data: prompt } = usePrompt('archetype-classifier');
```

#### useVersions(promptId)
Fetches all versions for a prompt

```typescript
const { data: versions } = useVersions(prompt.id);
```

#### useCreateVersion(promptId)
Creates new version

```typescript
const createVersion = useCreateVersion(promptId);

await createVersion.mutateAsync({
  version: 'v1.1.0',
  userPromptTemplate: '...',
  config: { ... },
  variables: { ... },
  notes: 'Updated classification logic',
});
```

#### useDeployVersion()
Deploys a version

```typescript
const deploy = useDeployVersion();

await deploy.mutateAsync({
  serviceId: 'archetype-classifier',
  versionId: '...',
});
```

#### useRollbackVersion()
Rolls back to previous version

```typescript
const rollback = useRollbackVersion();

await rollback.mutateAsync({
  serviceId: 'archetype-classifier',
  versionId: '...',
});
```

## Features Roadmap

### Phase 1 (Complete) ✅
- [x] Prompt list view
- [x] Monaco editor integration
- [x] Version history sidebar
- [x] Deploy/rollback buttons
- [x] Real-time updates with React Query

### Phase 2 (Future)
- [ ] Variable preview with sample data
- [ ] Token count estimator
- [ ] Diff view between versions
- [ ] Search and filter prompts
- [ ] Prompt duplication
- [ ] Export/import prompts

### Phase 3 (Future)
- [ ] A/B testing UI
- [ ] Create/manage A/B tests
- [ ] View test results
- [ ] Statistical significance calculator
- [ ] Winner declaration

### Phase 4 (Future)
- [ ] Analytics dashboard
- [ ] Success rate charts
- [ ] Token usage graphs
- [ ] Cost analysis
- [ ] Performance metrics

## Troubleshooting

### Prompt Service Not Connected

**Error:** "Error loading prompts" / ECONNREFUSED

**Solution:**
1. Make sure Prompt Service is running: `curl http://localhost:3002/health`
2. Check `.env.local` has correct URL
3. Verify no CORS issues in browser console

### UI Won't Start

**Error:** Port 3003 already in use

**Solution:**
```bash
# Kill process on port 3003
lsof -ti:3003 | xargs kill -9

# Or use different port
npm run dev -- --port 3004
```

### Changes Not Appearing

**Issue:** Edits don't show up

**Solution:**
- Check browser console for errors
- Verify Prompt Service is responding
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check React Query DevTools

## Production Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/prompt-admin
vercel
```

**Environment Variables in Vercel:**
```
NEXT_PUBLIC_PROMPT_SERVICE_URL=https://prompt-service.railway.app
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["npm", "start"]
```

## Support

**Issues?**
- Check [services/prompt-service/README.md](../../services/prompt-service/README.md)
- Review [docs/PROMPT_SERVICE_MIGRATION_GUIDE.md](../../docs/PROMPT_SERVICE_MIGRATION_GUIDE.md)
- See [docs/PROMPT_SERVICE_SUCCESS.md](../../docs/PROMPT_SERVICE_SUCCESS.md)

---

**Version:** 1.0.0
**Last Updated:** 2026-01-22
**Status:** Production Ready
