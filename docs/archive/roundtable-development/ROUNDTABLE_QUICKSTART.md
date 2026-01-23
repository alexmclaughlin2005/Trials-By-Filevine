# Roundtable Conversations - Quick Start Guide

Get the roundtable conversation feature up and running in 5 minutes.

## Prerequisites

- PostgreSQL database running
- Node.js 18+ installed
- Anthropic API key

## Setup Steps

### 1. Database Setup (30 seconds)

```bash
cd packages/database
npx prisma migrate dev
```

This creates the `focus_group_conversations` and `focus_group_statements` tables.

### 2. Seed Prompts (30 seconds)

```bash
npx tsx scripts/add-roundtable-prompts.ts
```

This adds 5 conversation prompts to the Prompt Management Service:
- `roundtable-persona-system`
- `roundtable-initial-reaction`
- `roundtable-conversation-turn`
- `roundtable-statement-analysis`
- `roundtable-conversation-synthesis`

### 3. Assign Leadership Levels (30 seconds)

```bash
npx tsx scripts/assign-persona-leadership.ts
```

This assigns leadership levels to all existing personas based on their archetypes.

### 4. Environment Variables (1 minute)

Create/update `.env` files:

**`services/prompt-service/.env`:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/trialforge
REDIS_URL=redis://localhost:6379
PORT=3002
```

**`services/api-gateway/.env`:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/trialforge
ANTHROPIC_API_KEY=sk-ant-...
PROMPT_SERVICE_URL=http://localhost:3002
PORT=3001
```

**`apps/web/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Start Services (1 minute)

Open 3 terminals:

**Terminal 1: Prompt Service**
```bash
cd services/prompt-service
npm run dev
```

**Terminal 2: API Gateway**
```bash
cd services/api-gateway
npm run dev
```

**Terminal 3: Frontend**
```bash
cd apps/web
npm run dev
```

### 6. Test It Out (2 minutes)

1. Open browser to `http://localhost:3000`
2. Log in and navigate to a case
3. Go to Focus Groups tab
4. Create a new focus group session:
   - Select personas (or use random)
   - Select arguments to test
   - Complete setup wizard
5. Click "Start Roundtable Discussion" on an argument
6. Wait ~60-90 seconds for conversation to complete
7. View results with full transcript!

## Quick Test with cURL

If you prefer testing via API directly:

```bash
# 1. Create a focus group session
SESSION_ID=$(curl -X POST http://localhost:3001/api/focus-groups/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "YOUR_CASE_ID",
    "name": "Test Session",
    "description": "Testing roundtable"
  }' | jq -r '.id')

# 2. Run roundtable conversation
curl -X POST http://localhost:3001/api/focus-groups/sessions/$SESSION_ID/roundtable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"argumentId": "YOUR_ARGUMENT_ID"}' \
  | jq '.'

# 3. View conversation
CONVERSATION_ID="conversation_id_from_above"
curl http://localhost:3001/api/focus-groups/conversations/$CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.'
```

## What to Expect

### Sample Output

**Conversation Stats:**
- 6 personas (2 leaders, 2 influencers, 1 follower, 1 passive)
- 18-25 total statements
- 60-90 seconds total duration
- ~25,000-30,000 tokens used

**Transcript Example:**
```
Captain Frank Morrison (LEADER): "Based on what we've heard, the company
clearly had processes in place. The question is whether the plaintiff
followed them. What do others think?"

Engineer Maria Santos (INFLUENCER): "I'm not so sure. The procedures
might have existed on paper, but were they realistic to follow in practice?"

Teacher Janet Chen (FOLLOWER): "Frank makes a good point about procedures.
But Maria's right too—I wonder if anyone actually trained the plaintiff."

Retail Worker Derek Kim (PASSIVE): "Hard to say yet."

[... conversation continues ...]
```

**Analysis Output:**
- **Consensus Areas:** "Training adequacy is a key issue"
- **Fracture Points:** "Whether procedures were realistic to follow"
- **Key Debate Points:** "Personal responsibility vs. systemic failure"
- **Influential Personas:** Captain Frank (dominant), Maria (persuasive)

## Troubleshooting

### "Prompt not found" error
**Solution:** Run `npx tsx scripts/add-roundtable-prompts.ts`

### "Leadership level is null" warning
**Solution:** Run `npx tsx scripts/assign-persona-leadership.ts`

### Conversation hangs/times out
**Possible causes:**
- Anthropic API key invalid/missing
- Prompt service not running
- Database connection issue

**Check logs:**
```bash
# API Gateway logs
tail -f services/api-gateway/logs/app.log

# Prompt Service logs
tail -f services/prompt-service/logs/app.log
```

### Mock data returned
**Reason:** `ANTHROPIC_API_KEY` not set in environment
**Solution:** Add valid API key to `services/api-gateway/.env`

## Architecture Overview

```
User clicks "Start Roundtable Discussion"
  ↓
Frontend → API Gateway
  ↓
ConversationOrchestrator
  ↓
┌─────────────────────────────────────┐
│ Phase 1: Initial Reactions          │
│ - Everyone speaks once (ordered)    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Phase 2: Dynamic Deliberation       │
│ - Turn-taking until convergence     │
│ - TurnManager determines speakers   │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Phase 3: Statement Analysis         │
│ - Analyze sentiment, key points     │
│ - Detect social signals             │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Phase 4: Conversation Synthesis     │
│ - Identify consensus & fractures    │
│ - Rank influential personas         │
└─────────────────────────────────────┘
  ↓
Results returned to frontend
```

## Key Files

### Backend
- `services/api-gateway/src/services/roundtable/`
  - `turn-manager.ts` - Speaking turn logic
  - `conversation-orchestrator.ts` - Orchestration
  - `statement-analyzer.ts` - Analysis

- `services/api-gateway/src/routes/focus-groups.ts`
  - Roundtable API endpoints

### Frontend
- `apps/web/components/roundtable-conversation-viewer.tsx` - View results
- `apps/web/components/roundtable-conversation-trigger.tsx` - Start conversation

### Database
- `packages/database/prisma/schema.prisma`
  - `FocusGroupConversation` model
  - `FocusGroupStatement` model
  - Persona leadership fields

### Scripts
- `scripts/add-roundtable-prompts.ts` - Prompt seeding
- `scripts/assign-persona-leadership.ts` - Leadership assignment

## Next Steps

1. **Read the Design Doc:** [focus_group_simulation_design.md](focus_group_simulation_design.md)
2. **Review Session Summary:** [SESSION_SUMMARY_2026-01-23_ROUNDTABLE_CONVERSATIONS.md](SESSION_SUMMARY_2026-01-23_ROUNDTABLE_CONVERSATIONS.md)
3. **Service Documentation:** [services/api-gateway/src/services/roundtable/README.md](services/api-gateway/src/services/roundtable/README.md)

## Support

For issues or questions:
- Check logs in `services/*/logs/`
- Review error messages in browser console
- Verify environment variables are set
- Ensure all services are running

## Demo Video Coming Soon!

We'll add a demo video showing the complete flow from setup to results.

---

**Status:** ✅ Feature complete and ready for testing
**Version:** 1.0.0
**Last Updated:** January 23, 2026
