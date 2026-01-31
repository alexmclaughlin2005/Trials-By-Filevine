# Prompt Management System - Quick Reference

**Status:** Proposed | **Priority:** Medium | **Effort:** 4 weeks

## TL;DR

Move all AI prompts from hardcoded strings in 12 service files → centralized database with admin UI for rapid iteration without deployments.

## Current Problem

```typescript
// Today: Prompts embedded in code
class ArchetypeClassifier {
  buildPrompt() {
    return `You are an expert...`; // ← Changing this requires full deployment
  }
}
```

**Pain Points:**
- Every prompt tweak = ~1 hour (code → test → deploy)
- 12 services × 2 changes/month = **24 hours wasted/month**
- No A/B testing, no version control, no analytics

## Proposed Solution

```typescript
// Future: Prompts from database
class ArchetypeClassifier {
  async classifyJuror(input) {
    const { result } = await promptClient.execute('archetype-classifier', {
      variables: { jurorData: input }
    });
    return this.parseResponse(result);
  }
}
```

**Benefits:**
- Prompt changes in **5 minutes** (edit → publish → done)
- A/B testing for data-driven optimization
- Analytics dashboard (success rates, token usage, costs)
- Version control with one-click rollback

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│              Prompt Admin UI (Next.js)                    │
│  Monaco Editor | Version History | A/B Tests | Analytics  │
└───────────────────────────┬───────────────────────────────┘
                            │ REST API
┌───────────────────────────┴───────────────────────────────┐
│           Prompt Management Service (Fastify)             │
│  Registry | Versioning | A/B Engine | Cache (Redis)       │
└───────────────────────────┬───────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │   PostgreSQL Database     │
              │  - prompts                │
              │  - prompt_versions        │
              │  - ab_tests               │
              │  - prompt_analytics       │
              └───────────────────────────┘
                            ↑
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴────────┐  ┌───────┴────────┐  ┌──────┴─────────┐
│   Archetype    │  │    Persona     │  │   Research     │
│  Classifier    │  │   Suggester    │  │  Summarizer    │
│   (+ 9 more)   │  │                │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

## Key Components

### 1. Prompt Service (`services/prompt-service/`)
**New microservice:**
- REST API for prompt CRUD
- Version control (like Git)
- A/B test traffic routing
- Redis caching layer
- Analytics collection

**Tech:** Node.js + Fastify + PostgreSQL + Redis

### 2. Admin UI (`apps/prompt-admin/`)
**New web app:**
- Monaco code editor (VS Code-like)
- Version history with diffs
- A/B test creation & monitoring
- Analytics dashboard
- One-click deploy/rollback

**Tech:** Next.js 14 + Radix UI + Monaco Editor

### 3. Prompt Client (`packages/prompt-client/`)
**Shared library for AI services:**
```typescript
const promptClient = new PromptClient({
  serviceUrl: process.env.PROMPT_SERVICE_URL
});

// Get and execute prompt
const { result } = await promptClient.execute('archetype-classifier', {
  variables: { jurorData: '...' }
});
```

## Database Schema (Simplified)

```sql
prompts
  - id, service_id, name, current_version_id

prompt_versions (immutable history)
  - id, prompt_id, version, system_prompt, user_prompt_template, config

ab_tests
  - id, prompt_id, control_version_id, variant_version_id, traffic_split

prompt_analytics
  - id, version_id, success, tokens_used, latency_ms, confidence
```

## Migration Plan

**Week 1:** Build prompt service + API + database
**Week 2:** Extract prompts, migrate services one-by-one
**Week 3:** Build admin UI (editor, version history)
**Week 4:** Add A/B testing, analytics, deploy to production

## ROI Analysis

**Development Cost:** 164 hours (~4 weeks)

**Monthly Savings:**
- Before: 24 hours/month on prompt changes
- After: 4 hours/month
- **Savings: 20 hours/month = 240 hours/year**

**Break-even: 8.2 months**

**Additional Benefits:**
- A/B testing → 10-20% token cost reduction
- Faster AI feature development
- Non-engineers can iterate on prompts
- Data-driven quality improvements

## API Examples

**Get & Render Prompt:**
```typescript
POST /api/v1/prompts/archetype-classifier/render
{
  "variables": { "jurorData": "..." },
  "version": "latest"
}
→ Returns rendered prompt ready for Claude API
```

**Track Result:**
```typescript
POST /api/v1/prompts/archetype-classifier/results
{
  "versionId": "uuid",
  "success": true,
  "tokensUsed": 3500,
  "latencyMs": 2300,
  "confidence": 0.87
}
```

**Deploy New Version (Admin):**
```typescript
POST /api/v1/admin/prompts/archetype-classifier/deploy
{ "versionId": "uuid" }
→ Instant deployment, no code changes
```

## Admin UI Mockup

```
┌────────────────────────────────────────────────────────────┐
│ Juries by Filevine - Prompt Management                     │
├────────────────────────────────────────────────────────────┤
│ [Prompts] [A/B Tests] [Analytics]                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Prompt: Archetype Classifier                v2.3.1 ▼      │
│ ┌────────────────────────────────────────────────────┐    │
│ │ System Prompt (optional)                           │    │
│ │ ┌────────────────────────────────────────────────┐ │    │
│ │ │ You are an expert jury consultant...          │ │    │
│ │ └────────────────────────────────────────────────┘ │    │
│ │                                                    │    │
│ │ User Prompt Template                               │    │
│ │ ┌────────────────────────────────────────────────┐ │    │
│ │ │ Classify this juror:                          │ │    │
│ │ │                                                │ │    │
│ │ │ {{jurorData}}                                 │ │    │
│ │ │                                                │ │    │
│ │ │ Categories: {{categories}}                    │ │    │
│ │ └────────────────────────────────────────────────┘ │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ Config: Model: claude-sonnet-4-5  Temp: 0.3  Tokens: 4000 │
│                                                            │
│ [Save Draft] [Preview] [Deploy] [Rollback] [Version Hist] │
└────────────────────────────────────────────────────────────┘
```

## Security & Safety

✅ **Authentication:** Admin UI requires JWT (Admin/Attorney roles only)
✅ **Audit Logging:** Every change tracked with user ID + timestamp
✅ **Validation:** Schema validation before deployment
✅ **Rollback:** One-click revert if prompts fail
✅ **Caching:** Services cache prompts (5 min TTL) for resilience
✅ **Fallback:** Services can use hardcoded prompts if service down

## Success Metrics

Track these after implementation:
1. **Iteration Speed:** <5 minutes from idea → production
2. **Deployment Frequency:** 5-10x more prompt changes per week
3. **A/B Test Adoption:** >50% of changes tested before rollout
4. **Cost Savings:** 10-20% token reduction from optimization
5. **Quality:** Improved average confidence scores

## Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **File-based** (prompts in Git) | Simple, no new service | Still requires deployments | ❌ Too slow |
| **Third-party** (Promptlayer, etc.) | No dev time, enterprise features | $200-500/month, vendor lock-in | ⚠️ Maybe later |
| **Admin UI only** (no service) | Simpler architecture | Less scalable, harder to cache | ⚠️ Viable but limited |
| **Proposed solution** | Full control, scalable, A/B testing | 4 weeks dev time | ✅ **Recommended** |

## Next Steps

1. **Review this proposal** with team
2. **Validate assumptions** (time savings, costs)
3. **Prioritize vs. other roadmap items**
4. **If approved:** Start with Phase 1 (prompt service backend)

---

**Questions? See full proposal:** [PROMPT_MANAGEMENT_PROPOSAL.md](./PROMPT_MANAGEMENT_PROPOSAL.md)
