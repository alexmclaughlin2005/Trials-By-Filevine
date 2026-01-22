# Railway Environment Variables Configuration

This document lists all environment variables that need to be set for each Railway service.

## 📋 API Gateway Service

Required for the API Gateway to function properly:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Authentication
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration (CRITICAL for Vercel frontend)
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://*.vercel.app

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m

# Anthropic API (for AI features)
ANTHROPIC_API_KEY=sk-ant-your-api-key

# Server Configuration (Railway sets PORT automatically)
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

### How to Set:
1. Go to Railway Dashboard → api-gateway service → Variables tab
2. Add each variable above
3. **Most Important**: Set `ALLOWED_ORIGINS` to your Vercel domain

---

## 📋 Notification Service

Required for notifications to function:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Authentication (must match API Gateway)
JWT_SECRET=your-jwt-secret-change-in-production

# Redis Configuration (Railway provides these automatically if Redis is connected)
REDIS_URL=redis://default:password@host:port
# OR individually:
REDISHOST=your-redis-host.railway.app
REDISPORT=6379
REDISPASSWORD=your-redis-password

# Email Service (Resend.com API key - optional)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=notifications@yourdomain.com

# Server Configuration
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

### How to Set:
1. Go to Railway Dashboard → notification-service → Variables tab
2. Add each variable above
3. **Note**: If you connect Railway's Redis plugin, it will auto-populate Redis variables

---

## 📋 Collaboration Service

Required for real-time collaboration features:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Authentication (must match API Gateway)
JWT_SECRET=your-jwt-secret-change-in-production

# Redis Configuration
REDIS_URL=redis://default:password@host:port
# OR individually:
REDISHOST=your-redis-host.railway.app
REDISPORT=6379
REDISPASSWORD=your-redis-password

# CORS Configuration (for WebSocket connections from Vercel)
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://*.vercel.app

# Server Configuration
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

### How to Set:
1. Go to Railway Dashboard → collaboration-service → Variables tab
2. Add each variable above
3. **Important**: Set `ALLOWED_ORIGINS` for WebSocket CORS

---

## 📋 Database (PostgreSQL)

Railway automatically provisions PostgreSQL with these variables:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-postgres-host.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=generated-password
PGDATABASE=railway
```

### How to Use:
1. Add PostgreSQL plugin to your Railway project
2. Connect it to each service that needs database access
3. Railway will automatically inject `DATABASE_URL` into connected services

---

## 🔄 Shared Variables

These should be **identical** across all services:

| Variable | Used By | Description |
|----------|---------|-------------|
| `DATABASE_URL` | All services | PostgreSQL connection string |
| `JWT_SECRET` | API Gateway, Notification, Collaboration | Must be the same for JWT verification |
| `REDISHOST`, `REDISPORT`, `REDISPASSWORD` | Notification, Collaboration | Redis connection details |
| `ALLOWED_ORIGINS` | API Gateway, Collaboration | Your Vercel frontend URL |

---

## 🎯 Quick Setup for Shared Variables

### Option 1: Shared Variables (Recommended)

Railway supports shared variables across services:

1. Go to your Railway project → Settings → Shared Variables
2. Add these shared variables:
   ```
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://*.vercel.app
   ```
3. Each service will automatically have access to these

### Option 2: Manual Copy

Copy the same values to each service's Variables tab:
- `JWT_SECRET` → API Gateway, Notification Service, Collaboration Service
- `ALLOWED_ORIGINS` → API Gateway, Collaboration Service

---

## 🔐 Security Best Practices

### Generate Strong Secrets

```bash
# Generate JWT_SECRET (use one of these)
openssl rand -base64 32
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate NEXTAUTH_SECRET (for Vercel)
openssl rand -base64 32
```

### Don't Commit Secrets

- Never commit `.env` files to Git
- Use Railway's secret management
- Use Vercel's environment variables dashboard
- Keep production secrets different from development

### Use Railway's Secret References

Railway supports referencing other services' variables:

```bash
# Reference database URL from PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Reference Redis URL from Redis service
REDIS_URL=${{Redis.REDIS_URL}}
```

---

## 📊 Environment Variable Checklist

Before deploying:

### API Gateway
- [ ] `DATABASE_URL` is set (auto-set if PostgreSQL connected)
- [ ] `JWT_SECRET` is set with a strong random value
- [ ] `ALLOWED_ORIGINS` includes your Vercel domain
- [ ] `ANTHROPIC_API_KEY` is set for AI features

### Notification Service
- [ ] `DATABASE_URL` is set
- [ ] `JWT_SECRET` matches API Gateway's value
- [ ] `REDISHOST`, `REDISPORT`, `REDISPASSWORD` are set (or `REDIS_URL`)
- [ ] `RESEND_API_KEY` is set (optional, for email)

### Collaboration Service
- [ ] `DATABASE_URL` is set
- [ ] `JWT_SECRET` matches API Gateway's value
- [ ] `REDISHOST`, `REDISPORT`, `REDISPASSWORD` are set (or `REDIS_URL`)
- [ ] `ALLOWED_ORIGINS` includes your Vercel domain

### All Services
- [ ] All services are connected to PostgreSQL plugin
- [ ] Redis services are connected to Redis plugin
- [ ] `NODE_ENV=production` is set
- [ ] `HOST=0.0.0.0` is set (allows Railway to route traffic)

---

## 🚀 After Configuration

1. **Restart all services** after setting environment variables
2. **Check logs** for any missing variable errors:
   ```bash
   railway logs --service api-gateway
   railway logs --service notification-service
   railway logs --service collaboration-service
   ```
3. **Test endpoints** using curl or Postman:
   ```bash
   curl https://your-api-gateway.railway.app/health
   ```
4. **Monitor deployments** in Railway dashboard

---

## 🆘 Troubleshooting

### Service crashes on startup

**Check logs for missing environment variables:**
```bash
railway logs --service api-gateway
```

**Common errors:**
- `DATABASE_URL is required` → Connect PostgreSQL plugin
- `JWT_SECRET is required` → Add JWT_SECRET variable
- `Cannot connect to Redis` → Connect Redis plugin or set REDIS_URL

### CORS errors from Vercel

**Verify ALLOWED_ORIGINS:**
1. Check API Gateway variables include Vercel domain
2. Make sure format is: `https://your-app.vercel.app,https://*.vercel.app`
3. No trailing slashes in URLs
4. Restart service after changing

### Services can't talk to each other

**Use Railway's internal networking:**
- Services in the same project can communicate via private networking
- Use service names: `http://api-gateway.railway.internal:3001`
- Or use public URLs: `https://api-gateway.railway.app`
