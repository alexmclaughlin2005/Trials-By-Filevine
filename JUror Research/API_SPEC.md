# Juror Research Tool — API Specification

## Overview

This module exposes REST endpoints for CRUD operations and search, plus WebSocket events for real-time collaboration.

**Base path**: `/api/juror-research` (or as defined by parent app)

**Authentication**: Handled by parent app. All endpoints assume authenticated user context.

---

## REST Endpoints

### Jurors

#### List jurors for a case
```
GET /cases/{case_id}/jurors
```

Query params:
- `status` — Filter by status (optional)
- `source` — Filter by source: `manual`, `csv_import`, `ocr_extraction` (optional)
- `search` — Text search on name (optional)

Response:
```json
{
  "jurors": [
    {
      "id": "uuid",
      "full_name": "Maria Garcia",
      "first_name": "Maria",
      "last_name": "Garcia",
      "age": 42,
      "city": "Houston",
      "occupation": "Teacher",
      "status": "matched",
      "candidate_count": 3,
      "confirmed_candidate_id": "uuid-or-null",
      "created_by": "user-id",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 47
}
```

#### Create juror (manual entry)
```
POST /cases/{case_id}/jurors
```

Request:
```json
{
  "full_name": "John Smith",
  "first_name": "John",
  "last_name": "Smith",
  "age": 35,
  "city": "Austin",
  "occupation": "Engineer",
  "venue_id": "travis-county-tx",
  "auto_search": true
}
```

- If `auto_search` is true, immediately triggers search after creation
- Name parsing: If only `full_name` provided, server parses into components

Response: `201 Created`
```json
{
  "juror": { ... },
  "search_job_id": "uuid"  // If auto_search was true
}
```

#### Batch create jurors (CSV import)
```
POST /cases/{case_id}/jurors/batch
```

Request:
```json
{
  "jurors": [
    { "full_name": "John Smith", "age": 35, "city": "Austin" },
    { "full_name": "Jane Doe", "age": 28, "city": "Austin" }
  ],
  "venue_id": "travis-county-tx",
  "auto_search": true
}
```

Response: `202 Accepted`
```json
{
  "batch_id": "uuid",
  "juror_count": 50,
  "status": "processing"
}
```

#### Get juror detail
```
GET /jurors/{juror_id}
```

Response:
```json
{
  "juror": {
    "id": "uuid",
    "full_name": "Maria Garcia",
    ...
  },
  "candidates": [
    {
      "id": "uuid",
      "full_name": "Maria L Garcia",
      "age": 42,
      "city": "Houston",
      "confidence_score": 87,
      "score_factors": [
        { "factor": "name_exact_last", "score": 30, "detail": "Last name exact match" },
        { "factor": "name_fuzzy_first", "score": 25, "detail": "First name exact match" },
        { "factor": "age_close", "score": 20, "detail": "Age within 2 years" },
        { "factor": "city_match", "score": 12, "detail": "Same city" }
      ],
      "photo_url": "https://...",
      "is_confirmed": false,
      "sources": ["voter_record", "fec", "linkedin"]
    }
  ],
  "notes": [ ... ],
  "confirmed_profile": null  // Or AggregatedProfile if match confirmed
}
```

#### Update juror
```
PATCH /jurors/{juror_id}
```

Request:
```json
{
  "age": 43,
  "occupation": "Retired Teacher"
}
```

#### Delete juror
```
DELETE /jurors/{juror_id}
```

---

### Search

#### Trigger search for juror
```
POST /jurors/{juror_id}/search
```

Request (optional refinements):
```json
{
  "venue_id": "harris-county-tx",
  "additional_hints": {
    "employer": "Houston ISD"
  }
}
```

Response: `202 Accepted`
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

Results delivered via WebSocket events.

#### Get search job status
```
GET /search-jobs/{job_id}
```

Response:
```json
{
  "job_id": "uuid",
  "juror_id": "uuid",
  "status": "completed",
  "sources_searched": ["local_voter", "local_fec", "pipl", "fec_api", "news"],
  "sources_pending": [],
  "candidate_count": 5,
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:04Z"
}
```

---

### Candidates

#### Confirm candidate match
```
POST /candidates/{candidate_id}/confirm
```

Marks this candidate as the confirmed identity for the juror. Only one candidate per juror can be confirmed.

Response:
```json
{
  "candidate": { ... },
  "profile": { ... }  // Full aggregated profile
}
```

#### Reject candidate
```
POST /candidates/{candidate_id}/reject
```

Marks candidate as "not this person" to improve future suggestions.

#### Get full profile for candidate
```
GET /candidates/{candidate_id}/profile
```

Fetches/refreshes the full aggregated profile. May trigger additional API calls.

Response:
```json
{
  "profile": {
    "candidate_id": "uuid",
    "social_profiles": [ ... ],
    "voter_registration": { ... },
    "political_donations": [ ... ],
    "court_cases": [ ... ],
    "news_mentions": [ ... ],
    "sources_searched": ["linkedin", "facebook", "voter", "fec", "pacer", "news"],
    "last_updated": "2024-01-15T10:35:00Z"
  }
}
```

---

### Document Capture

#### Create capture (initiate upload)
```
POST /cases/{case_id}/captures
```

Request:
```json
{
  "document_type": "jury_list",
  "page_count": 3
}
```

Response:
```json
{
  "capture_id": "uuid",
  "upload_urls": [
    { "page": 1, "url": "https://presigned-upload-url-1", "expires_at": "..." },
    { "page": 2, "url": "https://presigned-upload-url-2", "expires_at": "..." },
    { "page": 3, "url": "https://presigned-upload-url-3", "expires_at": "..." }
  ]
}
```

Client uploads images directly to storage via presigned URLs.

#### Signal upload complete
```
POST /captures/{capture_id}/process
```

Triggers OCR processing after images are uploaded.

Response: `202 Accepted`
```json
{
  "status": "processing"
}
```

Results delivered via WebSocket.

#### Get capture status and results
```
GET /captures/{capture_id}
```

Response:
```json
{
  "capture": {
    "id": "uuid",
    "document_type": "jury_list",
    "status": "review",
    "page_count": 3,
    "images": [
      { "page": 1, "url": "https://...", "thumbnail_url": "https://..." }
    ],
    "extracted_jurors": [
      {
        "raw_name": "GARCIA, MARIA L",
        "parsed_name": "Maria L Garcia",
        "parsed_first_name": "Maria",
        "parsed_last_name": "Garcia",
        "raw_age": "42",
        "parsed_age": 42,
        "raw_city": "Houston",
        "parsed_city": "Houston",
        "confidence": 94,
        "needs_review": false,
        "juror_id": null
      },
      {
        "raw_name": "SM1TH, J0HN",
        "parsed_name": "John Smith",
        "confidence": 67,
        "needs_review": true,
        "juror_id": null
      }
    ]
  }
}
```

#### Confirm extracted jurors
```
POST /captures/{capture_id}/confirm
```

Creates Juror records from extracted data (after user review/edit).

Request:
```json
{
  "jurors": [
    {
      "index": 0,
      "first_name": "Maria",
      "last_name": "Garcia",
      "age": 42,
      "city": "Houston",
      "include": true
    },
    {
      "index": 1,
      "first_name": "John",
      "last_name": "Smith",
      "age": null,
      "city": "Austin",
      "include": true
    }
  ],
  "venue_id": "harris-county-tx",
  "auto_search": true
}
```

Response:
```json
{
  "created_jurors": [
    { "index": 0, "juror_id": "uuid-1" },
    { "index": 1, "juror_id": "uuid-2" }
  ],
  "batch_search_job_id": "uuid"
}
```

---

### Notes & Flags

#### Add note to juror
```
POST /jurors/{juror_id}/notes
```

Request:
```json
{
  "content": "Seemed hesitant when discussing law enforcement",
  "note_type": "general",
  "is_flagged": true,
  "flag_reason": "concern"
}
```

#### List notes for juror
```
GET /jurors/{juror_id}/notes
```

#### Update note
```
PATCH /notes/{note_id}
```

#### Delete note
```
DELETE /notes/{note_id}
```

---

### Venues

#### List available venues
```
GET /venues
```

Response:
```json
{
  "venues": [
    {
      "id": "travis-county-tx",
      "name": "Travis County, TX",
      "state": "TX",
      "county": "Travis",
      "datasets": [
        { "type": "voter", "status": "ready", "record_count": 847000, "last_refreshed": "2024-01-10" },
        { "type": "fec", "status": "ready", "record_count": 52000, "last_refreshed": "2024-01-01" }
      ]
    }
  ]
}
```

#### Request venue pre-load
```
POST /venues
```

Request:
```json
{
  "state": "TX",
  "county": "Harris"
}
```

Queues the venue for data loading. Admin operation.

#### Get venue status
```
GET /venues/{venue_id}
```

---

### Collaboration

#### Get active users on case
```
GET /cases/{case_id}/presence
```

Response:
```json
{
  "users": [
    {
      "user_id": "user-1",
      "user_name": "Sarah",
      "status": "active",
      "current_view": "juror_detail",
      "current_juror_id": "juror-uuid-12"
    },
    {
      "user_id": "user-2", 
      "user_name": "Mike",
      "status": "active",
      "current_view": "capture"
    }
  ]
}
```

---

### Export

#### Export juror research to PDF/Excel
```
POST /cases/{case_id}/export
```

Request:
```json
{
  "format": "pdf",
  "juror_ids": ["uuid-1", "uuid-2"],  // Or omit for all
  "include_profiles": true,
  "include_notes": true
}
```

Response: `202 Accepted`
```json
{
  "export_id": "uuid",
  "status": "generating"
}
```

#### Get export result
```
GET /exports/{export_id}
```

Response:
```json
{
  "export_id": "uuid",
  "status": "ready",
  "download_url": "https://...",
  "expires_at": "2024-01-15T12:00:00Z"
}
```

---

## WebSocket Events

Connect to WebSocket at `/ws/cases/{case_id}` (or parent app's WS infrastructure).

### Client → Server

#### Join case room
```json
{
  "type": "join",
  "case_id": "uuid"
}
```

#### Update presence
```json
{
  "type": "presence_update",
  "current_view": "juror_detail",
  "current_juror_id": "uuid"
}
```

#### Heartbeat
```json
{
  "type": "heartbeat"
}
```

### Server → Client

#### Juror added
```json
{
  "type": "juror_added",
  "juror": {
    "id": "uuid",
    "full_name": "Maria Garcia",
    "status": "pending",
    "source": "ocr_extraction",
    "created_by": "user-id",
    "created_by_name": "Sarah"
  }
}
```

#### Search started
```json
{
  "type": "search_started",
  "juror_id": "uuid",
  "job_id": "uuid"
}
```

#### Search progress
```json
{
  "type": "search_progress",
  "juror_id": "uuid",
  "job_id": "uuid",
  "sources_completed": ["local_voter", "local_fec"],
  "sources_pending": ["pipl", "news"],
  "candidates_so_far": 2
}
```

#### Candidates found
```json
{
  "type": "candidates_found",
  "juror_id": "uuid",
  "candidates": [
    {
      "id": "uuid",
      "full_name": "Maria L Garcia",
      "confidence_score": 87,
      "photo_url": "https://...",
      "sources": ["voter", "fec", "linkedin"]
    }
  ]
}
```

#### Match confirmed
```json
{
  "type": "match_confirmed",
  "juror_id": "uuid",
  "candidate_id": "uuid",
  "confirmed_by": "user-id",
  "confirmed_by_name": "Mike"
}
```

#### Note added
```json
{
  "type": "note_added",
  "juror_id": "uuid",
  "note": {
    "id": "uuid",
    "content": "Seemed hesitant...",
    "note_type": "general",
    "is_flagged": true,
    "flag_reason": "concern",
    "created_by_name": "Sarah"
  }
}
```

#### Juror flagged
```json
{
  "type": "juror_flagged",
  "juror_id": "uuid",
  "flag_reason": "strike",
  "flagged_by_name": "Mike"
}
```

#### Capture processing complete
```json
{
  "type": "capture_complete",
  "capture_id": "uuid",
  "extracted_count": 12,
  "needs_review_count": 2,
  "created_by_name": "Priya"
}
```

#### Presence update
```json
{
  "type": "presence_update",
  "users": [
    { "user_id": "...", "user_name": "Sarah", "status": "active", "current_view": "juror_list" },
    { "user_id": "...", "user_name": "Mike", "status": "active", "current_juror_id": "uuid" }
  ]
}
```

#### User joined/left
```json
{
  "type": "user_joined",
  "user_id": "...",
  "user_name": "Priya"
}
```

```json
{
  "type": "user_left",
  "user_id": "...",
  "user_name": "Priya"
}
```

---

## Error Responses

All errors follow consistent format:

```json
{
  "error": {
    "code": "JUROR_NOT_FOUND",
    "message": "Juror with ID xyz not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `JUROR_NOT_FOUND` | 404 | Juror ID doesn't exist |
| `CANDIDATE_NOT_FOUND` | 404 | Candidate ID doesn't exist |
| `CAPTURE_NOT_FOUND` | 404 | Capture ID doesn't exist |
| `VENUE_NOT_FOUND` | 404 | Venue ID doesn't exist |
| `VENUE_NOT_READY` | 400 | Venue data not yet loaded |
| `SEARCH_IN_PROGRESS` | 409 | Search already running for this juror |
| `ALREADY_CONFIRMED` | 409 | Juror already has confirmed match |
| `INVALID_DOCUMENT_TYPE` | 400 | Unknown document type for capture |
| `OCR_FAILED` | 500 | OCR processing failed |
| `EXPORT_FAILED` | 500 | Export generation failed |
| `RATE_LIMITED` | 429 | Too many requests to external API |
