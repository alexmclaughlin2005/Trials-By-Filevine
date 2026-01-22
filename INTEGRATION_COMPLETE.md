# ✅ API Endpoints & WebSocket Integration Complete

**Date:** 2026-01-21
**Status:** Complete & Ready for Testing

## Summary

Successfully implemented:
1. ✅ **API Endpoints** for Facts, Arguments, and Witnesses with full CRUD
2. ✅ **WebSocket Integration** for real-time collaboration
3. ✅ **Presence Tracking** showing active viewers
4. ✅ **Connection Status** indicators

---

## Part 1: API Endpoints

### Files Created

#### Facts API (`services/api-gateway/src/routes/case-facts.ts`)
```
POST   /api/cases/:caseId/facts
PUT    /api/cases/:caseId/facts/:factId
DELETE /api/cases/:caseId/facts/:factId
PATCH  /api/cases/:caseId/facts/reorder
```

**Features:**
- Create facts with auto-incrementing sortOrder
- Update existing facts
- Delete facts with cascade protection
- Reorder facts via drag-and-drop
- Organization-level access control
- Fact types: background, disputed, undisputed

#### Arguments API (`services/api-gateway/src/routes/case-arguments.ts`)
```
POST   /api/cases/:caseId/arguments
PUT    /api/cases/:caseId/arguments/:argumentId  (Creates new version)
DELETE /api/cases/:caseId/arguments/:argumentId
GET    /api/cases/:caseId/arguments/:argumentId/versions
```

**Features:**
- Create arguments with version 1
- Update creates new version (marks old as !isCurrent)
- Version history tracking
- Change notes per version
- Delete removes all versions
- Get full version history
- Argument types: opening, closing, theme, rebuttal

#### Witnesses API (`services/api-gateway/src/routes/case-witnesses.ts`)
```
POST   /api/cases/:caseId/witnesses
PUT    /api/cases/:caseId/witnesses/:witnessId
DELETE /api/cases/:caseId/witnesses/:witnessId
PATCH  /api/cases/:caseId/witnesses/reorder
```

**Features:**
- Create witnesses with auto-incrementing sortOrder
- Update witness information
- Delete witnesses
- Reorder witnesses
- Witness roles: fact, expert, character
- Affiliations: plaintiff, defendant, neutral

### Server Configuration

**Updated:** `services/api-gateway/src/server.ts`

Added route registrations:
```typescript
await server.register(caseFactsRoutes, { prefix: '/api/cases' });
await server.register(caseArgumentsRoutes, { prefix: '/api/cases' });
await server.register(caseWitnessesRoutes, { prefix: '/api/cases' });
```

---

## Part 2: WebSocket Integration

### Frontend Files Created

#### 1. Socket Client (`apps/web/lib/socket-client.ts`)
- Singleton socket connection manager
- Auto-reconnection logic
- Heartbeat every 30 seconds
- Connection state management

#### 2. Collaboration Context (`apps/web/contexts/collaboration-context.tsx`)
- React Context for WebSocket state
- Connection status tracking
- Active viewers list
- Room join/leave functions
- Typing indicators
- Event subscription system

**API:**
```typescript
const {
  socket,
  isConnected,
  activeViewers,
  joinRoom,
  leaveRoom,
  startTyping,
  stopTyping,
  onCollaborationEvent
} = useCollaboration();
```

#### 3. Case Collaboration Hook (`apps/web/hooks/use-case-collaboration.ts`)
- Auto joins case room on mount
- Filters viewers for current case
- Listens for case-specific events
- Returns case-specific data

**API:**
```typescript
const {
  isConnected,
  activeViewers,
  viewerCount
} = useCaseCollaboration(caseId);
```

#### 4. UI Components

**Active Viewers** (`apps/web/components/collaboration/active-viewers.tsx`)
- Shows viewer count with animated indicator
- "N people viewing" badge
- Pulsing green dot animation
- Only shows when viewers present

**Connection Status** (`apps/web/components/collaboration/connection-status.tsx`)
- "Live" indicator when connected
- "Offline" indicator when disconnected
- Color-coded (green/red)
- WiFi icon visual

### Integration

**Updated:** `apps/web/components/providers.tsx`

Wrapped app with CollaborationProvider:
```typescript
<AuthProvider>
  <CollaborationWrapper>
    {children}
  </CollaborationWrapper>
</AuthProvider>
```

**Updated:** `apps/web/app/(auth)/cases/[id]/page-enhanced.tsx`

Added collaboration to case page:
```typescript
const { isConnected, viewerCount } = useCaseCollaboration(caseId);

// In header:
<ConnectionStatus isConnected={isConnected} />
<ActiveViewers count={viewerCount} isConnected={isConnected} />
```

### Environment Configuration

**Created:** `apps/web/.env.example`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_COLLABORATION_SERVICE_URL=http://localhost:3003
NODE_ENV=development
```

**Required:** Create `.env.local`:
```bash
cp apps/web/.env.example apps/web/.env.local
```

---

## How It Works

### Real-Time Collaboration Flow

```
1. User Opens Case Page
   ↓
2. useCaseCollaboration Hook Activates
   ↓
3. Socket Emits: join:room { resourceType: 'case', resourceId: caseId }
   ↓
4. Collaboration Service:
   - Adds user to room
   - Broadcasts user:joined to other viewers
   - Sends room:viewers with current viewer list
   ↓
5. Frontend Receives Events:
   - Updates activeViewers state
   - Shows "N people viewing" badge
   - Displays "Live" connection status
   ↓
6. User Leaves Page
   ↓
7. Socket Emits: leave:room
   ↓
8. Collaboration Service:
   - Removes user from room
   - Broadcasts user:left to others
```

### Event Types

**Outgoing (Client → Server):**
- `join:room` - Join a resource room
- `leave:room` - Leave a resource room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing
- `heartbeat` - Keep connection alive

**Incoming (Server → Client):**
- `user:joined` - Someone joined room
- `user:left` - Someone left room
- `room:viewers` - Current viewer list
- `typing:indicator` - Typing status changed
- `collaboration:event` - General collaboration event
- `notification:created` - New notification

---

## Testing Guide

### 1. Start Services

**Terminal 1 - API Gateway:**
```bash
cd services/api-gateway
npm run dev
# Should run on http://localhost:3001
```

**Terminal 2 - Collaboration Service:**
```bash
cd services/collaboration-service
npm run dev
# Should run on http://localhost:3003
```

**Terminal 3 - Notification Service (Optional):**
```bash
cd services/notification-service
npm run dev
# Should run on http://localhost:3004
```

**Terminal 4 - Web App:**
```bash
cd apps/web
npm run dev
# Should run on http://localhost:3000
```

**Terminal 5 - Redis:**
```bash
redis-server
# Or: brew services start redis
```

### 2. Test API Endpoints

**Create a Fact:**
```bash
curl -X POST http://localhost:3001/api/cases/YOUR_CASE_ID/facts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "The accident occurred at 3:45 PM",
    "factType": "undisputed",
    "source": "Police Report"
  }'
```

**Update a Fact:**
```bash
curl -X PUT http://localhost:3001/api/cases/YOUR_CASE_ID/facts/FACT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "The accident occurred at 3:45 PM on January 15, 2024",
    "factType": "undisputed"
  }'
```

**Create an Argument (with versioning):**
```bash
curl -X POST http://localhost:3001/api/cases/YOUR_CASE_ID/arguments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Negligence Was Clear",
    "content": "The evidence shows...",
    "argumentType": "opening"
  }'
```

**Update Argument (creates v2):**
```bash
curl -X PUT http://localhost:3001/api/cases/YOUR_CASE_ID/arguments/ARG_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Negligence Was Clear",
    "content": "The overwhelming evidence demonstrates...",
    "argumentType": "opening",
    "changeNotes": "Strengthened language based on new evidence"
  }'
```

**Create a Witness:**
```bash
curl -X POST http://localhost:3001/api/cases/YOUR_CASE_ID/witnesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "role": "expert",
    "affiliation": "plaintiff",
    "summary": "Medical expert with 20 years experience",
    "directOutline": "1. Establish credentials\n2. Explain injuries",
    "crossOutline": "1. Question methodology\n2. Prior testimony"
  }'
```

### 3. Test WebSocket Connection

**Option A: Browser Console**
```javascript
// Open case page in browser
// Open DevTools Console
// Check for connection:
console.log('Socket connected');

// View active connection:
// Look for "Live" badge in header
// Open page in incognito window - should show "2 people viewing"
```

**Option B: wscat**
```bash
npm install -g wscat

wscat -c ws://localhost:3003 \
  -H "authorization: Bearer YOUR_JWT_TOKEN"

# Once connected:
> {"type":"join:room","data":{"resourceType":"case","resourceId":"case-123"}}
```

### 4. Test Real-Time Collaboration

1. **Open case page in two browsers** (or incognito + normal)
2. **Watch for:**
   - "Live" connection status in both
   - "2 people viewing" badge appears
   - When one user leaves, badge updates to "1 person viewing"

3. **Test CRUD operations:**
   - Add a fact in browser 1
   - Browser 2 should see it immediately (React Query invalidation)
   - Edit an argument in browser 2
   - Browser 1 should see version update

---

## Troubleshooting

### WebSocket Not Connecting

**Check:**
1. Collaboration service running on port 3003
2. Redis running
3. `.env.local` has correct `NEXT_PUBLIC_COLLABORATION_SERVICE_URL`
4. JWT token is valid
5. Browser console for WebSocket errors

**Fix:**
```bash
# Check collaboration service logs
cd services/collaboration-service
npm run dev

# Check Redis
redis-cli ping
# Should return: PONG

# Check environment
cat apps/web/.env.local
```

### API Endpoints 404

**Check:**
1. API Gateway running on port 3001
2. Routes registered in server.ts
3. Correct URL format: `/api/cases/:caseId/facts`

**Fix:**
```bash
# Restart API Gateway
cd services/api-gateway
npm run dev

# Check routes
curl http://localhost:3001/health
```

### "No viewers" always showing

**Check:**
1. WebSocket connected (look for "Live" badge)
2. Room join happening (check browser console)
3. User authentication working

**Debug:**
```typescript
// In useCaseCollaboration hook, add:
console.log('Active viewers:', activeViewers);
console.log('Is connected:', isConnected);
console.log('Case ID:', caseId);
```

---

## Next Steps

### Immediate

1. **Activate Enhanced UI:**
   ```bash
   cd apps/web/app/(auth)/cases/[id]
   mv page.tsx page-original.tsx
   mv page-enhanced.tsx page.tsx
   ```

2. **Test in Browser:**
   - Navigate to a case
   - Check for "Live" badge
   - Add/edit facts, arguments, witnesses
   - Open in second browser to test collaboration

### Optional Enhancements

3. **Add Typing Indicators:**
   - Hook into form inputs
   - Call `startTyping()` on focus
   - Call `stopTyping()` on blur or submit
   - Display "User is typing..." message

4. **Add Real-Time Notifications:**
   - Subscribe to `notification:created` events
   - Show toast notifications
   - Badge count in sidebar

5. **Add Optimistic Updates:**
   - Update UI immediately on mutations
   - Revert if server fails
   - Show loading states

6. **Add Conflict Resolution:**
   - Detect concurrent edits
   - Show warning dialog
   - Offer merge options

---

## Production Checklist

Before deploying to production:

- [ ] Set proper JWT secrets
- [ ] Configure CORS for production domains
- [ ] Set up Redis on Railway/production
- [ ] Configure WebSocket load balancing
- [ ] Add rate limiting to API endpoints
- [ ] Add monitoring and error tracking
- [ ] Test with multiple concurrent users
- [ ] Add database connection pooling
- [ ] Configure proper logging
- [ ] Set up health checks
- [ ] Add WebSocket reconnection limits
- [ ] Test mobile browsers
- [ ] Add fallback for WebSocket failures
- [ ] Document deployment process

---

## File Summary

### Backend (API Gateway)
- ✅ `services/api-gateway/src/routes/case-facts.ts` (127 lines)
- ✅ `services/api-gateway/src/routes/case-arguments.ts` (143 lines)
- ✅ `services/api-gateway/src/routes/case-witnesses.ts` (127 lines)
- ✅ `services/api-gateway/src/server.ts` (Updated)

### Frontend (Web App)
- ✅ `apps/web/lib/socket-client.ts` (43 lines)
- ✅ `apps/web/contexts/collaboration-context.tsx` (170 lines)
- ✅ `apps/web/hooks/use-case-collaboration.ts` (60 lines)
- ✅ `apps/web/components/collaboration/active-viewers.tsx` (32 lines)
- ✅ `apps/web/components/collaboration/connection-status.tsx` (28 lines)
- ✅ `apps/web/components/providers.tsx` (Updated)
- ✅ `apps/web/app/(auth)/cases/[id]/page-enhanced.tsx` (Updated)
- ✅ `apps/web/.env.example` (New)

### Documentation
- ✅ `COLLABORATION_NOTIFICATION_SETUP.md`
- ✅ `PHASE_3_CASE_MANAGEMENT_UI.md`
- ✅ `INTEGRATION_COMPLETE.md` (This file)

---

**Status:** ✅ Complete & Ready for Testing

**Total Files Created/Modified:** 14 files

**Total Lines of Code:** ~750 lines

**Estimated Testing Time:** 30-60 minutes

**Next Phase:** Phase 4 - Juror Research UI Enhancements (bulk import, status tracking)
