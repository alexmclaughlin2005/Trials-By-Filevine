# Juror Research Tool — Specification

This folder contains the complete specification for the juror research module.

## Documents

| File | Description |
|------|-------------|
| [OVERVIEW.md](./OVERVIEW.md) | Product context, user stories, high-level architecture |
| [DATA_MODELS.md](./DATA_MODELS.md) | Domain entities, relationships, TypeScript interfaces |
| [API_SPEC.md](./API_SPEC.md) | REST endpoints, WebSocket events, request/response formats |
| [DATA_SOURCES.md](./DATA_SOURCES.md) | External APIs, data source tiers, integration patterns |
| [UI_FLOWS.md](./UI_FLOWS.md) | Screens, interactions, wireframes |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Build order, algorithms, edge cases, AI coding tips |

## Quick Start for Developers

1. Read **OVERVIEW.md** to understand the product
2. Review **DATA_MODELS.md** for the core types
3. Check **IMPLEMENTATION_GUIDE.md** for build order and phasing
4. Reference **API_SPEC.md** and **UI_FLOWS.md** during implementation

## Quick Start for AI Coding Assistants

When prompting an AI assistant:

1. **Include context**: Reference specific sections of these docs
2. **Be incremental**: Start with Phase 1 from IMPLEMENTATION_GUIDE.md
3. **Request tests**: Ask for unit tests alongside implementation
4. **Specify edge cases**: See edge case tables in IMPLEMENTATION_GUIDE.md

Example prompt:
```
Using the Juror and Candidate interfaces from DATA_MODELS.md,
implement the scoreCandidate function from IMPLEMENTATION_GUIDE.md.
Include tests for exact name match, phonetic match, and age matching.
```

## Integration Notes

This module integrates with a parent application. Key integration points:

- **Authentication**: Uses parent app's auth (no auth logic in this module)
- **Case/Matter**: References external `case_id` (structure defined by parent)
- **Audit logging**: Emits events for parent app's audit trail
- **WebSockets**: Can use parent app's WS infrastructure if available

## Out of Scope

- User authentication
- Case/matter management
- Billing/usage tracking
- Jury selection strategy analytics
