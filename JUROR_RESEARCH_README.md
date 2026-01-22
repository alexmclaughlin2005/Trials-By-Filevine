# Juror Research System - Phase 1 Implementation

## Overview

The Juror Research System is a real-time identity resolution tool integrated into Juries by Filevine. It helps attorneys and jury consultants quickly research jurors during voir dire by searching public records and providing confidence-scored identity matches.

## What We Built (Phase 1)

### Backend Infrastructure

1. **Database Schema** (7 new models)
   - `Venue` - Court jurisdictions
   - `VoterRecord` - Voter registration data with phonetic indexing
   - `FECDonation` - Federal campaign contribution records
   - `Candidate` - Identity match candidates with 0-100 confidence scores
   - `CandidateSource` - Links candidates to multiple data sources
   - `SearchJob` - Search execution tracking
   - `Capture` - Document capture (for Phase 4 OCR)

2. **Utilities Package** (`packages/utils/`)
   - Name parser with multiple format support
   - Metaphone phonetic algorithm for fuzzy name matching
   - Levenshtein distance for string similarity

3. **Confidence Scoring Engine**
   - 100-point scoring system:
     - Name: 40 points (exact, phonetic, similar matching)
     - Age: 20 points (exact, ±2 years, ±5 years)
     - Location: 20 points (city, county, state matching)
     - Occupation: 10 points (fuzzy string similarity)
     - Corroboration: 10 points (multiple source bonus)
   - Detailed score breakdowns with human-readable explanations

4. **Search Orchestrator**
   - Parallel multi-source searching
   - Entity linking using Union-Find algorithm
   - Clusters matches that refer to the same person
   - Calculates link strength based on:
     - Strong links: same email, phone, DOB+last name (5 pts each)
     - Moderate links: same name, age, city, address, employer

5. **Mock Data Source**
   - 10 synthetic jurors for Phase 1 testing
   - Simulates realistic search latency (50-150ms)
   - Demonstrates name matching, age variation, location data

6. **API Routes** (integrated into `/api/jurors`)
   - `POST /api/jurors/:id/search` - Search for identity matches
   - `POST /api/jurors/candidates/:candidateId/confirm` - Confirm a match
   - `POST /api/jurors/candidates/:candidateId/reject` - Reject a match
   - Extended `GET /api/jurors/:id` to include candidates and search jobs

### Frontend Component

**JurorResearchPanel** (`apps/web/components/juror-research-panel.tsx`)
- Search trigger button
- Candidate cards with:
  - Confidence score badges (color-coded: green ≥70%, yellow ≥50%, red <50%)
  - Source type badges (voter_record, fec_donation, mock)
  - Contact info (phone, email when available)
  - Expandable score breakdowns showing point allocation
- Confirm/Reject actions
- Empty state with call-to-action
- Error handling

## Integration Points

### Adding to Juror Detail Page

Add the Juror Research Panel to `apps/web/app/(auth)/jurors/[id]/page.tsx`:

```tsx
import { JurorResearchPanel } from '@/components/juror-research-panel';

// Add after line 233, before the ArchetypeClassifier section:
<JurorResearchPanel
  jurorId={jurorId}
  jurorName={`${data.firstName} ${data.lastName}`}
  jurorInfo={{
    firstName: data.firstName,
    lastName: data.lastName,
    age: data.age || undefined,
    city: data.city || undefined,
    zipCode: data.zipCode || undefined,
    occupation: data.occupation || undefined,
  }}
  initialCandidates={data.candidates || []}
/>
```

## How It Works

### Search Flow

1. User clicks "Search Public Records" on a juror's detail page
2. System builds search query from juror's name, age, location, occupation
3. Search Orchestrator queries all available data sources in parallel
4. Each match is scored using the confidence algorithm
5. Entity linking clusters matches that refer to the same person
6. Corroboration bonuses applied to multi-source matches
7. Results filtered (≥30% confidence) and sorted by score
8. Candidates saved to database and returned to UI

### Scoring Example

**Juror:** Maria Garcia, Age 35, Los Angeles, CA 90012, Nurse

**Candidate:** Maria L Garcia, Age 35, Los Angeles, CA 90015, Registered Nurse

```
Name Score: 35/40
  - Last name: Exact match (20 pts)
  - First name: Exact match (15 pts)
  - Middle name: Not available (0 pts)

Age Score: 20/20
  - Exact age match

Location Score: 20/20
  - Same city and state
  - Different ZIP but same metro area

Occupation Score: 8/10
  - "Nurse" vs "Registered Nurse" (high similarity)

Corroboration: 3/10
  - Found in 2 sources (voter records + mock)

Total: 86/100 (High Confidence Match)
```

### Entity Linking Example

If the search finds:
- "Maria Garcia" in voter records (age 35, LA)
- "Maria L. Garcia" in FEC donations (same address)
- "M. Garcia" in people search (same phone number)

The system will:
1. Calculate link strength between each pair
2. Cluster them together (same person)
3. Choose the highest-confidence record as primary
4. Apply +6 corroboration bonus for 3 sources
5. Merge profile data from all sources

## Testing with Mock Data

The mock data source includes 10 test jurors:

1. **John Smith** - 42, Software Engineer, LA
2. **John A Smith** - 43, Teacher, LA (similar name test)
3. **Jon Smith** - 41, Accountant, Pasadena (phonetic match test)
4. **Maria Garcia** - 35, Nurse, LA
5. **Maria L Garcia** - 35, Registered Nurse, LA (exact duplicate test)
6. **Robert Johnson** - 58, Retired Navy, Long Beach
7. **Sarah Chen** - 29, Data Scientist, Irvine
8. **Michael Brown** - 45, Attorney, Santa Monica
9. **Jennifer Martinez** - 38, Marketing Manager, Burbank
10. **David Lee** - 52, Business Owner, Glendale

### Test Scenarios

**High Confidence Match (≥70%):**
```
Search: "Maria Garcia", Age 35, Los Angeles
Expected: 2 candidates (Maria Garcia + Maria L Garcia), both 80%+
```

**Phonetic Matching:**
```
Search: "John Smith", Age 42
Expected: Jon Smith appears (last name sounds alike)
```

**Age Tolerance:**
```
Search: "John Smith", Age 44
Expected: John Smith (42) and John A Smith (43) both match
```

## File Structure

```
packages/
  utils/
    src/
      name-parser.ts           # Name parsing & similarity
      metaphone.ts             # Phonetic matching algorithm
      index.ts                 # Exports

  database/
    prisma/
      schema.prisma            # Database models (lines 534-745)

services/
  api-gateway/
    src/
      services/
        confidence-scorer.ts   # Scoring algorithm
        search-orchestrator.ts # Search coordination & entity linking
      adapters/
        data-source-adapter.ts # Base interface
        mock-data-source.ts    # Phase 1 mock data
      routes/
        jurors.ts              # Extended with search endpoints

apps/
  web/
    components/
      juror-research-panel.tsx # React component
    app/(auth)/jurors/[id]/
      page.tsx                 # Integration point
```

## Phase 2 Preview

Phase 2 will add **real data sources**:

1. **Voter Record Adapter** - Pre-loaded state voter registration files
2. **FEC Local Adapter** - Pre-loaded federal donation records
3. **FEC API Adapter** - Real-time FEC API queries
4. **People Search APIs** - Pipl, FullContact, Whitepages Pro integration

Performance targets:
- Tier 1 (Local): <100ms (voter records, FEC local)
- Tier 2 (Fast APIs): 1-3s (people search APIs)
- Overall search time: 3-5 seconds

## Environment Variables (Phase 2+)

```env
# People Search APIs
PIPL_API_KEY=your_key_here
FULLCONTACT_API_KEY=your_key_here
WHITEPAGES_API_KEY=your_key_here

# Azure Document Intelligence (Phase 4 - OCR)
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_key_here
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your_endpoint_here
```

## Migration Applied

```bash
npx prisma migrate dev --name add_juror_research_models
```

Migration created:
- `packages/database/prisma/migrations/20260121185647_add_juror_research_models/`

## Key Algorithms

### Name Parsing
Handles formats: "First Last", "Last, First", "First M. Last", "First Last Jr."

### Metaphone Phonetic Encoding
Converts names to phonetic codes for fuzzy matching:
- "Smith" → "SM0" (TH → 0)
- "Smythe" → "SM0" (same sound)

### Confidence Scoring
Multi-factor algorithm with weighted components and detailed reasoning.

### Entity Linking (Union-Find)
Clusters candidates efficiently in O(n log n) time with path compression.

## Next Steps

1. **Immediate**: Integrate JurorResearchPanel into juror detail page
2. **Phase 2**: Implement real data source adapters
3. **Phase 3**: Add CSV batch import
4. **Phase 4**: Add document capture with OCR
5. **Phase 5**: Add WebSocket real-time collaboration
6. **Phase 6**: Add PWA offline support
7. **Phase 7**: Implement venue pre-loading

## Questions?

See the full specification in `JUror Research/IMPLEMENTATION_GUIDE.md`
