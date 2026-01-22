# Claude Synthesis Feature — Implementation Spec

## Agent Prompt

```
Add a "deep research" feature to the juror research service that uses Claude API with web search to synthesize raw candidate data into structured, actionable profiles with voir dire recommendations.

This feature:
- Triggers AFTER a user confirms a candidate match (not during initial search)
- Runs asynchronously (10-20 seconds)
- Calls Claude API with web search tool enabled
- Returns structured JSON profile with case-specific recommendations
- Results delivered via WebSocket event

Use the schema, prompts, and implementation details below. Create the new endpoint, worker, and data model as specified.
```

---

## New API Endpoint

```
POST /candidates/{candidate_id}/synthesize
```

Request:
```json
{
  "case_context": {
    "case_type": "personal injury - medical malpractice",
    "key_issues": ["hospital negligence", "damages valuation"],
    "client_position": "plaintiff"
  }
}
```

Response: `202 Accepted`
```json
{
  "job_id": "uuid",
  "status": "processing"
}
```

Polling endpoint:
```
GET /candidates/{candidate_id}/synthesis
```

---

## Output Schema

```json
{
  "schema_version": "1.0",
  "juror_profile": {
    "name": "string",
    "name_variations": ["string"],
    "age": "number | null",
    "gender": "string | null",
    "photo_url": "string | null",
    "profile_urls": {
      "linkedin": "string | null",
      "facebook": "string | null",
      "twitter": "string | null",
      "other": ["string"]
    },
    "location": {
      "city": "string | null",
      "county": "string | null",
      "state": "string | null",
      "residence_type": "string | null",
      "years_in_area": "number | null"
    },
    "occupation": {
      "current_title": "string | null",
      "employer": "string | null",
      "industry": "string | null",
      "years_employed": "number | null",
      "management_level": "none | individual_contributor | manager | executive | owner | null"
    },
    "education": {
      "highest_level": "high_school | some_college | associates | bachelors | masters | doctorate | professional | unknown",
      "field_of_study": "string | null",
      "institutions": ["string"]
    },
    "family": {
      "marital_status": "string | null",
      "children": "number | null",
      "household_notes": "string | null"
    }
  },
  "attitudes_and_affiliations": {
    "political_indicators": {
      "party_registration": "democrat | republican | independent | libertarian | green | none | unknown",
      "donation_history": [
        {
          "recipient": "string",
          "amount": "number",
          "year": "number",
          "party": "string | null"
        }
      ],
      "public_statements": ["string"],
      "confidence": "confirmed | inferred | none"
    },
    "organizational_memberships": [
      {
        "organization": "string",
        "type": "religious | professional | civic | political | union | fraternal | other",
        "role": "string | null",
        "source": "string"
      }
    ],
    "community_involvement": ["string"],
    "social_media_presence": {
      "platforms_identified": ["string"],
      "activity_level": "high | moderate | low | none | unknown",
      "notable_content": [
        {
          "content": "string",
          "platform": "string",
          "relevance": "string"
        }
      ]
    },
    "worldview_indicators": [
      {
        "indicator": "string",
        "source": "string",
        "source_url": "string | null",
        "confidence": "confirmed | inferred"
      }
    ]
  },
  "litigation_relevance": {
    "prior_jury_service": {
      "served": "yes | no | unknown",
      "details": "string | null"
    },
    "lawsuit_history": [
      {
        "role": "plaintiff | defendant | witness | party",
        "case_type": "string | null",
        "outcome": "string | null",
        "year": "number | null",
        "source": "string"
      }
    ],
    "law_enforcement_connection": {
      "has_connection": "boolean",
      "details": "string | null"
    },
    "legal_profession_connection": {
      "has_connection": "boolean",
      "details": "string | null"
    },
    "medical_profession_connection": {
      "has_connection": "boolean",
      "details": "string | null"
    },
    "industry_relevance": {
      "relevant_experience": "boolean",
      "details": "string | null"
    }
  },
  "voir_dire_recommendations": {
    "suggested_questions": [
      {
        "question": "string",
        "rationale": "string"
      }
    ],
    "areas_to_probe": ["string"],
    "potential_concerns": [
      {
        "concern": "string",
        "evidence": "string",
        "severity": "low | medium | high"
      }
    ],
    "favorable_indicators": [
      {
        "indicator": "string",
        "evidence": "string"
      }
    ]
  },
  "data_quality": {
    "sources_consulted": ["string"],
    "sources_count": "number",
    "data_richness": "sparse | moderate | comprehensive",
    "confidence_overall": "low | medium | high",
    "gaps_identified": ["string"]
  },
  "summary": "string"
}
```

---

## Claude API Call

### System Prompt

```
You are a jury research analyst producing structured intelligence for trial attorneys.

Your task is to synthesize all available information about a potential juror into a structured profile that helps attorneys make informed decisions during jury selection.

Guidelines:
- Use null for unknown fields—never fabricate or speculate without evidence
- Every non-null claim must be supported by the provided data or your web searches
- Set confidence: "confirmed" only for facts directly stated in sources
- Set confidence: "inferred" for reasonable conclusions (and note the reasoning)
- Voir dire recommendations must reference specific findings
- Include both concerns AND favorable indicators—attorneys need balanced assessments
- Be conservative: sparse data should produce sparse output
- The summary should be 2-3 sentences highlighting factors most relevant to the client's position

You have access to web search. Use it to:
- Verify social media profiles
- Find news mentions
- Look up organizational affiliations
- Research employers or professional backgrounds

Do NOT search for information that would be inappropriate or unavailable through legitimate public sources.

Return ONLY valid JSON matching the provided schema. No markdown formatting, no explanations outside the JSON.
```

### User Message Template

```
<juror_data>
Name: {{CANDIDATE_NAME}}
Age: {{AGE}}
Location: {{CITY}}, {{STATE}}
Occupation: {{OCCUPATION}}
Employer: {{EMPLOYER}}

Voter Registration:
{{VOTER_INFO}}

Political Donations:
{{FEC_DONATIONS}}

Social Profiles Found:
{{SOCIAL_URLS}}

Court Records:
{{COURT_RECORDS}}
</juror_data>

<case_context>
Case type: {{CASE_TYPE}}
Key issues: {{KEY_ISSUES}}
Client position: {{CLIENT_POSITION}}
</case_context>

<schema>
{{INSERT_FULL_SCHEMA}}
</schema>

Research this juror and return a structured profile as JSON.
```

### API Call (Python)

```python
import anthropic
import json

def synthesize_juror_profile(candidate_data: dict, case_context: dict, schema: dict) -> dict:
    client = anthropic.Anthropic()
    
    corpus = build_corpus(candidate_data)
    
    user_message = f"""
<juror_data>
{corpus}
</juror_data>

<case_context>
Case type: {case_context['case_type']}
Key issues: {', '.join(case_context['key_issues'])}
Client position: {case_context['client_position']}
</case_context>

<schema>
{json.dumps(schema, indent=2)}
</schema>

Research this juror and return a structured profile as JSON.
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 10
        }],
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}]
    )
    
    result_text = extract_text_content(response)
    return json.loads(result_text)


def build_corpus(candidate: dict) -> str:
    sections = []
    sections.append(f"Name: {candidate['full_name']}")
    
    if candidate.get('age'):
        sections.append(f"Age: {candidate['age']}")
    if candidate.get('city'):
        sections.append(f"Location: {candidate['city']}, {candidate.get('state', '')}")
    if candidate.get('occupation'):
        sections.append(f"Occupation: {candidate['occupation']}")
    if candidate.get('employer'):
        sections.append(f"Employer: {candidate['employer']}")
    
    if candidate.get('voter_registration'):
        v = candidate['voter_registration']
        sections.append(f"\nVoter Registration:")
        sections.append(f"  Party: {v.get('party', 'Unknown')}")
        sections.append(f"  Registered: {v.get('registration_date', 'Unknown')}")
    
    if candidate.get('donations'):
        sections.append(f"\nPolitical Donations:")
        for d in candidate['donations']:
            sections.append(f"  - ${d['amount']} to {d['recipient']} ({d.get('date', '')})")
    
    if candidate.get('social_profiles'):
        sections.append(f"\nSocial Profiles:")
        for s in candidate['social_profiles']:
            sections.append(f"  - {s['platform']}: {s['url']}")
    
    if candidate.get('court_cases'):
        sections.append(f"\nCourt Records:")
        for c in candidate['court_cases']:
            sections.append(f"  - {c.get('case_type', 'Case')}: {c.get('role', '')} ({c.get('year', '')})")
    
    return '\n'.join(sections)
```

---

## Data Model

```typescript
interface SynthesizedProfile {
  id: string;
  candidate_id: string;
  case_id: string;
  profile: JurorProfileSchema;  // The full JSON output
  model_used: string;
  tokens_used: number;
  web_searches_performed: number;
  generated_at: string;
  context_hash: string;  // Regenerate if case context changes
}
```

---

## WebSocket Event

On completion, emit:

```json
{
  "type": "synthesis_complete",
  "candidate_id": "uuid",
  "juror_id": "uuid",
  "profile_id": "uuid",
  "data_richness": "moderate",
  "confidence_overall": "medium",
  "concerns_count": 2,
  "favorable_count": 1
}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Claude API timeout | Retry once, then fail job |
| Invalid JSON response | Retry with note to return valid JSON, then fail |
| Rate limited | Queue with exponential backoff |
| Web search fails | Continue without, note in `gaps_identified` |

---

## Config

```yaml
synthesis:
  model: "claude-sonnet-4-20250514"
  max_tokens: 4096
  max_web_searches: 10
  timeout_seconds: 60
  retry_attempts: 1
```
