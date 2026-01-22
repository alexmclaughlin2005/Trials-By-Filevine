# Railway Deployment Configuration

Configuration files and documentation for deploying Trials by Filevine AI services to Railway.

## Overview

Railway hosts all backend services:
- API Gateway
- Core microservices (Case, Jury Panel, Research, Persona, etc.)
- AI services (Python FastAPI services)
- PostgreSQL database
- Redis cache

## Project Structure on Railway

```
Trials by Filevine AI (Project)
├── PostgreSQL (Plugin)
├── Redis (Plugin)
├── api-gateway (Service)
├── case-service (Service)
├── jury-panel-service (Service)
├── research-service (Service)
├── persona-service (Service)
├── trial-session-service (Service)
├── focus-group-service (Service)
├── auth-service (Service)
├── collaboration-service (Service)
├── notification-service (Service)
├── identity-resolution (Service)
├── research-summarizer (Service)
├── persona-suggester (Service)
├── question-generator (Service)
├── focus-group-engine (Service)
└── trial-insight-engine (Service)
```

## Setup Instructions

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link
```

### 2. Add Database and Redis

In Railway dashboard:
1. Click "New" → "Database" → "Add PostgreSQL"
2. Click "New" → "Database" → "Add Redis"

Railway automatically provisions and provides connection strings.

### 3. Deploy Services

Each service has its own Dockerfile. Deploy services individually:

```bash
# Deploy API Gateway
cd services/api-gateway
railway up

# Deploy other services similarly
cd ../case-service
railway up
```

Or use the monorepo root:

```bash
# Deploy all services
railway up --service api-gateway
railway up --service case-service
# ... repeat for all services
```

## Environment Variables

### Shared Variables (Set at Project Level)

```env
# Database (auto-provisioned by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-provisioned by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.trialforge.ai

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_VERSION=claude-sonnet-4-5-20250929

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info
```

### Service-Specific Variables

Each service also needs:

```env
# Service-specific
PORT=3000
NODE_ENV=production

# Internal service URLs (use Railway's internal networking)
CASE_SERVICE_URL=${{case-service.RAILWAY_PRIVATE_DOMAIN}}
JURY_PANEL_SERVICE_URL=${{jury-panel-service.RAILWAY_PRIVATE_DOMAIN}}
# ... etc
```

## Service Configuration

### Node.js Services

Each Node.js service uses this `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Python Services

Python services use similar configuration:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn src.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Networking

### Internal Service Communication

Railway provides private networking between services:

```typescript
// Use Railway's internal domain for service-to-service calls
const caseServiceUrl = process.env.CASE_SERVICE_URL ||
  'http://case-service.railway.internal:3001';
```

### External Access

Only API Gateway needs public access:
- Set `RAILWAY_PUBLIC_DOMAIN` for API Gateway
- All other services use internal networking only
- Configure custom domain: `api.trialforge.ai` → API Gateway

## Database Migrations

Run Prisma migrations on deploy:

```bash
# Add to deployment script
railway run npm run db:migrate:deploy
```

Or use Railway's build phase:

```dockerfile
# In Dockerfile
RUN npm run db:migrate:deploy
```

## Monitoring

Railway provides:
- Service logs (stdout/stderr)
- Metrics (CPU, memory, network)
- Deployment history
- Health check monitoring

Access logs:

```bash
# View logs for a service
railway logs --service api-gateway

# Follow logs
railway logs --service api-gateway --follow
```

## Scaling

### Vertical Scaling
Upgrade service resources in Railway dashboard:
- Starter: 512MB RAM, 0.25 vCPU
- Pro: 8GB RAM, 8 vCPU

### Horizontal Scaling
For services that need multiple instances:
1. Enable horizontal scaling in service settings
2. Set `RAILWAY_REPLICA_ID` aware load balancing
3. Use Redis for session management

### Database Scaling
- Railway automatically scales PostgreSQL
- Monitor connection pool usage
- Use PgBouncer for connection pooling if needed

## Cost Optimization

1. **Resource Right-Sizing**
   - Start with smaller instances
   - Monitor usage and scale up as needed
   - AI services may need more resources

2. **Database Connection Pooling**
   - Use Prisma connection pooling
   - Limit max connections per service

3. **Caching**
   - Use Redis for frequently accessed data
   - Cache persona library in memory
   - Cache AI responses when appropriate

4. **Idle Timeout**
   - Development services can have longer idle timeout
   - Production services: always on

## Backup and Recovery

### Database Backups

Railway automatically backs up PostgreSQL:
- Daily automated backups
- 7-day retention
- Manual backup option

Restore from backup:
```bash
railway backup restore <backup-id>
```

### Application Rollback

Railway keeps deployment history:
1. Go to service deployments
2. Select previous deployment
3. Click "Redeploy"

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy-railway.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy Services
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway up --service api-gateway
          railway up --service case-service
          # ... deploy other services
```

### Deployment Strategy

1. **Staging Environment**
   - Create separate Railway project for staging
   - Deploy to staging first
   - Run integration tests
   - Deploy to production

2. **Blue/Green Deployment**
   - Deploy new version alongside old
   - Switch traffic when ready
   - Instant rollback if issues

## Security

1. **Environment Variables**
   - Never commit secrets
   - Use Railway's environment variable management
   - Separate dev/staging/prod environments

2. **Network Security**
   - Use internal networking for service-to-service
   - Only expose API Gateway publicly
   - Enable Railway's DDoS protection

3. **Database Security**
   - Railway PostgreSQL includes encryption at rest
   - SSL connections required
   - Regular security updates

## Troubleshooting

### Service Won't Start

Check logs:
```bash
railway logs --service <service-name>
```

Common issues:
- Missing environment variables
- Database connection failed
- Port already in use

### Database Connection Issues

```bash
# Test database connection
railway run psql $DATABASE_URL
```

### High Memory Usage

```bash
# Check service metrics
railway metrics --service <service-name>
```

Consider:
- Memory leaks (use heap snapshots)
- Too many database connections (add pooling)
- Large file processing (stream instead)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Team contact: devops@trialforge.ai
