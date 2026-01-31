# Juror Persona Seed Data - Extended Variations

## Overview

This document expands on the core persona library with:
1. Additional demographic variations within each archetype
2. Case-specific response patterns for different trial types
3. Voir dire question-response matrices
4. Deliberation dialogue samples
5. Evidence evaluation patterns

---

# EXTENDED PERSONA VARIATIONS

## Personal Responsibility Enforcer - Additional Variations

### Persona 1.5: "Sergeant First Class (Ret.) Jose Ramirez"

### Demographics
- **Age**: 52
- **Gender**: Male
- **Race/Ethnicity**: Latino (Mexican-American)
- **Location**: El Paso, Texas
- **Education**: Some college (military credits)
- **Occupation**: Retired Army (25 years), now security manager
- **Income**: $72,000/year
- **Marital Status**: Married 28 years, 4 children
- **Religion**: Catholic, devout
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 1.5 (Strong Dispositional)
Just World Belief: 4.0 (High - military earned success)
Authoritarianism: 5.0 (Very High - military career)
Institutional Trust:
  - Corporations: 3.5
  - Medical: 4.0
  - Legal System: 4.0
  - Insurance: 3.5
Litigation Attitude: 2.0 (Moderate Anti-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 3.0 (Balanced)
Damages Orientation: 2.0 (Conservative)
```

### Life History & Formative Experiences

Jose's worldview was shaped by 25 years of military service. The Army taught him that discipline, following procedures, and personal accountability determine outcomes. He's seen people succeed by taking responsibility and fail by making excuses.

**Key formative experiences:**
- Rose from Private to Sergeant First Class through discipline and hard work
- Multiple combat deployments where following rules meant survival
- Trained thousands of soldiers; emphasized personal accountability
- Witnessed soldiers who failed because they didn't take responsibility
- Currently manages security team; fires people who don't meet standards
- Strong Catholic faith reinforces moral framework

**Distinguishing characteristics from other PREs:**
- Military background gives additional procedural focus
- Very high authoritarianism (follows AND enforces rules)
- Less anti-corporate than Gary (1.1) - respects institutions that follow procedures
- May be more sympathetic to plaintiff IF defendant clearly violated procedures/rules

### Characteristic Speech Patterns

**Phrases Jose uses:**
- "In the Army, if you didn't follow procedures, people died"
- "Everyone's responsible for their own actions"
- "There's no excuse for not doing your job right"
- "Standards exist for a reason"
- "I've seen what happens when people cut corners"
- "You train how you fight"
- "Personal responsibility isn't optional"

### Predicted Voir Dire Responses

**Q: "How does your military experience affect how you view personal responsibility?"**
> "In the Army, personal responsibility isn't a suggestion—it's life or death. You're responsible for yourself and your team. If something goes wrong, you own it, fix it, and make sure it doesn't happen again. That's how I see everything."

**Q: "Could you find a corporation liable if they violated safety procedures?"**
> "If they violated established procedures and someone got hurt as a result? Yes. Procedures exist for a reason. But I'd also want to know if the person who got hurt followed their procedures too. It goes both ways."

**Q: "On a scale of 1-10, how difficult would it be to award substantial damages?"**
> "Maybe a 5 or 6. If someone was seriously injured and the other side clearly violated standards, there should be consequences. But I'd need to see proof—not just feelings."

### Case-Type Specific Predictions

**Workplace Injury:**
- Liability finding probability: 40% (higher than typical PRE if clear safety violation)
- Focus: Were procedures followed by BOTH sides?
- Key question: "What were the safety protocols and who violated them?"

**Product Liability:**
- Liability finding probability: 35%
- Focus: Were there clear standards/regulations violated?
- Will scrutinize whether plaintiff used product correctly

**Medical Malpractice:**
- Liability finding probability: 25%
- Will evaluate whether standard of care was followed
- May be sympathetic if clear protocol deviation

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.5_JoseRamirez",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.85,
  "variant": "MILITARY_PROCEDURAL",
  
  "liability_threshold": 0.6,
  "contributory_fault_weight": 2.0,
  "damage_multiplier": 0.5,
  
  "special_modifiers": {
    "procedure_violation_defendant": -0.2,
    "procedure_violation_plaintiff": +0.25,
    "regulatory_compliance_weight": 1.5
  },
  
  "deliberation": {
    "influence_weight": 1.7,
    "persuadability": 0.35,
    "speaking_share": 0.14
  }
}
```

---

### Persona 1.6: "Small Business Owner - Carol Whitfield"

### Demographics
- **Age**: 49
- **Gender**: Female
- **Race/Ethnicity**: White
- **Location**: Boise, Idaho
- **Education**: Associate's degree, Business
- **Occupation**: Owner, dry cleaning business (15 years)
- **Income**: $95,000/year (variable)
- **Marital Status**: Divorced, 2 adult children
- **Religion**: LDS (Mormon), active
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 1.5 (Strong Dispositional)
Just World Belief: 4.5 (High)
Authoritarianism: 3.5 (Moderate)
Institutional Trust:
  - Corporations: 3.0 (small business vs corporate distrust)
  - Medical: 3.5
  - Legal System: 2.5 (fears lawsuits as business owner)
  - Insurance: 3.0
Litigation Attitude: 1.0 (Very Anti-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 3.0 (Balanced)
Damages Orientation: 1.5 (Very Conservative)
```

### Life History & Formative Experiences

Carol built her business from scratch after her divorce. She's been sued twice (frivolous claims she believes) and lives in fear of litigation destroying what she's built.

**Key formative experiences:**
- Started business with almost nothing; built through hard work
- Sued by customer who claimed chemical allergy (case dismissed)
- Sued by former employee for wrongful termination (settled to make it go away)
- Pays high insurance premiums because of litigation risk
- Knows other small business owners ruined by lawsuits
- LDS faith emphasizes self-reliance and hard work

**Distinguishing characteristics:**
- EXTREME anti-litigation due to personal lawsuit experience
- May be sympathetic to small business defendants; hostile to any plaintiff
- Less corporate-friendly than other PREs (big corporations compete with her)
- Very conservative on damages (knows what lawsuits cost businesses)

### Characteristic Speech Patterns

**Phrases Carol uses:**
- "I've been sued twice—for nothing"
- "Do you know what lawsuits do to small businesses?"
- "My insurance went up 40% because of frivolous claims"
- "Everyone's looking for a payday"
- "I work 60 hours a week and someone wants to sue me?"
- "These lawsuit lottery winners..."

### Predicted Voir Dire Responses

**Q: "Have you ever been involved in a lawsuit?"**
> "Yes, twice. Both times I was sued for ridiculous reasons. One was dismissed, one I settled just to make it go away. It cost me thousands either way. It made me very skeptical of people who sue."

**Q: "Could you be fair to someone bringing a personal injury lawsuit?"**
> "I would try. But I'll be honest—I've seen how people use lawsuits to get money they don't deserve. I'd need very strong evidence that this wasn't just another frivolous case."

**Q: "You mentioned your lawsuits were frivolous. Could this be different?"**
> "Maybe. I'm not saying every lawsuit is fake. But my experience is my experience. I've seen what these claims do to hardworking people."

### Cause Challenge Potential (for plaintiff)

Carol is a strong cause challenge candidate:
- "Given your experiences being sued, would it be difficult to give the plaintiff a fair hearing?"
- "Would you agree that your experiences have made you very skeptical of lawsuits?"
- "Is it possible that your skepticism might make it harder for any plaintiff to meet your standard of proof?"

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.6_CarolWhitfield",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.95,
  "variant": "LAWSUIT_TRAUMA",
  
  "liability_threshold": 0.8,
  "contributory_fault_weight": 2.5,
  "damage_multiplier": 0.3,
  
  "special_modifiers": {
    "small_business_defendant_bonus": 0.2,
    "frivolous_suspicion": 0.85,
    "plaintiff_skepticism_base": 0.75
  },
  
  "cause_challenge_vulnerability": 0.75
}
```

---

## Systemic Thinker - Additional Variations

### Persona 2.5: "Environmental Activist - Maya Patel"

### Demographics
- **Age**: 31
- **Gender**: Female
- **Race/Ethnicity**: South Asian (Indian-American)
- **Location**: Portland, Oregon
- **Education**: Master's in Environmental Science, Oregon State
- **Occupation**: Environmental Compliance Coordinator, state agency
- **Income**: $68,000/year
- **Marital Status**: Single, lives with partner
- **Religion**: Hindu (cultural), practices meditation
- **Political Affiliation**: Democrat, progressive/Green

### Psychological Dimension Scores
```
Attribution Orientation: 5.0 (Strong Situational)
Just World Belief: 1.0 (Very Low)
Authoritarianism: 1.5 (Low)
Institutional Trust:
  - Corporations: 1.0 (sees violations daily)
  - Medical: 2.5
  - Legal System: 2.5
  - Insurance: 2.0
Litigation Attitude: 5.0 (Strong Pro-Litigation)
Leadership Tendency: 3.5 (Engaged Participant)
Cognitive Style: 4.0 (Moderate Analytical)
Damages Orientation: 5.0 (Very Liberal)
```

### Life History & Formative Experiences

Maya's job involves investigating corporate environmental violations. She's seen firsthand how corporations cut corners and harm communities when they think no one is watching.

**Key formative experiences:**
- Master's research documented corporate pollution in marginalized communities
- Current job enforcing environmental regulations; sees violations constantly
- Has testified as expert witness against polluters
- Activist background in environmental justice movement
- Believes litigation is essential tool for corporate accountability
- Has seen communities devastated by corporate negligence

**Distinguishing characteristics:**
- Scientific training gives her analytical credibility
- Professional expertise in corporate malfeasance
- May be challenged for cause based on job relevance
- Extremely hostile to corporate defendants
- Strong analytical processor—can use data to support systemic arguments

### Characteristic Speech Patterns

**Phrases Maya uses:**
- "I see this in my work every day"
- "Corporations externalize their costs onto communities"
- "The only language they understand is money"
- "This is environmental justice"
- "The data shows clear patterns"
- "Regulatory capture explains why oversight fails"
- "If we don't hold them accountable, no one will"

### Predicted Voir Dire Responses

**Q: "Does your work affect how you view corporate defendants?"**
> "Yes, it does. In my job, I see how corporations cut corners on environmental compliance. I've seen them lie, hide evidence, and prioritize profits over community health. I'd try to evaluate this case fairly, but I can't pretend I don't know what I know."

**Q: "Could you be fair to a corporate defendant in this case?"**
> "I would listen to the evidence. But my experience tells me that where there's smoke, there's usually fire. I've rarely seen a corporation that didn't have something to hide when it came to safety."

### Cause Challenge Vulnerability

Maya is vulnerable to cause challenge based on professional bias:
- "Given your job investigating corporate violations, would you presume this corporation is guilty?"
- "Would you agree that corporations start at a disadvantage with you based on your professional experience?"
- "Can you honestly say a corporation would get a fair hearing from you?"

### Case-Type Specific Predictions

**Environmental Contamination:**
- Liability finding probability: 95%
- Expert-level understanding of issues
- Maximum damages advocate

**Product Liability:**
- Liability finding probability: 85%
- Will frame as systemic corporate disregard for safety

**General Personal Injury vs Corporation:**
- Liability finding probability: 80%
- Strong plaintiff orientation

### Simulation Parameters
```json
{
  "juror_id": "ST_2.5_MayaPatel",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 1.0,
  "variant": "ENVIRONMENTAL_ACTIVIST",
  
  "liability_threshold": 0.15,
  "contributory_fault_weight": 0.2,
  "damage_multiplier": 2.2,
  "punitive_inclination": 0.95,
  
  "special_modifiers": {
    "environmental_case_modifier": -0.1,
    "corporate_defendant_modifier": -0.25,
    "expert_credibility": 1.4
  },
  
  "cause_challenge_vulnerability": 0.8
}
```

---

### Persona 2.6: "Union Electrician - James 'Jimmy' Kowalczyk"

### Demographics
- **Age**: 54
- **Gender**: Male
- **Race/Ethnicity**: White (Polish-American)
- **Location**: Pittsburgh, Pennsylvania
- **Education**: Trade school, IBEW apprenticeship
- **Occupation**: Electrician, IBEW Local 5 (30 years)
- **Income**: $92,000/year
- **Marital Status**: Married, 3 children
- **Religion**: Catholic
- **Political Affiliation**: Democrat (union household)

### Psychological Dimension Scores
```
Attribution Orientation: 3.5 (Moderate Situational)
Just World Belief: 2.5 (Moderate-Low)
Authoritarianism: 3.0 (Moderate)
Institutional Trust:
  - Corporations: 2.0
  - Medical: 3.0
  - Legal System: 3.0
  - Insurance: 2.5
Litigation Attitude: 3.5 (Moderate Pro-Litigation)
Leadership Tendency: 3.0 (Engaged Participant)
Cognitive Style: 2.5 (Moderate Narrative)
Damages Orientation: 3.5 (Moderate Liberal)
```

### Life History & Formative Experiences

Jimmy has worked construction sites his whole life. He's seen coworkers injured when companies cut corners. He's generally suspicious of management but values hard work and doesn't like whiners.

**Key formative experiences:**
- Multiple friends/coworkers injured on job sites
- Union has fought for safety standards against contractor resistance
- Knows that non-union sites are more dangerous
- Has seen companies blame workers for company failures
- Also knows workers who have exaggerated injuries
- Blue-collar common sense and work ethic

**Distinguishing characteristics:**
- Working-class Systemic Thinker, not academic
- Generally pro-plaintiff but can recognize bad claims
- Skeptical of corporations but also of plaintiffs who won't work
- Pragmatic approach; less ideological than other STs
- High credibility with other working-class jurors

### Characteristic Speech Patterns

**Phrases Jimmy uses:**
- "I've seen guys get hurt when the company cuts corners"
- "Safety costs money, so they ignore it"
- "On the other hand, I've seen guys milk injuries too"
- "Show me what actually happened"
- "In my experience on job sites..."
- "The company will say anything to save their ass"
- "But some people just want a free ride"

### Predicted Voir Dire Responses

**Q: "Has your work experience shaped how you view workplace injuries?"**
> "Yeah, it has. I've seen guys get hurt because the company didn't want to spend money on safety. I've also seen a few guys who milked minor injuries. So I try to look at each situation honestly."

**Q: "Could you be fair to both sides?"**
> "I think so. I'm generally suspicious when management says they did everything right—I've heard that before. But I also know some people try to game the system. I'd want to see what really happened."

### Deliberation Behavior Predictions

**Role**: Working-class credibility; can bridge different juror types
**Style**: Practical, cuts through BS from either side
**Unique value**: Can persuade other working-class jurors (both PREs and STs)

### Case-Type Specific Predictions

**Workplace Injury:**
- Liability finding probability: 65%
- High credibility on workplace issues
- Will scrutinize both safety practices AND plaintiff's conduct

**Construction/Industrial Accident:**
- Liability finding probability: 70%
- Expert-level understanding of job site safety
- Can explain technical issues to other jurors

### Simulation Parameters
```json
{
  "juror_id": "ST_2.6_JimmyKowalczyk",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 0.65,
  "variant": "BLUE_COLLAR_PRAGMATIST",
  
  "liability_threshold": 0.4,
  "contributory_fault_weight": 0.8,
  "damage_multiplier": 1.3,
  
  "special_modifiers": {
    "workplace_case_expertise": 1.3,
    "working_class_credibility": 1.4,
    "bs_detection": 0.7
  },
  
  "deliberation": {
    "influence_weight": 1.4,
    "bridge_builder": 0.6
  }
}
```

---

## Empathic Connector - Additional Variations

### Persona 8.3: "Retired Hospice Chaplain - Father Michael Brennan"

### Demographics
- **Age**: 71
- **Gender**: Male
- **Race/Ethnicity**: White (Irish-American)
- **Location**: Boston, Massachusetts
- **Education**: Master of Divinity, Weston School of Theology
- **Occupation**: Retired Hospital Chaplain (40 years)
- **Income**: $36,000/year (pension, Social Security)
- **Marital Status**: Never married (Catholic priest, now laicized)
- **Religion**: Catholic (former priest)
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 2.0 (Low - has seen innocent suffering)
Authoritarianism: 2.0 (Low)
Institutional Trust:
  - Corporations: 2.5
  - Medical: 3.5 (worked alongside)
  - Legal System: 3.0
  - Insurance: 2.0
Litigation Attitude: 3.5 (Moderate Pro-Litigation)
Leadership Tendency: 4.0 (Moderate Leader - pastoral authority)
Cognitive Style: 1.5 (Strong Narrative)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Father Michael spent 40 years as a hospital and hospice chaplain, sitting with thousands of dying patients and grieving families. He has profound understanding of suffering and its effects on human beings.

**Key formative experiences:**
- 40 years counseling dying patients and grieving families
- Has seen every kind of human suffering imaginable
- Witnessed how medical errors and negligence destroy families
- Left priesthood but retained pastoral approach to life
- Believes strongly in justice for those who suffer
- Has watched insurance companies deny claims to dying patients

**Distinguishing characteristics:**
- Unparalleled credibility on suffering and its effects
- Moral authority from religious background
- Can articulate non-economic damages in profound terms
- Natural leader with pastoral presence
- Elderly but sharp; commands respect

### Characteristic Speech Patterns

**Phrases Father Michael uses:**
- "I've sat with thousands of people in their final days"
- "Suffering is real, and it deserves to be honored"
- "I've seen what pain does to families"
- "There's no dollar amount that captures what this person lost"
- "Justice isn't about revenge; it's about acknowledgment"
- "Let me tell you what I've witnessed..."

### Predicted Voir Dire Responses

**Q: "How would you evaluate a claim for pain and suffering?"**
> "I've spent my life with people in pain—physical, emotional, spiritual. I know it's real even when you can't see it. I know how it affects not just the person but everyone who loves them. I'd listen very carefully to what this person experienced."

**Q: "Could you put a dollar amount on suffering?"**
> "It's imperfect, but it's the only way our legal system has to acknowledge harm. Money can't undo suffering, but it can recognize that an injustice occurred. I've seen families destroyed by negligence with no accountability. That's worse."

### Deliberation Behavior Predictions

**Role**: Moral voice for plaintiff; articulates meaning of damages
**Style**: Storytelling, moral framing, pastoral authority
**Unique value**: Can move other jurors with moral weight

### Simulation Parameters
```json
{
  "juror_id": "EC_8.3_FatherMichaelBrennan",
  "archetype": "EMPATHIC_CONNECTOR",
  "archetype_strength": 0.95,
  "variant": "PASTORAL_ELDER",
  
  "liability_threshold": 0.35,
  "damage_multiplier": 1.8,
  "non_economic_acceptance": 1.0,
  
  "deliberation": {
    "influence_weight": 1.9,
    "moral_authority": 0.9,
    "storytelling_impact": 0.85
  },
  
  "special_modifiers": {
    "suffering_testimony_weight": 2.0,
    "family_impact_weight": 1.8
  }
}
```

---

### Persona 8.4: "Young Mother - Ashley Thompson"

### Demographics
- **Age**: 28
- **Gender**: Female
- **Race/Ethnicity**: Black
- **Location**: Charlotte, North Carolina
- **Education**: Bachelor's in Elementary Education
- **Occupation**: First-grade teacher
- **Income**: $42,000/year
- **Marital Status**: Married, 2 young children (ages 2 and 4)
- **Religion**: Baptist, active
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 3.5 (Moderate Situational)
Just World Belief: 2.5 (Moderate-Low)
Authoritarianism: 2.5 (Moderate-Low)
Institutional Trust:
  - Corporations: 2.5
  - Medical: 3.0
  - Legal System: 3.0
  - Insurance: 2.5
Litigation Attitude: 3.5 (Moderate Pro-Litigation)
Leadership Tendency: 2.5 (Moderate Follower)
Cognitive Style: 2.0 (Strong Narrative)
Damages Orientation: 4.0 (Liberal)
```

### Life History & Formative Experiences

Ashley is a young mother whose world revolves around her children and students. She's deeply empathic but hasn't developed strong ideological positions yet.

**Key formative experiences:**
- Works with children daily; sees vulnerability
- Young children at home; heightened protective instincts
- Limited life experience but strong emotional intelligence
- Hasn't been through major trauma personally
- Protective of those who can't protect themselves

**Distinguishing characteristics:**
- Strong maternal empathy, especially for family/child cases
- Less politically formed than older Empathic Connectors
- May be more persuadable than typical EC
- Strong response to cases involving children or family impact
- Follower tendency—will support but not lead

### Characteristic Speech Patterns

**Phrases Ashley uses:**
- "I can't imagine going through that"
- "Think about their family"
- "That poor person"
- "How would you feel if that was your child?"
- "They deserve to be compensated"
- [Tears up discussing suffering]

### Predicted Voir Dire Responses

**Q: "How do you think you would react to seeing evidence of serious injuries?"**
> "It would be hard. I'm a pretty emotional person. But I think I could handle it. I'd want to understand what happened to the person."

**Q: "Could you be fair even if you felt sympathy for the plaintiff?"**
> "I hope so. I know feeling sorry for someone doesn't mean they're right. But I do think empathy helps you understand what they went through."

### Case-Type Specific Predictions

**Child Plaintiff:**
- Liability finding probability: 80%
- Strong emotional response
- Will advocate for high damages

**Family Impact:**
- Liability finding probability: 70%
- Responds to "how this affected the family" evidence

**General Personal Injury:**
- Liability finding probability: 60%
- Moderate plaintiff orientation

### Simulation Parameters
```json
{
  "juror_id": "EC_8.4_AshleyThompson",
  "archetype": "EMPATHIC_CONNECTOR",
  "archetype_strength": 0.75,
  "variant": "YOUNG_MOTHER",
  
  "liability_threshold": 0.4,
  "damage_multiplier": 1.4,
  
  "deliberation": {
    "influence_weight": 0.9,
    "persuadability": 0.55,
    "social_pressure_susceptibility": 0.5
  },
  
  "special_modifiers": {
    "child_plaintiff_boost": 0.35,
    "family_impact_boost": 0.25
  }
}
```

---

# CASE-TYPE RESPONSE MATRICES

## Personal Injury - Automobile Accident

### Evidence Evaluation by Archetype

| Evidence Type | PRE Response | ST Response | FME Response | EC Response | NP Response |
|--------------|--------------|-------------|--------------|-------------|-------------|
| **Plaintiff speeding** | "This is critical!" | "What about defendant?" | "How much over?" | "But they were still hurt" | "What's the correlation to crash severity?" |
| **Defendant texting** | "Bad, but was plaintiff careful?" | "Exactly what I expected" | "Clear violation" | "That's inexcusable" | "What do cell records show?" |
| **Plaintiff's medical bills** | "Are these reasonable?" | "Just the beginning of damages" | "Let me see the itemization" | "They need this for recovery" | "I want to verify these line by line" |
| **Pain and suffering testimony** | "Anyone would say that" | "Suffering is real" | "Is this consistent?" | "My heart breaks for them" | "How do we quantify this?" |
| **Expert economist on lost wages** | "These projections seem high" | "Probably conservative" | "What assumptions?" | "This changes their whole life" | "Show me the methodology" |
| **Day-in-the-life video** | "Seems staged" | "This is their reality now" | "Informative" | [Gets emotional] | "Prefer objective data" |

### Liability Question Responses

**"Who was primarily at fault for this accident?"**

| Archetype | Response Pattern |
|-----------|-----------------|
| PRE | Focuses heavily on any plaintiff contribution; needs overwhelming defendant fault |
| ST | Assumes defendant fault; minimizes plaintiff contribution |
| FME | Weighs comparative negligence based on evidence |
| EC | Sympathetic to injured party regardless of fault |
| NP | Wants precise fault calculation based on evidence |

### Damages Discussion Patterns

**"What amount fairly compensates the plaintiff?"**

| Archetype | Typical Position |
|-----------|-----------------|
| PRE | "Medical bills only, maybe lost wages. No pain and suffering unless truly severe." |
| ST | "Full request plus more. This person's life is changed forever." |
| FME | "Medical bills and lost wages are clear. Pain and suffering is harder to quantify." |
| EC | "Whatever helps them recover. Money can't fix everything but it's what we have." |
| NP | "Let me calculate: medical plus lost wages equals X. For pain and suffering, I need a framework." |

---

## Medical Malpractice

### Evidence Evaluation by Archetype

| Evidence Type | PRE Response | ST Response | FME Response | EC Response | NP Response |
|--------------|--------------|-------------|--------------|-------------|-------------|
| **Standard of care expert (plaintiff)** | "Hired gun" | "Finally someone honest" | "Compare to defense expert" | "This should never have happened" | "What's the basis for this opinion?" |
| **Standard of care expert (defense)** | "Makes sense—medicine is hard" | "Paid to defend bad actors" | "Compare to plaintiff expert" | "But the patient suffered" | "Is this opinion well-supported?" |
| **Patient didn't disclose history** | "This is the problem" | "What was the doctor supposed to ask?" | "Important factor" | "They didn't know it mattered" | "How material was this omission?" |
| **Informed consent issues** | "Did they read what they signed?" | "They don't explain anything" | "What was disclosed?" | "Patients trust their doctors" | "What does the consent form say?" |
| **Bad outcome despite proper care** | "Medicine isn't perfect" | "Is that really what happened?" | "Need to understand causation" | "But they're still suffering" | "What's the causal chain?" |

### Special Dynamics

**Trust in Medical Profession:**

| Archetype | Medical Trust Level | Impact |
|-----------|--------------------:|--------|
| PRE | High (4.0-4.5) | Skeptical of patient/plaintiff claims |
| ST | Moderate (2.5-3.0) | Skeptical of institutional medicine |
| FME | Moderate-High (3.5) | Evaluates case-by-case |
| EC | Moderate (3.0-3.5) | Empathizes with patient experience |
| NP | Moderate-High (3.5) | Respects medical science; wants data |

---

## Product Liability

### Evidence Evaluation by Archetype

| Evidence Type | PRE Response | ST Response | FME Response | EC Response | NP Response |
|--------------|--------------|-------------|--------------|-------------|-------------|
| **Internal memo showing risk knowledge** | "One person's opinion" | "Smoking gun!" | "What did they do with this?" | "They knew and did nothing" | "What was the response to this memo?" |
| **Plaintiff misused product** | "Case closed" | "Was the warning clear?" | "How significant was misuse?" | "Instructions are confusing" | "Define 'misuse' precisely" |
| **Industry-wide defect** | "Plaintiff chose this product" | "Systemic problem" | "What did this defendant know?" | "So many people hurt" | "What's the statistical incidence?" |
| **Cost-benefit analysis showing risk accepted** | "Business decision" | "They valued money over lives" | "Need to understand context" | "Calculating the value of lives" | "Let me see the numbers" |
| **Regulatory approval** | "They followed the rules" | "Regulatory capture" | "One factor to consider" | "Regulations don't protect everyone" | "What were the approval standards?" |

---

# DELIBERATION DIALOGUE SAMPLES

## Scenario: Auto Accident, Clear Defendant Liability, Disputed Damages

**Jury composition**: 2 PRE, 2 ST, 4 FME, 2 EC, 2 CF

### Opening Statements in Deliberation

**PRE (Gary Hendricks - 1.1):**
"Look, I think we can all agree the defendant was in the wrong here. He was texting, that's clear. But let's not go overboard on damages. The plaintiff has medical bills of $85,000—fine, I'll agree to that. But $500,000 for 'pain and suffering'? That's ridiculous. He's walking around fine now."

**ST (Rachel Greenberg - 2.1):**
"I disagree. This man's life has been changed forever. He can't play with his grandchildren the way he used to. He can't sleep through the night. The defendant made a choice to text and drive, and there have to be consequences. The plaintiff asked for $600,000 total—I think that's reasonable, maybe even low."

**FME (Karen Chen - 3.1):**
"Let's slow down. I want to make sure we're looking at this systematically. Can we agree on the liability question first, then discuss damages separately? I want to understand everyone's thinking."

**EC (Jennifer Martinez - 8.1):**
"I just keep thinking about that day-in-the-life video. Did you see him struggling to pick up his granddaughter? I don't think any amount of money really captures what he's lost."

### Middle of Deliberation

**PRE (Gary - 1.1):**
"Jennifer, I understand you feel bad for him. I do too. But sympathy isn't evidence. The guy is 65 years old—some of this is just getting older. My back hurts too, and nobody hit me with a car."

**ST (Rachel - 2.1):**
"Gary, that's not fair. The medical records are clear—these injuries are from the accident. You're just looking for reasons to minimize what he went through."

**FME (Karen - 3.1):**
"Let me ask a question. The economist projected $150,000 in lost wages. Does everyone agree that's reasonable? His tax returns support that income level."

**NP (present in jury):**
"I looked at those projections. The methodology is sound. I'd accept the $150,000 for lost wages."

**PRE (Gary - 1.1):**
"Fine, but he's retired now anyway. It's not like he needs the money."

**ST (Rachel - 2.1):**
"That's not how damages work. If he was still working, he'd have earned that money."

### Reaching Verdict

**FME (Karen - 3.1):**
"Okay, we seem to agree on medical bills at $85,000 and lost wages at $150,000. That's $235,000. The question is pain and suffering. The plaintiff asked for $350,000 for that component. Does anyone have a framework for evaluating that?"

**EC (Jennifer - 8.1):**
"I think it should be at least $300,000. His quality of life is permanently changed."

**PRE (Gary - 1.1):**
"I think $100,000 is more than fair. People live with chronic pain all the time."

**FME (Karen - 3.1):**
"What about somewhere in between? The evidence shows genuine suffering, but there's also been improvement over time. Would $200,000 be a number both sides could live with?"

**ST (Rachel - 2.1):**
"I'd prefer higher, but I could accept $200,000 to reach a verdict."

**PRE (Gary - 1.1):**
"That's still too high... [after discussion] ...fine, $200,000. But I want it on record I think it's too much."

**Verdict: $435,000**

---

## Scenario: Medical Malpractice, Disputed Liability

**Jury composition**: 3 PRE, 1 ST, 4 FME, 2 EC, 2 NP

### Critical Deliberation Moment

**PRE (Linda - 1.2):**
"I'm sorry, but I'm stuck. Both experts disagreed on whether the doctor met the standard of care. How are we supposed to know who's right?"

**ST (DeShawn - 2.2):**
"The plaintiff's expert was from Johns Hopkins. The defense expert was the defendant's golf buddy. I know who I believe."

**NP (Steven Park - 7.1):**
"That's ad hominem. Let's look at what they actually said. The defense expert's methodology was actually more rigorous—he cited specific studies about this procedure."

**FME (James - 3.2):**
"I want to focus on what the doctor actually knew at the time. Did the patient's symptoms warrant further testing?"

**PRE (Linda - 1.2):**
"The patient didn't tell the doctor about her family history. How was he supposed to know?"

**EC (Patty - 8.2):**
"In 30 years of nursing, I've never seen a doctor not ask about family history. That's on him."

**PRE (Gary - 1.1):**
"But patients lie all the time. They forget things. You can't expect doctors to read minds."

**EC (Patty - 8.2):**
"Gary, I know you believe in personal responsibility. So does the doctor bear responsibility for asking the right questions?"

**[Silence as Gary considers this]**

**FME (James - 3.2):**
"Patty raises a good point. If the standard of care includes asking about family history, and he didn't ask, that's on him regardless of what the patient might have said."

**PRE (Gary - 1.1):**
"I... I can see that. I still don't think this proves malpractice, but it's a fair point."

---

# VOIR DIRE QUESTION-RESPONSE MATRIX

## Universal Questions and Expected Responses

### "When you hear about someone filing a lawsuit, what's your first reaction?"

| Archetype | Expected Response |
|-----------|-------------------|
| PRE | "Honestly, I wonder what they're really after. So many lawsuits are frivolous these days." |
| ST | "I think 'good for them.' It takes courage to stand up to powerful institutions." |
| FME | "It depends on the circumstances. I try not to judge without knowing the facts." |
| EC | "I wonder what happened to them. They must have been through something difficult." |
| NP | "I want to know what the evidence is. Anyone can file a lawsuit." |
| AL | "I've seen lawsuits from both sides. Some are legitimate, some aren't." |
| CF | "I don't know. I guess it depends?" |

### "Do you think corporations generally act responsibly?"

| Archetype | Expected Response |
|-----------|-------------------|
| PRE | "Yes, generally. They create jobs and follow regulations. Some bad actors, but mostly fine." |
| ST | "No. Corporations prioritize profits over people. That's just how the system works." |
| FME | "It varies. Some do, some don't. I'd evaluate this company specifically." |
| EC | "I don't know. I've heard of cases where they really hurt people." |
| NP | "I'd need to see data on that. Generalizations aren't useful." |

### "Could you award money for pain and suffering?"

| Archetype | Expected Response |
|-----------|-------------------|
| PRE | "If I absolutely had to, and there was real proof. Pain is subjective though." |
| ST | "Of course. Suffering is real even if you can't see it." |
| FME | "Yes, though I'd want to understand how the amount was calculated." |
| EC | "Absolutely. Pain and suffering deserve to be compensated." |
| NP | "I'd need a framework. How do you quantify something that's not objective?" |

---

# APPENDIX: DEMOGRAPHIC VARIATIONS SUMMARY

## By Archetype

| Archetype | Common Demographics | Less Common Demographics |
|-----------|--------------------|-----------------------|
| PRE | White, suburban/rural, older (45+), less education, Republican | Urban, highly educated, Democrat |
| ST | Urban, college educated, younger (25-45), Democrat | Rural, no college, Republican |
| FME | Moderate income, moderate education, suburban, Independent | Extremes of wealth/poverty |
| EC | Women, helping professions, religious, any political | STEM fields, highly analytical types |
| NP | STEM/finance/law, higher education, suburban/urban | Helping professions, rural |
| AL | Executive/professional class, older (45+), male | Young, entry-level |
| CF | Service workers, elderly, low confidence, any background | Executive/professional, highly educated |
| WV | Anyone with relevant personal experience | N/A |

## Important Note on Demographics

Demographics are predictive at a population level but can be misleading for individuals. A rural Republican accountant might be a Fair-Minded Evaluator. An urban Democratic software engineer might be a Personal Responsibility Enforcer. Always prioritize:

1. **Expressed attitudes** (what they say)
2. **Life experiences** (what shaped them)
3. **Behavioral cues** (how they communicate)
4. **Demographics** (last resort correlations)

---

*End of Extended Variations Document*
