**Product Requirements Document**

**Trials by Filevine AI**

_AI-Powered Trial Preparation & Jury Intelligence Platform_

| **Version:** | 1.0 Draft |
| --- | --- |
| **Status:** | Initial Scoping |
| **Last Updated:** | 1/21/2026 |
| **Author:** | Product Team |

# 1\. Executive Summary

Trials by Filevine AI is a comprehensive trial preparation platform designed to help legal teams optimize jury selection and craft persuasive arguments. The application combines AI-powered juror research, behavioral persona mapping, simulated focus groups, and real-time trial support to give attorneys an unprecedented advantage in the courtroom.

The platform serves two primary objectives: (1) selecting optimal jurors during voir dire, and (2) ensuring legal arguments resonate with the seated jury. By integrating deep juror intelligence with psychological persona modeling and AI-driven simulation, Trials by Filevine AI transforms trial preparation from intuition-based to data-driven.

# 2\. Product Vision & Goals

## 2.1 Vision Statement

Empower trial attorneys with AI-driven insights that transform jury selection from art to science and trial strategy from guesswork to precision.

## 2.2 Core Goals

- Reduce time spent on manual juror research by 80%
- Increase accuracy of juror persona identification through AI-assisted mapping
- Enable attorneys to test arguments against simulated jury panels before trial
- Provide real-time strategic insights during voir dire and trial proceedings
- Build a reusable library of juror personas informed by psychological research

## 2.3 Target Users

- Trial attorneys (plaintiff and defense)
- Jury consultants and trial strategists
- Paralegals and litigation support staff (research and data entry)
- Law firm trial preparation teams

# 3\. Principles & Constraints

## 3.1 Legal & Compliance Constraints

- **No-contact research:** All research must be limited to publicly accessible information without initiating contact (no friend requests, no LinkedIn connections, no direct outreach)
- **Auditability:** All research and AI recommendations must be traceable with full provenance (sources used, timestamps, user decisions)
- **Jurisdiction variability:** Product must support configuration and disclaimers by state, county, and court rules
- **Sensitive inference handling:** Political leanings and other sensitive inferences must be clearly labeled as "signals" (not facts), include provenance, and provide user controls to enable/disable signal types

## 3.2 Product Principles

- **Human-in-the-loop:** Always require human confirmation for juror identity resolution, persona assignment, and strike decisions
- **Speed under pressure:** Voir dire and trial modes require fast, confident UX with minimal clicks, clear actions, and offline resilience
- **Separation of concerns:** Cases and personas are separate entities; personas are library objects reusable across cases
- **Defensible AI:** All AI recommendations must show rationale, confidence score, source citations, and "what would change this recommendation" (counterfactual reasoning)

## 3.3 Trial Mode UX Principles

Courtroom use requires a distinct UX approach optimized for high-stress, time-constrained environments:

- Large touch targets and buttons
- Minimal typing required; favor taps and selections
- Quick juror selection (tap to tag, swipe to dismiss)
- Immediate takeaway cards (insights surfaced without navigation)
- Offline resilience with graceful sync when connectivity returns

# 4\. Application Architecture

## 4.1 Hierarchy Overview

The application is organized around a project-based hierarchy with shared resources accessible across projects.

| **Level** | **Description** |
| --- | --- |
| **Organization** | Top-level container; manages users, permissions, billing |
| **Personas Library** | Shared across all cases; contains pre-defined, AI-generated, and user-created personas |
| **Cases (Projects)** | Individual lawsuits; contains all case-specific data |
| └ Case Facts | User-provided facts, documents, evidence summaries |
| └ Arguments | Opening statements, plaintiff arguments, defense arguments |
| └ Jury Panel | Potential and seated jurors with research and persona mappings |
| └ Focus Groups | Simulated jury deliberations against case arguments |
| └ Trial Sessions | Real-time audio capture and analysis during proceedings |

## 4.2 Data Model Summary

### Case Object

- Case metadata (name, court, jurisdiction, case number, trial date, parties, counsel)
- Case narrative (facts, timeline, disputed issues)
- Theories (plaintiff theory, defense theory)
- Arguments library with version tracking (Opening v1, v2, v3 with changelog)
- Witness list with anticipated direct/cross outlines
- Associated jury panel, focus groups, and trial sessions

### Juror Object

- Court-provided fields (name, age/DOB range, address, occupation, employer, questionnaire answers, juror number)
- Research profile (linked Research Artifacts with confirmed/rejected status)
- Persona mappings (AI-suggested and user-confirmed, with confidence and rationale)
- Voir dire responses (transcript snippets, tags, signals)
- Risk/opportunity markers (strike priority, keep priority, unknown)
- Status (available, questioned, struck for cause, peremptory strike, seated, alternate)

### Persona Object

- Persona name, description, and structured attributes
- Signals/markers that suggest persona fit (what to look for)
- Common persuasion levers and pitfalls
- Source type (pre-seeded, AI-generated, user-created)
- Version history and user notes

### Research Artifact Object

- Source type (social, professional, political donation, court filing, news, etc.)
- URL/reference with timestamp
- Extracted snippets with provenance
- Match confidence score
- User action status (confirmed, rejected, uncertain)

### Trial Session Object

- Session metadata (type: voir dire / trial day, date, witness if applicable)
- Audio recordings with user-added timestamps
- Time-coded transcripts
- Tagged moments (persona signals, credibility hits, concessions, confusion, emotional moments)
- Generated insights and alerts

### Template Object (Future)

- Reusable question sets
- Argument frameworks
- Focus group scripts

# 5\. Core Features

## 5.1 Jury Research Engine

**Purpose:** Automate the collection of publicly available information about potential jurors while maintaining legal compliance (no-contact, publicly accessible only).

### Data Sources

| **Source** | **Information Retrieved** |
| --- | --- |
| **LinkedIn** | Professional background, employment history, education, connections |
| **Election Donations** | Political leanings, causes supported, donation amounts |
| **PACER** | Federal court filings, bankruptcy records, prior litigation involvement |
| **Social Media** | Facebook, Twitter/X, Instagram public posts and profiles |
| **Reddit** | Post history, community participation, expressed opinions |
| **Property Records** | Home ownership, property values, neighborhood |
| **News/Media** | Public appearances, news mentions, published content |

### Key Functionality

- **Bulk import:** Upload jury list from court (CSV, Excel, or manual entry) with name, age, occupation, and geographic information
- **Smart matching:** AI disambiguates common names and presents candidate matches for user confirmation
- **Confidence scoring:** Each match receives a confidence score with rationale (matching features: location, employer, age band)
- **Research summary:** AI-generated summary of key findings with source citations
- **Compliance flags:** System prevents contact-based searches and logs all research activities for audit

### Match Inbox UX

For each juror, present a "Match Inbox" view with candidate matches and one-click actions:

- ✓ Confirm this match
- ✗ Not the right person
- ? Unsure / revisit later
- Always display "Why we think this is them" with matching features and source timestamps

## 5.2 Juror Persona Mapping

**Purpose:** Classify jurors into behavioral personas to predict their reactions to case facts and arguments.

### Persona Types

- **Pre-defined Personas:** Library of research-backed personas developed from psychological studies and trial consultant expertise
- **AI-Generated Personas:** System-created personas based on patterns identified across juror research data
- **User-Created Personas:** Custom personas defined by attorneys based on their experience and case-specific needs

### Mapping Process

- AI analyzes juror research data and suggests persona matches with confidence scores
- Users can accept AI suggestions or manually override with their own assessment
- Multiple personas can be assigned to a single juror (primary and secondary)
- Persona mappings update dynamically as new information is gathered during voir dire

## 5.3 Voir Dire Question Generation

**Purpose:** Generate strategic questions that reveal juror personas and predict case-specific biases.

### Inputs

- Case facts and key themes
- Target personas to identify
- Juror research findings
- Jurisdiction-specific constraints (time limits, question restrictions)

### Outputs

- Suggested questions organized by purpose (persona identification, bias detection, cause challenges)
- Follow-up question trees based on anticipated responses
- Response interpretation guidance (what answers indicate about persona fit)
- Red flag indicators for cause or peremptory challenges

## 5.4 Simulated Focus Groups

**Purpose:** Test arguments against AI-simulated jury panels to identify weaknesses and refine strategy.

### Configuration Options

- **Generic panel:** Random sampling from persona library representing typical jury composition
- **Case-specific panel:** Simulated panel matching the actual jury panel personas
- **Custom panel:** User-selected mix of personas for targeted testing

### Simulation Capabilities

- Present opening statements and receive persona-based reactions
- Test individual arguments and evidence presentations
- Simulate cross-examination Q&A scenarios
- Run full deliberation simulations with persona interactions
- A/B test different argument framings

### Output Reports

- Predicted verdict distribution
- Argument effectiveness scores by persona
- Identified weaknesses and knowledge gaps
- Suggested argument modifications
- Questions jurors might raise during deliberation

## 5.5 Real-Time Trial Support

**Purpose:** Provide live strategic insights during voir dire and trial proceedings.

### Audio Capture & Processing

- Real-time transcription of courtroom audio (legally permissible recording)
- Speaker identification and attribution
- Testimony and argument segmentation

### Real-Time Analysis

- Continuous analysis of testimony against seated jury personas
- Alert system for damaging testimony or missed opportunities
- Suggested follow-up questions for cross-examination
- Running assessment of case strength by persona

### Pre-Trial Preparation Mode

- Input planned Q&A sequences for witness prep
- Simulate jury reactions to anticipated testimony
- Receive alternative question phrasings
- Prepare witnesses for difficult questions based on persona predictions

# 6\. User Experience & Navigation

## 6.1 Global Navigation

The application uses a sidebar navigation pattern with the following primary sections:

| **Section** | **Contents** |
| --- | --- |
| **Dashboard** | Recent cases, upcoming trials, quick actions |
| **Cases** | List of all cases/projects with search and filters |
| **Personas** | Global persona library (view, create, manage) |
| **Research** | Standalone juror research tools (not case-specific) |
| **Settings** | Organization settings, integrations, user management |

## 6.2 Case Workspace

When a user enters a case, they access a dedicated workspace with tabbed navigation:

- **Overview:** Case summary, key dates, team members, quick stats
- **Facts & Evidence:** Case facts, document uploads, evidence summaries
- **Arguments:** Opening/closing statements, key themes, argument library
- **Jury Panel:** Juror list, research status, persona mappings, strike list
- **Voir Dire:** Question bank, live session mode, juror notes
- **Focus Groups:** Simulation configuration, run history, reports
- **Trial Mode:** Live audio analysis, real-time insights, testimony tracker

## 6.3 Key User Flows

### Flow 1: New Case Setup

- Create new case with basic metadata
- Input case facts and key themes
- Upload or enter jury list
- Initiate automated juror research
- Review and confirm juror matches
- Accept or modify AI persona suggestions

### Flow 2: Pre-Trial Preparation

- Input opening statement and key arguments
- Run focus group simulation with case jury panel
- Review weakness report and suggested modifications
- Generate voir dire questions based on case and personas
- Pre-test witness Q&A scenarios
- Refine strategy based on simulation results

### Flow 3: Voir Dire Execution

- Start voir dire session with audio capture
- System transcribes and analyzes responses in real-time
- Receive persona classification updates based on responses
- Note juror responses and impressions
- Receive strike recommendations with reasoning
- Finalize seated jury with confirmed personas

### Flow 4: Trial Support

- Activate trial mode with audio capture
- Monitor real-time testimony analysis
- Receive alerts for significant moments
- Review suggested cross-examination questions
- Track running case strength assessment
- Access daily trial summaries with strategic recommendations

# 7\. Technical Considerations

## 7.1 AI Services Architecture

AI capabilities are structured as discrete services with clear inputs/outputs. All services must support explainability, confidence scoring, user override, and versioning.

| **Service** | **Input → Output** |
| --- | --- |
| **Identity Resolution** | Juror roster + candidate matches → Match confidence + rationale signals |
| **Research Summarization** | Public artifacts (text/metadata) → Structured signals with provenance |
| **Persona Suggestion** | Juror profile (questionnaire + research + voir dire) → Persona recommendations with confidence, rationale, and counterfactual |
| **Question Generation** | Case facts + personas + jurisdiction → Question sets with what-to-listen-for and follow-up branches |
| **Focus Group Simulation** | Arguments + selected personas → Persona reactions + consolidated critique + recommended edits |
| **Trial Insight Engine** | Transcript stream + personas + case themes → Tagged moments, alerts, follow-ups, damage/opportunity assessments |

## 7.2 Data & Integration Requirements

- **Public records APIs:** PACER, state court systems, property records
- **Social media APIs:** LinkedIn, Facebook (public profiles), Twitter/X
- **Election data:** FEC donation records, state election databases
- **Document processing:** PDF extraction, image OCR for uploaded evidence

## 7.3 Compliance & Privacy

- All research limited to publicly accessible, no-contact sources
- Full audit trail of all research activities
- Data retention policies aligned with legal requirements
- Attorney-client privilege considerations for stored data
- Courtroom recording compliance verification by jurisdiction

## 7.4 Non-Functional Requirements

- **Security:** Encryption at rest and in transit; strong access controls by case; comprehensive audit logs
- **Retention policies:** Configurable by firm; ability to purge trial audio/transcripts after trial conclusion
- **Performance:** Voir dire and trial modes must be fast and usable in high-stress courtroom environments
- **Offline/poor network:** Local caching of juror list, questions, personas; graceful transcript delays; batch sync on reconnect
- **Compliance tooling:** Source provenance storage, disclaimers, jurisdiction toggles, no-contact reminders

# 8\. Future Considerations (Beyond Phase 3)

- **Settlement optimization:** Data-driven settlement range recommendations based on jury composition analysis
- **Multi-language support:** Support for non-English proceedings and juror research
- **Jury selection analytics:** Historical analysis of strike patterns and outcomes to optimize selection strategy
- **Expert witness matching:** Recommend expert witnesses based on jury composition and case type
- **Opposing counsel analysis:** Track opposing attorney patterns and tendencies from public records
- **Venue analysis:** Jurisdiction-specific jury tendency data to inform venue decisions

# 9\. Release Phasing

## 9.1 Phase 1: MVP

The MVP release focuses on pre-trial preparation capabilities:

- **Case Management:** Full case creation, facts/evidence input, argument library
- **Jury Research Engine:** Automated public records search, match confirmation, research summaries
- **Persona Library:** Pre-seeded personas (internally sourced), AI-generated personas, user-created personas
- **Juror Panel Management:** Panel import, persona mapping (AI-suggested + manual), juror status tracking
- **Focus Group Simulations:** Argument testing, deliberation simulation, weakness reports
- **Multi-User Collaboration:** Real-time collaboration on focus group sessions across team members

## 9.2 Phase 2: Trial Support

Phase 2 adds in-trial capabilities:

- **Voir Dire Question Generation:** AI-generated questions based on case facts and target personas
- **Real-Time Trial Support:** Live audio capture, transcription, testimony analysis
- **Witness Prep Mode:** Pre-trial Q&A simulation and coaching
- **Offline Recording:** Record full-day proceedings with witness/questioner timestamps for later sync and analysis

## 9.3 Phase 3: Integrations & Advanced Features

- **Filevine Integration:** Bi-directional sync with case data (priority integration)
- **Clio Integration:** Case management sync (nice-to-have)
- **Verdict Prediction:** Historical outcome analysis
- **Damages Modeling:** Award prediction based on jury composition
- **Mobile Companion:** Tablet-optimized interface for courtroom use

# 10\. Scoping Decisions

## 10.1 Courtroom Recording Compliance

Recording restrictions vary by jurisdiction and courtroom. Compliance with local rules is the responsibility of the attorney and their team. The application will not enforce jurisdiction-specific restrictions but will include a confirmation prompt reminding users to verify local recording permissions before activating audio capture features.

## 10.2 Persona Sourcing

Pre-defined personas will be sourced internally from our research team. The initial persona library will be seeded before MVP launch. The system will also support AI-generated personas (based on pattern analysis) and user-created custom personas.

## 10.3 Collaboration Model

Focus group simulations will support multi-user collaboration, allowing multiple attorneys and team members to participate in and review simulations together in real-time. This enables collaborative strategy sessions where team members can observe jury reactions simultaneously and discuss adjustments.

## 10.4 Pricing Model

Pricing will be on a per-case basis with potential tiered pricing:

- **Pre-Trial Package:** Case management, juror research, persona mapping, focus group simulations
- **Full Trial Package:** All pre-trial features plus real-time trial support and voir dire tools

## 10.5 Integration Strategy

External integrations are deferred to Phase 3:

- **Filevine:** Priority integration for bi-directional case data sync
- **Clio:** Nice-to-have integration, not required for initial phases

## 10.6 Offline Functionality

Offline capabilities will be minimal but focused on courtroom utility:

- **Data Entry Queue:** Users can enter data (notes, observations, juror impressions) offline; data syncs when connectivity is restored
- **Proceedings Recording:** Record full-day courtroom proceedings locally with user-added timestamps marking witness changes, questioner changes, and other significant moments
- **Batch Upload:** Queued data and recordings upload for processing when internet becomes available

# 11\. Engineering Handoff Deliverables

The following artifacts should be created to support engineering kickoff:

- **Information Architecture:** Clickable prototype of Cases → Jury Panel → Voir Dire Prep → Focus Groups → Trial Mode → Personas Library navigation
- **Data Model Diagram:** Visual ERD showing Case → Jury Panel → Juror relationships, Persona library linkages, Research Artifact associations, and Trial Session structure
- **MVP Epics & Stories:** User stories aligned to Phase 1-2 with acceptance criteria and definition of done
- **Compliance Checklist:** No-contact verification, provenance requirements, audit log specifications, retention policy configurations
- **AI Service Contracts:** Input/output specifications for each AI service with explainability and confidence requirements
- **Persona Seed Data:** Initial persona library from internal research team ready for import
