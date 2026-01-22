# Developer Guide - TrialForge AI

Quick reference for developers working on the TrialForge AI platform.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp services/api-gateway/.env.example services/api-gateway/.env
cp apps/web/.env.example apps/web/.env

# Set up database
cd packages/database
npx prisma migrate dev
npx prisma db seed

# Start dev servers
cd ../..
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database Studio: `npm run db:studio`

---

## Project Structure

```
trials-by-filevine/
├── apps/web/                    # Next.js frontend
│   ├── app/(auth)/             # Authenticated routes
│   ├── app/(public)/           # Public routes
│   ├── components/             # React components
│   └── lib/                    # Client utilities
├── services/api-gateway/        # Fastify API
│   ├── src/routes/             # API endpoints
│   ├── src/services/           # Business logic
│   └── src/adapters/           # Data source adapters
└── packages/
    ├── database/               # Prisma schema
    ├── types/                  # Shared types
    └── utils/                  # Shared utilities
```

---

## Common Tasks

### Adding a New Feature

1. **Plan the feature**:
   - Define requirements
   - Design database schema changes
   - Plan API endpoints
   - Sketch UI components

2. **Backend (if needed)**:
   ```bash
   # Update schema
   cd packages/database
   vim prisma/schema.prisma

   # Create migration
   npx prisma migrate dev --name add_feature_x

   # Create API route
   cd ../../services/api-gateway/src/routes
   touch feature-x.ts

   # Register route in server.ts
   vim ../server.ts
   ```

3. **Frontend**:
   ```bash
   cd apps/web

   # Create component
   touch components/feature-x.tsx

   # Create page (if needed)
   touch app/(auth)/feature-x/page.tsx
   ```

4. **Test**:
   - Manual testing in dev mode
   - Check database changes
   - Verify API responses
   - Test UI interactions

### Database Operations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

### Adding a Data Source Adapter

1. **Create adapter class**:
   ```typescript
   // services/api-gateway/src/adapters/my-adapter.ts
   export class MyDataSourceAdapter implements DataSourceAdapter {
     name = 'my_source';
     tier = 2;

     async search(params: SearchParams): Promise<DataSourceMatch[]> {
       // Implementation
     }

     async getStats(): Promise<DataSourceStats> {
       // Implementation
     }
   }
   ```

2. **Register in jurors routes**:
   ```typescript
   // services/api-gateway/src/routes/jurors.ts
   import { MyDataSourceAdapter } from '../adapters/my-adapter';

   const myAdapter = new MyDataSourceAdapter();
   dataSources.push(myAdapter);
   ```

3. **Test search**:
   - Add test data
   - Trigger search
   - Verify results appear

### Adding a UI Component

1. **Create component file**:
   ```typescript
   // apps/web/components/my-component.tsx
   'use client';

   import { useState } from 'react';
   import { Button } from './ui/button';

   export function MyComponent() {
     const [state, setState] = useState();

     return (
       <div>
         {/* Component JSX */}
       </div>
     );
   }
   ```

2. **Import and use**:
   ```typescript
   import { MyComponent } from '@/components/my-component';

   <MyComponent />
   ```

3. **Style with Tailwind**:
   ```typescript
   <div className="rounded-lg border border-gray-200 p-4">
     {/* Content */}
   </div>
   ```

---

## Code Style Guide

### TypeScript

```typescript
// Use interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions/primitives
type Status = 'pending' | 'active' | 'completed';

// Use async/await (not .then)
const data = await fetchData();

// Handle errors explicitly
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

### React Components

```typescript
// Use functional components
export function MyComponent({ prop1, prop2 }: Props) {
  // Hooks at top
  const [state, setState] = useState();
  const { data } = useQuery(...);

  // Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // Early returns for loading/error
  if (loading) return <Loading />;
  if (error) return <Error />;

  // Main render
  return <div>...</div>;
}
```

### API Routes

```typescript
// Fastify route pattern
export async function myRoutes(server: FastifyInstance) {
  server.get('/path', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;

      // Validate input
      const params = schema.parse(request.body);

      // Business logic
      const result = await doSomething(params);

      // Return response
      return { result };
    },
  });
}
```

---

## Testing

### Manual Testing Checklist

**For New Features**:
- [ ] Happy path works
- [ ] Error handling works
- [ ] Validation works
- [ ] Authentication works
- [ ] Authorization works (right org only)
- [ ] UI looks good (desktop + mobile)
- [ ] Database updates correctly
- [ ] No console errors
- [ ] Network tab looks clean

**For API Endpoints**:
```bash
# Test with curl
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"key": "value"}'
```

**For Database Changes**:
```bash
# Check schema
npx prisma studio

# Verify migration
npx prisma migrate status

# Test rollback (dev only)
npx prisma migrate reset
```

---

## Debugging

### Frontend Debugging

```typescript
// Console logging
console.log('Debug:', data);

// React DevTools
// Install browser extension

// Network tab
// Check API calls in browser DevTools

// React Query DevTools
// Already configured in app
```

### Backend Debugging

```typescript
// Pino logging (already set up)
server.log.info('Info message');
server.log.error('Error message');
server.log.debug('Debug message');

// Check server output
// Watch terminal where npm run dev:api is running

// Prisma query logging
// Set in schema.prisma:
// log: ["query", "info", "warn", "error"]
```

### Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# Check query logs
# See terminal output with Prisma logging enabled

# Manual SQL queries
psql $DATABASE_URL
```

---

## Common Pitfalls

### 1. File Not Read Before Edit
❌ **Wrong**:
```typescript
Edit file without reading it first
```

✅ **Right**:
```typescript
// Always read file before editing
const content = await Read('path/to/file.ts');
await Edit('path/to/file.ts', { old, new });
```

### 2. Missing Authentication
❌ **Wrong**:
```typescript
server.get('/endpoint', {
  handler: async (request, reply) => {
    // No auth check!
  }
});
```

✅ **Right**:
```typescript
server.get('/endpoint', {
  onRequest: [server.authenticate],
  handler: async (request, reply) => {
    const { organizationId } = request.user;
  }
});
```

### 3. No Error Handling
❌ **Wrong**:
```typescript
const result = await apiCall();
```

✅ **Right**:
```typescript
try {
  const result = await apiCall();
} catch (error) {
  console.error('API call failed:', error);
  setError(error.message);
}
```

### 4. Missing Organization Check
❌ **Wrong**:
```typescript
const item = await prisma.item.findUnique({
  where: { id }
});
```

✅ **Right**:
```typescript
const item = await prisma.item.findFirst({
  where: {
    id,
    organizationId  // Always filter by org!
  }
});
```

### 5. Not Using API Client
❌ **Wrong**:
```typescript
const response = await fetch('http://localhost:3001/api/endpoint');
```

✅ **Right**:
```typescript
import { apiClient } from '@/lib/api-client';
const result = await apiClient.get('/endpoint');
```

---

## Performance Tips

### Backend
- Use database indexes for frequently queried fields
- Implement pagination for large result sets
- Cache expensive operations with Redis
- Use parallel queries where possible
- Optimize Prisma queries (select only needed fields)

### Frontend
- Use React Query for caching
- Implement pagination for long lists
- Lazy load heavy components
- Optimize images (use Next.js Image component)
- Debounce search inputs

### Database
- Add indexes on foreign keys
- Add indexes on frequently searched fields
- Use connection pooling
- Monitor slow queries with Prisma logging

---

## Deployment Checklist

### Before Deploying

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] API keys configured
- [ ] Build succeeds locally
- [ ] Test in production-like environment

### Deployment Steps

1. **Database**:
   ```bash
   # Run migrations
   npx prisma migrate deploy
   ```

2. **Backend**:
   ```bash
   cd services/api-gateway
   npm run build
   railway up  # or deploy command
   ```

3. **Frontend**:
   ```bash
   cd apps/web
   vercel deploy --prod
   ```

4. **Verify**:
   - Check health endpoints
   - Test critical flows
   - Monitor error logs
   - Check database connections

---

## Useful Commands

```bash
# Development
npm run dev                    # Start all services
npm run dev:web               # Frontend only
npm run dev:api               # Backend only

# Database
npm run db:migrate            # Run migrations
npm run db:seed               # Seed data
npm run db:studio             # Open Prisma Studio
npm run db:reset              # Reset database (dev only)

# Build
npm run build                 # Build all
npm run build:web             # Frontend only
npm run build:api             # Backend only

# Type checking
npm run typecheck             # Check types
npm run typecheck:web         # Frontend only
npm run typecheck:api         # Backend only

# Linting
npm run lint                  # Lint all
npm run lint:fix              # Fix linting issues

# Testing (when implemented)
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

---

## Environment Variables Reference

### API Gateway

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key-here

# AI Services
ANTHROPIC_API_KEY=sk-ant-...

# External APIs (Optional)
FEC_API_KEY=...
PEOPLE_SEARCH_PROVIDER=pipl
PIPL_API_KEY=...
FULLCONTACT_API_KEY=...
WHITEPAGES_API_KEY=...

# Server Configuration
NODE_ENV=development|production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Security
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
```

### Frontend

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=...
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push to remote
git push -u origin feature/my-feature

# Create pull request on GitHub
# Wait for review and approval
# Merge to main
```

### Commit Message Convention

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

---

## Getting Help

### Documentation
- This guide
- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
- Phase completion docs (PHASE_*.md)
- Code comments

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Fastify Docs](https://fastify.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)

### Troubleshooting
- Check server logs
- Check browser console
- Check database state (Prisma Studio)
- Review recent changes (git diff)
- Ask team members

---

**Happy coding! 🚀**
