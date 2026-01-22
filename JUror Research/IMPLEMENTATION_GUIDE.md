# Juror Research Tool — Implementation Guide

## Overview

This guide provides implementation recommendations for developers (human or AI) building the juror research module. It includes build order, key algorithms, edge cases, and tips for AI coding assistants.

---

## Recommended Build Order

Build in vertical slices—each phase delivers working functionality.

### Phase 1: Core Search Flow (Single Juror)

**Goal**: End-to-end single juror lookup with mock data.

```
Week 1-2:
├── Data models (Juror, Candidate)
├── Basic API endpoints
│   ├── POST /jurors (create)
│   ├── GET /jurors/{id}
│   └── POST /jurors/{id}/search
├── Mock data source adapter
├── Simple search orchestrator (single source)
├── Basic UI
│   ├── Juror list (read-only)
│   ├── Single lookup form
│   └── Candidate display
└── Manual candidate confirmation
```

**Acceptance Criteria**:
- User can enter juror name + details
- System returns mock candidates
- User can confirm a match
- Confirmed profile displays

### Phase 2: Real Data Sources

**Goal**: Connect to actual data APIs.

```
Week 3-4:
├── Voter record adapter (if pre-loaded data available)
├── FEC adapter (live API)
├── People search adapter (Pipl or alternative)
├── Parallel search orchestration
├── Entity linking / merge logic
├── Confidence scoring
└── Profile aggregation
```

**Acceptance Criteria**:
- Searches hit real APIs
- Multiple sources merge correctly
- Confidence scores are reasonable
- Search completes in <5 seconds

### Phase 3: Batch & Import

**Goal**: Process multiple jurors efficiently.

```
Week 5:
├── CSV import endpoint
├── Batch search job queue
├── Progress tracking
├── Batch UI (import modal, progress)
└── Parallelized search execution
```

**Acceptance Criteria**:
- User can upload CSV of 50 jurors
- All searches run in parallel
- Progress updates in real-time
- Results appear as they complete

### Phase 4: Document Capture & OCR

**Goal**: Photo-to-jurors pipeline.

```
Week 6-7:
├── Capture API (presigned uploads)
├── Image storage
├── OCR integration (Azure Document Intelligence)
├── Extraction post-processing
├── Review/confirm UI
├── Camera capture UI
└── Multi-page handling
```

**Acceptance Criteria**:
- User can photograph document
- OCR extracts juror names/details
- User can review and correct
- Confirmed extractions create jurors

### Phase 5: Collaboration

**Goal**: Real-time multi-user experience.

```
Week 8:
├── WebSocket infrastructure
├── Presence tracking
├── Event broadcasting
├── Optimistic UI updates
├── Conflict handling
└── Notes and flags
```

**Acceptance Criteria**:
- Multiple users see same data
- Changes appear instantly
- Presence indicators work
- No data conflicts or overwrites

### Phase 6: Offline Support

**Goal**: Work in low-connectivity environments.

```
Week 9:
├── Service worker setup
├── IndexedDB local storage
├── Capture queue
├── Sync manager
├── Offline UI states
└── Conflict resolution
```

**Acceptance Criteria**:
- App loads offline
- Captures queue locally
- Sync happens automatically
- User understands offline state

### Phase 7: Venue Pre-Loading

**Goal**: Instant searches for frequent jurisdictions.

```
Week 10:
├── Venue management API
├── Bulk data import pipeline
├── Local query optimization
├── Refresh scheduling
└── Admin UI for venues
```

**Acceptance Criteria**:
- Admin can add venues
- Voter/FEC data loads
- Searches against local data are <100ms
- Data refreshes on schedule

---

## Key Algorithms

### 1. Name Parsing

Convert "Garcia, Maria L" or "MARIA L. GARCIA" into structured name components.

```typescript
interface ParsedName {
  full_name: string;       // Normalized: "Maria L Garcia"
  first_name: string;      // "Maria"
  last_name: string;       // "Garcia"
  middle_name?: string;    // "L"
  suffix?: string;         // "Jr", "III", etc.
  confidence: number;      // 0-100
}

function parseName(input: string): ParsedName {
  // Step 1: Normalize
  let normalized = input
    .trim()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[^\w\s\-\'\.]/g, ''); // Remove special chars except common name chars
  
  // Step 2: Detect format
  const isLastFirst = input.includes(',');
  
  // Step 3: Handle "Last, First Middle" format
  if (isLastFirst) {
    const [last, rest] = normalized.split(',').map(s => s.trim());
    const parts = rest.split(' ');
    return {
      full_name: `${parts[0]} ${parts.slice(1).join(' ')} ${last}`.trim(),
      first_name: parts[0],
      last_name: last,
      middle_name: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
      suffix: extractSuffix(last),
      confidence: 90,
    };
  }
  
  // Step 4: Handle "First Middle Last" format
  const parts = normalized.split(' ');
  const suffixIndex = parts.findIndex(p => isSuffix(p));
  let suffix: string | undefined;
  
  if (suffixIndex > 0) {
    suffix = parts[suffixIndex];
    parts.splice(suffixIndex, 1);
  }
  
  return {
    full_name: normalized,
    first_name: parts[0] || '',
    last_name: parts[parts.length - 1] || '',
    middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined,
    suffix,
    confidence: parts.length >= 2 ? 85 : 50,  // Lower confidence for single-word names
  };
}

function isSuffix(s: string): boolean {
  const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v', 'esq', 'phd', 'md'];
  return suffixes.includes(s.toLowerCase().replace(/\./g, ''));
}
```

**Edge Cases**:
- Hyphenated names: "Garcia-Rodriguez" → last_name: "Garcia-Rodriguez"
- Multiple middle names: "Maria Elena Rodriguez Garcia" → Ambiguous, flag for review
- Single name: "Prince" → last_name: "Prince", confidence: 30
- All caps: "JOHN SMITH" → Normalize to "John Smith"

### 2. Confidence Scoring

Calculate match confidence between a juror query and a candidate result.

```typescript
interface ScoreResult {
  total: number;           // 0-100
  factors: ScoreFactor[];
}

interface ScoreFactor {
  factor: string;
  score: number;
  max_score: number;
  detail: string;
}

function scoreCandidate(query: JurorSearchQuery, candidate: DataSourceMatch): ScoreResult {
  const factors: ScoreFactor[] = [];
  
  // Name matching (max 40 points)
  const nameScore = scoreNameMatch(query, candidate);
  factors.push(nameScore);
  
  // Age matching (max 20 points)
  if (query.age && candidate.age) {
    const ageDiff = Math.abs(query.age - candidate.age);
    let score = 0;
    let detail = '';
    
    if (ageDiff === 0) {
      score = 20;
      detail = 'Exact age match';
    } else if (ageDiff <= 2) {
      score = 15;
      detail = `Age within ${ageDiff} year(s)`;
    } else if (ageDiff <= 5) {
      score = 8;
      detail = `Age within ${ageDiff} years`;
    } else {
      score = 0;
      detail = `Age differs by ${ageDiff} years`;
    }
    
    factors.push({ factor: 'age', score, max_score: 20, detail });
  }
  
  // Location matching (max 20 points)
  const locationScore = scoreLocationMatch(query, candidate);
  factors.push(locationScore);
  
  // Occupation matching (max 10 points)
  if (query.occupation && candidate.occupation) {
    const similarity = fuzzyMatch(query.occupation, candidate.occupation);
    const score = Math.round(similarity * 10);
    factors.push({
      factor: 'occupation',
      score,
      max_score: 10,
      detail: similarity > 0.8 ? 'Occupation matches' : 'Partial occupation match',
    });
  }
  
  // Cross-source corroboration (max 10 points)
  // Bonus if multiple sources agree on same identity
  const sourceCount = candidate.sources?.length || 1;
  const sourceBonus = Math.min(sourceCount * 3, 10);
  factors.push({
    factor: 'corroboration',
    score: sourceBonus,
    max_score: 10,
    detail: `Found in ${sourceCount} source(s)`,
  });
  
  const total = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));
  
  return { total, factors };
}

function scoreNameMatch(query: JurorSearchQuery, candidate: DataSourceMatch): ScoreFactor {
  const qFirst = (query.first_name || '').toLowerCase();
  const qLast = (query.last_name || '').toLowerCase();
  const cFirst = (candidate.first_name || '').toLowerCase();
  const cLast = (candidate.last_name || '').toLowerCase();
  
  let score = 0;
  const details: string[] = [];
  
  // Last name (more important)
  if (qLast === cLast) {
    score += 20;
    details.push('Last name exact');
  } else if (metaphone(qLast) === metaphone(cLast)) {
    score += 12;
    details.push('Last name phonetic match');
  } else if (levenshtein(qLast, cLast) <= 2) {
    score += 8;
    details.push('Last name similar');
  }
  
  // First name
  if (qFirst === cFirst) {
    score += 15;
    details.push('First name exact');
  } else if (metaphone(qFirst) === metaphone(cFirst)) {
    score += 10;
    details.push('First name phonetic match');
  } else if (levenshtein(qFirst, cFirst) <= 2) {
    score += 6;
    details.push('First name similar');
  } else if (qFirst[0] === cFirst[0]) {
    score += 3;
    details.push('First initial matches');
  }
  
  return {
    factor: 'name',
    score,
    max_score: 40,
    detail: details.join('; ') || 'No name match',
  };
}
```

### 3. Entity Linking

Determine which results from different sources refer to the same person.

```typescript
function clusterMatches(matches: DataSourceMatch[]): DataSourceMatch[][] {
  // Union-Find data structure
  const parent = new Map<string, string>();
  
  function find(id: string): string {
    if (!parent.has(id)) parent.set(id, id);
    if (parent.get(id) !== id) {
      parent.set(id, find(parent.get(id)!));
    }
    return parent.get(id)!;
  }
  
  function union(a: string, b: string) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent.set(rootA, rootB);
    }
  }
  
  // Compare each pair of matches
  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      if (shouldLink(matches[i], matches[j])) {
        union(matchId(matches[i]), matchId(matches[j]));
      }
    }
  }
  
  // Group by root
  const clusters = new Map<string, DataSourceMatch[]>();
  for (const match of matches) {
    const root = find(matchId(match));
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(match);
  }
  
  return Array.from(clusters.values());
}

function shouldLink(a: DataSourceMatch, b: DataSourceMatch): boolean {
  // Strong links (any one is sufficient)
  if (a.emails?.some(e => b.emails?.includes(e))) return true;
  if (a.phones?.some(p => b.phones?.includes(p))) return true;
  if (a.dob && b.dob && a.dob === b.dob && sameLastName(a, b)) return true;
  
  // Moderate links (need multiple)
  let linkStrength = 0;
  
  if (sameLastName(a, b)) linkStrength += 2;
  if (sameFirstName(a, b)) linkStrength += 2;
  if (similarAge(a, b, 2)) linkStrength += 1;
  if (sameCity(a, b)) linkStrength += 1;
  if (sameAddress(a, b)) linkStrength += 3;
  
  return linkStrength >= 5;
}

function matchId(m: DataSourceMatch): string {
  return `${m.source_id}:${m.source_record_id}`;
}
```

### 4. OCR Post-Processing

Clean up OCR output for juror extraction.

```typescript
interface OCRExtractionResult {
  jurors: ExtractedJuror[];
  raw_text: string;
  document_type: 'jury_list' | 'questionnaire' | 'notes';
}

function postProcessOCR(ocrResult: AzureOCRResponse, documentType: string): OCRExtractionResult {
  // Strategy depends on document type
  switch (documentType) {
    case 'jury_list':
      return extractFromTable(ocrResult);
    case 'questionnaire':
      return extractFromForm(ocrResult);
    case 'notes':
      return extractFromFreeform(ocrResult);
    default:
      return extractFromFreeform(ocrResult);
  }
}

function extractFromTable(ocr: AzureOCRResponse): OCRExtractionResult {
  const jurors: ExtractedJuror[] = [];
  
  // Azure Document Intelligence returns structured tables
  for (const table of ocr.tables || []) {
    // Find header row to identify columns
    const headers = identifyHeaders(table.rows[0]);
    
    // Process data rows
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      const juror = mapRowToJuror(row, headers);
      if (juror && juror.raw_name) {
        jurors.push(juror);
      }
    }
  }
  
  return {
    jurors,
    raw_text: ocr.content,
    document_type: 'jury_list',
  };
}

function cleanOCRText(text: string): string {
  return text
    .replace(/[|]/g, 'I')        // Common OCR error: | for I
    .replace(/[0O]/g, m => {     // Context-sensitive 0/O
      // In names, probably O; in numbers, probably 0
      return m; // Would need context
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateFieldConfidence(
  rawValue: string,
  fieldType: 'name' | 'age' | 'city' | 'occupation'
): number {
  let confidence = 100;
  
  // Penalize for suspicious characters
  const suspiciousChars = rawValue.match(/[^a-zA-Z0-9\s\-\'\.]/g);
  if (suspiciousChars) {
    confidence -= suspiciousChars.length * 10;
  }
  
  // Field-specific validation
  switch (fieldType) {
    case 'name':
      if (!/^[A-Za-z]/.test(rawValue)) confidence -= 30;
      if (rawValue.length < 2) confidence -= 40;
      break;
    case 'age':
      const age = parseInt(rawValue);
      if (isNaN(age) || age < 18 || age > 100) confidence -= 50;
      break;
    case 'city':
      // Could validate against known city list
      break;
  }
  
  return Math.max(0, confidence);
}
```

---

## Edge Cases to Handle

### Search

| Case | Handling |
|------|----------|
| No results found | Show "No matches found" with option to retry with fewer constraints |
| Too many results (>20) | Show top 20 by confidence, offer to refine search |
| All low confidence (<50%) | Flag all as "needs verification" |
| API timeout | Return partial results, indicate which sources failed |
| API rate limit | Queue and retry, show "results pending" |
| Common name (John Smith) | Require additional details (age, city) before searching |

### OCR

| Case | Handling |
|------|----------|
| Handwritten text | Route to vision LLM (GPT-4o/Claude) instead of standard OCR |
| Rotated image | Auto-detect and correct orientation |
| Multi-column layout | Detect columns, process separately |
| Poor image quality | Warn user, suggest retake, still attempt processing |
| Mixed printed/handwritten | Process printed first, flag handwritten for review |
| Non-English names | Ensure Unicode handling, may need specialized OCR |

### Collaboration

| Case | Handling |
|------|----------|
| Same juror edited by two users | Last write wins for fields, merge notes |
| User goes offline mid-edit | Queue changes, sync on reconnect |
| Stale data displayed | WebSocket push updates, optimistic UI refresh |
| Two users confirm different candidates | Allow (each sees their own confirmation), but warn |

### Data Quality

| Case | Handling |
|------|----------|
| Voter record has wrong age | Trust more recent source, flag discrepancy |
| Social profile is private | Note "profile found but private", link for manual check |
| Person deceased | If death record found, note it clearly |
| Candidate is a minor | Should not appear in jury pool, flag as data error |

---

## AI Coding Assistant Tips

### When Using Cursor, Copilot, Claude, etc.

**1. Provide Context Files**

Always include these docs in context when asking for implementation:
- `OVERVIEW.md` — For understanding the domain
- `DATA_MODELS.md` — For type definitions
- `API_SPEC.md` — For endpoint signatures

Example prompt:
```
Given the data models in DATA_MODELS.md and API spec in API_SPEC.md,
implement the POST /jurors endpoint handler that:
1. Validates the request body
2. Parses the full_name into components
3. Creates the Juror record
4. Optionally triggers a search job
5. Returns the created juror with 201 status
```

**2. Request Tests Alongside Implementation**

```
Implement the confidence scoring function from IMPLEMENTATION_GUIDE.md.
Include unit tests for these cases:
- Exact name match
- Phonetic name match (Smith vs Smyth)
- Age within 2 years
- Age differs by 10 years
- Same city
- Different city, same state
```

**3. Specify Error Handling**

```
Implement the search orchestrator that fans out to multiple data sources.
Handle these error cases:
- One source times out (continue with others)
- One source returns error (log and continue)
- All sources fail (return error to client)
- Partial results after timeout (return what we have)
```

**4. Ask for Incremental Complexity**

Don't ask for everything at once. Build up:

```
Step 1: "Implement a mock data source adapter that returns hardcoded results"
Step 2: "Now implement the Pipl adapter using their API docs"
Step 3: "Now implement the orchestrator that queries both in parallel"
Step 4: "Add retry logic for failed requests"
```

**5. Use Specific Examples**

```
Implement the name parser. Here are test cases:

Input: "Garcia, Maria L"
Output: { first_name: "Maria", last_name: "Garcia", middle_name: "L" }

Input: "JOHN SMITH JR"
Output: { first_name: "John", last_name: "Smith", suffix: "Jr" }

Input: "María Elena García-Rodríguez"
Output: { first_name: "María", middle_name: "Elena", last_name: "García-Rodríguez" }
```

**6. Request Type Safety**

```
Implement the Juror creation endpoint using TypeScript.
Use the Juror interface from DATA_MODELS.md.
Ensure all inputs are validated with zod schemas.
Return proper error types for validation failures.
```

**7. Ask About Edge Cases**

```
What edge cases should I handle in the entity linking algorithm?
Consider: same name different people, name variations,
data source disagreements, missing fields.
```

---

## Sample Test Data

### Mock Jurors (for testing)

```json
[
  {
    "full_name": "Maria L Garcia",
    "age": 42,
    "city": "Houston",
    "occupation": "Teacher"
  },
  {
    "full_name": "John Smith",
    "age": 35,
    "city": "Austin",
    "occupation": "Software Engineer"
  },
  {
    "full_name": "Sarah Johnson-Williams",
    "age": 58,
    "city": "Houston",
    "occupation": "Retired"
  },
  {
    "full_name": "David Lee Jr",
    "age": 29,
    "city": "Katy",
    "occupation": "Sales Manager"
  },
  {
    "full_name": "José Rodríguez",
    "age": 45,
    "city": "Sugar Land",
    "occupation": "Small Business Owner"
  }
]
```

### Mock Voter Records (for venue pre-loading tests)

```json
[
  {
    "full_name": "Garcia, Maria Lucia",
    "dob": "1982-03-15",
    "address": "1234 Main St",
    "city": "Houston",
    "zip": "77001",
    "party": "Democratic",
    "registration_date": "2008-09-15",
    "vote_history": ["2024-11-05 General", "2024-03-05 Primary", "2022-11-08 General"]
  }
]
```

### Mock FEC Donations (for search tests)

```json
[
  {
    "donor_name": "Garcia, Maria L",
    "city": "Houston",
    "state": "TX",
    "zip": "77001",
    "employer": "Houston ISD",
    "occupation": "Teacher",
    "recipient_name": "Beto for Texas",
    "amount": 250,
    "date": "2022-09-15"
  },
  {
    "donor_name": "Garcia, Maria L",
    "city": "Houston",
    "state": "TX",
    "zip": "77001",
    "employer": "Houston ISD",
    "occupation": "Teacher",
    "recipient_name": "Biden Victory Fund",
    "amount": 250,
    "date": "2020-10-01"
  }
]
```

---

## Common Pitfalls

1. **Over-engineering the first version**: Start with mock data and one data source. Add complexity incrementally.

2. **Ignoring Unicode**: Names have accents, apostrophes, hyphens. Test with "José O'Brien-García".

3. **Blocking on slow sources**: Always use timeouts and return partial results.

4. **Not handling offline**: Test with airplane mode regularly.

5. **Exposing raw data**: Never show raw voter file data to users. Only show aggregated insights.

6. **Ignoring rate limits**: People search APIs are expensive. Cache aggressively.

7. **Assuming OCR is accurate**: Always show confidence scores and allow editing.

8. **Forgetting audit logs**: Every search must be logged. Build this in from day one.
