# Feature Flags System - V2 Rollout Control

**Created:** 2026-01-28
**Purpose:** Safe rollout control for V2 persona features

---

## Overview

The feature flag system allows you to safely enable/disable V2 persona features in production without code deployments. This provides:

- **Safe Rollout:** Enable V2 features gradually
- **Instant Rollback:** Disable features if issues arise
- **A/B Testing:** Compare V1 vs V2 performance
- **Organization-Specific:** Can be enabled per organization (future)

---

## Available Feature Flags

### 1. `personas_v2`
**Name:** Persona V2 Data
**Description:** Use enhanced V2 persona data with instant reads, danger levels, and strike/keep strategies
**Affects:**
- Persona Suggester service
- All persona displays in UI
- Juror-persona matching

### 2. `focus_groups_v2`
**Name:** Focus Groups V2
**Description:** Use V2 persona data in focus group simulations with realistic language patterns
**Affects:**
- Focus Group Engine service
- Roundtable deliberations
- Persona reactions and behavior

### 3. `voir_dire_v2`
**Name:** Voir Dire Generator V2
**Description:** Enable V2 voir dire question generation using "Phrases You'll Hear" data
**Affects:**
- Voir Dire Generator service
- Question generation endpoint
- Expected responses and red flags

---

## How to Use

### Access Feature Flags

1. Navigate to `/admin` page
2. Scroll to **Feature Flags (V2 Rollout Control)** section
3. If no flags exist, click **"Initialize Feature Flags"**

### Toggle a Flag

1. Find the flag you want to toggle
2. Click **"Enable"** or **"Disable"** button
3. Changes take effect immediately (within 60 seconds)
4. No code deployment needed!

### Monitor Impact

After enabling a flag:
- Check `/admin/ai-testing` to test the feature
- Monitor application logs for errors
- Review user feedback
- Check API response times

### Rollback if Needed

If issues arise:
1. Click **"Disable"** button
2. System reverts to V1 behavior within 60 seconds
3. No data loss or service interruption

---

## Technical Implementation

### Database Schema

```sql
CREATE TABLE "feature_flags" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN DEFAULT false,
  "organization_id" TEXT, -- NULL = global flag
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX ON "feature_flags" ("key", "organization_id");
CREATE INDEX ON "feature_flags" ("key");
```

### API Endpoints

**Get All Flags:**
```typescript
GET /api/admin/feature-flags
Response: { flags: FeatureFlag[] }
```

**Toggle a Flag:**
```typescript
PUT /api/admin/feature-flags/:key
Body: { enabled: boolean }
Response: { flag: FeatureFlag }
```

**Seed Default Flags:**
```typescript
POST /api/admin/seed-feature-flags
Response: { success: boolean, flags: FeatureFlag[] }
```

### Checking Flags in Code

```typescript
import { isFeatureEnabled, FeatureFlags } from '../utils/feature-flags';

// In your route handler
const useV2Personas = await isFeatureEnabled(
  server.prisma,
  FeatureFlags.PERSONAS_V2,
  organizationId // optional
);

if (useV2Personas) {
  // Use V2 logic
} else {
  // Use V1 logic (fallback)
}
```

### Caching Strategy

- **In-Memory Cache:** Flags cached for 60 seconds
- **Auto-Refresh:** Cache refreshes on toggle
- **Low Overhead:** No database hit on most requests
- **Fast Lookups:** <1ms lookup time

---

## Migration Guide

### Step 1: Run Database Migration

```bash
cd packages/database
npx prisma migrate dev --name add_feature_flags
npx prisma generate
```

### Step 2: Seed Feature Flags

```bash
# Via admin UI
1. Go to /admin
2. Click "Initialize Feature Flags"

# Or via API
curl -X POST http://localhost:3001/api/admin/seed-feature-flags
```

### Step 3: Test in Development

```bash
# Enable a flag
curl -X PUT http://localhost:3001/api/admin/feature-flags/personas_v2 \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Test the feature
# Go to /admin/ai-testing and verify V2 data is used
```

### Step 4: Deploy to Production

```bash
# 1. Deploy code with feature flag checks
git push origin main

# 2. Run migration on production
# (Railway auto-runs migrations)

# 3. Seed flags via admin UI
# Go to https://your-app.com/admin
# Click "Initialize Feature Flags"

# 4. Enable flags one at a time
# Test each flag before enabling the next
```

---

## Rollout Strategy (Recommended)

### Phase 1: Testing (Week 1)
- ✅ Deploy code with flags disabled
- ✅ Seed feature flags in production
- ✅ Test via `/admin/ai-testing` page
- ✅ Verify V2 data loads correctly

### Phase 2: Internal Testing (Week 2)
- Enable `personas_v2` flag
- Test with internal team
- Monitor logs and performance
- Gather feedback

### Phase 3: Limited Rollout (Week 3)
- Enable `voir_dire_v2` flag
- Test with select users
- Monitor API response times
- Check for errors

### Phase 4: Full Rollout (Week 4)
- Enable `focus_groups_v2` flag
- All V2 features enabled
- Monitor system health
- Collect user feedback

### Phase 5: Cleanup (Week 5+)
- Remove V1 code paths
- Remove feature flag checks
- V2 becomes default
- Archive old V1 personas

---

## Monitoring & Alerts

### Key Metrics to Watch

1. **API Response Times**
   - Persona Suggester: <5s expected
   - Voir Dire Generator: <8s expected
   - Focus Groups: <10s expected

2. **Error Rates**
   - Target: <1% errors
   - Alert if >5% errors in 5 minutes

3. **Cache Hit Rate**
   - Target: >95% cache hits
   - 60-second TTL should cover most requests

4. **User Feedback**
   - Track completion rates
   - Monitor support tickets
   - Collect qualitative feedback

### Logging

Check logs for feature flag usage:
```bash
# Backend logs
tail -f services/api-gateway/logs/app.log | grep "feature flag"

# Look for:
# - "Feature flag toggled: personas_v2 = true"
# - "Using V2 personas (flag enabled)"
# - "Falling back to V1 (flag disabled)"
```

---

## Troubleshooting

### Flag Changes Not Taking Effect

**Problem:** Toggled flag but behavior hasn't changed
**Solution:**
1. Wait 60 seconds for cache to expire
2. Check backend logs for cache refresh
3. Verify database was updated:
   ```sql
   SELECT * FROM feature_flags WHERE key = 'personas_v2';
   ```

### All Flags Disabled After Deployment

**Problem:** Flags reset to disabled state
**Solution:**
- Feature flags persist in database
- If migration was reset, run seed command again
- Check DATABASE_URL is pointing to correct database

### Performance Degradation

**Problem:** System slow after enabling V2 flags
**Solution:**
1. Check Claude API rate limits
2. Verify V2 personas have all fields populated
3. Monitor token usage (V2 uses more tokens)
4. Consider disabling flag temporarily

### Inconsistent Behavior

**Problem:** Some requests use V2, others use V1
**Solution:**
- This is expected during 60-second cache window
- Wait for full cache refresh
- All requests should be consistent after 60s

---

## Future Enhancements

### Organization-Specific Flags
```typescript
// Enable V2 only for specific organizations
await isFeatureEnabled(
  prisma,
  FeatureFlags.PERSONAS_V2,
  'org-123' // organization ID
);
```

### Percentage Rollout
```typescript
// Enable for 10% of users
{
  key: 'personas_v2',
  enabled: true,
  rollout_percentage: 10 // 10% of requests
}
```

### Scheduled Rollout
```typescript
// Enable automatically at specific time
{
  key: 'personas_v2',
  enabled: false,
  scheduled_enable_at: '2026-02-01T00:00:00Z'
}
```

---

## Security Considerations

### Authentication
- Feature flag endpoints require authentication
- Only admin users should access `/admin` page
- Consider adding role-based permissions

### Audit Log
```typescript
// Log all flag changes
{
  action: 'feature_flag_toggled',
  flag_key: 'personas_v2',
  old_value: false,
  new_value: true,
  changed_by: 'user@example.com',
  timestamp: '2026-01-28T12:00:00Z'
}
```

---

## Summary

Feature flags provide **safe, controlled rollout** of V2 persona features:

✅ **No Code Deployments:** Toggle features via admin UI
✅ **Instant Rollback:** Disable if issues arise
✅ **Zero Downtime:** Changes take effect within 60s
✅ **Gradual Rollout:** Enable one feature at a time
✅ **A/B Testing:** Compare V1 vs V2 performance

**Next Steps:**
1. Run database migration
2. Seed feature flags in production
3. Test via `/admin/ai-testing`
4. Enable flags gradually
5. Monitor and iterate

---

For questions or issues, check:
- [Phase 4 Documentation](./PHASE_4_AI_SERVICES_V2.md)
- [AI Testing Guide](./AI_TESTING_GUIDE.md)
- Backend logs: `services/api-gateway/logs/`
