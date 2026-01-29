# Environment Variables

This document lists all environment variables used across the Juries by Filevine platform.

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Used by: All services

### Authentication
- `AUTH0_DOMAIN` - Auth0 domain (if using Auth0)
- `AUTH0_CLIENT_ID` - Auth0 client ID
- `AUTH0_CLIENT_SECRET` - Auth0 client secret

### AI Services
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
  - Used by: API Gateway (all AI services)
  - Get from: https://console.anthropic.com/

- `OPENAI_API_KEY` - OpenAI API key (for DALL-E image generation)
  - Used by: `scripts/generate-persona-headshots.ts`
  - Get from: https://platform.openai.com/api-keys
  - Required for: Generating persona headshot images

### Redis (Optional)
- `REDIS_URL` - Redis connection string
  - Format: `redis://host:port` or `rediss://host:port` (SSL)
  - Used by: Collaboration service, caching

## Service-Specific Variables

### API Gateway
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret for JWT token signing

### Prompt Service
- `PROMPT_SERVICE_PORT` - Port for prompt service (default: 8080)

## Development vs Production

### Development
Create a `.env` file in the project root with your local values:
```bash
DATABASE_URL=postgresql://localhost:5432/juries_dev
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Production (Railway/Vercel)
Set environment variables in your deployment platform:
- Railway: Project Settings → Variables
- Vercel: Project Settings → Environment Variables

## Script-Specific Variables

### Persona Headshot Generation
When running `npm run generate-persona-headshots`:
- `OPENAI_API_KEY` (required) - OpenAI API key for DALL-E
- `UPDATE_JSON` (optional) - Set to `"true"` to update JSON files with image URLs

Example:
```bash
export OPENAI_API_KEY=sk-...
UPDATE_JSON=true npm run generate-persona-headshots
```

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` as a template (without real values)
- Rotate API keys regularly
- Use different keys for development and production
- Store production keys securely (use deployment platform secrets)
