# TrialForge AI - 5-Minute Quick Demo

## Setup (1 minute)

```bash
# Terminal 1: Start API Gateway
cd services/api-gateway && npm run dev

# Terminal 2: Start Web App
cd apps/web && npm run dev

# Browser: http://localhost:3000
# Login: attorney@example.com / password
```

## Demo Flow (4 minutes)

### 1. AI Persona Analysis (60 seconds)

**Path**: Dashboard → Jurors → Michael Chen → Analyze with AI

**Say**:
"Let's analyze this software engineer juror. AI will match him to behavioral personas based on his occupation, demographics, and background."

**Show**:
- Click "Analyze with AI" button
- Wait 3-5 seconds (emphasize real-time AI)
- Point to top match: "Tech Pragmatist" with 85% confidence
- Read one key match and one concern
- Click "Select Persona" to save

**Key Message**: "In 5 seconds, AI identifies the most likely behavioral profile for strategic jury selection."

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

### 3. Focus Group Simulation (90 seconds)

**Path**: Same case → Focus Groups Tab → Select argument → Run simulation

**Say**:
"Let's test our opening statement with a simulated jury of 6 diverse personas."

**Show**:
- Select "Opening Statement" argument
- Choose "Detailed" mode
- Click "Run Focus Group Simulation"
- Wait 5-10 seconds
- Show overall sentiment score
- Expand 1-2 persona reactions
- Point to what worked vs. weaknesses
- Scroll to recommendations

**Key Message**: "Test arguments before trial. Get specific feedback on what resonates with different juror types."

---

## Key Stats to Mention

- ⏱️ **Time Saved**: Hours of analysis → Seconds
- 🎯 **Accuracy**: 70-90% confidence scores typical
- 📊 **Scale**: Analyze 100 jurors in minutes
- 🧠 **AI Model**: Claude 4.5 (cutting-edge)

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
