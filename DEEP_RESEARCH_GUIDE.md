# Deep Research Feature - User Guide

## What is Deep Research?

Deep Research is an AI-powered feature that uses Claude 4 Sonnet with web search to synthesize comprehensive juror profiles from publicly available information. It generates strategic voir dire recommendations tailored to your specific case.

## How to Use

### Step 1: Navigate to a Juror
1. Go to the **Cases** page
2. Select a case
3. Click on a juror from the jury panel

### Step 2: Find the Juror's Identity
1. In the **Identity Research** section, click **"Search Public Records"**
2. Review the candidate matches that appear
3. Click **"Confirm"** on the correct match

### Step 3: Start Deep Research
Once you've confirmed a candidate:

1. Scroll down to the **"Deep Research Synthesis"** section (appears after confirmation)
2. Click **"Start Deep Research"**
3. Wait 10-60 seconds while Claude:
   - Searches the web for public information
   - Analyzes voter records, donations, social media, etc.
   - Generates case-specific voir dire recommendations

### Step 4: Review Results
The synthesis provides:

#### Summary
- Executive summary highlighting key strategic factors
- Data richness assessment (sparse/moderate/comprehensive)
- Confidence level (low/medium/high)

#### Strategic Indicators
- **Concerns**: Potential risks with severity ratings
- **Favorable**: Positive indicators for your side

#### Voir Dire Recommendations
- **Suggested Questions**: Tailored questions with rationales
- **Areas to Probe**: Topics to explore during voir dire
- **Potential Concerns**: Specific risks with evidence
- **Favorable Indicators**: Strengths with supporting evidence

## What Information is Synthesized?

### Juror Profile
- Demographics (age, gender, location, education, family)
- Occupation and employment history
- Photo and social media profiles (if publicly available)

### Attitudes & Affiliations
- Political indicators (party registration, donation history)
- Organizational memberships (religious, professional, civic)
- Community involvement
- Social media activity and notable content
- Worldview indicators from public sources

### Litigation Relevance
- Prior jury service
- Lawsuit history (as plaintiff, defendant, or party)
- Connections to law enforcement, legal, or medical professions
- Industry experience relevant to the case

### Voir Dire Recommendations
- Suggested questions specific to this juror
- Areas to probe based on findings
- Potential concerns with severity ratings (low/medium/high)
- Favorable indicators with supporting evidence

## Example Output

```
MEDIUM CONFIDENCE | MODERATE DATA | 8 WEB SEARCHES

Executive Summary:
45-year-old accountant with analytical mindset and Democratic political
leanings. Professional background may favor expert testimony and structured
evidence, but liberal donations suggest potential openness to plaintiff damages.

Concerns: 2 potential risks identified
Favorable: 1 positive indicators found

Suggested Voir Dire Questions:
1. "In your work as an accountant, do you find yourself more focused on
   following established procedures or looking at the bigger picture?"
   Rationale: Assesses analytical vs. holistic thinking; accountants often
   favor rule-based approaches which may be defense-favorable in malpractice.

Potential Concerns:
[MEDIUM] Strong analytical mindset may favor medical defense experts
Evidence: Professional background in accounting, CPA membership

Favorable Indicators:
Political donations suggest liberal leaning on damages
Evidence: $500 donation to Biden 2020 campaign
```

## Technical Details

### Data Sources
- Voter registration databases
- FEC political donation records
- Public court records
- Social media platforms (via web search)
- Professional networking sites
- News mentions and public statements

### Privacy & Ethics
- Only accesses **publicly available** information
- Does not access private records or paid databases
- Web search limited to 10 queries per synthesis
- All data sources are cited in the output

### Performance
- **Processing Time**: 10-60 seconds (average 20-30 seconds)
- **Caching**: Results are cached per candidate + case context
  - Changing case type or key issues will trigger a new synthesis
  - Same candidate/context returns instant results

### Cost
- Uses Claude 4 Sonnet API ($3 per million input tokens, $15 per million output)
- Typical synthesis: 200K input + 2K output tokens = ~$0.70 per profile
- Web searches included (no additional API cost)

## Tips for Best Results

### 1. Confirm the Right Candidate
Double-check you've confirmed the correct identity match before running synthesis. The quality of results depends on accurate identity resolution.

### 2. Provide Case Context
While the system uses default values, you can enhance results by:
- Setting accurate case type in case settings
- Adding key issues to case facts
- Specifying your side (plaintiff/defense)

### 3. Use with Other Features
Combine Deep Research with:
- **Archetype Classification**: Understand behavioral patterns
- **Persona Mapping**: Compare to ideal/risky juror profiles
- **Research Summarizer**: Manual research artifact analysis

### 4. Review Data Quality
Pay attention to:
- **Confidence Level**: How reliable the data is
- **Data Richness**: How much information was found
- **Web Searches**: More searches = more thorough research
- **Sources Consulted**: Listed in data quality section

## Troubleshooting

### "No candidate confirmed"
You must confirm a candidate match before running Deep Research. Search for the juror's identity first, then confirm the correct match.

### "Synthesis timed out"
If synthesis takes longer than 80 seconds, try again. This is rare but can happen if web searches are slow.

### "Failed to start synthesis"
- Check that API Gateway is running (port 3001)
- Verify ANTHROPIC_API_KEY is set in environment variables
- Check API Gateway logs for errors

### Low Data Richness
Some jurors have minimal public information available. This is normal and the system will indicate "sparse" data richness with appropriate confidence levels.

## API Endpoints

For programmatic access:

```bash
# Start synthesis
POST /api/candidates/:candidateId/synthesize
Authorization: Bearer <token>
{
  "case_context": {
    "case_type": "personal injury - medical malpractice",
    "key_issues": ["hospital negligence", "damages valuation"],
    "client_position": "plaintiff"
  }
}

# Check status
GET /api/candidates/:candidateId/synthesis

# Get full profile
GET /api/synthesis/:profileId
```

See [API Gateway README](services/api-gateway/README.md) for complete API documentation.
