# Focus Group Framework - Testing Guide

## Quick Start

### 1. Start Development Servers

```bash
# Terminal 1: Start database (if not running)
# Make sure PostgreSQL is running

# Terminal 2: Start API Gateway
cd services/api-gateway
npm run dev

# Terminal 3: Start Web App
cd apps/web
npm run dev
```

### 2. Access the Application

Open browser to: `http://localhost:3000`

---

## Test Workflow

### Test 1: Create New Focus Group Session

1. **Navigate to a case**
   - Go to Cases page
   - Click on any case
   - Click "Focus Groups" tab

2. **Click "New Focus Group"**
   - Should see multi-step wizard
   - Progress bar with 4 steps

3. **Step 1: Configure Panel**
   - Test **Random Panel** mode
     - Select "Random Panel"
     - Adjust panel size (3-12)
     - Click "Next"

   - Test **Configure Panel** mode
     - Select "Configure Panel"
     - Click multiple archetypes
     - See checkmarks on selected
     - Click "Next"

   - Test **Case-Matched** mode
     - Select "Match Case Jurors"
     - Should show archetypes from classified jurors
     - Click "Next"

4. **Step 2: Select Arguments**
   - Check/uncheck arguments
   - See order numbers (1, 2, 3)
   - Verify at least one selected
   - Click "Next"

5. **Step 3: Add Questions (Optional)**
   - Type a question
   - Press Enter or click "Add Question"
   - Add multiple questions
   - Remove a question
   - Click "Next"

6. **Step 4: Review**
   - Verify panel configuration shows correctly
   - Verify arguments list with order
   - Verify questions list
   - Click "Start Focus Group"

7. **Check Session Created**
   - Should redirect to "running" view
   - Check database for new session:
     ```sql
     SELECT * FROM focus_group_sessions ORDER BY created_at DESC LIMIT 1;
     ```

---

### Test 2: Session Management

1. **View Sessions List**
   - Go back to Focus Groups tab
   - Should see session in list
   - Check status badge (draft/running/completed)
   - Verify counts (personas, results, recommendations)

2. **Continue Draft Session**
   - Create a session but don't complete
   - Navigate away
   - Come back and click "Continue Setup"
   - Should resume at current step

3. **Delete Draft Session**
   - Create a draft session
   - Try to delete (should work)
   - Create and start a session
   - Try to delete (should fail - non-draft)

---

### Test 3: API Endpoints

Use Postman or curl to test API directly:

#### Create Session
```bash
curl -X POST http://localhost:3001/api/focus-groups/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "caseId": "YOUR_CASE_ID",
    "name": "Test Focus Group"
  }'
```

#### Update Configuration
```bash
curl -X PATCH http://localhost:3001/api/focus-groups/sessions/SESSION_ID/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "archetypeSelectionMode": "random",
    "archetypeCount": 6,
    "selectedArguments": [
      {
        "argumentId": "ARG_ID",
        "order": 1,
        "title": "Test Argument",
        "content": "Content here",
        "argumentType": "opening"
      }
    ]
  }'
```

#### Get Archetypes
```bash
curl http://localhost:3001/api/focus-groups/archetypes?caseId=YOUR_CASE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Start Simulation
```bash
curl -X POST http://localhost:3001/api/focus-groups/sessions/SESSION_ID/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Expected Behavior

### ✅ Should Work
- Create session in draft state
- Navigate through all 4 steps
- Save configuration at each step
- Select random panel with custom size
- Select configured panel with multiple archetypes
- Select case-matched panel (if jurors are classified)
- Add/remove arguments
- Reorder arguments (shows order numbers)
- Add/remove custom questions
- View configuration summary in review step
- Start simulation (changes status to "running")
- View session in list after creation
- Continue draft sessions
- Delete draft sessions

### ❌ Should Fail (Validation)
- Start simulation without arguments selected
- Delete non-draft session
- Update configuration of non-draft session
- Create session without caseId

---

## Database Checks

### Check Session Created
```sql
SELECT
  id,
  name,
  status,
  archetype_selection_mode,
  archetype_count,
  configuration_step,
  created_at
FROM focus_group_sessions
ORDER BY created_at DESC
LIMIT 5;
```

### Check Configuration Saved
```sql
SELECT
  id,
  name,
  selected_archetypes,
  selected_arguments,
  custom_questions
FROM focus_group_sessions
WHERE id = 'YOUR_SESSION_ID';
```

### Verify JSON Structure
```sql
-- Check selected_arguments JSON
SELECT
  id,
  selected_arguments::jsonb
FROM focus_group_sessions
WHERE selected_arguments IS NOT NULL;

-- Check custom_questions JSON
SELECT
  id,
  custom_questions::jsonb
FROM focus_group_sessions
WHERE custom_questions IS NOT NULL;
```

---

## Common Issues & Fixes

### Issue: "No archetypes available"
**Cause:** Archetype system not seeded or no classified jurors
**Fix:**
- Check if archetypes are in database: `SELECT * FROM archetype_configs WHERE is_active = true;`
- OR classify some jurors in the case first

### Issue: Wizard doesn't advance
**Cause:** API call failing or validation error
**Fix:**
- Check browser console for errors
- Check API Gateway logs
- Verify authentication token is valid

### Issue: Session not saving
**Cause:** Database connection or permissions
**Fix:**
- Check DATABASE_URL in services/api-gateway/.env
- Verify Prisma client is generated: `cd packages/database && npx prisma generate`

### Issue: "Case not found"
**Cause:** Case doesn't belong to user's organization
**Fix:**
- Verify user's organizationId matches case's organizationId
- Check: `SELECT id, organization_id FROM cases WHERE id = 'CASE_ID';`

---

## UI Testing Checklist

### Panel Configuration Step
- [ ] Random panel button highlights when selected
- [ ] Panel size input works (3-12)
- [ ] Configured panel button highlights when selected
- [ ] Archetype cards toggle selection
- [ ] Selected archetypes show checkmark
- [ ] Case-matched mode shows juror names (if available)
- [ ] "Next" button works

### Arguments Step
- [ ] Arguments list displays all case arguments
- [ ] Add/Remove buttons toggle correctly
- [ ] Selected arguments show order numbers
- [ ] Order numbers update when selecting/deselecting
- [ ] Argument preview shows content snippet
- [ ] Warning shows if no arguments selected
- [ ] "Next" button works

### Questions Step
- [ ] Text input accepts questions
- [ ] Enter key adds question
- [ ] "Add Question" button works
- [ ] Questions show order numbers
- [ ] "Remove" button works
- [ ] Empty state shows when no questions
- [ ] "Next" button works (skip is okay)

### Review Step
- [ ] Panel config displays correctly
- [ ] Arguments list shows all selected with order
- [ ] Questions list displays (if any)
- [ ] "Ready to Launch" indicator shows
- [ ] "Start Focus Group" button works
- [ ] Loading state shows during start

### Navigation
- [ ] Progress bar highlights current step
- [ ] Completed steps show checkmark
- [ ] "Back" button works on steps 2-4
- [ ] "Cancel" button returns to list
- [ ] Step data persists when navigating back

### Sessions List
- [ ] Shows all sessions for case
- [ ] Status badges show correct colors
- [ ] Counts display (personas, results, recommendations)
- [ ] Date formatted correctly
- [ ] "View Results" shows for completed
- [ ] "Continue Setup" shows for draft
- [ ] "New Focus Group" creates new session
- [ ] Empty state shows when no sessions

---

## Performance Checks

### API Response Times
- Create session: < 500ms
- Update config: < 300ms
- Get archetypes: < 200ms
- Start simulation: < 1s (just status update, not actual simulation)

### UI Responsiveness
- Step transitions: Instant
- Button clicks: Immediate feedback
- Loading states: Show within 100ms
- List rendering: < 500ms for 50 sessions

---

## Next Steps After Testing

1. **Fix any bugs found**
   - Document in GitHub issues
   - Prioritize critical vs. nice-to-have

2. **Improve UX**
   - Add better loading states
   - Improve error messages
   - Add tooltips/help text

3. **Integrate Prompt Service**
   - Create initial reactions prompt
   - Implement simulation execution
   - Add results display

4. **Design Deliberation Logic**
   - Prototype conversation flow
   - Test prompt variations
   - Measure quality vs. cost

---

## Testing Notes Template

Use this template to record testing results:

```markdown
## Test Session: [Date/Time]
**Tester:** [Your Name]
**Branch:** [Git Branch]

### Tests Completed
- [ ] Create session - Random panel
- [ ] Create session - Configured panel
- [ ] Create session - Case-matched panel
- [ ] Select arguments
- [ ] Add questions
- [ ] Complete wizard
- [ ] View sessions list
- [ ] Continue draft
- [ ] Delete draft

### Bugs Found
1. [Bug description]
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Severity: Critical/High/Medium/Low

### Improvements Needed
1. [Improvement suggestion]
   - Current behavior
   - Suggested behavior
   - Priority: High/Medium/Low

### Notes
[Any other observations or comments]
```

---

## Success Criteria

The focus group framework is ready when:

✅ All wizard steps work smoothly
✅ Configuration saves correctly to database
✅ Sessions appear in list view
✅ Draft sessions can be continued
✅ Started sessions show "running" status
✅ No console errors during normal flow
✅ All validation works as expected
✅ UI is responsive and intuitive

---

**Happy Testing!** 🧪

Report any issues and we'll fix them before moving to Phase 2 (Prompt Service Integration).
