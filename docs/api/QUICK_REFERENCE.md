# API Quick Reference Card

## 🚀 Getting Started

```bash
# Start API server
cd services/api-gateway
npm run dev

# Access Swagger UI
open http://localhost:3001/docs
```

## 🔑 Authentication

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Response
{
  "token": "eyJhbGciOiJIUz...",
  "user": { ... }
}

# Use token
curl http://localhost:3001/api/cases \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Documentation URLs

| Resource | URL |
|----------|-----|
| **Swagger UI (Interactive)** | http://localhost:3001/docs |
| **OpenAPI YAML** | http://localhost:3001/openapi.yaml |
| **OpenAPI JSON** | http://localhost:3001/openapi.json |
| **API Info** | http://localhost:3001 |
| **Health Check** | http://localhost:3001/health |

## 🎯 Common Workflows

### 1. Create Case and Add Juror

```bash
# 1. Create case
curl -X POST http://localhost:3001/api/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smith v. Jones",
    "caseNumber": "2024-CV-001",
    "caseType": "Personal Injury",
    "ourSide": "plaintiff"
  }'

# 2. Add juror (panelId from case response)
curl -X POST http://localhost:3001/api/jurors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "panelId": "PANEL_ID",
    "jurorNumber": "5",
    "firstName": "John",
    "lastName": "Smith",
    "age": 45,
    "occupation": "Engineer"
  }'
```

### 2. Classify Juror Archetype

```bash
curl -X POST http://localhost:3001/api/archetypes/classify/juror \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jurorId": "JUROR_ID",
    "includeResearch": true,
    "caseType": "Personal Injury",
    "ourSide": "plaintiff"
  }'
```

### 3. Run Focus Group Simulation

```bash
curl -X POST http://localhost:3001/api/focus-groups/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE_ID",
    "argumentId": "ARGUMENT_ID",
    "simulationMode": "detailed"
  }'
```

### 4. Deep Research Synthesis

```bash
# 1. Start synthesis
curl -X POST http://localhost:3001/api/candidates/CANDIDATE_ID/synthesize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_context": {
      "case_type": "Personal Injury",
      "key_issues": ["liability", "damages"],
      "client_position": "plaintiff"
    }
  }'

# 2. Poll for status (every 3 seconds)
curl http://localhost:3001/api/candidates/CANDIDATE_ID/synthesis \
  -H "Authorization: Bearer $TOKEN"

# 3. Get profile when complete
curl http://localhost:3001/api/synthesis/PROFILE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 📋 Key Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Register
- `GET /api/auth/me` - Current user

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/:id` - Get case
- `PATCH /api/cases/:id` - Update case

### Jurors
- `GET /api/jurors/panel/:panelId` - List jurors
- `POST /api/jurors` - Create juror
- `GET /api/jurors/:id` - Get juror
- `PATCH /api/jurors/:id` - Update juror

### Archetypes
- `POST /api/archetypes/classify/juror` - Classify juror
- `GET /api/archetypes/panel-analysis/:panelId` - Analyze panel

### Focus Groups
- `POST /api/focus-groups/simulate` - Run simulation
- `POST /api/focus-groups/sessions/:sessionId/roundtable` - Start roundtable

### Synthesis
- `POST /api/candidates/:candidateId/synthesize` - Start synthesis
- `GET /api/candidates/:candidateId/synthesis` - Poll status
- `GET /api/synthesis/:profileId` - Get profile

## 🛠️ Development Tools

### Using Swagger UI

1. Open http://localhost:3001/docs
2. Click "Authorize" button
3. Enter: `Bearer YOUR_JWT_TOKEN`
4. Try out any endpoint

### Using Postman

```bash
# Import OpenAPI spec
1. Open Postman
2. Import → Link → http://localhost:3001/openapi.json
3. Set environment variables:
   - baseUrl: http://localhost:3001
   - token: YOUR_JWT_TOKEN
```

### Using cURL with Environment Variables

```bash
# Save token
export API_TOKEN="YOUR_JWT_TOKEN"
export API_BASE="http://localhost:3001"

# Use in requests
curl $API_BASE/api/cases \
  -H "Authorization: Bearer $API_TOKEN"
```

## 🎨 Response Formats

### Success (200/201)
```json
{
  "case": { ... },
  "message": "Optional success message"
}
```

### Error (4xx/5xx)
```json
{
  "error": "Human-readable error message",
  "statusCode": 400,
  "details": {
    "field": "Validation error"
  }
}
```

## 🔢 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async operation started) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## ⚡ Rate Limits

- **Default**: 100 requests per 15 minutes
- **Headers**:
  - `X-RateLimit-Limit`: Max requests
  - `X-RateLimit-Remaining`: Remaining
  - `X-RateLimit-Reset`: Reset time

## 🎯 10 Behavioral Archetypes

1. **Bootstrapper** - Personal responsibility enforcer (pro-defense)
2. **Crusader** - Systemic thinker (pro-plaintiff vs. corporations)
3. **Scale-Balancer** - Fair-minded evaluator (true swing)
4. **Captain** - Authoritative leader (likely foreperson)
5. **Chameleon** - Compliant follower (adopts majority)
6. **Scarred** - Wounded veteran (experience-driven)
7. **Calculator** - Numbers person (data-focused)
8. **Heart** - Empathic connector (narrative-focused)
9. **Trojan Horse** - Stealth juror (hides biases)
10. **Maverick** - Nullifier (hung jury risk)

## 📊 Archetype Response

```json
{
  "primary": {
    "archetype": "bootstrapper",
    "confidence": 85,
    "description": "Personal responsibility enforcer..."
  },
  "dimensions": {
    "authority_respect": 75,
    "risk_tolerance": 30,
    "empathy_vs_logic": 25,
    "group_vs_individual": 60
  },
  "dangerLevel": {
    "forPlaintiff": "high",
    "forDefense": "low"
  },
  "recommendations": {
    "strategicApproach": "...",
    "voirDireQuestions": [...],
    "causeChallenge": { ... }
  }
}
```

## 🔄 Async Operations

| Operation | Start | Poll | Duration |
|-----------|-------|------|----------|
| Deep Synthesis | POST /candidates/:id/synthesize | GET /candidates/:id/synthesis | 10-60s |
| Roundtable | POST /sessions/:id/roundtable | GET /conversations/:id | 30-120s |
| OCR Processing | POST /captures/:id/process | GET /captures/:id | 5-15s |

**Polling Pattern:**
- Poll every 2-3 seconds
- Check `status` field: `processing`, `complete`, `error`
- Stop when status is `complete` or `error`

## 🔐 Security

- **JWT Token**: Required for all protected endpoints
- **Expiration**: 7 days (default)
- **Multi-Tenancy**: Automatic org filtering via token
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Per IP address

## 💡 Tips

1. **Use Swagger UI** for exploring and testing endpoints
2. **Save your JWT token** in environment variable
3. **Check response headers** for rate limit info
4. **Poll async operations** every 2-3 seconds
5. **Handle errors** with retry logic and exponential backoff
6. **Test locally first** before deploying changes

## 📖 Full Documentation

- **Complete API Spec**: [openapi.yaml](./openapi.yaml)
- **API Guide**: [README.md](./README.md)
- **AI Agent Guide**: [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md)
- **Architecture**: [../../Trials by Filevine_AI_Architecture.md](../../Trials by Filevine_AI_Architecture.md)

## 🆘 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3001

# Check database connection
npx prisma db pull
```

### 401 Unauthorized
- Verify token is valid: https://jwt.io
- Check `Authorization: Bearer TOKEN` header
- Token may be expired (7 day expiration)

### CORS errors
- Add frontend URL to `ALLOWED_ORIGINS`
- Check browser console for specific error

### Rate limited (429)
- Wait for rate limit window to reset
- Check `X-RateLimit-Reset` header

## 🎓 Example Use Cases

### Conversational AI Control
```javascript
// AI agent can parse natural language and call API
User: "Create a case called Smith v. Jones"
Agent: → POST /api/cases { name: "Smith v. Jones", ... }

User: "What archetype is juror #5?"
Agent: → POST /api/archetypes/classify/juror { jurorId: "...", ... }

User: "Test my opening statement"
Agent: → POST /api/focus-groups/simulate { argumentId: "...", ... }
```

### Batch Operations
```bash
# Upload jury list CSV → Extract with OCR → Classify all jurors
1. POST /api/cases/:caseId/captures (upload image)
2. POST /api/captures/:captureId/process (OCR)
3. POST /api/captures/:captureId/confirm (create jurors)
4. Loop: POST /api/archetypes/classify/juror for each
```

### Trial Preparation Workflow
```bash
# Complete case setup → Research jurors → Test arguments
1. POST /api/cases (create case)
2. POST /api/cases/:caseId/facts (add facts)
3. POST /api/cases/:caseId/arguments (create opening)
4. POST /api/jurors (add jurors)
5. POST /api/jurors/:id/search (identity matching)
6. POST /api/candidates/:id/synthesize (deep research)
7. POST /api/archetypes/classify/juror (archetype)
8. POST /api/focus-groups/simulate (test argument)
9. POST /api/cases/:id/generate-questions (voir dire)
```

---

**Pro Tip:** Keep this reference card open while developing with the API!
