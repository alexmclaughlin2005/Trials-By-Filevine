# Quick Start Guide

## Errors You're Seeing

1. ❌ `GET http://localhost:3001/api/jurors/... net::ERR_CONNECTION_REFUSED` - API Gateway not running
2. ❌ `WebSocket connection to 'ws://localhost:3003/socket.io/?EIO=4&transport=websocket' failed` - Collaboration Service not running

## Solution: Start All Services

You need to start the backend services. Here's how:

### Option 1: Start Services in Separate Terminals

**Terminal 1 - Redis (Required):**
```bash
redis-server
# Or if installed via Homebrew:
brew services start redis
```

**Terminal 2 - API Gateway:**
```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/services/api-gateway"
npm run dev
```

**Terminal 3 - Collaboration Service:**
```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/services/collaboration-service"
npm run dev
```

**Terminal 4 - Web App (Already Running):**
```bash
# This is already running on http://localhost:3000
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/apps/web"
npm run dev
```

### Option 2: Check if Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

If Redis isn't installed:
```bash
brew install redis
brew services start redis
```

### Quick Checklist

Once all services are running, verify:

- [ ] Redis: `redis-cli ping` returns `PONG`
- [ ] API Gateway: http://localhost:3001/health should return `{"status":"ok"}`
- [ ] Collaboration Service: http://localhost:3003/health should return `{"status":"ok"}`
- [ ] Web App: http://localhost:3000 (you're already here)

### After Starting Services

1. **Refresh your browser** (the web app at localhost:3000)
2. **Check for "Live" badge** in the case detail page header
3. **Try the API** - the juror/case data should load

---

## Environment Setup (One-Time)

If this is your first time running, create the `.env.local` file:

```bash
cd apps/web
cp .env.example .env.local
```

The defaults should work for local development:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_COLLABORATION_SERVICE_URL=http://localhost:3003
NODE_ENV=development
```

---

## Expected Console Output

When everything is running correctly:

**API Gateway (Terminal 2):**
```
🚀 API Gateway running on http://0.0.0.0:3001
```

**Collaboration Service (Terminal 3):**
```
Collaboration Service running on http://0.0.0.0:3003
Starting queue processor...
```

**Browser Console:**
```
Socket connected
[No errors about connection refused]
```

---

## Still Having Issues?

### Check Ports

Make sure ports aren't already in use:
```bash
lsof -i :3001  # API Gateway
lsof -i :3003  # Collaboration Service
lsof -i :6379  # Redis
```

### Check Dependencies

Make sure you've installed dependencies:
```bash
# API Gateway
cd services/api-gateway && npm install

# Collaboration Service
cd services/collaboration-service && npm install
```

### Database

If you see database errors, make sure Prisma is set up:
```bash
cd packages/database
npx prisma generate
npx prisma db push
```

---

## What's Next?

Once all services are running and the page loads without errors:

1. Navigate to a case
2. Look for "Live" badge in top-right corner
3. Try adding a fact, argument, or witness
4. Open the same case in an incognito window - you should see "2 people viewing"

🎉 That means real-time collaboration is working!
