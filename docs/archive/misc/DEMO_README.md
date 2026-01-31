# Demo & Presentation Materials

This directory contains comprehensive demo and presentation materials for Trials by Filevine AI.

## 📚 Available Guides

### 1. [DEMO_GUIDE.md](./DEMO_GUIDE.md) - Comprehensive Walkthrough
**Use for:** Training, detailed demos, technical evaluations
**Duration:** 30-60 minutes
**Includes:**
- Complete feature walkthrough with screenshots
- 4 detailed demo scenarios
- Technical architecture explanation
- Troubleshooting guide
- Q&A preparation

### 2. [QUICK_DEMO.md](./QUICK_DEMO.md) - 5-Minute Quick Demo
**Use for:** Initial meetings, quick overviews, time-constrained presentations
**Duration:** 5 minutes
**Includes:**
- Rapid setup instructions
- 3-part demo flow
- Key stats and quotes
- Quick troubleshooting

### 3. [FEATURE_MATRIX.md](./FEATURE_MATRIX.md) - Feature Comparison
**Use for:** Proposals, competitive analysis, ROI discussions
**Format:** Tables and matrices
**Includes:**
- Traditional vs. AI comparison
- Feature completeness chart
- Cost analysis
- Competitive advantages
- Use cases by role

### 4. [PRESENTATION_SCRIPT.md](./PRESENTATION_SCRIPT.md) - Investor/Stakeholder Pitch
**Use for:** Fundraising, executive presentations, partnership discussions
**Duration:** 15 minutes
**Includes:**
- Full presentation script with timing
- Business impact analysis
- Q&A preparation
- Backup slides suggestions
- Follow-up templates

## 🎯 Which Guide to Use When

| Situation | Recommended Guide | Duration |
|-----------|------------------|----------|
| First meeting with potential customer | QUICK_DEMO.md | 5 min |
| Technical evaluation with IT team | DEMO_GUIDE.md | 45 min |
| Investor pitch meeting | PRESENTATION_SCRIPT.md | 15 min |
| Sales proposal preparation | FEATURE_MATRIX.md | Reference |
| Team training/onboarding | DEMO_GUIDE.md | 60 min |
| Trade show/conference booth | QUICK_DEMO.md | 5 min |
| Partnership discussion | FEATURE_MATRIX.md + PRESENTATION_SCRIPT.md | 20 min |

## 🚀 Quick Start for Demo

1. **Start the application:**
   ```bash
   # Terminal 1: API Gateway
   cd services/api-gateway && npm run dev

   # Terminal 2: Web App
   cd apps/web && npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Login:**
   ```
   Email: attorney@example.com
   Password: password
   ```

4. **Choose your path:**
   - 5-minute demo: Follow QUICK_DEMO.md
   - Full walkthrough: Follow DEMO_GUIDE.md
   - Presentation: Use PRESENTATION_SCRIPT.md

## 📊 Demo Data Available

The seeded database includes:

- **1 Sample Case**: Johnson v. TechCorp Industries
  - Type: Employment discrimination (age)
  - Status: Active
  - Trial date: March 15, 2026
  - Facts: 3 key facts (background, disputed, undisputed)
  - Arguments: Opening statement, closing statement

- **5 Sample Jurors**:
  1. Michael Chen (42) - Software Engineer
  2. Jennifer Martinez (38) - Teacher
  3. David Thompson (55) - Business Consultant
  4. Emily Rodriguez (29) - Social Worker
  5. Robert Williams (61) - Retired Engineer

- **3 System Personas**:
  1. Tech Pragmatist - Analytical, data-driven
  2. Community Caretaker - Empathetic, relationship-focused
  3. Business Realist - Pragmatic, outcome-oriented

## 🎬 Demo Flow Recommendations

### For Legal Professionals (Attorneys, Paralegals)
1. Start with juror analysis (shows immediate value)
2. Show research summarization (saves paralegal time)
3. Demonstrate question generation (trial prep benefit)
4. End with focus group simulation (strategic advantage)

### For Technical Evaluators (IT, Security)
1. Show authentication and security features
2. Demonstrate API integration capabilities
3. Explain multi-tenant architecture
4. Discuss scalability and performance

### For Executives (C-suite, Partners)
1. Start with business problem/cost
2. Show quick demo of one feature
3. Present ROI and cost savings
4. Discuss implementation timeline

### For Investors
1. Present market opportunity
2. Show live demo (focus on "wow" factor)
3. Discuss competitive moat
4. Present financials and traction

## 🔧 Pre-Demo Checklist

### 1 Hour Before
- [ ] Start API Gateway and confirm it's running
- [ ] Start Web App and confirm it's running
- [ ] Test login with demo credentials
- [ ] Run through demo flow once
- [ ] Check internet connection stability
- [ ] Close unnecessary browser tabs
- [ ] Set browser zoom to 100%

### 15 Minutes Before
- [ ] Clear browser cache/cookies (optional)
- [ ] Test AI features are responding
- [ ] Have demo guide open on second screen
- [ ] Set up screen sharing if remote
- [ ] Silence phone/notifications
- [ ] Have water ready

### During Demo
- [ ] Speak slowly and clearly
- [ ] Let AI complete before moving on
- [ ] Explain what you're clicking
- [ ] Point out key information
- [ ] Ask if they have questions
- [ ] Take notes on feedback

## 💡 Demo Tips & Tricks

### Making AI Responses More Impressive
1. **Set expectations**: Tell them responses take 5-10 seconds
2. **Show loading state**: Don't skip over the spinner
3. **Read results aloud**: Highlight specific insights
4. **Explain confidence scores**: Color coding matters
5. **Connect to workflow**: "This normally takes hours..."

### Handling Common Issues
| Issue | Quick Fix |
|-------|-----------|
| AI not responding | Check `ANTHROPIC_API_KEY` env var |
| Slow response | Explain: "Real AI takes time, not pre-canned" |
| Error message | Refresh page, try again |
| Login fails | Use correct demo credentials |
| Blank screen | Check console, restart dev server |

### Recovering from Demo Failures
1. **Have backup screenshots** ready
2. **Record a demo video** beforehand
3. **Know the fallback modes** (mock data)
4. **Stay calm** - "Let me show you the recorded version"
5. **Be honest** - "This is a demo environment, but here's what it does..."

## 📈 Measuring Demo Success

### Immediate Indicators
- ✅ Asks detailed questions
- ✅ Requests second demo
- ✅ Asks about pricing/timeline
- ✅ Introduces you to decision maker
- ✅ Requests pilot program

### Follow-up Metrics
- 📧 Opens follow-up email within 24 hours
- 📞 Schedules next call
- 💰 Asks for proposal
- 🤝 Signs pilot agreement
- 🎉 Becomes paying customer

## 🎥 Recording Demos

For creating demo videos:

```bash
# Recommended tools
- OBS Studio (free, powerful)
- Loom (easy, good for quick demos)
- Zoom (record meeting)

# Settings
- Resolution: 1920x1080
- Frame rate: 30fps
- Audio: Clear mic, no background noise
- Duration: 5-15 minutes max
```

## 📝 Demo Feedback Template

After each demo, record:

```markdown
Date: [Date]
Audience: [Company/Role]
Duration: [Actual time]
Guide Used: [Which guide]

What went well:
-
-

What could improve:
-
-

Technical issues:
-

Questions asked:
-
-

Interest level (1-5): [ ]
Next steps:
Follow-up date: [Date]
```

## 🆘 Getting Help

If you encounter issues during demo preparation:

1. Check [DEMO_GUIDE.md](./DEMO_GUIDE.md) troubleshooting section
2. Review [README.md](./README.md) for general setup
3. Check [ai_instructions.md](./ai_instructions.md) for technical details
4. Test with mock data (no API key needed)
5. Record and replay if necessary

## 📞 Support Contacts

- **Technical Issues**: Check GitHub Issues
- **Demo Questions**: Review demo guides
- **Custom Demos**: Create new scenario in DEMO_GUIDE.md

## 🔄 Keeping Demos Updated

When code changes:
1. Update screenshots if UI changed
2. Revise timing estimates if performance changed
3. Add new features to appropriate guides
4. Test full demo flow after major updates
5. Update seed data if schema changed

---

## Next Steps After Demo

Based on audience interest:

### High Interest
1. Schedule follow-up technical deep-dive
2. Prepare custom demo with their data
3. Draft pilot program proposal
4. Introduce to implementation team

### Medium Interest
1. Send detailed feature matrix
2. Share case studies
3. Offer 30-day trial
4. Schedule check-in in 2 weeks

### Low Interest
1. Send thank-you email
2. Add to nurture campaign
3. Check back in 3 months
4. Note concerns for product feedback

---

**Remember**: The demo is about showing value, not features. Focus on the problems you solve and the time/money you save. Make it personal, relevant, and impressive.

**Good luck with your demos! 🚀**
