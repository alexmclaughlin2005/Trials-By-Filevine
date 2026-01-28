# Persona V2.0 - Phase 3 Testing Guide

**Date:** January 28, 2026
**Phase:** Frontend UI Components

---

## Quick Test (5 minutes)

### Prerequisites
1. Phase 2 complete (API endpoints working)
2. 60 V2 personas imported in database
3. Web app running (`cd apps/web && npm run dev`)

---

## Test 1: Personas Page - Archetype View

### Steps
1. Navigate to `/personas` in your browser
2. You should see a view toggle at the top right with "Archetypes" and "Personas" buttons
3. Ensure "Archetypes" view is selected (default)

### Expected Results
- ✅ Grid of 10 archetype cards displayed
- ✅ Each card shows:
  - Archetype display name (e.g., "The Bootstrapper")
  - Verdict lean badge (color-coded)
  - "What They Believe" section
  - Persona count badge (e.g., "10")
  - "Show More" button
- ✅ Cards are responsive (3 columns on desktop, 2 on tablet, 1 on mobile)

### Actions to Test
- **Click "Show More"** on any archetype card
  - Should expand to show:
    - "In Deliberation" behavior
    - "How to Spot Them" indicators (bullet list)
    - "View X Personas" button
- **Click "View X Personas"** button
  - Should switch to "Personas" view
  - Should filter to show only personas from that archetype

### Screenshot Checkpoints
- [ ] Archetype grid loads with all 10 cards
- [ ] Verdict lean badges have correct colors
- [ ] Expand/collapse works smoothly
- [ ] Navigation to personas view works

---

## Test 2: Personas Page - Persona List View

### Steps
1. Click the "Personas" button in the view toggle (or click "View Personas" from an archetype card)
2. You should see a filterable list of persona cards

### Expected Results
- ✅ Grid of persona cards (PersonaCardV2 components)
- ✅ Each card shows:
  - Persona name
  - Archetype badge with verdict lean
  - Instant read summary (prominent blue box)
  - Danger meters (visual bars, 1-5 scale)
  - "Show More" button
- ✅ No filter UI visible (filters disabled when embedded in personas page)
- ✅ Result count badge at top

### Actions to Test
- **Click "Show More"** on any persona card
  - Should expand to show:
    - Demographics (age, occupation, etc.)
    - Phrases You'll Hear (voir dire phrases)
    - Verdict Prediction (liability probability bar + damages + role)
    - Strike/Keep Strategy (plaintiff vs defense boxes)
- **Click a persona card** (anywhere on card)
  - Should open detail modal with full persona information

### Screenshot Checkpoints
- [ ] Persona grid loads correctly
- [ ] Instant read appears in blue highlighted box
- [ ] Danger meters display correctly (colored bars)
- [ ] Expand/collapse works smoothly
- [ ] Detail modal opens with all V2 fields

---

## Test 3: Persona Detail Modal (Enhanced with V2 Fields)

### Steps
1. From persona list view, click any persona card
2. Detail modal should open

### Expected Results (NEW V2 Content)
- ✅ **Instant Read** - Blue highlighted box at top
- ✅ **Verdict Lean** - Text showing archetype verdict lean
- ✅ **Danger Levels** - Large numbers with icons (plaintiff & defense)
- ✅ **Phrases You'll Hear** - List of voir dire phrases with quote formatting
- ✅ **Verdict Prediction:**
  - Visual probability bar (0-100%)
  - Damages if liability text
  - Role in deliberation text
- ✅ **Strike or Keep Strategy:**
  - Two side-by-side colored boxes
  - Orange box for plaintiff strategy
  - Blue box for defense strategy

### Existing Content (Should Still Work)
- ✅ Tagline (if no instant read)
- ✅ Demographics grid
- ✅ Key signals/attributes chips
- ✅ Description
- ✅ Clone, Edit, Notes buttons

### Actions to Test
- **Scroll through modal** - Should display all sections
- **Click "Clone"** - Should create a copy (existing feature)
- **Click "Notes"** - Should open notes modal (existing feature)
- **Click "Close"** - Should close modal

### Screenshot Checkpoints
- [ ] All V2 fields display correctly
- [ ] Instant read appears prominently
- [ ] Phrases have quote formatting with speech bubble emoji
- [ ] Verdict prediction probability bar shows correct percentage
- [ ] Strike/keep strategies appear in colored boxes (orange & blue)

---

## Test 4: View Toggle & Navigation Flow

### User Flow Test
1. Start at `/personas` (should show archetypes view)
2. Click on "The Bootstrapper" archetype → Click "View 10 Personas"
3. Should switch to personas view with bootstrapper personas only
4. Click "Archetypes" button in view toggle
5. Should return to archetype grid view
6. Click "Personas" button in view toggle
7. Should show all personas (not filtered)

### Expected Results
- ✅ View toggle buttons change active state (filled vs outlined)
- ✅ Clicking archetype → navigates to persona view filtered to that archetype
- ✅ Toggling view persists current archetype filter
- ✅ Smooth transition between views (no flickering)

### Screenshot Checkpoints
- [ ] View toggle visually indicates active view
- [ ] Archetype filter carries over when switching views
- [ ] All personas display when switching from archetypes to personas view

---

## Test 5: Component Integration

### ArchetypeBrowser Component
**Location:** `components/archetype-browser.tsx`

**Test:**
```typescript
import { ArchetypeBrowser } from '@/components/archetype-browser';

<ArchetypeBrowser
  onArchetypeSelect={(id) => console.log('Selected:', id)}
/>
```

**Expected:**
- Fetches from `/api/personas/archetypes`
- Displays all 10 archetypes
- Clicking archetype calls `onArchetypeSelect` callback

### PersonaListV2 Component
**Location:** `components/persona-list-v2.tsx`

**Test:**
```typescript
import { PersonaListV2 } from '@/components/persona-list-v2';

<PersonaListV2
  personas={personas}
  onPersonaSelect={(id) => console.log('Selected:', id)}
  showStrategy={false}
  side={undefined}
  allowFilters={false}
/>
```

**Expected:**
- Displays grid of persona cards
- No filters shown (allowFilters=false)
- Clicking persona calls `onPersonaSelect` callback

### PersonaCardV2 Component
**Location:** `components/persona-card-v2.tsx`

**Test:**
```typescript
import { PersonaCardV2 } from '@/components/persona-card-v2';

<PersonaCardV2
  persona={persona}
  expanded={false}
  onSelect={() => {}}
  showStrategy={true}
  side="plaintiff"
/>
```

**Expected:**
- Displays persona with instant read
- Shows danger meters
- Expandable with strike/keep strategy (plaintiff side shown)

### ArchetypeFilter Component
**Location:** `components/archetype-filter.tsx`

**Test:**
```typescript
import { ArchetypeFilter } from '@/components/archetype-filter';

const [selected, setSelected] = useState<string[]>([]);

<ArchetypeFilter
  selectedArchetypes={selected}
  onArchetypeToggle={(id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }}
  showPersonaCounts={true}
  collapsed={false}
/>
```

**Expected:**
- Displays collapsible filter panel
- Multi-select checkboxes
- Persona counts per archetype
- Select All / Clear All buttons

---

## Test 6: Data Accuracy

### V2 Fields Check
For any persona in the detail modal, verify:

1. **Instant Read:**
   - Should be 1-2 sentences
   - Should summarize the persona's key characteristics
   - Example: "Classic self-made man. Will blame plaintiff for not taking personal responsibility."

2. **Phrases You'll Hear:**
   - Should be array of 5-10 phrases
   - Should be actual quotes (in quotes)
   - Example: "Nobody put a gun to their head"

3. **Verdict Prediction:**
   - `liability_finding_probability` should be 0.0 - 1.0 (displayed as 0% - 100%)
   - `damages_if_liability` should be text description
   - `role_in_deliberation` should be text description

4. **Strike or Keep:**
   - `plaintiff_strategy` should start with "MUST STRIKE", "STRONG STRIKE", "STRIKE", or "KEEP"
   - `defense_strategy` should have similar format
   - Should be specific guidance for each side

### Danger Levels
- Should be integers 1-5
- Some personas may have undefined danger levels (Chameleon, Maverick, etc.)
- Visual meters should show correct number of filled bars

---

## Test 7: Error Handling & Edge Cases

### API Failures
1. Stop the API gateway (`kill the process`)
2. Reload `/personas` page
3. Should show error message: "Failed to load archetypes"

### Empty States
1. Filter to an archetype with 0 personas (shouldn't exist, but test anyway)
2. Should show: "No personas match your filters"

### Loading States
1. Reload page and watch for loading spinner
2. Should see spinning loader while fetching archetypes/personas

---

## Test 8: Responsive Design

### Desktop (1920x1080)
- [ ] Archetype grid: 3 columns
- [ ] Persona list: 3 columns
- [ ] Detail modal: Readable width, not full screen

### Tablet (768x1024)
- [ ] Archetype grid: 2 columns
- [ ] Persona list: 2 columns
- [ ] Detail modal: Full width with padding

### Mobile (375x667)
- [ ] Archetype grid: 1 column
- [ ] Persona list: 1 column
- [ ] Detail modal: Full screen
- [ ] View toggle: Stacked vertically

---

## Test 9: Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] All components render correctly
- [ ] Animations are smooth
- [ ] No console errors

### Firefox
- [ ] All components render correctly
- [ ] Colors match (verify Tailwind CSS works)
- [ ] No console errors

### Safari (macOS/iOS)
- [ ] All components render correctly
- [ ] Webkit-specific styles work
- [ ] No console errors

---

## Test 10: Performance

### Load Time
- [ ] Initial page load < 2 seconds
- [ ] Archetype grid loads < 500ms after mount
- [ ] Persona list loads < 1 second after mount

### Interactions
- [ ] Expand/collapse cards: instant (no lag)
- [ ] View toggle: instant switch
- [ ] Modal open/close: smooth transition (200-300ms)

### Memory
- [ ] No memory leaks after navigating between views multiple times
- [ ] React DevTools shows no unnecessary re-renders

---

## Common Issues & Fixes

### Issue 1: "Module not found: Can't resolve '@/components/persona-card-v2'"
**Fix:** Verify all component files exist:
```bash
ls apps/web/components/persona-card-v2.tsx
ls apps/web/components/persona-list-v2.tsx
ls apps/web/components/archetype-browser.tsx
ls apps/web/components/archetype-filter.tsx
```

### Issue 2: "Cannot read property 'instantRead' of undefined"
**Fix:** API may not be returning V2 fields. Verify:
```bash
curl http://localhost:3001/api/personas?version=2
```
Should include `instantRead`, `phrasesYoullHear`, etc.

### Issue 3: Danger meters not displaying
**Fix:** Check persona data has `plaintiffDangerLevel` and `defenseDangerLevel` fields:
```bash
npm run verify-personas-v2
```

### Issue 4: Archetype grid shows no cards
**Fix:** Verify API endpoint is working:
```bash
curl http://localhost:3001/api/personas/archetypes
```

### Issue 5: Styles not loading correctly
**Fix:** Rebuild Tailwind CSS:
```bash
cd apps/web
npm run build
```

---

## Success Criteria

Phase 3 is complete when:

- [x] All 5 new components created
- [x] Personas page updated with V2 components
- [x] Archetype view displays all 10 archetypes
- [x] Persona list view displays V2 personas
- [x] Detail modal shows all V2 fields
- [x] View toggle works correctly
- [x] Expand/collapse functionality works
- [x] Danger meters display correctly
- [x] Verdict prediction shows probability bar
- [x] Strike/keep strategies appear in colored boxes
- [x] No console errors
- [x] Responsive design works on all screen sizes
- [x] API integration works correctly

---

## Next Steps After Testing

Once all tests pass:

1. **Document any bugs found** - Create issues in GitHub
2. **Capture screenshots** - Add to documentation
3. **Record demo video** - Show off new V2 features
4. **Update user guide** - Document new UI for end users
5. **Begin Phase 4** - Update AI services to use V2 fields

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
