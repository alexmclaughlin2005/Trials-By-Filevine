# Trials by Filevine AI - 5-Minute Quick Demo

## Setup (1 minute)

```bash
# Terminal 1: Start API Gateway
cd services/api-gateway && npm run dev

# Terminal 2: Start Web App
cd apps/web && npm run dev

# Browser: http://localhost:3000
# Login: attorney@example.com / password
```

## Demo Flow (5 minutes)

### 1. Embedded Juror Research (90 seconds)

**Path**: Dashboard → Cases → Johnson v. TechCorp → Jurors Tab → Click juror to expand

**Say**:
"Let's look at a juror. All research happens right here in the case - no separate pages needed."

**Show**:
- Click to expand a juror card
- Point out inline sections: Basic Info, Identity Research, Deep Research, Archetype Classification
- Explain: "Everything stays in context - this is where attorneys will spend their time."

**Key Message**: "Complete juror research workflow embedded within the case. No jumping between pages."

---

### 2. Identity Matching & Deep Research (90 seconds)

**Path**: Same expanded juror → Identity Research section

**Say**:
"First, we find the right person. Then Claude AI does comprehensive web research."

**Show**:
- Click "Search Public Records" button
- Show candidate matches with confidence scores
- Click green "Confirm" button on best match
- Point to Deep Research section appearing below
- Click "Start Deep Research"
- Show processing indicator (10-20 seconds)
- Highlight results: Executive Summary, Concerns, Favorable Indicators, Suggested Questions

**Key Message**: "In 20 seconds, Claude searches the web and creates a comprehensive profile with strategic recommendations."

---

### 3. Archetype Classification (60 seconds)

**Path**: Same expanded juror → Archetype Classification section

**Say**:
"Now let's classify their behavioral archetype - one of 10 proven juror types."

**Show**:
- Click "Classify Juror" button
- Wait 5 seconds (emphasize real-time AI)
- Point to primary archetype with confidence score
- Show psychological dimension scores
- Highlight plaintiff/defense danger levels (color-coded)
- Show suggested voir dire questions

**Key Message**: "AI identifies behavioral patterns and gives strategic guidance specific to your case."

---

### 2. Voir Dire Questions (90 seconds)

**Path**: Dashboard → Johnson v. TechCorp → Voir Dire Questions Tab → Generate Questions

**Say**:
"Now let's generate strategic questions for our age discrimination case."

**Show**:
- Click "Generate Questions"
- Wait 5-10 seconds
- Show 4 category tabs with counts
- Click on one high-priority question (Priority 9-10)
- Expand to show full details:
  - Purpose
  - Listen for
  - Red flags
  - Ideal answers
  - Follow-up questions

**Key Message**: "AI creates 20+ tailored questions with strategic guidance in 10 seconds. Normally takes hours."

---

### 4. Voir Dire Question Generation (60 seconds)

**Path**: Same case → Voir Dire Questions Tab

**Say**:
"Let's generate strategic questions for voir dire based on our case facts."

**Show**:
- Click "Generate Questions"
- Wait 5-10 seconds
- Show 4 category tabs with question counts
- Click on a high-priority question (Priority 9-10)
- Expand to show full details: Purpose, Listen for, Red flags, Ideal answers, Follow-ups

**Key Message**: "AI creates 20+ tailored questions with strategic guidance in 10 seconds. Would normally take hours."

---

### 5. Focus Group Simulation with AI Questions (90 seconds) ⭐ NEW

**Path**: Same case → Focus Groups Tab → New Focus Group

**Say**:
"Let's create a focus group to test our arguments. Watch how AI generates contextual questions."

**Show**:
- Click "New Focus Group"
- Enter name and purpose (e.g., "Test workplace safety argument")
- Select 2-3 personas (e.g., Bootstrapper, Heart, Scale-Balancer)
- Click "Generate Questions with AI" button
- Wait 2-4 seconds (emphasize speed)
- Show 10-15 generated questions appearing
- Read 2-3 example questions aloud
- Click "Continue" to proceed with focus group

**Key Message**: "AI generates contextual questions tailored to your case and selected personas in seconds. Saves 10-15 minutes per focus group."

---

### 6. Run Focus Group Simulation (30 seconds)

**Path**: Same focus group → Run simulation

**Show**:
- Click "Run Simulation"
- Wait 10-15 seconds
- Show overall sentiment score
- Expand 1-2 persona reactions
- Point to what worked vs. weaknesses

**Key Message**: "Test arguments with AI-powered jury simulation. Get specific feedback on what resonates with different juror types."

---

## Key Stats to Mention

- ⏱️ **Time Saved**: Hours of research → 20 seconds per juror
- 🎯 **Accuracy**: 70-90% confidence scores typical
- 📊 **Scale**: Analyze entire jury panel (40+ jurors) in under 15 minutes
- 🧠 **AI Model**: Claude 4.5 Sonnet with web search (cutting-edge)
- 🌐 **Web Search**: 3-10 searches per juror for comprehensive public data
- 📋 **Complete Workflow**: Everything in one place - no separate navigation
- ✨ **NEW - AI Question Generation**: 10-15 contextual questions in 2-4 seconds (saves 10-15 minutes per focus group)

## Powerful Quotes

> "This is like having a jury consultant available 24/7, giving instant strategic insights based on the latest AI research."

> "Instead of guessing which jurors might be favorable, we now have data-driven confidence scores for each match."

> "We can now test every argument variant before trial and optimize for maximum jury impact."

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| No AI response | Check `ANTHROPIC_API_KEY` environment variable |
| Login fails | Run `npm run seed` in `packages/database` |
| Port conflict | Kill processes on 3000/3001 |

## Demo Best Practices

✅ **DO**:
- Let AI finish completely
- Show loading states
- Read outputs aloud
- Highlight confidence scores
- Emphasize "AI-assisted"

❌ **DON'T**:
- Skip through quickly
- Claim AI is perfect
- Say it replaces attorneys
- Use without explaining

## Follow-Up Questions to Ask

1. "Which feature would save you the most time?"
2. "How many jurors do you typically analyze per case?"
3. "Would your team use this for voir dire prep?"
4. "What custom personas would be valuable for your practice?"

---

**End Goal**: Schedule follow-up meeting to discuss:
- Custom persona development
- Integration with existing workflow
- Training for team
- Pilot trial timeline
