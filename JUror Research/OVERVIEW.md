# Juror Research Tool — Overview

## Purpose

A real-time research tool that helps trial attorneys verify juror responses during voir dire and identify potential biases. Both sides in litigation routinely research potential jurors—this tool makes that process faster and more comprehensive.

## Core Value Proposition

- **Speed**: 3-5 second lookups during live voir dire (vs. manual searches taking minutes)
- **Comprehensiveness**: Aggregates multiple data sources into unified profiles
- **Collaboration**: Multiple team members work simultaneously in the courtroom
- **Offline resilience**: Works in courthouses with poor connectivity

---

## User Stories

### Primary Users
- Trial attorneys (during voir dire and prep)
- Paralegals (batch research before trial, real-time support)
- Jury consultants (detailed analysis)

### Core Stories

```
As a trial attorney,
I want to quickly look up a juror by name during voir dire,
So that I can verify their responses and identify potential biases in real-time.

As a paralegal,
I want to batch-process a jury pool list before trial,
So that the attorney has research ready for each potential juror.

As a paralegal in the courtroom,
I want to photograph a juror questionnaire and have it automatically processed,
So that I don't have to manually transcribe names and details.

As an attorney,
I want to see when my team has already researched a juror,
So that we don't duplicate effort during voir dire.

As a trial attorney,
I want the tool to work even when courthouse WiFi is unreliable,
So that I can still capture juror information for later processing.
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ Single      │  │ Batch       │  │ Document    │  │ Offline      │  │
│  │ Lookup UI   │  │ Processing  │  │ Capture     │  │ Queue        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                │                 │          │
│         └────────────────┴────────────────┴─────────────────┘          │
│                                   │                                     │
│                          ┌────────▼────────┐                           │
│                          │ WebSocket +     │                           │
│                          │ REST Client     │                           │
│                          └────────┬────────┘                           │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                           API LAYER│                                    │
│                          ┌────────▼────────┐                           │
│                          │ Juror Research  │                           │
│                          │ API Module      │                           │
│                          └────────┬────────┘                           │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────────────┐  │
│         │                         │                                 │  │
│  ┌──────▼──────┐  ┌───────────────▼───────────────┐  ┌─────────────▼┐ │
│  │ OCR         │  │ Search Orchestrator           │  │ WebSocket    │ │
│  │ Pipeline    │  │ (identity resolution,         │  │ Hub          │ │
│  │             │  │  parallel fan-out)            │  │ (collab)     │ │
│  └──────┬──────┘  └───────────────┬───────────────┘  └──────────────┘ │
│         │                         │                                    │
└─────────┼─────────────────────────┼────────────────────────────────────┘
          │                         │
┌─────────┼─────────────────────────┼────────────────────────────────────┐
│         │        DATA LAYER       │                                    │
│  ┌──────▼──────┐           ┌──────▼──────┐                            │
│  │ OCR Service │           │ Data Source │                            │
│  │ (Azure/GCP) │           │ Adapters    │                            │
│  └─────────────┘           └──────┬──────┘                            │
│                                   │                                    │
│         ┌─────────────────────────┼─────────────────────────────────┐ │
│         │                         │                                 │ │
│  ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼───┐ │
│  │ Pre-loaded  │  │ People Search │  │ Public      │  │ Social    │ │
│  │ Venue Data  │  │ APIs          │  │ Records     │  │ Profiles  │ │
│  │ (voter,FEC) │  │ (Pipl, etc)   │  │ (courts)    │  │ (limited) │ │
│  └─────────────┘  └───────────────┘  └─────────────┘  └───────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Juror
A potential juror being researched. Core input fields:
- **Required**: Full name, county/venue
- **Helpful**: Age (or DOB), city, occupation
- **Optional**: Street address, email, phone

### Candidate
A potential identity match from data sources. A single juror search may return multiple candidates (e.g., 5 people named "John Smith" in Harris County). Each candidate has a confidence score.

### Match
A confirmed link between a Juror and a Candidate, made by a human user.

### Venue
A court jurisdiction with pre-loaded public records data for fast lookups.

### Capture
A photographed/scanned document that gets processed via OCR to extract juror information.

---

## Integration Points

This module integrates with the parent application via:

1. **Case/Matter context** — Jurors are associated with a case (structure TBD by parent app)
2. **User/Auth context** — Uses parent app's authentication and user identity
3. **Audit logging** — Emits events for parent app's audit trail
4. **Real-time infrastructure** — Uses parent app's WebSocket infrastructure if available

---

## Scope Boundaries

### In Scope
- Juror lookup (single and batch)
- Document capture and OCR
- Identity resolution and disambiguation
- Multi-user real-time collaboration
- Offline capture queue
- Venue data pre-loading
- Profile aggregation from multiple sources

### Out of Scope (for this module)
- Case/matter management (parent app)
- User authentication (parent app)
- Billing/usage tracking (parent app)
- Jury selection strategy/analytics (future module)
- Juror communication (not applicable)
