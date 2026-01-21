**Technical Design Document**

**TrialForge AI**

_Data Models, API Specifications & Service Design_

| **Version:** | 1.0 |
| --- | --- |
| **Status:** | Draft |
| **Last Updated:** | 1/21/2026 |

# 1\. Document Overview

This technical design document provides detailed specifications for implementing TrialForge AI. It covers database schemas, API contracts, service interfaces, and key implementation details for the engineering team.

# 2\. Database Schema

PostgreSQL 16 is the primary data store. All tables include standard audit columns (created_at, updated_at, created_by, updated_by) and tenant isolation via organization_id.

## 2.1 Organizations & Users

### organizations

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| name | VARCHAR(255) | Organization/firm name |
| slug | VARCHAR(100) | URL-friendly identifier |
| settings | JSONB | Org-level settings (retention, features) |
| subscription_tier | VARCHAR(50) | Pricing tier |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### users

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| organization_id | UUID FK | References organizations.id |
| email | VARCHAR(255) | Unique email address |
| name | VARCHAR(255) | Display name |
| role | VARCHAR(50) | admin \| attorney \| paralegal \| consultant |
| auth_provider_id | VARCHAR(255) | External auth provider ID |
| last_login_at | TIMESTAMPTZ | Last login timestamp |
| settings | JSONB | User preferences |

## 2.2 Cases

### cases

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| organization_id | UUID FK | Tenant isolation |
| name | VARCHAR(255) | Case display name |
| case_number | VARCHAR(100) | Court case number |
| jurisdiction | VARCHAR(255) | Court/jurisdiction |
| venue | VARCHAR(255) | Venue (county/district) |
| trial_date | DATE | Scheduled trial date |
| case_type | VARCHAR(100) | civil \| criminal \| family \| etc |
| plaintiff_name | VARCHAR(255) | Plaintiff/prosecution name |
| defendant_name | VARCHAR(255) | Defendant name |
| our_side | VARCHAR(50) | plaintiff \| defendant |
| status | VARCHAR(50) | active \| archived \| closed |
| created_by | UUID FK | User who created |

### case_facts

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| content | TEXT | Fact narrative |
| fact_type | VARCHAR(50) | background \| disputed \| undisputed |
| source | VARCHAR(255) | Source reference |
| sort_order | INTEGER | Display ordering |

### case_arguments

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| argument_type | VARCHAR(50) | opening \| closing \| theme \| rebuttal |
| title | VARCHAR(255) | Argument title |
| content | TEXT | Full argument content |
| version | INTEGER | Version number (1, 2, 3...) |
| is_current | BOOLEAN | Is this the active version |
| parent_id | UUID FK | Previous version reference |
| change_notes | TEXT | Changelog for this version |

### case_witnesses

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| name | VARCHAR(255) | Witness name |
| role | VARCHAR(100) | fact \| expert \| character |
| affiliation | VARCHAR(50) | plaintiff \| defendant \| neutral |
| summary | TEXT | Expected testimony summary |
| direct_outline | TEXT | Direct examination outline |
| cross_outline | TEXT | Cross examination outline |
| sort_order | INTEGER | Expected order of appearance |

## 2.3 Jury Panel & Jurors

### jury_panels

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| panel_date | DATE | Date panel was received |
| source | VARCHAR(255) | Source of panel list |
| version | INTEGER | Panel version number |
| total_jurors | INTEGER | Count of jurors in panel |
| status | VARCHAR(50) | draft \| active \| completed |

### jurors

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| panel_id | UUID FK | References jury_panels.id |
| juror_number | VARCHAR(50) | Court-assigned juror number |
| first_name | VARCHAR(100) | First name (encrypted) |
| last_name | VARCHAR(100) | Last name (encrypted) |
| age | INTEGER | Age or approximate age |
| occupation | VARCHAR(255) | Occupation |
| employer | VARCHAR(255) | Employer name |
| city | VARCHAR(100) | City of residence |
| zip_code | VARCHAR(20) | ZIP code |
| questionnaire_data | JSONB | Court questionnaire responses |
| status | VARCHAR(50) | See status enum below |
| strike_reason | TEXT | Reason for strike if applicable |
| keep_priority | INTEGER | 1-5 scale, 5 = must keep |
| strike_priority | INTEGER | 1-5 scale, 5 = must strike |
| notes | TEXT | Free-form attorney notes |

**Juror Status Enum:** available | questioned | struck_for_cause | peremptory_strike | seated | alternate | dismissed

## 2.4 Personas

### personas

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| organization_id | UUID FK | NULL for system personas |
| name | VARCHAR(255) | Persona name |
| description | TEXT | Detailed description |
| source_type | VARCHAR(50) | system \| ai_generated \| user_created |
| attributes | JSONB | Structured behavioral attributes |
| signals | JSONB | What to look for to identify |
| persuasion_levers | JSONB | What persuades this persona |
| pitfalls | JSONB | What triggers negative reactions |
| is_active | BOOLEAN | Available for use |
| version | INTEGER | Version number |

### juror_persona_mappings

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| juror_id | UUID FK | References jurors.id |
| persona_id | UUID FK | References personas.id |
| mapping_type | VARCHAR(50) | primary \| secondary |
| source | VARCHAR(50) | ai_suggested \| user_assigned |
| confidence | DECIMAL(3,2) | 0.00 - 1.00 confidence score |
| rationale | TEXT | Why this mapping was suggested |
| counterfactual | TEXT | What would change this assessment |
| is_confirmed | BOOLEAN | User confirmed this mapping |
| confirmed_by | UUID FK | User who confirmed |
| confirmed_at | TIMESTAMPTZ | When confirmed |

## 2.5 Research Artifacts

### research_artifacts

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| juror_id | UUID FK | References jurors.id |
| source_type | VARCHAR(50) | linkedin \| facebook \| pacer \| fec \| etc |
| source_url | TEXT | Original URL |
| source_name | VARCHAR(255) | Human-readable source name |
| retrieved_at | TIMESTAMPTZ | When data was retrieved |
| raw_content | TEXT | Raw retrieved content |
| extracted_snippets | JSONB | Relevant extracted portions |
| signals | JSONB | Extracted signals with provenance |
| match_confidence | DECIMAL(3,2) | Confidence this is the right person |
| match_rationale | TEXT | Why we think this matches |
| user_action | VARCHAR(50) | pending \| confirmed \| rejected \| uncertain |
| actioned_by | UUID FK | User who took action |
| actioned_at | TIMESTAMPTZ | When action was taken |

## 2.6 Trial Sessions

### trial_sessions

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| session_type | VARCHAR(50) | voir_dire \| trial_day |
| session_date | DATE | Date of session |
| session_number | INTEGER | Day number (1, 2, 3...) |
| title | VARCHAR(255) | Session title |
| status | VARCHAR(50) | scheduled \| in_progress \| completed |
| started_at | TIMESTAMPTZ | When recording started |
| ended_at | TIMESTAMPTZ | When recording ended |
| audio_file_url | TEXT | S3 URL for audio file |
| transcript_status | VARCHAR(50) | pending \| processing \| completed \| failed |

### session_timestamps

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References trial_sessions.id |
| timestamp_ms | BIGINT | Milliseconds from session start |
| event_type | VARCHAR(50) | witness_change \| questioner_change \| break \| note |
| label | VARCHAR(255) | User-provided label |
| witness_id | UUID FK | References case_witnesses.id (optional) |
| created_by | UUID FK | User who added timestamp |

### transcript_segments

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References trial_sessions.id |
| start_ms | BIGINT | Start time in milliseconds |
| end_ms | BIGINT | End time in milliseconds |
| speaker_label | VARCHAR(100) | Speaker identifier |
| content | TEXT | Transcribed text |
| confidence | DECIMAL(3,2) | Transcription confidence |

### session_insights

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References trial_sessions.id |
| segment_id | UUID FK | References transcript_segments.id |
| insight_type | VARCHAR(50) | persona_signal \| credibility \| opportunity \| risk |
| severity | VARCHAR(20) | info \| warning \| critical |
| title | VARCHAR(255) | Short insight title |
| description | TEXT | Detailed explanation |
| affected_personas | UUID\[\] | Personas this affects |
| suggested_action | TEXT | Recommended response |
| is_dismissed | BOOLEAN | User dismissed this insight |

## 2.7 Focus Groups

### focus_group_sessions

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| case_id | UUID FK | References cases.id |
| name | VARCHAR(255) | Session name |
| description | TEXT | Session purpose/notes |
| panel_type | VARCHAR(50) | generic \| case_matched \| custom |
| argument_id | UUID FK | Argument being tested |
| status | VARCHAR(50) | draft \| running \| completed |
| started_at | TIMESTAMPTZ | When simulation started |
| completed_at | TIMESTAMPTZ | When simulation completed |
| created_by | UUID FK | User who created session |

### focus_group_personas

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References focus_group_sessions.id |
| persona_id | UUID FK | References personas.id |
| seat_number | INTEGER | Simulated juror seat |

### focus_group_results

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References focus_group_sessions.id |
| persona_id | UUID FK | References personas.id |
| reaction_summary | TEXT | How persona reacted |
| sentiment_score | DECIMAL(3,2) | \-1.00 to 1.00 |
| concerns | JSONB | Array of concerns raised |
| questions | JSONB | Questions this persona would ask |
| verdict_lean | VARCHAR(50) | plaintiff \| defendant \| undecided |
| confidence | DECIMAL(3,2) | Confidence in verdict lean |

### focus_group_recommendations

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| session_id | UUID FK | References focus_group_sessions.id |
| recommendation_type | VARCHAR(50) | weakness \| strength \| reframe \| add_evidence |
| priority | INTEGER | 1-5, 5 = highest priority |
| title | VARCHAR(255) | Short recommendation title |
| description | TEXT | Detailed recommendation |
| affected_personas | UUID\[\] | Which personas this addresses |
| is_addressed | BOOLEAN | User marked as addressed |

## 2.8 Audit Log

### audit_logs

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID | Primary key |
| organization_id | UUID | Tenant ID |
| user_id | UUID | User who performed action |
| action | VARCHAR(100) | Action type (see enum) |
| entity_type | VARCHAR(100) | Type of entity affected |
| entity_id | UUID | ID of entity affected |
| case_id | UUID | Associated case (if applicable) |
| details | JSONB | Action-specific details |
| ip_address | INET | Client IP address |
| user_agent | TEXT | Client user agent |
| created_at | TIMESTAMPTZ | When action occurred |

**Audit Actions:** research_initiated | research_confirmed | research_rejected | persona_assigned | persona_overridden | juror_struck | ai_suggestion_accepted | ai_suggestion_rejected | argument_modified | focus_group_run | trial_session_started | data_exported

# 3\. API Specifications

All APIs follow REST conventions with JSON request/response bodies. Authentication via Bearer JWT token. All endpoints scoped to organization via token claims.

## 3.1 Cases API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **GET** | /api/v1/cases | List all cases for organization |
| **POST** | /api/v1/cases | Create new case |
| **GET** | /api/v1/cases/:id | Get case details |
| **PATCH** | /api/v1/cases/:id | Update case |
| **DELETE** | /api/v1/cases/:id | Archive case (soft delete) |
| **GET** | /api/v1/cases/:id/facts | List case facts |
| **POST** | /api/v1/cases/:id/facts | Add case fact |
| **GET** | /api/v1/cases/:id/arguments | List arguments (with versions) |
| **POST** | /api/v1/cases/:id/arguments | Create new argument |
| **POST** | /api/v1/cases/:id/arguments/:argId/versions | Create new version of argument |
| **GET** | /api/v1/cases/:id/witnesses | List witnesses |
| **POST** | /api/v1/cases/:id/witnesses | Add witness |

## 3.2 Jury Panel API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **GET** | /api/v1/cases/:caseId/panel | Get current jury panel |
| **POST** | /api/v1/cases/:caseId/panel | Create/import jury panel |
| **POST** | /api/v1/cases/:caseId/panel/import | Bulk import jurors (CSV) |
| **GET** | /api/v1/cases/:caseId/jurors | List all jurors in panel |
| **GET** | /api/v1/cases/:caseId/jurors/:id | Get juror details |
| **PATCH** | /api/v1/cases/:caseId/jurors/:id | Update juror (status, notes, priority) |
| **POST** | /api/v1/cases/:caseId/jurors/:id/strike | Strike juror |
| **POST** | /api/v1/cases/:caseId/jurors/:id/seat | Seat juror |

## 3.3 Research API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **POST** | /api/v1/jurors/:id/research | Initiate research for juror |
| **GET** | /api/v1/jurors/:id/research | Get research status and artifacts |
| **GET** | /api/v1/jurors/:id/artifacts | List all research artifacts |
| **GET** | /api/v1/jurors/:id/artifacts/:artifactId | Get artifact details |
| **POST** | /api/v1/jurors/:id/artifacts/:artifactId/confirm | Confirm artifact match |
| **POST** | /api/v1/jurors/:id/artifacts/:artifactId/reject | Reject artifact match |
| **GET** | /api/v1/jurors/:id/research-summary | Get AI-generated research summary |

## 3.4 Personas API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **GET** | /api/v1/personas | List all personas (system + org) |
| **POST** | /api/v1/personas | Create custom persona |
| **GET** | /api/v1/personas/:id | Get persona details |
| **PATCH** | /api/v1/personas/:id | Update persona |
| **DELETE** | /api/v1/personas/:id | Deactivate persona |
| **GET** | /api/v1/jurors/:id/persona-mappings | Get persona mappings for juror |
| **POST** | /api/v1/jurors/:id/persona-mappings | Assign persona to juror |
| **POST** | /api/v1/jurors/:id/persona-mappings/:mapId/confirm | Confirm AI suggestion |
| **DELETE** | /api/v1/jurors/:id/persona-mappings/:mapId | Remove persona mapping |

## 3.5 AI Services API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **POST** | /api/v1/ai/persona-suggest | Get persona suggestions for juror |
| **POST** | /api/v1/ai/question-generate | Generate voir dire questions |
| **POST** | /api/v1/ai/focus-group/simulate | Run focus group simulation |
| **POST** | /api/v1/ai/research-summarize | Summarize research artifacts |
| **POST** | /api/v1/ai/trial-insight | Analyze transcript segment |

### Standard AI Response Format

All AI service responses follow this structure:

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| result | Object | The primary result payload |
| confidence | Number | 0.0 - 1.0 confidence score |
| rationale | String | Human-readable explanation |
| sources | Array | Citations with provenance |
| counterfactual | String | What would change this result |
| model_version | String | AI model version used |
| latency_ms | Number | Processing time |

## 3.6 Focus Groups API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **GET** | /api/v1/cases/:caseId/focus-groups | List focus group sessions |
| **POST** | /api/v1/cases/:caseId/focus-groups | Create focus group session |
| **GET** | /api/v1/focus-groups/:id | Get session details |
| **POST** | /api/v1/focus-groups/:id/run | Execute simulation |
| **GET** | /api/v1/focus-groups/:id/results | Get simulation results |
| **GET** | /api/v1/focus-groups/:id/recommendations | Get recommendations |
| **POST** | /api/v1/focus-groups/:id/recommendations/:recId/address | Mark recommendation addressed |

## 3.7 Trial Sessions API

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| **GET** | /api/v1/cases/:caseId/trial-sessions | List trial sessions |
| **POST** | /api/v1/cases/:caseId/trial-sessions | Create trial session |
| **GET** | /api/v1/trial-sessions/:id | Get session details |
| **POST** | /api/v1/trial-sessions/:id/start | Start recording |
| **POST** | /api/v1/trial-sessions/:id/stop | Stop recording |
| **POST** | /api/v1/trial-sessions/:id/timestamps | Add timestamp marker |
| **GET** | /api/v1/trial-sessions/:id/transcript | Get transcript |
| **GET** | /api/v1/trial-sessions/:id/insights | Get AI insights |
| **POST** | /api/v1/trial-sessions/:id/upload | Upload offline recording |

# 4\. Event Schemas

Async operations publish events to the message queue. Services subscribe to relevant events for processing.

## 4.1 Core Events

| **Event Name** | **Triggered By / Triggers** |
| --- | --- |
| juror.created | Panel import → Research Service initiates research |
| research.initiated | Research Service → External data fetchers |
| research.artifact.found | Data fetcher → Research Service stores artifact |
| research.completed | Research Service → Persona Suggester runs |
| persona.suggested | Persona Suggester → WebSocket notifies UI |
| persona.confirmed | User action → Audit log, panel dashboard update |
| focus_group.started | User action → Focus Group Engine runs simulation |
| focus_group.completed | Engine → WebSocket notifies participants |
| trial_session.started | User action → Transcription Pipeline starts |
| transcript.segment.created | Transcription → Trial Insight Engine analyzes |
| insight.generated | Insight Engine → WebSocket pushes to UI |
| audio.uploaded | Offline sync → Transcription Pipeline processes |

# 5\. WebSocket Events

Real-time events pushed to connected clients. Clients subscribe to channels by case ID.

## 5.1 Channel Structure

- **case:{caseId}:** Case-level updates (panel changes, argument updates)
- **case:{caseId}:research:** Research progress and artifact discoveries
- **case:{caseId}:focus-group:{sessionId}:** Focus group simulation progress
- **case:{caseId}:trial:{sessionId}:** Live trial transcription and insights
- **presence:{caseId}:** User presence for collaboration

## 5.2 Event Types

| **Event** | **Payload** |
| --- | --- |
| research:progress | { jurorId, status, artifactsFound, percentComplete } |
| research:artifact:new | { jurorId, artifact: ResearchArtifact } |
| persona:suggested | { jurorId, mapping: PersonaMapping } |
| focus_group:progress | { sessionId, phase, percentComplete } |
| focus_group:result | { sessionId, personaId, result: FocusGroupResult } |
| transcript:segment | { sessionId, segment: TranscriptSegment } |
| insight:new | { sessionId, insight: SessionInsight } |
| user:joined | { userId, userName, caseId } |
| user:left | { userId, caseId } |
| sync:complete | { entityType, entityId, timestamp } |

# 6\. Offline Sync Protocol

## 6.1 Local Storage Schema

IndexedDB stores pending mutations and cached data:

- **pending_mutations:** Queue of unsynced changes { id, type, endpoint, payload, timestamp, retryCount }
- **cached_jurors:** Full juror records for current case
- **cached_personas:** Persona library
- **cached_questions:** Question bank for current case
- **audio_chunks:** Pending audio uploads { sessionId, chunkIndex, blob, timestamp }
- **timestamps:** User-added session timestamps

## 6.2 Sync Flow

- On mutation: Write to local IndexedDB, add to pending_mutations queue
- On connectivity: Process pending_mutations FIFO
- For each mutation: POST to server, on success remove from queue
- On conflict (409): Fetch server state, apply last-write-wins, notify user
- On failure (5xx): Increment retryCount, exponential backoff
- After sync: Emit sync:complete event to UI

## 6.3 Audio Upload Flow

- MediaRecorder captures audio in 30-second chunks
- Each chunk stored in IndexedDB with session ID and index
- On connectivity: Upload chunks sequentially via multipart upload
- Server concatenates chunks, triggers transcription
- On success: Clear local chunks, update session status

# 7\. Security Implementation

## 7.1 Row-Level Security

PostgreSQL RLS policies enforce tenant isolation:

CREATE POLICY tenant_isolation ON cases FOR ALL USING (organization_id = current_setting('app.current_org')::uuid);

## 7.2 Field-Level Encryption

Juror PII (first_name, last_name) encrypted using AES-256-GCM with tenant-specific keys stored in AWS KMS. Application-layer encryption/decryption via a dedicated crypto service.

## 7.3 API Security

- **Rate Limiting:** 100 requests/minute per user, 1000/minute per organization
- **Input Validation:** JSON Schema validation on all inputs; parameterized queries
- **CORS:** Strict origin allowlist
- **Headers:** HSTS, X-Content-Type-Options, X-Frame-Options, CSP
