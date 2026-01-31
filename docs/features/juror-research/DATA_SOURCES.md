# Juror Research Tool — Data Sources

## Overview

The juror research tool aggregates data from multiple sources to build comprehensive profiles. Sources are organized into tiers by speed and reliability.

---

## Source Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCE TIERS                               │
│                                                                         │
│  TIER 1: Instant (<100ms)                                              │
│  ┌─────────────────┐  ┌─────────────────┐                              │
│  │ Local Voter     │  │ Local FEC       │                              │
│  │ Records         │  │ Donations       │                              │
│  └─────────────────┘  └─────────────────┘                              │
│  Pre-loaded into local database for selected venues                     │
│                                                                         │
│  TIER 2: Fast (1-3s)                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ People Search   │  │ Whitepages Pro  │  │ Professional    │        │
│  │ APIs            │  │                 │  │ Networks        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│  Aggregated identity APIs with broad coverage                           │
│                                                                         │
│  TIER 3: Medium (2-5s)                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Social Media    │  │ News APIs       │  │ FEC API         │        │
│  │ (Public)        │  │                 │  │ (Live)          │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│  Platform-specific queries, may require multiple calls                  │
│                                                                         │
│  TIER 4: Slower (5-30s)                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Court Records   │  │ Professional    │  │ Property        │        │
│  │ (PACER, State)  │  │ Licenses        │  │ Records         │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│  Government databases with varying response times                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tier 1: Pre-Loaded Local Data

### Voter Registration Records

**Source**: State Secretary of State / County Clerk bulk exports

**Data available**:
- Full name (parsed into components)
- Date of birth or age
- Residential address
- Party affiliation
- Registration date
- Vote history (which elections, not how they voted)

**Coverage**: Varies by state. Most states provide bulk voter file access.

**Refresh cadence**: Monthly

**Integration approach**:
```
1. Identify target venues (counties where firm frequently practices)
2. Obtain bulk voter file (purchase or FOIA request depending on state)
3. Parse and normalize into standard schema
4. Load into PostgreSQL with search indexes
5. Schedule monthly refresh
```

**Privacy/legal notes**:
- Voter files are public records in most states
- Some states restrict commercial use — verify per-state
- Never expose raw voter data to end users; use only for matching

### FEC Donation Records

**Source**: FEC bulk data downloads (https://www.fec.gov/data/browse-data/?tab=bulk-data)

**Data available**:
- Donor name
- City, state, zip
- Employer and occupation
- Recipient (candidate, PAC, party)
- Amount and date

**Coverage**: All federal campaign contributions over $200

**Refresh cadence**: Quarterly (FEC updates regularly)

**Integration approach**:
```
1. Download individual contributions bulk file
2. Filter to target states/venues (optional, or load national)
3. Parse and normalize
4. Build name search indexes
5. Schedule quarterly refresh
```

**Notes**:
- FEC data is fully public
- State/local donations require separate state-level sources
- Very useful for identifying political leanings

---

## Tier 2: People Search APIs

These APIs aggregate data from multiple sources and provide unified identity resolution.

### Option A: Pipl

**Website**: https://pipl.com

**Data available**:
- Names, aliases
- Addresses (current and historical)
- Phone numbers, emails
- Social profile links
- Employment history
- Education
- Age/DOB

**Strengths**:
- Excellent coverage
- Good identity resolution
- Returns social profile URLs

**Pricing**: Enterprise pricing, contact for quote. Typically $0.05-0.20 per search.

**Rate limits**: Varies by plan

### Option B: FullContact

**Website**: https://www.fullcontact.com

**Data available**:
- Similar to Pipl
- Strong on social profiles
- Professional information

**Strengths**:
- Good API design
- Fast response times

**Pricing**: Tiered plans, identity resolution ~$0.01-0.10 per call

### Option C: Whitepages Pro

**Website**: https://pro.whitepages.com

**Data available**:
- Name, address, phone
- Associates (family, roommates)
- Property ownership
- Criminal records (some)

**Strengths**:
- Deep address history
- Good for locating correct person among common names

**Pricing**: Per-search pricing, ~$0.10-0.50 depending on depth

### Integration Pattern for People Search APIs

```typescript
interface PeopleSearchAdapter {
  name: string;  // 'pipl', 'fullcontact', 'whitepages'
  
  search(query: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    city?: string;
    state?: string;
    age?: number;
    email?: string;
    phone?: string;
  }): Promise<PeopleSearchResult[]>;
}

interface PeopleSearchResult {
  source: string;
  confidence: number;
  
  // Identity
  name: string;
  first_name?: string;
  last_name?: string;
  aliases?: string[];
  
  // Demographics
  age?: number;
  dob?: string;
  gender?: string;
  
  // Location
  current_address?: Address;
  historical_addresses?: Address[];
  
  // Contact
  phones?: string[];
  emails?: string[];
  
  // Social
  social_profiles?: {
    platform: string;
    url: string;
    username?: string;
  }[];
  
  // Professional
  employment?: {
    employer: string;
    title?: string;
    current: boolean;
  }[];
  education?: {
    school: string;
    degree?: string;
    year?: number;
  }[];
  
  // Raw response for debugging
  raw: object;
}
```

---

## Tier 3: Platform-Specific Sources

### Social Media (Public Profiles Only)

**Important**: Only access publicly available information. No scraping of private content.

#### LinkedIn (via search)
- Limited without Sales Navigator API
- Can search for profile URL if name + employer known
- Manual verification often required

#### Facebook (limited)
- Public profile search is restricted
- May get results from people search APIs instead

#### Twitter/X
- Public profile search available
- API access for public tweets

**Integration approach**:
- Rely primarily on people search APIs for social profile URLs
- Display URLs for manual review rather than automated scraping
- Consider Phantombuster or similar for structured social lookups (verify ToS compliance)

### News APIs

#### Option A: NewsAPI.org
- Good for recent news
- Limited historical depth
- Free tier available

#### Option B: Google News API (via Custom Search)
- Broader coverage
- Requires Google Cloud setup

#### Option C: Bing News Search
- Good coverage
- Azure Cognitive Services

**Query pattern**:
```
"{first_name} {last_name}" "{city}" -obituary
```

**Important**: News results often match wrong person. Flag as "possible mention" and require human verification.

### FEC API (Live)

**URL**: https://api.open.fec.gov/

**Use case**: Real-time queries when venue not pre-loaded

**Endpoints**:
- `/schedules/schedule_a/` — Individual contributions

**Example query**:
```
GET https://api.open.fec.gov/v1/schedules/schedule_a/
  ?contributor_name=Garcia,Maria
  &contributor_city=Houston
  &contributor_state=TX
  &api_key=YOUR_KEY
```

---

## Tier 4: Government & Official Records

### Court Records

#### PACER (Federal)
- **URL**: https://pacer.uscourts.gov
- **Coverage**: All federal court cases
- **Pricing**: $0.10/page, first $30/quarter free
- **Integration**: PACER API or screen scraping (unofficial)
- **Data**: Case filings, party names, docket entries

#### State Courts
- Varies dramatically by state
- Some have APIs, many require screen scraping
- Consider vendors like CourtListener (free) or LexisNexis (paid)

**Integration approach**:
- Start with CourtListener for federal and supported states
- Add state-specific integrations for high-priority venues
- Store case summaries, not full documents

### Professional Licenses

**Sources**: State licensing boards (medical, legal, real estate, etc.)

**Integration**: State-by-state, many have searchable databases

**Useful for**: Verifying occupation claims

### Property Records

**Sources**: County assessor/recorder offices

**Data**: Property ownership, purchase price, mortgage info

**Integration**: 
- Some counties have APIs
- Services like CoreLogic aggregate across counties (expensive)
- Lower priority — useful but not critical for voir dire

---

## Search Orchestration

### Parallel Fan-Out Pattern

When a juror search is triggered:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH ORCHESTRATOR                          │
│                                                                 │
│  Input: Juror { name: "Maria Garcia", age: 42, city: "Houston" }│
│                                                                 │
│         ┌─────────────────────────────────────────────┐        │
│         │            PARALLEL FAN-OUT                  │        │
│         │                                             │        │
│    ┌────┴────┐  ┌────────┐  ┌────────┐  ┌────────┐  │        │
│    │ Local   │  │ Local  │  │ Pipl   │  │ News   │  │        │
│    │ Voter   │  │ FEC    │  │        │  │ API    │  │        │
│    └────┬────┘  └────┬───┘  └────┬───┘  └───┬────┘  │        │
│         │            │           │          │        │        │
│         │  <100ms    │  <100ms   │  1-2s    │ 2-3s   │        │
│         │            │           │          │        │        │
│         └────────────┴───────────┴──────────┘        │        │
│                          │                            │        │
│                          ▼                            │        │
│                ┌─────────────────┐                   │        │
│                │ MERGE & SCORE   │                   │        │
│                │ (entity linking)│                   │        │
│                └────────┬────────┘                   │        │
│                         │                            │        │
│                         ▼                            │        │
│              ┌──────────────────────┐               │        │
│              │ Return Candidates    │               │        │
│              │ (sorted by score)    │               │        │
│              └──────────────────────┘               │        │
│                                                     │        │
└─────────────────────────────────────────────────────┘        │
```

### Source Priority Order

1. **Always query** (in parallel):
   - Local voter records (if venue pre-loaded)
   - Local FEC records (if venue pre-loaded)
   - Primary people search API (Pipl or equivalent)

2. **Query if time permits** (<3 second budget remaining):
   - FEC API (if not pre-loaded)
   - News API

3. **Query on-demand** (after initial results, user-triggered):
   - Court records (PACER)
   - Professional licenses
   - Property records

### Timeout Handling

```typescript
const SEARCH_CONFIG = {
  // Total time budget for initial search
  total_timeout_ms: 5000,
  
  // Per-source timeouts
  source_timeouts: {
    local_voter: 500,
    local_fec: 500,
    pipl: 3000,
    fullcontact: 3000,
    whitepages: 3000,
    fec_api: 3000,
    news_api: 3000,
    pacer: 10000,  // Only used on-demand
  },
  
  // Return results when either:
  // - All sources complete
  // - Total timeout reached
  // - At least N sources complete AND 2 seconds elapsed
  early_return_sources: 3,
  early_return_min_time_ms: 2000,
};
```

---

## Data Source Adapter Interface

Each data source implements this interface:

```typescript
interface DataSourceAdapter {
  // Unique identifier
  id: string;  // 'local_voter', 'pipl', 'fec_api', etc.
  
  // Display name
  name: string;
  
  // Which tier (affects timeout and priority)
  tier: 1 | 2 | 3 | 4;
  
  // Can this source be queried?
  isAvailable(venue_id?: string): Promise<boolean>;
  
  // Execute search
  search(query: JurorSearchQuery): Promise<DataSourceResult>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

interface JurorSearchQuery {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  age?: number;
  dob?: string;
  city?: string;
  state?: string;
  address?: string;
  occupation?: string;
  employer?: string;
  email?: string;
  phone?: string;
  
  venue_id?: string;
}

interface DataSourceResult {
  source_id: string;
  success: boolean;
  error?: string;
  duration_ms: number;
  
  // Raw matches from this source
  matches: DataSourceMatch[];
}

interface DataSourceMatch {
  // For entity linking across sources
  source_id: string;
  source_record_id: string;
  
  // Matching confidence from this source (0-100)
  source_confidence: number;
  
  // Identity fields
  name?: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  dob?: string;
  
  // Location
  city?: string;
  state?: string;
  address?: string;
  addresses?: Address[];
  
  // Contact
  phones?: string[];
  emails?: string[];
  
  // Source-specific data
  voter_info?: VoterInfo;
  donations?: Donation[];
  social_profiles?: SocialProfile[];
  court_cases?: CourtCase[];
  news_mentions?: NewsMention[];
  
  // Photo if available
  photo_url?: string;
}
```

---

## Entity Linking / Merging

When multiple sources return results, we need to determine which records refer to the same person.

### Linking Signals

| Signal | Weight | Notes |
|--------|--------|-------|
| Exact name match | High | First + Last exact |
| Phonetic name match | Medium | Handles misspellings |
| Same DOB | Very High | Near-certain match |
| Same address | High | Current or historical |
| Age within 2 years | Medium | Combined with name |
| Same city | Low | Common, but supportive |
| Same employer | Medium | Good signal |
| Same phone/email | Very High | Near-certain match |
| Cross-source ID link | Very High | e.g., Pipl returns same ID |

### Merge Logic

```typescript
function mergeMatches(matches: DataSourceMatch[]): Candidate[] {
  // Group matches that likely refer to same person
  const clusters = clusterByIdentity(matches);
  
  return clusters.map(cluster => {
    // Merge fields, preferring higher-confidence sources
    const merged = mergeFields(cluster);
    
    // Calculate overall confidence
    const confidence = calculateConfidence(cluster, merged);
    
    return {
      ...merged,
      confidence_score: confidence,
      sources: cluster.map(m => m.source_id),
    };
  });
}

function clusterByIdentity(matches: DataSourceMatch[]): DataSourceMatch[][] {
  // Use Union-Find or similar to cluster
  // Two matches cluster together if they share:
  // - Same phone or email (strong link)
  // - Same name + same DOB (strong link)
  // - Same name + same address (strong link)
  // - Same name + age within 2 years + same city (weak link, require 2+)
}
```

---

## Rate Limiting & Cost Management

### Per-Source Limits

| Source | Rate Limit | Cost | Notes |
|--------|------------|------|-------|
| Local voter | Unlimited | $0 | Local DB |
| Local FEC | Unlimited | $0 | Local DB |
| Pipl | 10 req/sec | ~$0.10/req | Check plan |
| FullContact | 600 req/min | ~$0.05/req | Check plan |
| FEC API | 1000/hour | $0 | Free API |
| News API | 100/day (free) | Varies | May need paid |
| PACER | No limit | $0.10/page | Cost adds up |

### Cost Control Strategy

1. **Pre-loading**: Reduces API calls for frequently-used venues
2. **Caching**: Cache results for 24-48 hours
3. **Tiered fetching**: Only fetch Tier 4 sources on-demand
4. **Batch optimization**: Group queries where possible
5. **Budget alerts**: Monitor spend per case/client

---

## Testing & Mocking

For development and testing, implement mock adapters:

```typescript
class MockVoterAdapter implements DataSourceAdapter {
  id = 'mock_voter';
  name = 'Mock Voter Records';
  tier = 1;
  
  async search(query: JurorSearchQuery): Promise<DataSourceResult> {
    // Return synthetic data based on query
    return {
      source_id: this.id,
      success: true,
      duration_ms: 50,
      matches: generateMockVoterMatches(query),
    };
  }
}
```

Include sample data files:
- `mock_data/voters.json` — Sample voter records
- `mock_data/fec_donations.json` — Sample FEC data
- `mock_data/people_search_responses.json` — Sample Pipl/FullContact responses
