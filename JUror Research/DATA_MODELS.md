# Juror Research Tool — Data Models

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Venue       │       │     Juror       │       │    Candidate    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ name            │◄──────│ venue_id        │       │ juror_id        │
│ state           │       │ case_id (ext)   │───────│ confidence_score│
│ county          │       │ full_name       │       │ source          │
│ federal_district│       │ first_name      │   ┌──▶│ is_confirmed    │
└─────────────────┘       │ last_name       │   │   │ confirmed_by    │
        │                 │ age             │   │   │ profile_data    │
        │                 │ city            │   │   └─────────────────┘
        ▼                 │ occupation      │   │
┌─────────────────┐       │ address         │   │   ┌─────────────────┐
│  VenueDataset   │       │ email           │   │   │  CandidateSource│
├─────────────────┤       │ phone           │   │   ├─────────────────┤
│ id              │       │ status          │   │   │ id              │
│ venue_id        │       │ created_by      │   │   │ candidate_id    │
│ dataset_type    │       │ created_at      │   │   │ source_type     │
│ record_count    │       └─────────────────┘   │   │ source_id       │
│ last_refreshed  │               │             │   │ raw_data        │
│ status          │               │             │   │ fetched_at      │
└─────────────────┘               │             │   └─────────────────┘
                                  │             │
┌─────────────────┐               │             │
│    Capture      │───────────────┘             │
├─────────────────┤                             │
│ id              │       ┌─────────────────┐   │
│ case_id (ext)   │       │   JurorNote     │   │
│ document_type   │       ├─────────────────┤   │
│ image_urls[]    │       │ id              │   │
│ ocr_result      │       │ juror_id        │───┘
│ extracted_jurors│       │ content         │
│ status          │       │ note_type       │
│ created_by      │       │ created_by      │
│ created_at      │       │ created_at      │
│ processed_at    │       └─────────────────┘
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  VoterRecord    │       │   FECDonation   │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ venue_id        │       │ venue_id        │
│ full_name       │       │ donor_name      │
│ first_name      │       │ city            │
│ last_name       │       │ state           │
│ dob             │       │ zip             │
│ address         │       │ employer        │
│ city            │       │ occupation      │
│ party           │       │ recipient       │
│ registration_dt │       │ amount          │
│ vote_history    │       │ date            │
└─────────────────┘       └─────────────────┘
```

---

## Core Entities

### Juror

The subject of research. Created via manual entry, CSV import, or OCR extraction.

```typescript
interface Juror {
  id: string;                    // UUID
  case_id: string;               // External reference to parent app's case
  venue_id: string;              // Reference to Venue
  
  // Input fields
  full_name: string;             // As provided (may need parsing)
  first_name?: string;           // Parsed or entered
  last_name?: string;            // Parsed or entered
  middle_name?: string;
  suffix?: string;               // Jr, Sr, III, etc.
  
  age?: number;                  // Age or DOB, not both required
  dob?: string;                  // ISO date
  city?: string;
  occupation?: string;
  employer?: string;
  address?: string;              // Full street address if known
  email?: string;
  phone?: string;
  
  // State
  status: 'pending' | 'searching' | 'candidates_found' | 'matched' | 'no_results' | 'error';
  search_started_at?: string;    // ISO datetime
  search_completed_at?: string;
  
  // Source tracking
  source: 'manual' | 'csv_import' | 'ocr_extraction';
  capture_id?: string;           // If from OCR
  
  // Metadata
  created_by: string;            // User ID from parent app
  created_at: string;            // ISO datetime
  updated_at: string;
}
```

### Candidate

A potential identity match from data sources.

```typescript
interface Candidate {
  id: string;                    // UUID
  juror_id: string;              // Reference to Juror
  
  // Identity
  full_name: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  dob?: string;
  
  // Location
  city?: string;
  state?: string;
  address?: string;
  addresses?: Address[];         // Historical addresses
  
  // Professional
  occupation?: string;
  employer?: string;
  
  // Contact
  emails?: string[];
  phones?: string[];
  
  // Profile photo (for visual confirmation)
  photo_url?: string;
  photo_source?: string;         // 'linkedin', 'facebook', etc.
  
  // Scoring
  confidence_score: number;      // 0-100
  score_factors: ScoreFactor[];  // Breakdown of what contributed to score
  
  // Confirmation
  is_confirmed: boolean;
  confirmed_by?: string;         // User ID
  confirmed_at?: string;
  
  // Aggregated data (populated after confirmation or on-demand)
  profile?: AggregatedProfile;
  
  // Metadata
  created_at: string;
}

interface ScoreFactor {
  factor: string;                // 'name_exact', 'age_match', 'city_match', etc.
  score: number;                 // Contribution to total
  detail?: string;               // Human-readable explanation
}

interface Address {
  full_address: string;
  city: string;
  state: string;
  zip: string;
  type?: 'current' | 'historical';
  last_seen?: string;
}
```

### AggregatedProfile

The comprehensive profile assembled from multiple sources for a confirmed match.

```typescript
interface AggregatedProfile {
  candidate_id: string;
  
  // Social media
  social_profiles: SocialProfile[];
  
  // Political
  voter_registration?: VoterInfo;
  political_donations: Donation[];
  
  // Legal
  court_cases: CourtCase[];
  
  // Professional
  professional_licenses?: License[];
  linkedin_summary?: string;
  
  // News & mentions
  news_mentions: NewsMention[];
  
  // Property
  property_records?: PropertyRecord[];
  
  // Metadata
  sources_searched: string[];
  last_updated: string;
}

interface SocialProfile {
  platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'other';
  url: string;
  username?: string;
  bio?: string;
  photo_url?: string;
  follower_count?: number;
  last_active?: string;
  notable_content?: string[];    // Relevant posts/comments (summarized, not full text)
}

interface VoterInfo {
  party: string;
  registration_date: string;
  status: 'active' | 'inactive';
  vote_history: VoteRecord[];    // Which elections they voted in (not how they voted)
}

interface VoteRecord {
  election: string;              // "2024 General", "2022 Primary", etc.
  date: string;
  voted: boolean;
}

interface Donation {
  date: string;
  amount: number;
  recipient: string;
  recipient_party?: string;
  employer_listed?: string;
  occupation_listed?: string;
}

interface CourtCase {
  case_number: string;
  court: string;
  case_type: 'civil' | 'criminal' | 'family' | 'bankruptcy' | 'other';
  role: 'plaintiff' | 'defendant' | 'petitioner' | 'respondent' | 'other';
  filed_date: string;
  status: string;
  summary?: string;
}

interface NewsMention {
  headline: string;
  source: string;
  date: string;
  url: string;
  snippet: string;
  relevance: 'direct' | 'possible';  // Is this definitely them or just same name?
}
```

### Capture

A photographed/scanned document.

```typescript
interface Capture {
  id: string;                    // UUID
  case_id: string;               // External reference
  
  // Document info
  document_type: 'single_questionnaire' | 'jury_list' | 'handwritten_notes' | 'other';
  page_count: number;
  
  // Images
  images: CaptureImage[];
  
  // Processing
  status: 'pending' | 'uploading' | 'processing' | 'review' | 'completed' | 'error';
  ocr_provider?: 'azure' | 'google' | 'vision_llm';
  ocr_raw_result?: object;       // Raw response from OCR service
  
  // Extracted data
  extracted_jurors: ExtractedJuror[];
  
  // Metadata
  created_by: string;
  created_at: string;
  uploaded_at?: string;          // When images finished uploading (may differ if offline)
  processed_at?: string;
}

interface CaptureImage {
  sequence: number;              // Page order
  original_url: string;          // Full resolution
  thumbnail_url?: string;
  width: number;
  height: number;
  size_bytes: number;
}

interface ExtractedJuror {
  // Raw extracted text
  raw_name: string;
  raw_age?: string;
  raw_city?: string;
  raw_occupation?: string;
  raw_address?: string;
  
  // Parsed/cleaned values
  parsed_name?: string;
  parsed_first_name?: string;
  parsed_last_name?: string;
  parsed_age?: number;
  parsed_city?: string;
  parsed_occupation?: string;
  
  // Quality indicators
  confidence: number;            // 0-100, overall extraction confidence
  field_confidences: Record<string, number>;  // Per-field confidence
  needs_review: boolean;         // Flag for human review
  
  // Link to created Juror (after user confirms extraction)
  juror_id?: string;
}
```

### Venue

A court jurisdiction with pre-loaded data.

```typescript
interface Venue {
  id: string;
  name: string;                  // "Travis County, TX"
  state: string;
  county?: string;
  federal_district?: string;     // "Western District of Texas"
  
  // Pre-loaded data status
  datasets: VenueDataset[];
  
  created_at: string;
  updated_at: string;
}

interface VenueDataset {
  id: string;
  venue_id: string;
  dataset_type: 'voter' | 'fec' | 'court' | 'property';
  
  record_count: number;
  storage_bytes: number;
  
  status: 'pending' | 'loading' | 'ready' | 'error' | 'stale';
  last_refreshed?: string;
  next_refresh?: string;
  error_message?: string;
}
```

---

## Pre-loaded Record Entities

These are the actual records stored locally for fast venue-based lookups.

### VoterRecord

```typescript
interface VoterRecord {
  id: string;
  venue_id: string;
  
  // Name (multiple formats for matching)
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  
  // Demographics
  dob?: string;
  age_computed?: number;         // Pre-computed for fast filtering
  
  // Address
  address: string;
  city: string;
  zip: string;
  
  // Registration
  party?: string;
  registration_date?: string;
  status: 'active' | 'inactive' | 'purged';
  
  // Vote history (which elections, not choices)
  vote_history: string[];        // ["2024-11-05 General", "2024-03-05 Primary", ...]
  
  // Search optimization (computed fields)
  name_tokens: string[];         // For full-text search
  name_metaphone: string;        // For phonetic matching
}
```

### FECDonation

```typescript
interface FECDonation {
  id: string;
  venue_id?: string;             // May be null for national-level storage
  
  // Donor info
  donor_name: string;
  first_name?: string;
  last_name?: string;
  city: string;
  state: string;
  zip: string;
  employer?: string;
  occupation?: string;
  
  // Donation info
  recipient_name: string;
  recipient_id: string;          // FEC committee ID
  recipient_type: 'candidate' | 'pac' | 'party' | 'other';
  recipient_party?: string;
  
  amount: number;
  date: string;
  
  // Search optimization
  name_tokens: string[];
  name_metaphone: string;
}
```

---

## Collaboration Entities

### Presence

Tracks who's actively viewing a case (ephemeral, not persisted long-term).

```typescript
interface Presence {
  user_id: string;
  user_name: string;
  case_id: string;
  
  status: 'active' | 'idle';
  current_view?: string;         // 'juror_list' | 'juror_detail:123' | 'capture'
  current_juror_id?: string;     // If viewing a specific juror
  
  last_heartbeat: string;        // ISO datetime
}
```

### JurorNote

Notes attached to jurors by team members.

```typescript
interface JurorNote {
  id: string;
  juror_id: string;
  
  content: string;
  note_type: 'general' | 'flag' | 'question' | 'strategy';
  
  // Flags for quick filtering
  is_flagged: boolean;
  flag_reason?: 'concern' | 'favorable' | 'strike' | 'keep';
  
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

---

## Audit Entity

```typescript
interface AuditEvent {
  id: string;
  
  // What happened
  event_type: 'juror_search' | 'candidate_confirmed' | 'profile_viewed' | 'capture_created' | 'export';
  
  // Context
  case_id: string;
  juror_id?: string;
  candidate_id?: string;
  capture_id?: string;
  
  // Who
  user_id: string;
  
  // Details
  details?: object;              // Event-specific data
  
  // When
  timestamp: string;
}
```

---

## Indexes & Query Patterns

### Primary Query Patterns

| Query | Fields | Notes |
|-------|--------|-------|
| Jurors by case | `case_id` | Primary listing |
| Juror by ID | `id` | Detail view |
| Candidates by juror | `juror_id` | Results listing |
| Voter records by name + venue | `venue_id`, `name_tokens`, `age_computed` | Fast local lookup |
| FEC donations by name + location | `name_tokens`, `state`, `city` | Donation search |
| Captures by case | `case_id`, `status` | Document queue |
| Presence by case | `case_id` | Real-time collaboration |
| Audit by case + time | `case_id`, `timestamp` | Compliance reporting |

### Search Optimization

For voter and FEC records, support both:
1. **Exact matching**: First + last name with filters
2. **Fuzzy matching**: Phonetic (Metaphone/Soundex) for misspellings
3. **Full-text**: Tokenized name search for partial matches

Example query for "Maria Garcia, ~42 years old, Houston":
```
WHERE venue_id = 'harris-county-tx'
  AND (
    (first_name = 'Maria' AND last_name = 'Garcia')
    OR name_metaphone = metaphone('Maria Garcia')
  )
  AND age_computed BETWEEN 39 AND 45
  AND city ILIKE '%houston%'
ORDER BY 
  CASE WHEN first_name = 'Maria' AND last_name = 'Garcia' THEN 0 ELSE 1 END,
  ABS(age_computed - 42)
LIMIT 20
```
