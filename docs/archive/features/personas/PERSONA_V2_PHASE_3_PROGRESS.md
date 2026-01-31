# Persona V2.0 - Phase 3 Progress: Frontend UI Components

**Date:** January 28, 2026
**Status:** 🚧 In Progress

---

## Summary

Phase 3 of the Persona V2.0 integration focuses on creating React components to display the new V2 fields in a beautiful, intuitive user interface.

---

## ✅ Components Created

### 1. PersonaCardV2 Component
**File:** `apps/web/components/persona-card-v2.tsx`

**Purpose:** Display individual persona with all V2 fields in an expandable card format

**Features:**
- **Instant Read** - Prominent display of one-sentence summary at the top
- **Danger Meters** - Visual 1-5 scale meters for plaintiff and defense danger levels
- **Verdict Lean Badge** - Color-coded badge showing archetype verdict lean
- **Expandable Sections:**
  - Demographics (age, occupation, etc.)
  - Phrases You'll Hear (voir dire phrases)
  - Verdict Prediction (liability probability, damages, deliberation role)
  - Strike/Keep Strategy (tailored by plaintiff/defense side)
- **Visual Design:** Uses Filevine color palette, responsive layout, smooth transitions

**Usage Example:**
```typescript
<PersonaCardV2
  persona={persona}
  expanded={isExpanded}
  onSelect={() => setExpanded(!isExpanded)}
  showStrategy={true}
  side="plaintiff"
/>
```

**Key Sub-Component:**
- `DangerMeter` - Reusable visual danger level indicator with colored bars

---

### 2. PersonaListV2 Component
**File:** `apps/web/components/persona-list-v2.tsx`

**Purpose:** Display filterable grid of personas with advanced search and filtering

**Features:**
- **Search Bar** - Full-text search across name, instant_read, backstory, tagline
- **Archetype Filter** - Dropdown to filter by archetype
- **Danger Level Filter** - Filter by high/medium/low danger (side-specific)
- **Results Count** - Shows active filters and result count
- **Clear Filters** - Easy reset of all filters
- **Responsive Grid** - 1-3 columns depending on screen size
- **Empty States** - Helpful messages when no results

**Usage Example:**
```typescript
<PersonaListV2
  personas={personas}
  onPersonaSelect={(id) => handleSelect(id)}
  showStrategy={true}
  side="plaintiff"
  allowFilters={true}
/>
```

**Filter Capabilities:**
- Search by text (name, instant read, backstory, tagline)
- Filter by archetype (bootstrapper, crusader, etc.)
- Filter by danger level (high: 4-5, medium: 2-3, low: 1)
- Side-specific danger filtering (plaintiff vs defense)

---

### 3. ArchetypeBrowser Component
**File:** `apps/web/components/archetype-browser.tsx`

**Purpose:** Grid view of all 10 archetypes with metadata and persona counts

**Features:**
- **Archetype Cards** - One card per archetype showing:
  - Display name (e.g., "The Bootstrapper")
  - Verdict lean badge (color-coded)
  - Core beliefs ("What They Believe")
  - Deliberation behavior
  - Detection indicators ("How to Spot Them")
  - Persona count badge
- **Expandable Details** - Show/hide additional info per archetype
- **Click to View Personas** - Navigate to persona list for that archetype
- **Loading States** - Spinner while fetching data
- **Error Handling** - User-friendly error messages

**Usage Example:**
```typescript
<ArchetypeBrowser
  onArchetypeSelect={(archetypeId) => {
    // Navigate to persona list for this archetype
    setSelectedArchetype(archetypeId);
  }}
/>
```

**Data Source:**
- Fetches from `/api/personas/archetypes` endpoint
- Uses React Query for caching and optimistic updates

---

### 4. ArchetypeFilter Component
**File:** `apps/web/components/archetype-filter.tsx`

**Purpose:** Collapsible filter panel for selecting multiple archetypes

**Features:**
- **Checkbox Selection** - Multi-select archetypes
- **Select All / Clear All** - Quick actions
- **Persona Counts** - Shows # of personas per archetype
- **Verdict Lean Badges** - Visual indication of archetype lean
- **Collapsible** - Expand/collapse to save space
- **Active Filter Count** - Badge showing selected count

**Usage Example:**
```typescript
<ArchetypeFilter
  selectedArchetypes={selectedArchetypes}
  onArchetypeToggle={(id) => toggleArchetype(id)}
  showPersonaCounts={true}
  collapsed={false}
/>
```

---

### 5. Collapsible UI Component (NEW)
**File:** `apps/web/components/ui/collapsible.tsx`

**Purpose:** Radix UI wrapper for collapsible/expandable sections

**API:**
- `<Collapsible>` - Root component
- `<CollapsibleTrigger>` - Clickable header/button
- `<CollapsibleContent>` - Expandable content area

---

## 🔄 Updated Existing Pages

### Personas Page (Enhanced)
**File:** `apps/web/app/(auth)/personas/page.tsx`

**Changes:**
1. **Added View Toggle:**
   - Archetype View (grid of 10 archetype cards)
   - Persona View (filterable list of personas)

2. **Integrated V2 Components:**
   - `<ArchetypeBrowser>` - For archetype grid view
   - `<PersonaListV2>` - For persona list view

3. **Updated API Call:**
   - Now fetches `?version=2` to get all V2 fields

4. **Enhanced Detail Modal:**
   - Displays instant_read in highlighted box
   - Shows phrases_youll_hear with quote formatting
   - Verdict prediction with visual probability bar
   - Strike/keep strategy in side-by-side cards (plaintiff vs defense)
   - Verdict lean badge

5. **Added Interface Fields:**
   - `instantRead?: string`
   - `archetypeVerdictLean?: string`
   - `phrasesYoullHear?: string[]`
   - `verdictPrediction?: { ... }`
   - `strikeOrKeep?: { ... }`
   - `backstory?: string`

**User Flow:**
1. User lands on page → sees archetype grid (10 cards)
2. User clicks archetype → switches to persona view filtered to that archetype
3. User can toggle between "Archetypes" and "Personas" views
4. User clicks persona → sees detail modal with all V2 fields

---

## 📊 Visual Design Highlights

### Color Palette
- **Plaintiff Danger:** Orange tones (`text-orange-500`, `bg-orange-100`)
- **Defense Danger:** Blue tones (`text-blue-500`, `bg-blue-100`)
- **Verdict Lean Colors:**
  - Strong Defense: Red (`bg-red-100 text-red-700`)
  - Strong Plaintiff: Green (`bg-green-100 text-green-700`)
  - Slight Defense: Orange (`bg-orange-100 text-orange-700`)
  - Slight Plaintiff: Teal (`bg-teal-100 text-teal-700`)
  - Neutral: Blue (`bg-blue-100 text-blue-700`)
  - Variable: Purple (`bg-purple-100 text-purple-700`)

### Typography
- **Instant Read:** Bold, prominent placement, blue background box
- **Phrases:** Italic with quote formatting, gray text with speech bubble emoji
- **Section Headers:** Small caps, semibold, gray-700
- **Danger Levels:** Large numbers with colored icons

### Layout
- **Cards:** Rounded corners, subtle shadows on hover
- **Grid:** Responsive (1-3 columns)
- **Spacing:** Consistent 4-6 unit gaps
- **Expandable Sections:** Smooth transitions with border-top dividers

---

## 🎯 Features Implemented

### Data Display
- [x] Instant read summary
- [x] Danger level meters (visual 1-5 scale)
- [x] Verdict lean badges
- [x] Phrases you'll hear (voir dire)
- [x] Verdict prediction (probability + damages + role)
- [x] Strike/keep strategies (plaintiff vs defense)
- [x] Demographics (age, occupation, etc.)
- [x] Archetype metadata (beliefs, behaviors, detection indicators)

### User Interactions
- [x] Expand/collapse persona cards
- [x] Filter by archetype
- [x] Filter by danger level
- [x] Search by text
- [x] View toggle (archetypes vs personas)
- [x] Click archetype to see its personas
- [x] Clear filters button
- [x] Active filter count display

### Data Fetching
- [x] Fetch V2 personas with React Query
- [x] Fetch archetype metadata
- [x] Fetch personas by archetype
- [x] Error handling
- [x] Loading states

---

## 🚧 Still To Do (Phase 3)

### Additional Components
- [ ] **PersonaCompare** - Side-by-side comparison of 2-3 personas
- [ ] **DangerLevelChart** - Visual chart showing danger distribution
- [ ] **ArchetypeRadar** - Radar chart for archetype strength across dimensions
- [ ] **PersonaSuggester V2** - Update AI suggester to use V2 fields

### Integration Points
- [ ] **Juror Research Panel** - Show instant_read in persona suggestions
- [ ] **Archetype Classifier** - Display detection indicators from V2
- [ ] **Case Dashboard** - Show archetype distribution for selected jurors
- [ ] **Voir Dire Prep** - Display phrases_youll_hear for each persona

### Enhancements
- [ ] **Export to PDF** - Generate PDF report with V2 persona details
- [ ] **Persona Print View** - Print-friendly layout with all V2 fields
- [ ] **Favorite Personas** - Bookmark frequently used personas
- [ ] **Persona Notes** - Enhanced notes with V2 field references

### Polish
- [ ] **Animations** - Smooth transitions for expand/collapse
- [ ] **Skeleton Loaders** - Better loading states
- [ ] **Empty States** - Custom illustrations
- [ ] **Mobile Optimization** - Better mobile layout for cards
- [ ] **Keyboard Navigation** - Arrow keys to navigate cards

---

## 📁 Files Modified/Created

### New Files
- `apps/web/components/persona-card-v2.tsx` - ✅ Created
- `apps/web/components/persona-list-v2.tsx` - ✅ Created
- `apps/web/components/archetype-browser.tsx` - ✅ Created
- `apps/web/components/archetype-filter.tsx` - ✅ Created
- `apps/web/components/ui/collapsible.tsx` - ✅ Created

### Modified Files
- `apps/web/app/(auth)/personas/page.tsx` - ✅ Enhanced with V2 components

---

## 🧪 Testing Checklist

### Component Tests (Manual)
- [ ] PersonaCardV2 displays all V2 fields correctly
- [ ] Danger meters show correct level (1-5)
- [ ] Expand/collapse works smoothly
- [ ] PersonaListV2 filters work correctly
- [ ] Search finds personas by instant_read
- [ ] ArchetypeBrowser shows all 10 archetypes
- [ ] ArchetypeFilter allows multi-select
- [ ] View toggle switches between archetypes and personas
- [ ] Detail modal shows all V2 fields

### Integration Tests
- [ ] Personas page loads without errors
- [ ] API calls return V2 data correctly
- [ ] Clicking archetype navigates to persona list
- [ ] Clicking persona opens detail modal
- [ ] Filters persist when switching views

### Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile (responsive layout)

---

## 💡 Usage Examples

### Example 1: Display Persona with Strategy
```typescript
import { PersonaCardV2 } from '@/components/persona-card-v2';

function JurorResearchPanel({ side }: { side: 'plaintiff' | 'defense' }) {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  return (
    <div>
      <h2>Recommended Personas</h2>
      {personas.map(persona => (
        <PersonaCardV2
          key={persona.id}
          persona={persona}
          expanded={selectedPersona === persona.id}
          onSelect={() => setSelectedPersona(persona.id)}
          showStrategy={true}
          side={side}
        />
      ))}
    </div>
  );
}
```

### Example 2: Archetype Browser with Navigation
```typescript
import { ArchetypeBrowser } from '@/components/archetype-browser';
import { useRouter } from 'next/navigation';

function ArchetypesPage() {
  const router = useRouter();

  return (
    <ArchetypeBrowser
      onArchetypeSelect={(archetypeId) => {
        router.push(`/personas?archetype=${archetypeId}`);
      }}
    />
  );
}
```

### Example 3: Filtered Persona List
```typescript
import { PersonaListV2 } from '@/components/persona-list-v2';

function CasePersonas({ caseId, side }: { caseId: string; side: 'plaintiff' | 'defense' }) {
  const { data } = useQuery(['personas', caseId], fetchPersonas);

  return (
    <PersonaListV2
      personas={data?.personas || []}
      onPersonaSelect={(id) => console.log('Selected:', id)}
      showStrategy={true}
      side={side}
      allowFilters={true}
    />
  );
}
```

---

## 🔍 Next Steps

### Immediate (Phase 3 Completion)
1. Test all components in browser
2. Fix any styling issues
3. Add keyboard navigation support
4. Create PersonaCompare component
5. Update AI services to use V2 fields

### Phase 4: AI Services Update
1. Update persona suggestion prompts to use instant_read
2. Enhance archetype classifier to use detection indicators
3. Add verdict prediction to juror analysis
4. Integrate phrases_youll_hear into voir dire prep

### Phase 5: Documentation & Training
1. Create user guide for V2 personas
2. Record demo video showing new features
3. Update onboarding to highlight V2 enhancements
4. Train support team on V2 fields

---

## 📊 Progress Metrics

- **Components Created:** 5/5 (100%)
- **Pages Updated:** 1/1 (100%)
- **Data Display Features:** 8/8 (100%)
- **User Interaction Features:** 9/9 (100%)
- **Integration Points:** 0/4 (0% - Phase 4)
- **Polish Items:** 0/5 (0% - Phase 4)

**Overall Phase 3 Progress:** ~65% Complete

---

## 🎉 Key Achievements

- Created comprehensive component library for V2 personas
- Integrated archetype browser with beautiful card layout
- Built advanced filtering and search capabilities
- Enhanced personas page with dual-view mode
- Displayed all V2 fields with appropriate visual design
- Maintained backward compatibility with V1 personas

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
**Status:** Phase 3 In Progress (65% Complete)
