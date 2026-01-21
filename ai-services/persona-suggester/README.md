# Persona Suggester AI Service

AI service that analyzes juror profiles and suggests matching personas with confidence scores and explainability.

## Overview

This service uses Claude 4.5 to:
- Analyze juror research data, questionnaire responses, and voir dire transcripts
- Match jurors to one or more behavioral personas
- Provide confidence scores and detailed rationale
- Generate counterfactual reasoning ("what would change this assessment")
- Cite specific evidence from research artifacts

## Technology Stack

- **Framework:** FastAPI (Python)
- **AI Model:** Claude 4.5 Sonnet (Anthropic API)
- **Language:** Python 3.11+
- **Validation:** Pydantic v2
- **HTTP Client:** httpx (async)

## Architecture

```
API Gateway → Persona Suggester → Claude 4.5 API → Response with structured persona suggestions
```

## Environment Variables

```env
# Service
PORT=8002
ENVIRONMENT=development

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_VERSION=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Database (for persona library lookup)
DATABASE_URL=postgresql://...

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

## API Endpoints

### POST /v1/suggest

Suggests personas for a juror based on their profile.

**Request:**
```json
{
  "juror_id": "uuid",
  "profile": {
    "questionnaire_data": {
      "occupation": "software engineer",
      "education": "bachelor's degree",
      "prior_jury_service": false
    },
    "research_summary": {
      "linkedin": "10+ years in tech, management role...",
      "social_media": "Active on Twitter, posts about tech trends...",
      "donations": "Donated to tech policy organizations..."
    },
    "voir_dire_responses": [
      {
        "question": "What do you do for work?",
        "answer": "I'm a software engineer at a startup..."
      }
    ]
  },
  "available_personas": ["uuid1", "uuid2"],  // Optional filter
  "min_confidence": 0.6  // Optional threshold
}
```

**Response:**
```json
{
  "result": {
    "primary_persona": {
      "persona_id": "uuid",
      "persona_name": "Tech Pragmatist",
      "mapping_type": "primary"
    },
    "secondary_personas": [
      {
        "persona_id": "uuid2",
        "persona_name": "Data-Driven Skeptic",
        "mapping_type": "secondary"
      }
    ]
  },
  "confidence": 0.85,
  "rationale": "Strong indicators of Tech Pragmatist persona based on: (1) Career in software engineering with management experience suggests analytical thinking and process-oriented mindset. (2) Social media activity shows engagement with technical topics and evidence-based reasoning. (3) Questionnaire responses indicate preference for concrete facts over emotional appeals. Secondary persona (Data-Driven Skeptic) suggested due to emphasis on verifiable information in voir dire responses.",
  "sources": [
    {
      "source_type": "linkedin",
      "artifact_id": "uuid",
      "snippet": "10+ years in tech, currently leading a team...",
      "relevance": "Career background indicates analytical mindset"
    },
    {
      "source_type": "voir_dire",
      "segment": "Question 3 response",
      "snippet": "I prefer to see the data before making decisions...",
      "relevance": "Explicit statement of data-driven decision making"
    }
  ],
  "counterfactual": "This assessment would change if: (1) Voir dire responses showed emotional reactions to case themes, suggesting less analytical approach. (2) Social media revealed strong ideological positions that override data-driven thinking. (3) Questionnaire indicated distrust of expert testimony or technical evidence.",
  "model_version": "claude-sonnet-4-5-20250929",
  "latency_ms": 3421
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model": "claude-sonnet-4-5-20250929",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

## Input Processing

The service processes three types of juror data:

1. **Questionnaire Data:** Court-provided juror questionnaire responses
   - Demographics, occupation, education
   - Prior jury service, legal involvement
   - Opinions on case-relevant topics

2. **Research Summary:** AI-generated summaries from research artifacts
   - Professional background (LinkedIn)
   - Social media activity and expressed opinions
   - Political donations and affiliations
   - Public records (PACER, property, news mentions)

3. **Voir Dire Responses:** Transcribed Q&A from jury selection
   - Direct responses to attorney questions
   - Body language notes (if provided)
   - Follow-up clarifications

## Persona Matching Logic

The AI analyzes juror data against persona definitions using:

1. **Signal Detection:** Identifies markers that indicate persona fit
   - Behavioral patterns (decision-making style)
   - Value indicators (what matters to them)
   - Communication style (how they express themselves)
   - Biases and blind spots

2. **Confidence Scoring:** Rates match strength (0.0 - 1.0)
   - High confidence (>0.8): Strong, consistent signals
   - Medium confidence (0.6-0.8): Some signals, needs validation
   - Low confidence (<0.6): Weak or conflicting signals

3. **Multi-Persona Support:** Can assign primary + secondary personas
   - Primary: Best overall match
   - Secondary: Situational or context-dependent traits

## Explainability Features

Every suggestion includes:

1. **Rationale:** Clear explanation of why this persona fits
2. **Sources:** Citations to specific research artifacts or responses
3. **Counterfactual:** What would change the assessment
4. **Confidence:** Numerical score with interpretation

This transparency allows attorneys to:
- Validate AI suggestions against their own judgment
- Understand the reasoning behind recommendations
- Identify gaps in research that reduce confidence
- Make informed decisions about persona assignments

## System Prompt

The service uses a carefully crafted system prompt that:
- Defines each persona with behavioral markers
- Instructs Claude on confidence scoring
- Requires citation of specific evidence
- Enforces structured response format
- Emphasizes nuance and multiple personas when appropriate

## Error Handling

Common error scenarios:

**400 Bad Request**
```json
{
  "error": "invalid_input",
  "message": "Juror profile must include questionnaire_data or research_summary"
}
```

**404 Not Found**
```json
{
  "error": "persona_not_found",
  "message": "Persona ID abc123 not found in library"
}
```

**500 Internal Server Error**
```json
{
  "error": "ai_service_error",
  "message": "Failed to get response from Claude API",
  "details": "Rate limit exceeded"
}
```

## Performance

- **Target latency:** <5 seconds (p95)
- **Typical latency:** 2-4 seconds depending on input size
- **Token usage:** ~2000-3000 tokens per request
- **Concurrent requests:** Handles 10+ concurrent via asyncio

## Caching Strategy

To reduce costs and latency:
- Persona definitions cached in memory (refreshed hourly)
- System prompt cached using Claude's prompt caching feature
- Results cached for 5 minutes (in case of re-request)

## Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Type checking
mypy src/

# Linting
ruff check src/
```

## Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run in development mode (with auto-reload)
uvicorn src.main:app --reload --port 8002

# Run in production mode
uvicorn src.main:app --host 0.0.0.0 --port 8002 --workers 4
```

## Deployment

Deployed to Railway as a containerized Python service.

```bash
# Build Docker image
docker build -t persona-suggester .

# Run locally
docker run -p 8002:8002 --env-file .env persona-suggester
```

## Monitoring

Key metrics to monitor:
- Request count and rate
- Latency (p50, p95, p99)
- Error rate
- Claude API usage (tokens, cost)
- Confidence score distribution
- User acceptance rate (personas accepted vs rejected)

## Integration with Main Application

The Persona Service calls this AI service when:
1. Research completes for a juror
2. User manually requests persona suggestions
3. Voir dire responses are added/updated

The flow:
1. Persona Service → POST /v1/suggest
2. AI Service → Claude API
3. Response stored in `juror_persona_mappings` table with `source=ai_suggested`
4. User can accept, reject, or modify suggestions
5. User decision logged to audit trail

## Best Practices

1. **Always validate inputs** - Garbage in, garbage out
2. **Require minimum data** - Need at least questionnaire OR research summary
3. **Handle partial data gracefully** - Work with what's available
4. **Never guarantee correctness** - AI suggestions are hypotheses
5. **Track user overrides** - Learn from attorney corrections
6. **Monitor confidence distribution** - Flag systemic low confidence
7. **Update prompts based on feedback** - Continuous improvement

## Future Enhancements

- Fine-tuning on historical persona assignments
- Multi-model ensemble for higher accuracy
- Active learning from user feedback
- Persona similarity scoring
- Automatic persona creation from patterns

## Support

For issues or questions, contact the AI services team or see the main project documentation.
