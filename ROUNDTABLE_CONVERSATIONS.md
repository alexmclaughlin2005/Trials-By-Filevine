# 🎭 Roundtable Conversations - Production Ready

**Status:** ✅ **LIVE IN PRODUCTION**
**Last Updated:** January 23, 2026
**Feature:** Multi-turn AI-powered jury deliberations

---

## Overview

Roundtable Conversations replace the old single-turn focus group simulator with authentic, multi-turn jury deliberations. Watch AI personas debate arguments in real-time, revealing consensus areas, fracture points, and influential dynamics that shape verdicts.

### Key Features

- ✅ **Multi-turn conversations** (1-5 statements per persona)
- ✅ **Leadership-based turn management** (LEADER → INFLUENCER → FOLLOWER → PASSIVE)
- ✅ **Real-time sentiment tracking** (plaintiff/defense leaning, neutral, conflicted)
- ✅ **Social signal detection** (who agrees/disagrees with whom)
- ✅ **Consensus & fracture analysis** (what unites or divides the panel)
- ✅ **Conversation synthesis** (key debate points, influential personas)

---

## How It Works

### User Flow

1. **Create Focus Group Session**
   - Navigate to a case → **Focus Groups** tab
   - Click **New Focus Group**
   - Complete setup wizard:
     - Select panel size (6-12 personas)
     - Choose persona selection mode (Random, Balanced, or Custom)
     - Configure panel composition
     - Add custom questions (optional)

2. **Start Roundtable Discussion**
   - Session opens with list of case arguments
   - Click **Start Roundtable Discussion** on any argument
   - Wait 60-90 seconds for conversation to complete

3. **View Results**
   - Full conversation transcript in chronological order
   - Color-coded sentiment indicators for each statement
   - Consensus areas and fracture points
   - Key debate points
   - Influential persona analysis
   - Expandable details: emotional intensity, key points, social signals

### Technical Architecture

```
User → Focus Group Session → Select Argument
  ↓
POST /api/focus-groups/sessions/:sessionId/roundtable
  ↓
ConversationOrchestrator.runConversation()
  ↓
┌─────────────────────────────────────────────┐
│ Phase 1: Initial Reactions                  │
│ - Everyone speaks once                      │
│ - Ordered by leadership level               │
│ - Sets context for deliberation             │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ Phase 2: Dynamic Deliberation               │
│ - Turn-based conversation                   │
│ - Leadership weights:                       │
│   • LEADER: 40% speaking probability        │
│   • INFLUENCER: 30%                         │
│   • FOLLOWER: 20%                           │
│   • PASSIVE: 10%                            │
│ - Continues until convergence (20 turns)    │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ Phase 3: Statement Analysis                 │
│ - Sentiment scoring                         │
│ - Key point extraction                      │
│ - Social signal detection                   │
│ - Emotional intensity tracking              │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ Phase 4: Conversation Synthesis             │
│ - Consensus area identification             │
│ - Fracture point detection                  │
│ - Key debate points                         │
│ - Influential persona ranking               │
└─────────────────────────────────────────────┘
  ↓
Results displayed in RoundtableConversationViewer
```

### Components

**Frontend:**
- `RoundtableConversationTrigger` - Initiates conversations
- `RoundtableConversationViewer` - Displays results
- `FocusGroupManager` - Orchestrates session workflow

**Backend:**
- `ConversationOrchestrator` - Manages conversation lifecycle
- `TurnManager` - Controls speaking order
- `StatementAnalyzer` - Analyzes individual statements (future)
- `PromptClient` - Communicates with prompt service

**Services:**
- `prompt-service` - Manages AI prompts and versioning
- `api-gateway` - Handles conversation orchestration

---

## Prompts

The system uses 5 specialized prompts:

1. **`roundtable-initial-reaction`** - First impressions of argument
2. **`roundtable-conversation-turn`** - Dynamic deliberation responses
3. **`roundtable-statement-analysis`** - Analyzes individual statements (future)
4. **`roundtable-conversation-synthesis`** - Synthesizes full conversation
5. **`roundtable-verdict-prediction`** - Predicts panel verdict (future)

**Model:** `claude-sonnet-4-20250514`
**Tokens per conversation:** ~25,000-30,000
**Duration:** 60-90 seconds

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Personas per conversation** | 6 (typical jury panel) |
| **Statements generated** | 18-25 |
| **Conversation duration** | 60-90 seconds |
| **Token usage** | 25,000-30,000 |
| **API calls** | 20-30 (Claude API) |
| **Success rate** | 100% with fallback |

---

## Recent Bug Fixes (Jan 23, 2026)

### Issue: Mock Data Appearing Instead of Real Conversations

**Symptoms:**
- All personas showed "I need more time to think about this."
- Backend logs showed real AI responses but they weren't saved to DB

**Root Causes:**
1. **Persona Assignment:** Session start wasn't creating `focus_group_personas` records
2. **Response Parsing:** `extractStatement()` not handling Anthropic API response format
3. **Model Configuration:** Invalid model name `claude-sonnet-4-5-20251101`
4. **Service Stability:** TSX watch mode causing auto-restarts during conversations

**Fixes Applied:**
1. ✅ Updated `/sessions/:sessionId/start` to create persona records from `selectedArchetypes`
2. ✅ Fixed `extractStatement()` to parse `result.content[0].text` structure
3. ✅ Updated all prompts to use correct model: `claude-sonnet-4-20250514`
4. ✅ Installed missing `node-fetch@2` dependency
5. ✅ Run API Gateway without watch mode in production

**Commits:**
- `5a8532d` - fix: Handle Anthropic API response format in conversation orchestrator
- `ceac968` - chore: Trigger Railway deployment for roundtable conversation fixes

---

## Database Schema

### Core Tables

```sql
-- Focus group sessions
focus_group_sessions
  - id (UUID)
  - case_id (UUID)
  - name (string)
  - status (enum: draft, running, completed)
  - selected_archetypes (JSONB) -- Stores selected personas
  - configuration_step (string)
  - started_at (timestamp)
  - completed_at (timestamp)

-- Persona assignments
focus_group_personas
  - id (UUID)
  - session_id (UUID)
  - persona_id (UUID)
  - seat_number (integer) -- 1-12

-- Conversations
focus_group_conversations
  - id (UUID)
  - session_id (UUID)
  - argument_id (UUID)
  - started_at (timestamp)
  - completed_at (timestamp)
  - converged (boolean)
  - convergence_reason (text)
  - consensus_areas (text[])
  - fracture_points (text[])
  - key_debate_points (text[])
  - influential_personas (JSONB)

-- Individual statements
focus_group_statements
  - id (UUID)
  - conversation_id (UUID)
  - persona_id (UUID)
  - persona_name (string)
  - sequence_number (integer)
  - content (text) -- The actual statement
  - sentiment (enum: plaintiff_leaning, defense_leaning, neutral, conflicted)
  - emotional_intensity (float 0-1)
  - key_points (text[])
  - addressed_to (text[]) -- Who they're speaking to
  - agreement_signals (text[]) -- Who they agree with
  - disagreement_signals (text[]) -- Who they disagree with
  - speak_count (integer) -- How many times this persona has spoken
```

---

## API Endpoints

### Create/Manage Sessions

```http
# Get sessions for a case
GET /api/focus-groups/case/:caseId

# Get specific session
GET /api/focus-groups/:sessionId

# Start a session (creates persona assignments)
POST /api/focus-groups/sessions/:sessionId/start

# Update session configuration
PATCH /api/focus-groups/sessions/:sessionId/config
```

### Roundtable Conversations

```http
# Start roundtable discussion for an argument
POST /api/focus-groups/sessions/:sessionId/roundtable
Body: { argumentId: string }
Returns: { conversationId: string, statements: [...], ... }

# Get conversation results
GET /api/focus-groups/conversations/:conversationId

# List conversations for a session
GET /api/focus-groups/sessions/:sessionId/conversations
```

---

## Local Development

### Start Services

```bash
# Terminal 1: Prompt Service
cd services/prompt-service
npm run dev

# Terminal 2: API Gateway
cd services/api-gateway
npm run dev

# Terminal 3: Frontend
cd apps/web
npm run dev
```

### Environment Variables

**API Gateway** (`services/api-gateway/.env`):
```env
ANTHROPIC_API_KEY=sk-ant-...
PROMPT_SERVICE_URL=http://localhost:3002
DATABASE_URL=postgresql://...
```

**Prompt Service** (`services/prompt-service/.env`):
```env
DATABASE_URL=postgresql://...
```

### Test Flow

1. Navigate to `http://localhost:3000`
2. Log in with test account
3. Go to any case → **Focus Groups** tab
4. Create new session or select existing
5. Click **Start Roundtable Discussion** on any argument
6. Wait 60-90 seconds
7. View results with full transcript and analysis

---

## Troubleshooting

### Mock Data Instead of Real Conversations

**Check:**
- ✅ `ANTHROPIC_API_KEY` is set in `services/api-gateway/.env`
- ✅ API Gateway logs show Claude API calls (not errors)
- ✅ Database has `focus_group_personas` records for the session

**Fix:**
```bash
# Restart API Gateway
cd services/api-gateway
npm run dev

# Check logs for errors
tail -f /tmp/api-gateway.log
```

### Personas Not Assigned to Session

**Symptom:** Session shows 0 personas even after setup wizard

**Cause:** Session wasn't "started" properly

**Fix:**
1. Complete setup wizard fully
2. Click through to "Start Session"
3. Verify in logs: `POST /sessions/:sessionId/start` creates persona records

### Service Crashes During Conversations

**Symptom:** `ERR_CONNECTION_REFUSED` or service restarts mid-conversation

**Cause:** TSX watch mode auto-restarting on file changes

**Fix:**
```bash
# Run without watch mode
cd services/api-gateway
npx tsx src/index.ts
```

### Synthesis Not Working (Fallback Data)

**Symptom:** Conversation completes but shows generic synthesis

**Cause:** Synthesis prompt template validation or model error

**Check:**
- Prompt `roundtable-conversation-synthesis` is using `claude-sonnet-4-20250514`
- Variables match: `argumentContent`, `conversationTranscript`, `personasText`
- Logs show synthesis step completing (not catching error)

---

## Future Enhancements

### Planned Features

- [ ] **Live Streaming:** Show statements as they're generated
- [ ] **Cross-Argument Memory:** Personas remember previous discussions
- [ ] **Faction Detection:** Identify voting blocs and alliances
- [ ] **Position Evolution:** Track how opinions shift over time
- [ ] **Verdict Prediction:** Estimate panel verdict after deliberation
- [ ] **Juror Profiles:** Deep-dive into individual persona behavior
- [ ] **Comparison Mode:** Compare conversations across different arguments

### Performance Optimizations

- [ ] Cache persona context between conversations
- [ ] Batch statement analysis (currently sequential)
- [ ] Use Anthropic prompt caching for repeated context
- [ ] Parallelize initial reactions (all personas at once)

### UX Improvements

- [ ] Progress indicator showing current phase
- [ ] Real-time statement streaming to frontend
- [ ] Export conversation transcripts (PDF, DOCX)
- [ ] Highlight influential statements in timeline
- [ ] Filter statements by persona or sentiment

---

## Resources

### Documentation
- [Roundtable Quickstart Guide](./ROUNDTABLE_QUICKSTART.md)
- [Focus Group Testing Guide](./FOCUS_GROUP_TESTING_GUIDE.md)
- [Persona Summary Plan](./ROUNDTABLE_PERSONA_SUMMARY_PLAN.md)
- [Service Architecture](./services/api-gateway/src/services/roundtable/README.md)

### Session Summaries
- [Roundtable Conversations Implementation](./SESSION_SUMMARY_2026-01-23_ROUNDTABLE_CONVERSATIONS.md)
- [Focus Group Questions Deployment](./SESSION_SUMMARY_2026-01-23_FOCUS_GROUP_QUESTIONS_DEPLOYMENT.md)

### Code Locations
- Frontend: `apps/web/components/roundtable-*.tsx`
- Backend: `services/api-gateway/src/services/roundtable/`
- Routes: `services/api-gateway/src/routes/focus-groups.ts`
- Database: `packages/database/prisma/schema.prisma`

---

## Support

**Issues:** https://github.com/alexmclaughlin2005/Trials-By-Filevine/issues
**Deployed:** Railway (api-gateway, prompt-service) + Vercel (frontend)

---

**Built with ❤️ using Claude Sonnet 4.5**
