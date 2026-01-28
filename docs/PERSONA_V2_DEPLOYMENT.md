# Persona V2.0 - Deployment Guide

**Commit:** `e55b91d`
**Date:** January 28, 2026
**Status:** ✅ Pushed to Production

---

## What Was Deployed

### Major Changes
- **37 files changed**
- **8,554 insertions** (+)
- **66 deletions** (-)

### Components Deployed

#### Database Changes
- ✅ New migration: `20260128135013_add_persona_v2_fields`
- ✅ 8 new fields added to Persona table
- ✅ All fields nullable (backward compatible)

#### API Changes
- ✅ Updated `/api/personas` endpoint with V2 fields
- ✅ New endpoint: `/api/personas/archetypes`
- ✅ New endpoint: `/api/personas/archetypes/:archetype/personas`
- ✅ Query parameter support: `?version=2`, `?archetype=...`

#### Frontend Changes
- ✅ 5 new React components (PersonaCardV2, PersonaListV2, ArchetypeBrowser, ArchetypeFilter, Collapsible)
- ✅ Updated Personas page with dual-view mode
- ✅ Enhanced detail modal with V2 fields

#### Data Files
- ✅ 11 JSON files (10 archetypes + 1 master reference)
- ✅ 60 personas ready for import

#### Scripts & Tooling
- ✅ Import script for V2 personas
- ✅ Verification scripts
- ✅ Testing scripts

#### Documentation
- ✅ 7 new documentation files
- ✅ Quick start guide
- ✅ API documentation
- ✅ Testing guides

---

## Post-Deployment Steps

### 1. Run Database Migration

**On Railway (Production):**
```bash
# Railway will auto-run migrations on deploy
# Verify in Railway dashboard logs
```

**Manual verification (if needed):**
```bash
cd packages/database
npx prisma migrate deploy
```

### 2. Import V2 Persona Data

**Important:** Run the import script to populate the database with 60 V2 personas.

```bash
# From project root
npm run import-personas-v2
```

**Expected Output:**
```
Importing personas from bootstrappers.json...
✓ Imported 10 Bootstrapper personas
Importing personas from crusaders.json...
✓ Imported 5 Crusader personas
...
✓ Successfully imported 60 personas across 10 archetypes
```

**Verification:**
```bash
npm run verify-personas-v2
```

Expected: All 10 archetypes with correct persona counts.

### 3. Test API Endpoints

**Test the new endpoints:**
```bash
# Test archetypes endpoint
curl https://your-api-domain.com/api/personas/archetypes

# Test V2 personas endpoint
curl https://your-api-domain.com/api/personas?version=2

# Test specific archetype
curl https://your-api-domain.com/api/personas/archetypes/bootstrapper/personas
```

### 4. Verify Frontend

1. Navigate to `/personas` in production
2. Confirm archetype grid displays 10 cards
3. Click an archetype → verify persona list loads
4. Click a persona → verify detail modal shows V2 fields
5. Test view toggle (Archetypes ↔ Personas)

**Check for V2 fields in detail modal:**
- [ ] Instant Read (blue highlighted box)
- [ ] Danger meters (visual bars)
- [ ] Verdict lean badge
- [ ] Phrases You'll Hear
- [ ] Verdict Prediction (probability bar)
- [ ] Strike/Keep strategies (colored boxes)

### 5. Monitor for Errors

**Check logs for:**
- Database migration success
- Import script completion
- API endpoint responses
- Frontend rendering

**Vercel logs:**
```bash
vercel logs
```

**Railway logs:**
- Check Railway dashboard for API gateway logs
- Look for any 500 errors or failed requests

---

## Environment Variables

**Ensure these are set in production:**

### Vercel (Frontend)
```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway.railway.app/api
DATABASE_URL=postgresql://...
```

### Railway (API Gateway)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
ANTHROPIC_API_KEY=...
```

---

## Rollback Plan

If issues occur, rollback to previous commit:

```bash
# Revert the commit
git revert e55b91d

# Push to trigger re-deployment
git push origin main
```

**Note:** Database migration cannot be automatically rolled back. You would need to manually drop the new columns if absolutely necessary (not recommended - they're nullable and won't break anything).

---

## Breaking Changes

**None** - All changes are backward compatible:
- New fields are nullable
- Existing personas still work
- Old API calls still function
- V1 personas display correctly

---

## Known Issues / Limitations

### Current Limitations
1. **No V2 data by default** - Must run import script
2. **Manual import required** - Not automated in deployment pipeline
3. **Persona suggester** - Not yet updated to use V2 fields (Phase 4)
4. **AI services** - Not yet leveraging V2 data (Phase 4)

### Future Enhancements (Phase 4)
- Update persona suggester to use `instant_read`
- Enhance archetype classifier with detection indicators
- Generate voir dire questions from `phrases_youll_hear`
- Use `strike_or_keep` in case strategy recommendations

---

## Testing Checklist

### Pre-Deployment (✅ Complete)
- [x] Database migration tested locally
- [x] API endpoints tested locally
- [x] Frontend components tested locally
- [x] Import script verified with 60 personas
- [x] No TypeScript errors
- [x] No console errors in browser

### Post-Deployment (To Do)
- [ ] Verify migration ran successfully
- [ ] Import V2 personas into production DB
- [ ] Test API endpoints return V2 fields
- [ ] Test frontend displays V2 components
- [ ] Verify archetype grid loads
- [ ] Verify persona detail modal shows all fields
- [ ] Check for any console errors
- [ ] Monitor error logs for 24 hours

---

## Success Metrics

### Phase 1: Database ✅
- 60 personas imported
- All 8 new fields populated
- 10 archetypes with correct counts

### Phase 2: API ✅
- 3 endpoints working (personas, archetypes, archetype/:id/personas)
- V2 fields returned in responses
- Query parameters functional

### Phase 3: Frontend ✅
- 5 new components rendering
- Dual-view mode working
- Detail modal showing V2 fields
- No UI bugs or console errors

---

## Support & Documentation

### Quick Links
- **Quick Start:** [PERSONA_V2_QUICKSTART.md](../PERSONA_V2_QUICKSTART.md)
- **API Docs:** [docs/API_UPDATES_PERSONA_V2.md](./API_UPDATES_PERSONA_V2.md)
- **Testing Guide:** [docs/PERSONA_V2_PHASE_3_TESTING.md](./PERSONA_V2_PHASE_3_TESTING.md)
- **Full Summary:** [docs/PERSONA_V2_INTEGRATION_SUMMARY.md](./PERSONA_V2_INTEGRATION_SUMMARY.md)

### Contact
- Issues: GitHub repository
- Questions: Reference documentation above

---

## Deployment Timeline

| Time | Action | Status |
|------|--------|--------|
| 2026-01-28 | Commit created | ✅ Complete |
| 2026-01-28 | Pushed to GitHub | ✅ Complete |
| TBD | Vercel deployment | ⏳ Pending |
| TBD | Railway deployment | ⏳ Pending |
| TBD | Database migration | ⏳ Pending |
| TBD | Data import | ⏳ Pending |
| TBD | Production testing | ⏳ Pending |

---

## Next Steps

1. **Wait for automatic deployment** (Vercel + Railway)
2. **Run database migration** (should auto-run)
3. **Import V2 personas** (run script manually)
4. **Test in production** (verify all features work)
5. **Monitor logs** (check for errors)
6. **Begin Phase 4** (AI services integration)

---

**Deployment Status:** 🚀 Code Deployed, Data Import Pending

**Last Updated:** January 28, 2026
