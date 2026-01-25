# Trials by Filevine API Documentation

## Overview

This directory contains the complete API documentation for Trials by Filevine AI platform.

## Files

- **[openapi.yaml](./openapi.yaml)** - Complete OpenAPI 3.0 specification with detailed endpoint documentation
- **README.md** - This file

## Quick Start

### Viewing the Documentation

You can view the API documentation in several ways:

1. **Swagger UI** (Recommended)
   ```bash
   # Using npx (no installation required)
   npx swagger-ui-watcher openapi.yaml
   ```
   Then open http://localhost:8000

2. **Swagger Editor** (Online)
   - Visit https://editor.swagger.io/
   - File → Import File → Select `openapi.yaml`

3. **Redoc** (Alternative viewer)
   ```bash
   npx @redocly/cli preview-docs openapi.yaml
   ```

4. **VS Code Extension**
   - Install "OpenAPI (Swagger) Editor" extension
   - Right-click `openapi.yaml` → "Preview Swagger"

### Testing the API

1. **Using Swagger UI**
   - Click "Authorize" button
   - Enter your JWT token (from `/api/auth/login`)
   - Try out endpoints directly in the browser

2. **Using cURL**
   ```bash
   # Login to get token
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "attorney@lawfirm.com", "password": "password"}'

   # Use token for authenticated requests
   curl -X GET http://localhost:3001/api/cases \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Using Postman**
   - Import `openapi.yaml` into Postman
   - Postman will automatically create a collection with all endpoints
   - Set up environment variables for baseUrl and token

## API Overview

### Base URLs
- **Production**: `https://api-gateway-production.railway.app`
- **Staging**: `https://api-gateway-staging.railway.app`
- **Local**: `http://localhost:3001`

### Authentication
All protected endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

Get a token via:
- `POST /api/auth/login` - Existing users
- `POST /api/auth/signup` - New users

### API Categories

The API is organized into the following categories:

#### 1. **Authentication** (`/api/auth`)
- User login and registration
- JWT token management
- Current user profile

#### 2. **Cases** (`/api/cases`)
- Case management (CRUD)
- Case metadata and status
- Facts, arguments, witnesses management

#### 3. **Jurors** (`/api/jurors`)
- Jury panel management
- Individual juror profiles
- Identity resolution workflow
- Batch import from CSV
- Jury box positioning

#### 4. **Personas** (`/api/personas`)
- Persona library management
- AI-powered persona suggestions
- Custom persona creation

#### 5. **Archetypes** (`/api/archetypes`)
- 10 behavioral archetype classification
- Psychological dimension scoring
- Panel composition analysis
- Strategic recommendations

#### 6. **Research** (`/api/research`)
- Juror research summarization
- Public records analysis
- Batch processing

#### 7. **Synthesis** (`/api/candidates/.../synthesize`)
- Deep research with Claude web search
- Comprehensive juror profiles
- Voir dire recommendations
- Async processing with polling

#### 8. **Focus Groups** (`/api/focus-groups`)
- AI-powered jury simulations
- Roundtable deliberations
- Argument testing
- Weakness analysis

#### 9. **Captures** (`/api/captures`)
- Document upload and OCR
- Jury list extraction
- Questionnaire processing
- Claude Vision integration

#### 10. **Filevine Integration** (`/api/filevine`)
- Connection management
- Document import
- Case linking

## Conversational AI Integration

This API is designed to be controlled by conversational AI agents. Key patterns:

### Common Workflows

#### 1. Case Setup
```
User: "Create a new personal injury case for plaintiff Smith v. Jones"

AI Flow:
1. POST /api/auth/login (if needed)
2. POST /api/cases
   - name: "Smith v. Jones"
   - caseType: "Personal Injury"
   - ourSide: "plaintiff"
3. Note: Jury panel is auto-created
```

#### 2. Juror Research
```
User: "Add juror #5: John Smith, age 45, engineer"

AI Flow:
1. GET /api/cases/{caseId} to get panelId
2. POST /api/jurors
   - jurorNumber: "5"
   - firstName: "John"
   - lastName: "Smith"
   - age: 45
   - occupation: "engineer"
3. POST /api/jurors/{jurorId}/search (identity matching)
4. Present candidates to user
5. POST /api/jurors/candidates/{candidateId}/confirm
6. POST /api/candidates/{candidateId}/synthesize (deep research)
7. Poll GET /api/candidates/{candidateId}/synthesis
8. GET /api/synthesis/{profileId} when complete
```

#### 3. Archetype Classification
```
User: "What archetype is juror #5?"

AI Flow:
1. POST /api/archetypes/classify/juror
   - jurorId: "..."
   - includeResearch: true
2. Display archetype with confidence, dimensions, recommendations
```

#### 4. Focus Group Simulation
```
User: "Test my opening statement with a mock jury"

AI Flow:
1. GET /api/cases/{caseId} to get argumentId
2. POST /api/focus-groups/simulate
   - caseId: "..."
   - argumentId: "..."
   - simulationMode: "detailed"
3. Display persona reactions and recommendations
```

#### 5. Document Capture
```
User: "Extract jurors from this jury list image"

AI Flow:
1. POST /api/cases/{caseId}/captures
   - documentType: "panel_list"
   - imageData: "<base64>"
2. POST /api/captures/{captureId}/process
3. Poll GET /api/captures/{captureId}
4. Present extracted jurors for review
5. POST /api/captures/{captureId}/confirm
```

### Async Operations

Several operations are asynchronous and require polling:

| Operation | Start Endpoint | Poll Endpoint | Typical Duration |
|-----------|---------------|---------------|------------------|
| Deep Research Synthesis | POST /candidates/{id}/synthesize | GET /candidates/{id}/synthesis | 10-60 seconds |
| Roundtable Conversation | POST /focus-groups/sessions/{id}/roundtable | GET /focus-groups/conversations/{id} | 30-120 seconds |
| OCR Processing | POST /captures/{id}/process | GET /captures/{id} | 5-15 seconds |

**Polling Pattern:**
```javascript
// 1. Start operation
const { conversationId } = await POST('/api/focus-groups/.../roundtable');

// 2. Poll every 2-3 seconds
const interval = setInterval(async () => {
  const { status, ...result } = await GET(`/api/.../conversations/${conversationId}`);

  if (status === 'complete') {
    clearInterval(interval);
    // Display results
  } else if (status === 'error') {
    clearInterval(interval);
    // Handle error
  }
}, 3000);
```

## Response Formats

### Success Response
```json
{
  "case": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "statusCode": 400,
  "details": {
    "field": "Specific validation error"
  }
}
```

### Common Status Codes
- **200 OK** - Request successful
- **201 Created** - Resource created
- **202 Accepted** - Async operation started
- **204 No Content** - Successful deletion
- **400 Bad Request** - Validation error
- **401 Unauthorized** - Missing/invalid JWT
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource conflict (e.g., duplicate email)
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Database connection issue

## Rate Limiting

- **Default**: 100 requests per 15-minute window
- Rate limit info in response headers:
  - `X-RateLimit-Limit`: Max requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Multi-Tenancy

All data is isolated by organization. The `organizationId` from your JWT token automatically filters all queries.

**Important**: You can only access data belonging to your organization.

## Data Models

### Key Entities

```
Organization
└── Users
└── Cases
    ├── Facts
    ├── Arguments (versioned)
    ├── Witnesses
    └── Jury Panels
        └── Jurors
            ├── Research Artifacts
            ├── Persona Mappings
            ├── Identity Candidates
            └── Synthesized Profile
└── Personas (shared library)
└── Focus Group Sessions
    ├── Simulations
    └── Roundtable Conversations
```

### Relationships

- **Case → Jury Panel**: 1:N (auto-created on case creation)
- **Jury Panel → Jurors**: 1:N
- **Juror → Persona**: N:N (multiple personas per juror)
- **Case → Arguments**: 1:N (with version history)
- **Argument → Focus Groups**: 1:N

## Development

### Running Locally

```bash
# Start API Gateway
cd services/api-gateway
npm install
npm run dev

# Server runs on http://localhost:3001
```

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Services
ANTHROPIC_API_KEY=sk-ant-...

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Testing with Mock Data

When `ANTHROPIC_API_KEY` is not set, many AI endpoints return mock responses for development.

## API Design Principles

1. **RESTful** - Standard HTTP methods and status codes
2. **Consistent** - Uniform error handling and response formats
3. **Versioned** - All endpoints include `/api/` prefix (v1 implicit)
4. **Documented** - Every endpoint has detailed descriptions
5. **Secure** - JWT authentication, organization isolation
6. **Async-Aware** - Long operations return immediately with polling endpoints
7. **Explainable** - AI recommendations include confidence, rationale, sources

## Support

For API questions or issues:
- **Documentation**: See [openapi.yaml](./openapi.yaml) for complete endpoint details
- **Architecture**: See [../../Trials by Filevine_AI_Architecture.md](../../Trials by Filevine_AI_Architecture.md)
- **PRD**: See [../../Trials by Filevine_AI_PRD.md](../../Trials by Filevine_AI_PRD.md)
- **Issues**: Report at https://github.com/anthropics/trials-by-filevine/issues

## Changelog

### Version 1.0.0 (January 2026)
- Initial API specification
- Complete endpoint documentation
- Authentication and authorization
- Case management
- Juror research and synthesis
- Archetype classification
- Focus group simulations
- Document capture and OCR
- Filevine integration

## License

Proprietary - Filevine, Inc.
