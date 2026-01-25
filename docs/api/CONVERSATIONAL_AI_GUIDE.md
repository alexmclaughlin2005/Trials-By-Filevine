# Conversational AI Agent Guide - Trials by Filevine API

## Overview

This guide is designed specifically for conversational AI agents (like Claude, GPT-4, etc.) that need to interact with the Trials by Filevine API on behalf of users through natural language.

## Quick Reference

### Essential Endpoints for Common Tasks

| User Intent | Required Endpoints | Notes |
|-------------|-------------------|-------|
| "Create a new case" | POST /api/cases | Auto-creates jury panel |
| "Add a juror" | POST /api/jurors | Requires panelId |
| "Research this juror" | POST /api/jurors/{id}/search → POST /api/jurors/candidates/{id}/confirm → POST /api/candidates/{id}/synthesize | 3-step workflow |
| "What archetype is this juror?" | POST /api/archetypes/classify/juror | Returns 10 archetype types |
| "Test my argument" | POST /api/focus-groups/simulate | Quick or detailed mode |
| "Add a case fact" | POST /api/cases/{caseId}/facts | Supports background/disputed/undisputed |
| "Upload jury list" | POST /api/cases/{caseId}/captures → POST /api/captures/{id}/process → GET /api/captures/{id} | OCR workflow |
| "Generate voir dire questions" | POST /api/cases/{id}/generate-questions | AI-generated strategic questions |

## Authentication Flow

### Initial Authentication

```javascript
// Always start by authenticating
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'attorney@lawfirm.com',
    password: 'SecurePassword123!'
  })
});

const { token, user } = await response.json();

// Store token for all subsequent requests
const authHeaders = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Token Management

- **Expiration**: 7 days (default)
- **Storage**: Store securely in session
- **Refresh**: Re-authenticate when token expires (401 response)
- **Multi-tenancy**: Token contains `organizationId` for automatic data isolation

## Common Workflows

### 1. Complete Case Setup

**User says**: "Create a new case for Smith v. Jones, a personal injury case where we represent the plaintiff"

**AI Agent Flow**:

```javascript
// Step 1: Create the case
const createCase = await fetch('/api/cases', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    name: 'Smith v. Jones',
    caseNumber: '2024-CV-12345', // Extract from user or ask
    caseType: 'Personal Injury',
    plaintiffName: 'John Smith',
    defendantName: 'ABC Corporation',
    ourSide: 'plaintiff',
    trialDate: '2024-09-15' // If mentioned
  })
});

const { case: newCase } = await createCase.json();

// Step 2: Note that jury panel was auto-created
const panelId = newCase.juryPanels[0].id;

// Step 3: Confirm with user
return `Created case "${newCase.name}" (ID: ${newCase.id}).
A jury panel has been automatically created and is ready for jurors.`;
```

### 2. Add and Research Juror

**User says**: "Add juror #5: John Smith, 45 years old, software engineer from San Jose"

**AI Agent Flow**:

```javascript
// Step 1: Get case and panel ID (from context or query)
const { case: caseData } = await fetch(`/api/cases/${caseId}`, {
  headers: authHeaders
}).then(r => r.json());

const panelId = caseData.juryPanels[0].id;

// Step 2: Create juror
const { juror } = await fetch('/api/jurors', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    panelId,
    jurorNumber: '5',
    firstName: 'John',
    lastName: 'Smith',
    age: 45,
    occupation: 'Software Engineer',
    city: 'San Jose'
  })
}).then(r => r.json());

// Step 3: Ask user if they want to search for identity
return `Added Juror #5: John Smith. Would you like me to search for their public profiles and research data?`;

// If user says yes:
// Step 4: Search for identity matches
const { candidates } = await fetch(`/api/jurors/${juror.id}/search`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    caseContext: {
      caseType: 'Personal Injury',
      keyIssues: ['liability', 'damages']
    }
  })
}).then(r => r.json());

// Step 5: Present candidates to user
if (candidates.length === 0) {
  return "No matching profiles found in public records.";
}

return `Found ${candidates.length} potential matches:

${candidates.map((c, i) => `
${i + 1}. ${c.name}, age ${c.age}, ${c.location}
   Occupation: ${c.occupation}
   Match Score: ${c.matchScore}%
   Matching: ${c.matchingFeatures.join(', ')}
`).join('\n')}

Which match should I confirm? (or 'none' if incorrect)`;

// Step 6: User confirms a match
const confirmedCandidate = candidates[userSelection];

await fetch(`/api/jurors/candidates/${confirmedCandidate.id}/confirm`, {
  method: 'POST',
  headers: authHeaders
});

// Step 7: Start deep research synthesis
await fetch(`/api/candidates/${confirmedCandidate.id}/synthesize`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    case_context: {
      case_type: 'Personal Injury',
      key_issues: ['medical negligence', 'damages'],
      client_position: 'plaintiff'
    }
  })
});

return "Starting deep research synthesis. This will take 10-60 seconds...";

// Step 8: Poll for synthesis completion
let status = 'processing';
let attempts = 0;
const maxAttempts = 30; // 30 * 3 = 90 seconds max

while (status === 'processing' && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

  const { status: currentStatus, profileId } = await fetch(
    `/api/candidates/${confirmedCandidate.id}/synthesis`,
    { headers: authHeaders }
  ).then(r => r.json());

  status = currentStatus;

  if (status === 'complete') {
    // Step 9: Fetch full profile
    const profile = await fetch(`/api/synthesis/${profileId}`, {
      headers: authHeaders
    }).then(r => r.json());

    return formatSynthesizedProfile(profile);
  }

  attempts++;
}

if (status === 'processing') {
  return "Synthesis is taking longer than expected. I'll notify you when it's complete.";
}
```

### 3. Archetype Classification

**User says**: "What archetype is juror #5?"

**AI Agent Flow**:

```javascript
// Classify juror
const classification = await fetch('/api/archetypes/classify/juror', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    jurorId: juror.id,
    includeResearch: true,
    caseType: 'Personal Injury',
    ourSide: 'plaintiff'
  })
}).then(r => r.json());

// Format response for user
return `
Juror #5 Archetype Analysis:

**Primary Archetype**: ${classification.primary.archetype.toUpperCase()} (${classification.primary.confidence}% confidence)
${classification.primary.description}

**Secondary Archetype**: ${classification.secondary.archetype.toUpperCase()} (${classification.secondary.confidence}% confidence)

**Psychological Dimensions** (0-100 scale):
- Authority Respect: ${classification.dimensions.authority_respect}
- Risk Tolerance: ${classification.dimensions.risk_tolerance}
- Empathy vs Logic: ${classification.dimensions.empathy_vs_logic}
- Group vs Individual: ${classification.dimensions.group_vs_individual}

**Danger Level**:
- For Plaintiff: ${classification.dangerLevel.forPlaintiff.toUpperCase()}
- For Defense: ${classification.dangerLevel.forDefense.toUpperCase()}

**Strategic Approach**:
${classification.recommendations.strategicApproach}

**Voir Dire Questions to Ask**:
${classification.recommendations.voirDireQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

**Cause Challenge**: ${classification.recommendations.causeChallenge.recommended ? 'RECOMMENDED' : 'Not recommended'}
${classification.recommendations.causeChallenge.recommended ?
  `Basis: ${classification.recommendations.causeChallenge.basis}` : ''}
`;
```

### 4. Focus Group Simulation

**User says**: "Test my opening statement with a mock jury"

**AI Agent Flow**:

```javascript
// Get case and arguments
const { case: caseData } = await fetch(`/api/cases/${caseId}`, {
  headers: authHeaders
}).then(r => r.json());

// Find opening statement
const openingStatement = caseData.arguments.find(
  arg => arg.argumentType === 'opening'
);

if (!openingStatement) {
  return "No opening statement found. Would you like to create one first?";
}

// Run simulation
const result = await fetch('/api/focus-groups/simulate', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    caseId,
    argumentId: openingStatement.id,
    simulationMode: 'detailed' // or 'quick'
  })
}).then(r => r.json());

// Format results
return `
Focus Group Simulation Results:

**Predicted Verdict**:
- For Plaintiff: ${result.predictedVerdict.forPlaintiff} jurors
- For Defense: ${result.predictedVerdict.forDefense} jurors
- Undecided: ${result.predictedVerdict.undecided} jurors

**Persona Reactions**:
${result.personaReactions.map(reaction => `
### ${reaction.personaName} (Persuasiveness: ${reaction.persuasiveness}/10)
${reaction.reaction}

Concerns:
${reaction.concerns.map(c => `- ${c}`).join('\n')}
`).join('\n')}

**Overall Assessment**:

**Strengths**:
${result.overallAssessment.strengths.map(s => `✓ ${s}`).join('\n')}

**Weaknesses**:
${result.overallAssessment.weaknesses.map(w => `⚠ ${w}`).join('\n')}

**Recommendations**:
${result.overallAssessment.recommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}
`;
```

### 5. Document Capture (OCR)

**User says**: "Extract jurors from this jury list photo"

**AI Agent Flow**:

```javascript
// Assume image is provided as base64 or file upload
const imageBase64 = await convertImageToBase64(userProvidedImage);

// Step 1: Create capture
const { capture } = await fetch(`/api/cases/${caseId}/captures`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    documentType: 'panel_list', // or 'questionnaire', 'jury_card', 'other'
    imageData: imageBase64
  })
}).then(r => r.json());

// Step 2: Trigger OCR processing
await fetch(`/api/captures/${capture.id}/process`, {
  method: 'POST',
  headers: authHeaders
});

return "Processing document with OCR. This will take 5-15 seconds...";

// Step 3: Poll for completion
let status = 'processing';
let attempts = 0;

while (status === 'processing' && attempts < 10) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const captureData = await fetch(`/api/captures/${capture.id}`, {
    headers: authHeaders
  }).then(r => r.json());

  status = captureData.capture.status;

  if (status === 'completed') {
    const extractedJurors = captureData.capture.extractedData.jurors;

    // Step 4: Present for review
    return `
Extracted ${extractedJurors.length} jurors from document:

${extractedJurors.map((j, i) => `
${i+1}. Juror #${j.jurorNumber}: ${j.firstName} ${j.lastName}
   Age: ${j.age || 'Unknown'}
   Occupation: ${j.occupation || 'Unknown'}
   City: ${j.city || 'Unknown'}
   Confidence: ${j.confidence}%
`).join('\n')}

Would you like to:
1. Confirm and add these jurors to the panel
2. Edit the extractions before adding
3. Cancel
`;
  }

  attempts++;
}

// Step 5: User confirms
if (userConfirms) {
  const { created, jurors } = await fetch(`/api/captures/${capture.id}/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      panelId: panelId,
      jurors: extractedJurors // Can be edited by user first
    })
  }).then(r => r.json());

  return `Successfully added ${created} jurors to the panel!`;
}
```

### 6. Generate Voir Dire Questions

**User says**: "Generate voir dire questions for this case"

**AI Agent Flow**:

```javascript
const questions = await fetch(`/api/cases/${caseId}/generate-questions`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    targetPersonas: ['crusader', 'bootstrapper'], // Optional
    jurisdictionConstraints: 'Limited to 30 minutes, no insurance questions'
  })
}).then(r => r.json());

// Format response
return `
Voir Dire Question Bank:

## Opening Questions (Ice Breakers)
${questions.categories.opening.map((q, i) => formatQuestion(q, i+1)).join('\n\n')}

## Persona Identification Questions
${questions.categories.personaIdentification.map((q, i) => formatQuestion(q, i+1)).join('\n\n')}

## Case-Specific Bias Questions
${questions.categories.caseSpecific.map((q, i) => formatQuestion(q, i+1)).join('\n\n')}

## Challenge for Cause Questions
${questions.categories.causeChallenge.map((q, i) => formatQuestion(q, i+1)).join('\n\n')}
`;

function formatQuestion(q, num) {
  return `
### Question ${num}
**Ask**: "${q.question}"
**Purpose**: ${q.purpose}

**Listen for**:
${q.listenFor.map(l => `- ${l}`).join('\n')}

**Red flags**:
${q.redFlags.map(r => `⚠ ${r}`).join('\n')}

**Ideal answers**:
${q.idealAnswers.map(a => `✓ ${a}`).join('\n')}

${q.followUps.length > 0 ? `
**Follow-up if**: ${q.followUps[0].condition}
Ask: "${q.followUps[0].question}"
` : ''}
`;
}
```

## Natural Language Processing Tips

### Extracting Intent

Map user intents to API endpoints:

```javascript
const intentMap = {
  // Case management
  'create case': 'POST /api/cases',
  'list cases': 'GET /api/cases',
  'show case': 'GET /api/cases/{id}',
  'update case': 'PATCH /api/cases/{id}',

  // Juror management
  'add juror': 'POST /api/jurors',
  'list jurors': 'GET /api/jurors/panel/{panelId}',
  'research juror': 'POST /api/jurors/{id}/search',

  // Archetypes
  'classify juror': 'POST /api/archetypes/classify/juror',
  'analyze panel': 'GET /api/archetypes/panel-analysis/{panelId}',

  // Focus groups
  'test argument': 'POST /api/focus-groups/simulate',
  'run simulation': 'POST /api/focus-groups/simulate',

  // Documents
  'upload document': 'POST /api/cases/{caseId}/captures',
  'extract jurors': 'POST /api/captures/{id}/process',

  // Questions
  'generate questions': 'POST /api/cases/{id}/generate-questions',
};
```

### Entity Extraction

Extract key entities from user input:

```javascript
function extractEntities(userMessage) {
  const entities = {};

  // Names (case or juror)
  const nameMatch = userMessage.match(/(?:case|juror)\s+(?:named?\s+)?["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)["']?/i);
  if (nameMatch) entities.name = nameMatch[1];

  // Numbers (juror number)
  const numberMatch = userMessage.match(/(?:juror\s+)?#?(\d+)/i);
  if (numberMatch) entities.jurorNumber = numberMatch[1];

  // Age
  const ageMatch = userMessage.match(/(\d+)\s*(?:years?\s*old|yo)/i);
  if (ageMatch) entities.age = parseInt(ageMatch[1]);

  // Occupation
  const occupationMatch = userMessage.match(/(?:works?\s+as|occupation:?|job:?)\s+(?:a|an)?\s*([a-z\s]+)/i);
  if (occupationMatch) entities.occupation = occupationMatch[1].trim();

  // Location
  const locationMatch = userMessage.match(/(?:from|lives?\s+in|city:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (locationMatch) entities.city = locationMatch[1];

  // Case type
  const caseTypes = ['personal injury', 'medical malpractice', 'product liability', 'contract dispute'];
  const caseTypeMatch = caseTypes.find(type =>
    userMessage.toLowerCase().includes(type)
  );
  if (caseTypeMatch) entities.caseType = caseTypeMatch;

  // Our side
  const sideMatch = userMessage.match(/(?:we represent|our client is|we're)\s+(plaintiff|defense)/i);
  if (sideMatch) entities.ourSide = sideMatch[1].toLowerCase();

  return entities;
}

// Example usage:
const userInput = "Create a personal injury case where we represent the plaintiff, John Smith";
const entities = extractEntities(userInput);
// { name: "John Smith", caseType: "personal injury", ourSide: "plaintiff" }
```

### Context Management

Maintain conversation context to avoid asking for the same information:

```javascript
class ConversationContext {
  constructor() {
    this.currentCaseId = null;
    this.currentJurorId = null;
    this.currentPanelId = null;
    this.recentlyCreated = {};
  }

  setCase(caseId, caseName) {
    this.currentCaseId = caseId;
    this.recentlyCreated.case = { id: caseId, name: caseName };
  }

  setJuror(jurorId, jurorInfo) {
    this.currentJurorId = jurorId;
    this.recentlyCreated.juror = { id: jurorId, ...jurorInfo };
  }

  getCaseId() {
    return this.currentCaseId || this.recentlyCreated.case?.id;
  }

  getJurorId() {
    return this.currentJurorId || this.recentlyCreated.juror?.id;
  }
}

const context = new ConversationContext();

// After creating a case:
context.setCase(newCase.id, newCase.name);

// Later, when user says "add a juror":
const caseId = context.getCaseId(); // Already know which case
```

## Error Handling

### Common Errors and Responses

```javascript
async function handleApiError(response, userIntent) {
  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 400:
        // Validation error
        if (error.details) {
          return `I couldn't complete that request. Here's what needs to be fixed:
${Object.entries(error.details).map(([field, msg]) => `- ${field}: ${msg}`).join('\n')}`;
        }
        return `I couldn't complete that request: ${error.error}`;

      case 401:
        // Unauthorized - token expired or invalid
        return "Your session has expired. Let me log you in again.";

      case 404:
        // Not found
        return "I couldn't find that resource. Could you clarify which case/juror you're referring to?";

      case 409:
        // Conflict (e.g., duplicate email)
        return `That action conflicts with existing data: ${error.error}`;

      case 500:
        // Server error
        return "I encountered a server error. Please try again in a moment.";

      case 503:
        // Service unavailable
        return "The service is temporarily unavailable. Please try again in a moment.";

      default:
        return `An error occurred: ${error.error}`;
    }
  }
}

// Usage:
try {
  const response = await fetch('/api/cases', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(caseData)
  });

  if (!response.ok) {
    return await handleApiError(response, 'create case');
  }

  const { case: newCase } = await response.json();
  // Success handling
} catch (error) {
  return "I'm having trouble connecting to the server. Please check your internet connection.";
}
```

## Best Practices

### 1. Always Confirm Destructive Actions

```javascript
// Before deleting
if (intent === 'delete case') {
  return "Are you sure you want to delete this case? This action cannot be undone and will permanently remove all associated data including jurors, research, and focus groups.";
}

// Wait for user confirmation before executing DELETE
```

### 2. Provide Progress Updates for Async Operations

```javascript
// Synthesis (10-60 seconds)
return "Starting deep research synthesis. This typically takes 10-60 seconds. I'll keep you updated...";

// Poll with progress updates
let lastProgress = '';
while (status === 'processing') {
  const { status, progress } = await pollStatus();
  if (progress !== lastProgress) {
    console.log(`Progress: ${progress}`); // Stream to user
    lastProgress = progress;
  }
}
```

### 3. Handle Ambiguity Gracefully

```javascript
// When multiple cases exist and user doesn't specify
if (userInput.includes('add a juror') && !context.getCaseId()) {
  const { cases } = await fetch('/api/cases', { headers: authHeaders }).then(r => r.json());

  if (cases.length > 1) {
    return `You have multiple cases. Which one would you like to add a juror to?
${cases.map((c, i) => `${i+1}. ${c.name}`).join('\n')}`;
  } else if (cases.length === 1) {
    context.setCase(cases[0].id, cases[0].name);
    // Continue with adding juror
  } else {
    return "You don't have any cases yet. Would you like to create one?";
  }
}
```

### 4. Provide Summaries for Complex Results

```javascript
// Instead of dumping all archetype data:
function summarizeArchetype(classification) {
  const { primary, dangerLevel } = classification;

  return `Juror #5 is primarily a **${primary.archetype.toUpperCase()}** (${primary.confidence}% confidence).

In brief: ${primary.description}

Risk assessment: ${dangerLevel.forPlaintiff.toUpperCase()} danger to plaintiff, ${dangerLevel.forDefense.toUpperCase()} to defense.

Would you like to see:
1. Full psychological dimension scores
2. Strategic voir dire questions
3. Challenge for cause recommendations
`;
}
```

### 5. Maintain Data Consistency

```javascript
// After creating a juror, update context
const { juror } = await createJuror();
context.setJuror(juror.id, juror);

// After identity confirmation, refresh juror data
const updatedJuror = await fetch(`/api/jurors/${juror.id}`, {
  headers: authHeaders
}).then(r => r.json());

context.setJuror(updatedJuror.id, updatedJuror);
```

## Sample Conversation Flows

### Complete Case Setup Conversation

```
User: Create a new case for my client
AI: I'd be happy to help create a new case. Could you provide:
    1. Case name (e.g., "Smith v. Jones")
    2. Case number
    3. Type of case (personal injury, medical malpractice, etc.)
    4. Which side you represent (plaintiff or defendant)

User: Smith v. Jones, case number 2024-CV-12345, personal injury, we're the plaintiff
AI: [POST /api/cases]
    Created case "Smith v. Jones" (2024-CV-12345). A jury panel has been automatically created.

    What would you like to do next?
    1. Add case facts
    2. Add jurors to the panel
    3. Create opening statement
    4. Generate voir dire questions

User: Add some facts
AI: I can add case facts for you. Each fact can be:
    - Background (undisputed context)
    - Disputed (contested facts)
    - Undisputed (agreed upon facts)

    What's the first fact you'd like to add?

User: Add a background fact: The accident occurred on January 15, 2024 at 3:15 PM
AI: [POST /api/cases/{id}/facts]
    Added fact #1: "The accident occurred on January 15, 2024 at 3:15 PM" (background)

    Would you like to add another fact, or move on to something else?
```

### Juror Research Conversation

```
User: I got the jury list. Add juror #5: John Smith, 45, software engineer from San Jose
AI: [POST /api/jurors]
    Added Juror #5: John Smith, 45, Software Engineer from San Jose

    Would you like me to search public records for John Smith's identity and background?

User: Yes, search for him
AI: [POST /api/jurors/{id}/search]
    Searching public records for John Smith, age 45 in San Jose...

    Found 3 potential matches:

    1. John M. Smith, 45, Software Engineer at Google
       Location: San Jose, CA
       Match Score: 87%
       Matching: age, occupation, location

    2. John A. Smith, 46, Senior Developer at Apple
       Location: Cupertino, CA (near San Jose)
       Match Score: 72%
       Matching: occupation, approximate age, nearby location

    3. John Smith, 44, Tech Consultant
       Location: San Francisco, CA
       Match Score: 58%
       Matching: occupation type, approximate age

    Which one looks correct? (or say 'none' if none match)

User: The first one
AI: [POST /api/jurors/candidates/{id}/confirm]
    Confirmed match: John M. Smith from Google.

    Starting deep research synthesis... This will analyze:
    - Public social media profiles
    - Professional background
    - Political donations
    - Any litigation history
    - Affiliations and associations

    This typically takes 10-60 seconds. I'll let you know when it's complete.

    [POST /api/candidates/{id}/synthesize]
    [Poll GET /api/candidates/{id}/synthesis]

    Research complete! Here's what I found:

    **Demographics**:
    - Age: 45, lives in San Jose, married with 2 children
    - Education: BS Computer Science, Stanford University
    - Occupation: Senior Software Engineer at Google (8 years)

    **Key Attitudes**:
    - Political leaning: Moderate liberal (donated to Warren 2020)
    - Corporate views: Generally pro-tech, values innovation
    - Authority views: Respects expertise and data-driven decisions

    **Litigation Relevance**:
    ⚠ No prior litigation involvement found
    ✓ No medical background that could bias medical testimony
    ⚠ Works for large corporation - may be sympathetic to corporate defendants

    **Strategic Voir Dire Recommendations**:
    1. [MODERATE] Ask about experiences with large vs small companies
       Concern: May favor corporate defendants

    2. [HIGH] Explore views on personal responsibility vs corporate accountability
       Concern: Tech background suggests individual responsibility focus

    3. [LOW] Ask about data privacy and corporate ethics
       Concern: Works at company known for data practices

    Would you like to see the full archetype classification for this juror?
```

## Rate Limiting Considerations

```javascript
// Implement exponential backoff for rate limits
async function fetchWithRetry(url, options, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      // Rate limited
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, attempt);

      await new Promise(resolve =>
        setTimeout(resolve, retryAfter * 1000)
      );

      attempt++;
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded due to rate limiting');
}
```

## Testing Your Integration

### Mock Mode

When `ANTHROPIC_API_KEY` is not configured, the API returns mock responses:

```javascript
// This will return mock data in development
const classification = await fetch('/api/archetypes/classify/juror', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({ jurorId: '123' })
}).then(r => r.json());

// Mock response includes realistic data for testing UI
```

### Test Cases

Test these scenarios:

1. **New user signup and case creation**
2. **Adding multiple jurors from CSV**
3. **Identity resolution workflow (search → confirm → synthesize)**
4. **Archetype classification with various juror types**
5. **Focus group simulation with different modes**
6. **OCR document capture with jury lists**
7. **Error handling (invalid IDs, missing fields, etc.)**
8. **Rate limiting behavior**
9. **Token expiration and re-authentication**

## Support and Resources

- **OpenAPI Spec**: See [openapi.yaml](./openapi.yaml) for complete endpoint details
- **README**: See [README.md](./README.md) for API overview
- **Architecture**: See [../../Trials by Filevine_AI_Architecture.md](../../Trials by Filevine_AI_Architecture.md)
- **Issues**: Report problems at https://github.com/anthropics/trials-by-filevine/issues

## License

Proprietary - Filevine, Inc.
