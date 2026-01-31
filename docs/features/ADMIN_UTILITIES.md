# Admin Utilities Documentation

This document describes the administrative utilities available for managing the Trials by Filevine application.

## Admin Dashboard

**Location:** `/admin` in the web application

The Admin Dashboard provides a UI for managing system configuration and database operations without requiring direct database access or CLI tools.

### Accessing the Admin Page

1. Navigate to your deployed application
2. Go to `/admin` (e.g., `https://your-app.vercel.app/admin`)
3. The Admin link is also available in the main navigation header

> **Note:** Currently, the admin page is open to all authenticated users. Authentication middleware should be added before production deployment to restrict access to admin/attorney roles only.

## Prompt Seeding

### What It Does

The prompt seeding utility ensures that all required AI prompts are properly configured in the database. This is critical for:
- Focus group conversations (requires `extract-key-points` prompt)
- Takeaway generation (requires `roundtable-takeaways-synthesis` prompt)

### When to Use

Use the "Seed Prompts" button when:
- **After deploying to a new environment** - Fresh database needs prompts initialized
- **Seeing "Prompt not found" errors in logs** - Indicates missing or misconfigured prompts
- **Conversations failing with "Failed to render prompt" errors** - Core prompts are missing their currentVersionId

### How to Use

1. Navigate to `/admin`
2. Check the "Current Status" section:
   - **Green checkmark** = Prompt is seeded and ready
   - **Red X** = Prompt is missing or misconfigured
3. Click the "Seed Prompts" button
4. Wait for the success message showing which prompts were created/fixed
5. Verify the status indicators turn green

### What Happens During Seeding

The seeding process is **idempotent** and safe to run multiple times:

1. **For each required prompt:**
   - Checks if the prompt already exists in the database
   - If it exists and has a valid `currentVersionId`: **Skips it** (no changes)
   - If it exists but missing `currentVersionId`: **Fixes it** by setting the latest version as current
   - If it doesn't exist: **Creates it** with an initial v1.0.0 version

2. **Never duplicates or corrupts existing data**
3. **Logs all actions** to Railway for debugging

### Required Prompts

The system currently requires these prompts:

#### 1. `extract-key-points`
- **Purpose:** Extracts main points from focus group participant statements
- **Used by:** Conversation orchestrator service during live conversations
- **Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Configuration:** Temperature 0.3, Max tokens 500

#### 2. `roundtable-takeaways-synthesis`
- **Purpose:** Analyzes completed conversations and generates strategic insights
- **Used by:** Synthesis service for takeaway generation
- **Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Configuration:** Temperature 0.7, Max tokens 4000

## Technical Architecture

### API Flow

```
Frontend (/admin)
    ↓ POST /api/admin/seed-prompts
API Gateway (Railway)
    ↓ POST /api/v1/admin/seed
Prompt Service (Railway)
    ↓ seedAllPrompts()
Database (Railway PostgreSQL)
```

### File Locations

**Frontend:**
- Admin page: `apps/web/app/(auth)/admin/page.tsx`
- Alert component: `apps/web/components/ui/alert.tsx`

**Backend:**
- API Gateway routes: `services/api-gateway/src/routes/admin.ts`
- Prompt Service routes: `services/prompt-service/src/routes/admin.ts`
- Seed logic: `services/prompt-service/src/routes/admin.ts` (seedAllPrompts function)

**Alternative CLI approach (not currently used):**
- Standalone scripts: `services/prompt-service/scripts/seed-*.ts`
- Run locally: `npm run seed:all` in prompt-service directory

### API Endpoints

#### `POST /api/admin/seed-prompts`
Seeds all required prompts in the database.

**Request:**
```typescript
POST /api/admin/seed-prompts
Content-Type: application/json
Body: {}
```

**Response:**
```typescript
{
  success: true,
  message: "Prompts seeded successfully",
  data: {
    success: true,
    message: "All prompts seeded successfully",
    results: [
      {
        serviceId: "extract-key-points",
        action: "created" | "skipped" | "fixed",
        promptId: "uuid",
        versionId: "uuid" // only present for "created" action
      },
      // ... more results
    ]
  }
}
```

#### `GET /api/admin/seed-status`
Checks which prompts are currently seeded.

**Request:**
```typescript
GET /api/admin/seed-status
```

**Response:**
```typescript
{
  prompts: [
    {
      serviceId: "extract-key-points",
      exists: true,
      hasCurrentVersion: true,
      promptId: "uuid" | null
    },
    // ... more prompts
  ],
  allSeeded: true
}
```

## Adding New Prompts

To add a new required prompt to the system:

1. **Add prompt template** to `seedAllPrompts()` function in `services/prompt-service/src/routes/admin.ts`:

```typescript
const prompts = [
  // ... existing prompts
  {
    serviceId: 'your-new-prompt-id',
    name: 'Your Prompt Name',
    description: 'What this prompt does',
    category: 'analysis',
    systemPrompt: `System instructions here`,
    userPromptTemplate: `User prompt with {{variables}}`,
    config: {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 2000,
    },
    variables: {
      variableName: { type: 'string', required: true },
    },
  },
];
```

2. **Add to status check** in the same file:

```typescript
const requiredPrompts = [
  'extract-key-points',
  'roundtable-takeaways-synthesis',
  'your-new-prompt-id', // Add here
];
```

3. **Test locally:**
```bash
cd services/prompt-service
npm run seed:all
```

4. **Deploy** and run the seeding via the admin UI

## Troubleshooting

### "Bad Request" Error When Seeding

**Cause:** API client not sending proper JSON body

**Fix:** Ensure `apiClient.post()` is called with an empty object:
```typescript
await apiClient.post('/admin/seed-prompts', {})
```

### "Prompt not found" Errors in Logs

**Cause:** Missing prompts in database or missing `currentVersionId`

**Fix:** Run the seed utility from `/admin` page

### Seeding Appears to Work But Errors Persist

**Cause:** Prompt versions exist but `currentVersionId` is null

**Solution:** The seed script will automatically fix this by:
1. Finding the latest version of the prompt
2. Setting it as the `currentVersionId`

### Multiple Versions Created

**Cause:** Running seed script multiple times when prompts didn't exist

**Impact:** Harmless - only the version set as `currentVersionId` is used

**Cleanup (optional):**
```sql
-- Find prompts with multiple versions
SELECT p.serviceId, COUNT(pv.id) as version_count
FROM "Prompt" p
JOIN "PromptVersion" pv ON pv."promptId" = p.id
GROUP BY p.serviceId
HAVING COUNT(pv.id) > 1;

-- Delete old versions (keep current)
DELETE FROM "PromptVersion"
WHERE id NOT IN (
  SELECT "currentVersionId"
  FROM "Prompt"
  WHERE "currentVersionId" IS NOT NULL
);
```

## Security Considerations

### Current State
- ⚠️ Admin endpoints are currently **open** to all users
- No authentication or authorization checks

### Before Production
Add authentication middleware to both:

1. **API Gateway** (`services/api-gateway/src/routes/admin.ts`):
```typescript
export async function adminRoutes(fastify: FastifyInstance) {
  // Add authentication check
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify();

    // Check if user has admin role
    if (request.user.role !== 'admin' && request.user.role !== 'attorney') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  });

  // ... routes
}
```

2. **Prompt Service** (`services/prompt-service/src/routes/admin.ts`):
```typescript
export async function adminRoutes(fastify: FastifyInstance, options) {
  // Add authentication check
  fastify.addHook('preHandler', async (request, reply) => {
    // Verify JWT and check admin/attorney role
  });

  // ... routes
}
```

## Monitoring

### Railway Logs

Monitor seeding operations in Railway logs:

**API Gateway logs:**
```
Triggering prompt seeding...
```

**Prompt Service logs:**
```
Starting prompt seeding...
Seeding Extract Key Points from Statement...
  Prompt already exists (ID: xxx)
  Already has currentVersionId set - skipping
Seeding Roundtable Takeaways Synthesis...
  Created prompt (ID: xxx)
  Created version: v1.0.0
  Set v1.0.0 as current version
```

### Success Indicators

- Admin UI shows green checkmarks for all prompts
- `allSeeded: true` in status response
- No "Prompt not found" errors in conversation logs
- Focus groups run successfully without prompt errors

## Future Enhancements

Potential improvements for the admin utility:

1. **Prompt Version Management**
   - UI for viewing all versions of a prompt
   - Ability to roll back to previous versions
   - Deploy new versions without database access

2. **Bulk Operations**
   - Export all prompts to JSON
   - Import prompts from JSON file
   - Backup/restore functionality

3. **Analytics**
   - Show which prompts are most frequently used
   - Display average token usage per prompt
   - Cost tracking per prompt

4. **Testing Tools**
   - Test prompt rendering with sample variables
   - Preview prompt output with test data
   - Compare prompt versions side-by-side

5. **Audit Trail**
   - Log all admin actions with user/timestamp
   - Show who deployed which version when
   - Track prompt performance metrics

## Related Documentation

- [Prompt Service README](services/prompt-service/README.md) - Prompt management architecture
- [API Gateway README](services/api-gateway/README.md) - API routing and authentication
- [CURRENT_STATE.md](CURRENT_STATE.md) - Overall project status
