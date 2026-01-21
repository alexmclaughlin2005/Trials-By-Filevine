# API Gateway Service

Main API gateway for TrialForge AI, handling routing, authentication, and request validation.

## Overview

The API Gateway serves as the single entry point for all client requests, providing:
- Request routing to microservices
- JWT authentication and authorization
- Rate limiting and throttling
- Request/response validation
- CORS handling
- Security headers
- Request logging and monitoring

## Technology Stack

- **Framework:** Fastify (Node.js)
- **Language:** TypeScript
- **Auth:** Auth0 SDK
- **Validation:** Zod schemas
- **Rate Limiting:** Redis-based

## Architecture

```
Client → API Gateway → [Auth Middleware] → [Rate Limiting] → [Validation] → Service
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.trialforge.ai
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Service URLs (Railway internal)
CASE_SERVICE_URL=http://case-service:3001
JURY_PANEL_SERVICE_URL=http://jury-panel-service:3002
RESEARCH_SERVICE_URL=http://research-service:3003
PERSONA_SERVICE_URL=http://persona-service:3004
TRIAL_SESSION_SERVICE_URL=http://trial-session-service:3005
FOCUS_GROUP_SERVICE_URL=http://focus-group-service:3006

# AI Services
IDENTITY_RESOLUTION_URL=http://identity-resolution:8000
RESEARCH_SUMMARIZER_URL=http://research-summarizer:8001
PERSONA_SUGGESTER_URL=http://persona-suggester:8002
QUESTION_GENERATOR_URL=http://question-generator:8003
FOCUS_GROUP_ENGINE_URL=http://focus-group-engine:8004
TRIAL_INSIGHT_ENGINE_URL=http://trial-insight-engine:8005

# Rate Limiting
RATE_LIMIT_USER=100  # requests per minute per user
RATE_LIMIT_ORG=1000  # requests per minute per org

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

## API Routes

### Cases API
- `GET /api/v1/cases` - List all cases
- `POST /api/v1/cases` - Create new case
- `GET /api/v1/cases/:id` - Get case details
- `PATCH /api/v1/cases/:id` - Update case
- `DELETE /api/v1/cases/:id` - Archive case

### Jury Panel API
- `GET /api/v1/cases/:caseId/panel` - Get jury panel
- `POST /api/v1/cases/:caseId/panel/import` - Import jurors
- `GET /api/v1/cases/:caseId/jurors` - List jurors
- `PATCH /api/v1/cases/:caseId/jurors/:id` - Update juror

### Research API
- `POST /api/v1/jurors/:id/research` - Initiate research
- `GET /api/v1/jurors/:id/artifacts` - Get research artifacts

### Personas API
- `GET /api/v1/personas` - List personas
- `POST /api/v1/personas` - Create persona
- `GET /api/v1/jurors/:id/persona-mappings` - Get mappings

### AI Services API
- `POST /api/v1/ai/persona-suggest` - Suggest personas
- `POST /api/v1/ai/question-generate` - Generate questions
- `POST /api/v1/ai/focus-group/simulate` - Run simulation

## Authentication

All routes require Bearer token authentication except health check:

```bash
curl -H "Authorization: Bearer <token>" https://api.trialforge.ai/v1/cases
```

### JWT Claims Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "org_id": "organization-id",
  "role": "attorney",
  "permissions": ["cases:read", "cases:write"]
}
```

### Role-Based Access Control

Roles:
- `admin` - Full access to organization
- `attorney` - Create/manage cases, full trial features
- `paralegal` - Research, data entry, limited case access
- `consultant` - Read-only access to specific cases

## Rate Limiting

Rate limits are enforced per user and per organization:

- **User limit:** 100 requests/minute
- **Organization limit:** 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642598400
```

When rate limit exceeded:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds.",
  "retry_after": 60
}
```

## Request Validation

All requests are validated using Zod schemas:

```typescript
// Example: Create case validation
const createCaseSchema = z.object({
  name: z.string().min(1).max(255),
  case_number: z.string().optional(),
  jurisdiction: z.string(),
  trial_date: z.string().datetime(),
  case_type: z.enum(['civil', 'criminal', 'family']),
  our_side: z.enum(['plaintiff', 'defendant'])
});
```

Invalid requests return 400:
```json
{
  "error": "validation_error",
  "message": "Invalid request body",
  "details": [
    {
      "field": "trial_date",
      "message": "Invalid datetime format"
    }
  ]
}
```

## Error Handling

Standard error response format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {},
  "request_id": "req_abc123"
}
```

HTTP status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Internal server error

## Logging

All requests are logged with:
- Request ID (for tracing)
- User ID and organization ID
- HTTP method and path
- Response status and latency
- Error details (if applicable)

Log format (JSON):
```json
{
  "timestamp": "2026-01-21T10:30:00Z",
  "level": "info",
  "request_id": "req_abc123",
  "user_id": "user_123",
  "org_id": "org_456",
  "method": "POST",
  "path": "/api/v1/cases",
  "status": 201,
  "latency_ms": 145
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Deployment

The service is deployed to Railway as a containerized service.

```bash
# Build Docker image
docker build -t api-gateway .

# Run locally
docker run -p 3000:3000 --env-file .env api-gateway
```

## Health Checks

```bash
# Health check endpoint (no auth required)
GET /health

# Response
{
  "status": "healthy",
  "timestamp": "2026-01-21T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Security

- All endpoints use HTTPS in production
- CORS restricted to allowed origins
- Security headers enabled (HSTS, CSP, etc.)
- Input sanitization on all requests
- SQL injection prevention via parameterized queries
- Rate limiting to prevent abuse

## Monitoring

Integration with:
- **Sentry:** Error tracking
- **Railway Logs:** Centralized logging
- **Custom metrics:** Request counts, latency, error rates

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Support

For issues or questions, contact the backend team or see the main project documentation.
