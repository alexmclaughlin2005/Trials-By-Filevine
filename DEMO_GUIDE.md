# Trials by Filevine AI - Demo & Walkthrough Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-21

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Feature Walkthrough](#feature-walkthrough)
4. [Demo Scenarios](#demo-scenarios)
5. [Technical Architecture](#technical-architecture)
6. [Tips for Live Demos](#tips-for-live-demos)

---

## Overview

Trials by Filevine AI is an AI-powered trial preparation platform that helps legal teams optimize jury selection and craft persuasive arguments. The system uses Claude 4.5 models to provide intelligent insights throughout the trial preparation process.

### Key Features

1. **AI Persona Analysis** - Analyze jurors and suggest matching personas with confidence scores
2. **Research Summarization** - Extract persona-relevant signals from research artifacts
3. **Question Generation** - Generate strategic voir dire questions tailored to your case
4. **Focus Group Simulation** - Test arguments with AI-powered jury simulations

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Anthropic API key (for AI features)

### Starting the Application

1. **Start the Database** (if not already running):
   ```bash
   # PostgreSQL should be running on localhost:5432
   ```

2. **Start the API Gateway**:
   ```bash
   cd services/api-gateway
   npm run dev
   # Server runs on http://localhost:3001
   ```

3. **Start the Web Application**:
   ```bash
   cd apps/web
   npm run dev
   # App runs on http://localhost:3000
   ```

4. **Login with Demo Credentials**:
   - **Attorney Account**: `attorney@example.com` / `password`
   - **Paralegal Account**: `paralegal@example.com` / `password`

### Demo Data

The system includes seed data with:
- 1 sample case: "Johnson v. TechCorp Industries" (age discrimination)
- 5 sample jurors with diverse backgrounds
- 3 system personas: Tech Pragmatist, Community Caretaker, Business Realist
- Case facts and arguments

---

## Feature Walkthrough

### 1. Dashboard Overview

**URL:** `http://localhost:3000/dashboard`

**What to Show:**
- Welcome message with user name
- Quick stats cards showing active cases, total cases, jury panels
- Recent cases table with clickable case names
- Navigation sidebar with all major features

**Key Points:**
- Clean, professional interface matching Filevine design system
- Real-time data from PostgreSQL database
- Quick access to all major features

---

### 2. Juror Analysis & Persona Suggestion

**URL:** `http://localhost:3000/jurors`

**Step-by-Step Demo:**

1. **View Jurors List**
   - Click "Jurors" in the sidebar
   - Shows all jurors across all cases in a table
   - Displays name, occupation, case, status

2. **Select a Juror**
   - Click "View Details" on any juror (e.g., Michael Chen - Software Engineer)
   - Shows complete juror profile:
     - Demographics (age, occupation, employer, location)
     - Questionnaire responses
     - Research artifacts (if any)

3. **Run AI Persona Analysis**
   - Scroll to "AI Persona Suggestions" section
   - Click "Analyze with AI" button
   - **Watch the magic happen:**
     - Loading spinner appears
     - Claude AI analyzes juror data in real-time
     - Returns in 3-5 seconds

4. **Review Persona Suggestions**
   - Top 3 persona matches displayed as cards
   - Each card shows:
     - **Rank badge** (#1, #2, #3)
     - **Persona name and description**
     - **Confidence score** (color-coded: green = high, yellow = medium, orange = low)
     - **System/Custom badge**
     - **Detailed analysis** explaining the match
     - **Key matches** (✓ checkmarks) - specific evidence supporting the match
     - **Potential concerns** (⚠ warnings) - things to watch out for
     - **"Select Persona" button** to save the mapping

5. **Select a Persona**
   - Click "Select Persona" on the best match
   - Confirmation alert shows success
   - Mapping saved to database for future reference

**Example Output:**
```
Persona #1: Tech Pragmatist
Confidence: 85%
Analysis: "Juror's technical background and analytical mindset strongly align
with the Tech Pragmatist persona. As a Software Engineer at a startup, they
likely value data-driven decision making and logical reasoning."

Key Matches:
✓ Software engineering occupation aligns with Tech Pragmatist signals
✓ STEM background indicates analytical thinking style
✓ Startup experience suggests comfort with innovation

Potential Concerns:
⚠ May be overly skeptical of emotional appeals
⚠ Could focus too much on technical details of the case
```

---

### 3. Research Artifact Analysis

**URL:** Same juror detail page

**Step-by-Step Demo:**

1. **View Research Artifacts**
   - Scroll to "Research Artifacts" section
   - Shows raw research data (LinkedIn, social media, public records)
   - Each artifact shows type, source, and content

2. **Run AI Research Analysis**
   - Scroll to "AI Research Analysis" section
   - Select specific artifacts or analyze all
   - Click "Analyze Research" button

3. **Review Analysis Results**
   - **Summary**: 2-3 sentence overview of the artifact
   - **Sentiment badge**: Positive/Neutral/Negative/Mixed
   - **Key Themes**: Extracted topics as tags
   - **Persona Signals**: Structured insights with:
     - Category (decision_style, values, communication, expertise, community)
     - Signal description
     - Confidence score
     - Evidence with specific quotes
     - Relevance explanation
   - **Key Excerpts**: Important quotes with context
   - **Warnings**: Any concerning content flagged

**Example Output:**
```
LinkedIn Profile Analysis
Sentiment: POSITIVE

Key Themes: • professional development • team leadership • innovation

Persona Signal: Collaborative Decision Making
Category: decision_style | Confidence: 75%
Evidence:
• "Led cross-functional team of 12 engineers"
• "Mentored 5 junior developers"
Relevance: Shows preference for collaborative problem-solving, may value
consensus in deliberations.
```

---

### 4. Voir Dire Question Generation

**URL:** `http://localhost:3000/cases/[case-id]` → Voir Dire Questions tab

**Step-by-Step Demo:**

1. **Navigate to Case**
   - From dashboard, click on "Johnson v. TechCorp Industries"
   - Lands on Overview tab showing case details

2. **Switch to Questions Tab**
   - Click "Voir Dire Questions" tab
   - Shows Question Generator interface

3. **Generate Questions**
   - Click "Generate Questions" button
   - AI analyzes:
     - Case type and facts
     - Key issues (age discrimination, employment)
     - Available personas
     - Jurisdiction (California)
   - Returns in 5-10 seconds

4. **Review General Strategy**
   - Overall approach for voir dire
   - Timing notes for question pacing

5. **Explore Question Categories**
   - **Four category tabs** with counts:
     - Opening Questions (rapport building)
     - Persona Identification (discover juror types)
     - Case-Specific (probe attitudes on key issues)
     - Challenge for Cause (reveal disqualifying biases)

6. **Examine Individual Questions**
   - Questions sorted by priority (high to low)
   - Click to expand any question
   - Shows:
     - **The question** (open-ended)
     - **Purpose** (what you're trying to learn)
     - **Target personas** (which types this identifies)
     - **Listen for** (signals in responses)
     - **Red flags** (warning signs)
     - **Ideal answers** (favorable responses)
     - **Legal notes** (jurisdiction considerations)
     - **Follow-up questions** with triggers

**Example Question:**
```
Priority: 9/10

Question: "Can you tell us about a time when you had to make a difficult
decision at work? How did you approach it?"

Purpose: Identify analytical vs. emotional decision-making style

Target Personas: • Tech Pragmatist • Business Realist

Listen For:
• Mention of data or analysis
• Consultation with others
• Emotional considerations
• Risk assessment process

Red Flags:
⚠ Impulsive decision without analysis
⚠ Extreme bias toward/against authority
⚠ Inability to explain reasoning

Ideal Answers:
✓ Balanced approach considering multiple factors
✓ Evidence of thoughtful analysis
✓ Willingness to consider different perspectives

Follow-ups:
→ If they mention data: "What kind of information did you gather?"
→ If they mention team: "How did you weigh different opinions?"
```

---

### 5. Focus Group Simulation

**URL:** Same case detail page → Focus Groups tab

**Step-by-Step Demo:**

1. **Switch to Focus Groups Tab**
   - Click "Focus Groups" tab
   - Shows Focus Group Simulator interface

2. **Configure Simulation**
   - **Select Argument**: Choose from dropdown (e.g., "Opening Statement")
   - **Choose Mode**:
     - **Quick**: Brief reactions (~2K tokens, 3-5 seconds)
     - **Detailed**: Comprehensive feedback (~5K tokens, 5-10 seconds) ✓ Recommended
     - **Deliberation**: Full jury discussion (~8K tokens, 10-15 seconds)

3. **Run Simulation**
   - Click "Run Focus Group Simulation"
   - Watch loading state
   - AI simulates 6 diverse personas reacting to your argument

4. **Review Overall Reception**
   - Summary paragraph of how the panel received it
   - Average sentiment score (-1 to +1)
   - Color-coded indicator

5. **Examine Individual Persona Reactions**
   - Each persona gets a detailed card:
     - **Name and verdict lean badge** (Favorable/Neutral/Unfavorable)
     - **Initial reaction** narrative
     - **Sentiment and confidence scores**
     - **What Worked** (✓ green) - persuasive elements they liked
     - **Weaknesses** (✗ red) - what fell flat or raised doubts
     - **Concerns** - specific worries they have
     - **Questions** - what they'd want clarified

6. **View Deliberation Discussion** (Deliberation mode only)
   - Exchange-by-exchange conversation
   - Shows who speaks and what they say
   - Influence tracking (who swayed whom)
   - Consensus areas vs. divisive issues

7. **Review Recommendations**
   - Prioritized list of improvements (1-10)
   - Category badges (strengthen/address/reframe/add/remove)
   - Detailed description and reasoning
   - Which personas are affected

8. **Check Summary Cards**
   - **Strengths to Emphasize** (green card) - what's working well
   - **Weaknesses to Address** (red card) - what needs improvement

**Example Output:**
```
Overall Reception:
"The panel was generally receptive to the opening statement's narrative
structure, but Technical Pragmatist persona members found the emotional
appeals less compelling than data-driven evidence."

Average Sentiment: +0.35

---

Tech Pragmatist (Sarah) - NEUTRAL
Sentiment: 0.2 | Confidence: 85%

Initial Reaction: "The opening establishes the timeline well, but I'd like
to see more concrete data about the hiring decisions. The emotional narrative
is compelling but doesn't address the business justification question."

✓ What Worked:
• Clear timeline of events
• Specific documentation references
• Logical structure

✗ Weaknesses:
• Insufficient quantitative evidence
• Over-reliance on emotional appeal
• Doesn't address alternative explanations

Concerns:
• Need more data on company hiring patterns
• Want to understand business metrics that were considered

---

Recommendation #1: Add Statistical Evidence
Priority: 9/10 | Category: strengthen

Add concrete statistics about hiring patterns before and after plaintiff's
termination. Include industry benchmarks for comparison.

Affected Personas: • Tech Pragmatist • Business Realist
```

---

## Demo Scenarios

### Scenario 1: Rapid Juror Assessment (5 minutes)

**Story**: "You have 100 potential jurors and need to quickly identify which personas they match."

1. Navigate to Jurors list
2. Pick first juror (Michael Chen)
3. Click "Analyze with AI"
4. Show top 3 persona matches with confidence
5. Explain how this helps prioritize which jurors to question more deeply
6. Select best persona to save the mapping

**Key Message**: "In seconds, AI analyzes occupation, demographics, questionnaire responses, and research to match jurors to proven behavioral personas."

---

### Scenario 2: Comprehensive Case Prep (10 minutes)

**Story**: "You're preparing for voir dire tomorrow and need strategic questions."

1. Start at Dashboard, click case name
2. Show Overview tab - review case facts
3. Switch to Voir Dire Questions tab
4. Generate questions
5. Walk through all 4 categories
6. Expand 2-3 high-priority questions
7. Show follow-up question trees
8. Explain how this saves hours of prep time

**Key Message**: "AI generates 15-25 strategic questions tailored to your case facts, personas, and jurisdiction in under 10 seconds."

---

### Scenario 3: Argument Testing (15 minutes)

**Story**: "You've drafted your opening statement and want to test it before trial."

1. Navigate to case
2. Show Arguments in Overview tab
3. Switch to Focus Groups tab
4. Select opening statement
5. Choose "Detailed" mode
6. Run simulation
7. Review overall reception
8. Deep dive into 2 persona reactions (one positive, one negative)
9. Show recommendations
10. Explain how to refine the argument based on feedback

**Key Message**: "Test arguments with AI-powered jury simulations before trial. Get specific feedback on what works and what needs improvement."

---

### Scenario 4: Research Deep-Dive (8 minutes)

**Story**: "Your paralegal found social media posts for a juror. Let's extract insights."

1. Navigate to a juror with research artifacts
2. Show raw research artifacts
3. Run AI Research Analysis
4. Review persona signals extracted
5. Show evidence supporting each signal
6. Highlight warnings if any
7. Explain how this informs questioning strategy

**Key Message**: "Turn raw research into actionable persona signals. AI identifies patterns and red flags you might miss."

---

## Technical Architecture

### AI Services (All Claude 4.5 Powered)

```
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│                    (Fastify + TypeScript)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ PersonaSuggester     │  │ ResearchSummarizer   │       │
│  │ Service              │  │ Service              │       │
│  │                      │  │                      │       │
│  │ • Analyzes juror     │  │ • Extracts signals   │       │
│  │ • Matches personas   │  │ • Identifies themes  │       │
│  │ • Confidence scores  │  │ • Sentiment analysis │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ QuestionGenerator    │  │ FocusGroupEngine     │       │
│  │ Service              │  │ Service              │       │
│  │                      │  │                      │       │
│  │ • 4 question types   │  │ • Persona reactions  │       │
│  │ • Follow-up trees    │  │ • Deliberation sim   │       │
│  │ • Strategic guidance │  │ • Recommendations    │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Claude 4.5 API
                              ▼
                    ┌─────────────────┐
                    │   Anthropic     │
                    │   Claude AI     │
                    └─────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Web App                        │
│                  (App Router + React 19)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Pages:                          Components:                 │
│  • Dashboard                     • PersonaSuggester         │
│  • Jurors List                   • ResearchSummarizer       │
│  • Juror Detail                  • QuestionGenerator        │
│  • Cases List                    • FocusGroupSimulator      │
│  • Case Detail                   • (Filevine Design)        │
│                                                              │
│  Hooks (React Query):                                        │
│  • usePersonaSuggestions         • useFocusGroupSimulation  │
│  • useResearchSummarizer         • useQuestionGenerator     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → React Query Hook → API Client
                                                        │
                                                        ▼
                                            API Gateway (JWT Auth)
                                                        │
                                                        ▼
                                            AI Service + Claude API
                                                        │
                                                        ▼
                                            Parse & Validate Response
                                                        │
                                                        ▼
                                            Save to PostgreSQL (Prisma)
                                                        │
                                                        ▼
                                            Return to Frontend
                                                        │
                                                        ▼
                                            Update UI (Real-time)
```

---

## Tips for Live Demos

### Before the Demo

1. **Start Both Servers**: Ensure API Gateway and Web App are running
2. **Check Database**: Verify seed data exists (`npm run seed` if needed)
3. **Test AI Key**: Confirm `ANTHROPIC_API_KEY` is set and working
4. **Login Ready**: Have demo account credentials ready
5. **Browser Setup**:
   - Clear cache/cookies
   - Disable extensions that might interfere
   - Have browser window at good size for screen sharing

### During the Demo

1. **Set Expectations**:
   - "This is real AI running in real-time"
   - "Responses take 3-10 seconds depending on mode"
   - "Every response is unique and contextual"

2. **Show Loading States**:
   - Don't skip over the loading spinners
   - Explain "Claude is analyzing right now"
   - This demonstrates it's not pre-canned

3. **Highlight Confidence Scores**:
   - Point out the color coding
   - Explain what different confidence levels mean
   - Show this helps prioritize actions

4. **Read AI Responses Aloud**:
   - Pick interesting insights to read
   - Show evidence supporting claims
   - Highlight actionable recommendations

5. **Connect to Real Workflow**:
   - "This would normally take hours of manual analysis"
   - "You can now do this for 100 jurors in minutes"
   - "Save these insights for trial notes"

### Common Questions & Answers

**Q: How accurate are the AI suggestions?**
A: The AI uses Claude 4.5, which analyzes patterns based on provided data. Confidence scores indicate reliability. Always combine AI insights with your professional judgment.

**Q: Can we customize the personas?**
A: Yes! The system supports both system personas and custom organization-specific personas. You can create personas based on your own case history.

**Q: What if the AI makes a mistake?**
A: All AI suggestions are advisory, not prescriptive. Attorneys review and approve all outputs. The system provides transparency with evidence and reasoning.

**Q: How fast does this work in practice?**
A:
- Persona suggestions: 3-5 seconds
- Research analysis: 5-10 seconds per batch
- Question generation: 5-10 seconds for full set
- Focus groups: 5-15 seconds depending on mode

**Q: Does this work offline?**
A: The current version requires internet for AI features. The Trial Mode PWA (coming soon) will support offline note-taking with background sync.

**Q: What about data privacy?**
A: All data stays in your private PostgreSQL database. API calls to Claude are encrypted. We follow SOC 2 compliance guidelines. No data is shared between organizations.

### Demo Don'ts

❌ Don't refresh during loading
❌ Don't skip reading AI outputs
❌ Don't make claims about "replacing attorneys"
❌ Don't show error states (test beforehand!)
❌ Don't rush through explanations

### Demo Do's

✓ Let AI complete its analysis
✓ Show the evidence behind suggestions
✓ Emphasize "AI-assisted" not "AI-automated"
✓ Use real case scenarios
✓ Highlight time savings

---

## Troubleshooting

### API Not Responding
```bash
# Check if API Gateway is running
curl http://localhost:3001/health

# Restart if needed
cd services/api-gateway
npm run dev
```

### No AI Responses (Mock Data Shows)
```bash
# Check environment variable
echo $ANTHROPIC_API_KEY

# Set if missing
export ANTHROPIC_API_KEY=your-key-here

# Restart API Gateway
```

### Login Not Working
```bash
# Re-seed database
cd packages/database
npm run seed
```

### UI Not Updating
```bash
# Clear browser cache
# Or restart Next.js dev server
cd apps/web
npm run dev
```

---

## Next Steps After Demo

1. **Gather Feedback**: What features resonate most?
2. **Discuss Customization**: Organization-specific personas needed?
3. **Plan Integration**: How to fit into existing workflow?
4. **Trial Timeline**: When could they pilot this?
5. **Training Needs**: What support is needed?

---

## Contact & Support

- **Documentation**: See `/ai_instructions.md` for technical details
- **Issues**: GitHub Issues for bug reports
- **Feature Requests**: Contact product team

---

**Remember**: This is a powerful tool that augments attorney expertise. The AI provides insights and suggestions, but the attorney makes all final decisions. Emphasize collaboration between human judgment and AI intelligence.
