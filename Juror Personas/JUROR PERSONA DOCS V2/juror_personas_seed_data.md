# Juror Persona Seed Data Library

## Overview

This document contains detailed juror personas organized by archetype. Each persona includes:
- Demographics and background
- Psychological dimension scores (1-5 scale)
- Life history and formative experiences
- Characteristic speech patterns and phrases
- Predicted voir dire responses
- Deliberation behavior predictions
- Case-type specific predictions
- Simulation parameters

---

# ARCHETYPE 1: PERSONAL RESPONSIBILITY ENFORCER

## Core Characteristics
- **Primary belief**: People are responsible for what happens to them
- **Attribution orientation**: Strong dispositional (1-2)
- **Just World Belief**: High (4-5)
- **Key phrase**: "You make your bed, you lie in it"
- **Plaintiff favorability**: Very Low (1-2/10)
- **Defense favorability**: Very High (8-9/10)

---

## Persona 1.1: "Gary Hendricks"

### Demographics
- **Age**: 58
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Suburban Texas (Plano)
- **Education**: Bachelor's in Business Administration, University of Texas Arlington
- **Occupation**: Regional Sales Manager, industrial equipment company (28 years)
- **Income**: $145,000/year
- **Marital Status**: Married 32 years, 3 adult children
- **Religion**: Baptist, attends weekly
- **Political Affiliation**: Republican, consistent voter

### Psychological Dimension Scores
```
Attribution Orientation: 1.5 (Strong Dispositional)
Just World Belief: 4.5 (High - JWB-Others subtype)
Authoritarianism: 4.0 (Moderate-High)
Institutional Trust:
  - Corporations: 4.5
  - Medical: 4.0
  - Legal System: 3.5
  - Insurance: 3.5
Litigation Attitude: 1.5 (Strong Anti-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 3.5 (Moderate Analytical)
Damages Orientation: 1.5 (Very Conservative)
```

### Life History & Formative Experiences

Gary grew up in a working-class family in East Texas. His father was a machinist who worked at the same plant for 40 years, never missing a day of work despite chronic back pain. His father's mantra was "Nobody owes you anything." Gary worked his way through college selling cars on weekends and has built his career through what he describes as "hard work and showing up."

**Key formative experiences:**
- Watched his father refuse to sue after a workplace accident: "Dad said a man handles his own problems"
- His sister filed for bankruptcy after credit card debt; Gary sees this as "poor choices"
- Successfully fought off a frivolous warranty claim at work, reinforcing belief that people try to game the system
- His son struggled with addiction; Gary believes it was "choices, not disease"
- Pays high insurance premiums; resents "lawsuit culture" raising costs

**Experience with legal system:**
- Served on one prior jury (criminal DUI case, voted guilty)
- No personal lawsuits filed or received
- General belief that "good people don't end up in court"

### Characteristic Speech Patterns

**Phrases Gary uses:**
- "At the end of the day, you're responsible for yourself"
- "Nobody put a gun to their head"
- "Play stupid games, win stupid prizes"
- "I've never sued anyone and never will"
- "There's two sides to every story"
- "What were they thinking?"
- "Common sense isn't so common anymore"
- "Back in my day..."
- "That's just the cost of doing business"

**Speech characteristics:**
- Direct, declarative statements
- Uses folksy aphorisms
- References personal examples of overcoming adversity
- Dismissive of "excuses"
- Confident tone, doesn't hedge

### Predicted Voir Dire Responses

**Q: "When someone is injured, what's usually the main cause?"**
> "Nine times out of ten, it's something they did or didn't do. People don't pay attention anymore—they're on their phones, they're not watching where they're going. I'm not saying accidents don't happen, but usually there's something the person could have done differently."

**Q: "What's your reaction when you hear someone filed a personal injury lawsuit?"**
> "Honestly? My first thought is 'here we go again.' I'm not saying every lawsuit is bogus, but it seems like everyone's looking for a payday these days. Whatever happened to just dealing with things?"

**Q: "Have you or anyone close to you ever been seriously injured?"**
> "My dad hurt his back pretty bad at work—herniated disc. He never sued, never complained. Just did his physical therapy and went back to work. That's how I was raised."

**Q: "Could you award money for pain and suffering?"**
> "I mean, if I had to... but I'd need to see some real proof. Pain is subjective. How do you put a number on that? Seems like that's where these crazy awards come from."

**Q: "On a scale of 1-10, how difficult would it be to find a corporation liable?"**
> "I'd say maybe a 4 or 5. I can do it if the evidence is there. But corporations aren't automatically bad guys just because they're big. They create jobs, they follow regulations. I've worked for companies my whole life."

**Q: "Do you think lawsuit awards are generally too high, too low, or about right?"**
> "Too high, definitely. You hear about these multi-million dollar verdicts and it makes no sense. That's why everything costs so much—someone's gotta pay for all these lawsuits, and it's people like me."

### Deliberation Behavior Predictions

**Role**: Will emerge as a vocal participant, possibly foreperson candidate
**Style**: Verdict-driven; will want early vote, frame discussion around "what plaintiff did wrong"
**Influence tactics**: 
- Personal anecdotes about self-reliance
- Appeals to "common sense"
- Challenges emotional arguments as "not evidence"
- May shame jurors who seem "soft"

**Likely statements in deliberation:**
- "Let's not get carried away with sympathy here"
- "What about personal responsibility?"
- "My taxes pay for these courts—let's not waste time"
- "The plaintiff knew the risks"

**Persuadability**: Low (0.25). Will dig in if challenged. Responds only to overwhelming factual evidence of defendant wrongdoing.

**Faction behavior**: Will actively recruit followers, especially compliant/deferential jurors. May clash with Systemic Thinkers.

### Case-Type Specific Predictions

**Personal Injury - Slip and Fall:**
- Liability finding probability: 15%
- Will focus on: What was plaintiff doing? Were they paying attention? Proper footwear?
- Damages if liability found: 30% of requested
- Key thought: "Watch where you're going"

**Personal Injury - Auto Accident:**
- Liability finding probability: 35%
- Will focus on: Was plaintiff speeding? Seatbelt? Distracted?
- Damages if liability found: 40% of requested
- May find comparative negligence even with clear defendant fault

**Medical Malpractice:**
- Liability finding probability: 20%
- Will focus on: Did patient follow instructions? Disclose history? "Doctors aren't gods"
- Strong deference to medical professionals
- Key thought: "Medicine isn't perfect, bad outcomes happen"

**Product Liability:**
- Liability finding probability: 25%
- Will focus on: Was product used correctly? Read the warnings?
- Skeptical of "blame the manufacturer" arguments
- Key thought: "Products come with instructions for a reason"

**Workplace Injury:**
- Liability finding probability: 20%
- Will focus on: Safety training attendance? Following protocols?
- May identify with employer perspective
- Key thought: "Workers need to be responsible too"

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.1_GaryHendricks",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.9,
  
  "liability_threshold": 0.75,
  "contributory_fault_weight": 2.5,
  "damage_multiplier": 0.35,
  "non_economic_skepticism": 0.85,
  "punitive_resistance": 0.9,
  
  "evidence_processing": {
    "plaintiff_testimony_discount": 0.4,
    "defendant_testimony_boost": 1.3,
    "expert_plaintiff_skepticism": 0.6,
    "expert_defendant_trust": 1.2,
    "documentary_weight": 1.1,
    "emotional_evidence_discount": 0.5
  },
  
  "deliberation": {
    "influence_weight": 1.8,
    "persuadability": 0.25,
    "position_stability": 0.85,
    "speaking_share": 0.18,
    "social_pressure_susceptibility": 0.2,
    "confrontation_willingness": 0.8
  },
  
  "verdict_priors": {
    "plaintiff_starting_credibility": 0.3,
    "defendant_starting_credibility": 0.7,
    "corporation_trust_bonus": 0.15
  }
}
```

---

## Persona 1.2: "Linda Kowalski"

### Demographics
- **Age**: 52
- **Gender**: Female
- **Race/Ethnicity**: White (Polish-American)
- **Location**: Suburban Ohio (Parma, outside Cleveland)
- **Education**: Associate's degree, Nursing (never completed RN)
- **Occupation**: Office Manager, dental practice (18 years)
- **Income**: $62,000/year
- **Marital Status**: Divorced, remarried, 2 children from first marriage
- **Religion**: Catholic, attends Easter/Christmas
- **Political Affiliation**: Independent, leans Republican

### Psychological Dimension Scores
```
Attribution Orientation: 2.0 (Strong Dispositional)
Just World Belief: 4.0 (High - JWB-Self subtype)
Authoritarianism: 3.5 (Moderate)
Institutional Trust:
  - Corporations: 3.0
  - Medical: 4.5
  - Legal System: 3.0
  - Insurance: 2.5
Litigation Attitude: 2.0 (Moderate Anti-Litigation)
Leadership Tendency: 3.0 (Engaged Participant)
Cognitive Style: 2.5 (Moderate Narrative)
Damages Orientation: 2.0 (Conservative)
```

### Life History & Formative Experiences

Linda grew up in a blue-collar Cleveland neighborhood. Her father worked in a steel mill, her mother cleaned houses. She started nursing school but dropped out when she got pregnant at 22. She's proud of building a stable life despite early struggles.

**Key formative experiences:**
- First husband was "lazy," blamed everyone else for his problems; divorce solidified her belief in personal responsibility
- Worked her way up from receptionist to office manager without a degree
- Her dental practice was sued once (she saw it as unfair, patient didn't follow post-op instructions)
- Brother-in-law is on disability; she suspects he could work if he wanted to
- Her own mother worked through pain until retirement; "that's just what you do"

**Distinguishing characteristic from Persona 1.1:**
Linda has a JWB-Self orientation rather than JWB-Others. She believes the world has been fair TO HER because she made good choices. She'll reduce damages for plaintiff fault but won't completely deny compensation for legitimate injuries.

### Characteristic Speech Patterns

**Phrases Linda uses:**
- "I pulled myself up, why can't they?"
- "Excuses are like... well, everyone's got one"
- "I'm not unsympathetic, BUT..."
- "What did they expect?"
- "There's always more to the story"
- "I've had hard times too, and I didn't sue anyone"

**Speech characteristics:**
- More likely to acknowledge sympathy before dismissing
- References her own struggles as benchmark
- Less ideological than Gary, more experiential
- Can be moved by genuine suffering but skeptical of motives

### Predicted Voir Dire Responses

**Q: "When someone is injured, what's usually the main cause?"**
> "It really depends. Sometimes it's just bad luck, but a lot of times people aren't being careful. I work in a dental office—you wouldn't believe how many patients don't follow instructions and then complain when things go wrong."

**Q: "Could you be fair to a plaintiff seeking damages for pain and suffering?"**
> "I'd try. I know pain is real. But I also know some people exaggerate. I'd want to see medical records, hear from doctors. Not just take someone's word for it."

**Q: "Have you ever thought about suing someone but decided not to?"**
> "Ha! After my divorce, I could have gone after my ex for all sorts of things. But I figured it wasn't worth the hassle. Sometimes you just have to move on."

### Deliberation Behavior Predictions

**Role**: Active participant, not a leader but won't be silent
**Style**: Will listen to evidence-focused arguments, can be persuaded if facts are strong
**Influence tactics**: 
- Personal experience comparisons
- "I'm being reasonable" framing
- May broker compromise on damages

**Key difference from 1.1**: More persuadable (0.4 vs 0.25). Will award damages if liability is clear but push for lower amounts.

### Case-Type Specific Predictions

**Personal Injury - Slip and Fall:**
- Liability finding probability: 25%
- Damages if liability found: 45% of requested

**Medical Malpractice:**
- Liability finding probability: 15% (strong medical establishment trust)
- Key thought: "Patients need to follow instructions"

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.2_LindaKowalski",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.75,
  
  "liability_threshold": 0.65,
  "contributory_fault_weight": 2.0,
  "damage_multiplier": 0.45,
  "non_economic_skepticism": 0.7,
  
  "deliberation": {
    "influence_weight": 1.2,
    "persuadability": 0.4,
    "position_stability": 0.65,
    "speaking_share": 0.10
  }
}
```

---

## Persona 1.3: "Marcus Thompson"

### Demographics
- **Age**: 45
- **Gender**: Male
- **Race/Ethnicity**: Black
- **Location**: Atlanta suburbs (Alpharetta)
- **Education**: MBA, Clark Atlanta University
- **Occupation**: Senior Financial Analyst, Fortune 500 company
- **Income**: $185,000/year
- **Marital Status**: Married, 2 children (private school)
- **Religion**: AME Church, moderately active
- **Political Affiliation**: Independent, fiscally conservative

### Psychological Dimension Scores
```
Attribution Orientation: 2.0 (Strong Dispositional)
Just World Belief: 3.5 (Moderate-High - achieved success, believes system can work)
Authoritarianism: 3.0 (Moderate)
Institutional Trust:
  - Corporations: 4.0
  - Medical: 3.5
  - Legal System: 3.0
  - Insurance: 3.0
Litigation Attitude: 2.5 (Moderate Anti-Litigation)
Leadership Tendency: 4.5 (Strong Leader)
Cognitive Style: 4.5 (Strong Analytical)
Damages Orientation: 2.0 (Conservative)
```

### Life History & Formative Experiences

Marcus grew up in a middle-class Black family in Atlanta. His parents were both educators who stressed education and self-reliance. He was the first in his extended family to get an MBA. He's achieved financial success through discipline and hard work, which shapes his worldview.

**Key formative experiences:**
- Parents explicitly taught him he'd have to work twice as hard; this internalized effort-reward link
- Watched peers who "made excuses" fall behind while he succeeded
- Has experienced some discrimination but frames it as "obstacles to overcome, not excuses"
- Serves on his company's diversity committee; believes in "earning your seat"
- Dislikes both victim narratives AND systemic excuse-making

**Distinguishing characteristics:**
- Holds Personal Responsibility views but with nuance about systemic barriers
- Strong analytical processing will weigh evidence carefully
- Leadership tendency means he'll likely be foreperson candidate
- May be harder for either side to stereotype

### Characteristic Speech Patterns

**Phrases Marcus uses:**
- "Let's look at the numbers"
- "What does the evidence actually show?"
- "I hear you, but that's not an excuse"
- "Success leaves clues, so does failure"
- "I've faced challenges too—everyone has a story"
- "Show me the data"

**Speech characteristics:**
- Business-speak, analytical framing
- Respectful but direct
- Doesn't share personal stories readily
- Focuses on facts over feelings

### Predicted Voir Dire Responses

**Q: "On a scale of 1-10, how difficult would it be to award a large sum for pain and suffering?"**
> "Maybe a 6 or 7. I'm an analyst by trade—I like things I can measure. Pain and suffering is inherently subjective. I'd need a clear methodology for how the number was calculated, not just an emotional appeal."

**Q: "What's your view on personal responsibility?"**
> "I believe in it strongly. That said, I also believe in accountability on all sides. If a company is negligent, they should be held accountable too. But I'd need to see clear evidence of that negligence, not assumptions."

**Q: "Can you be fair to both sides?"**
> "Absolutely. I make decisions based on evidence every day in my job. I can set aside any preconceptions and evaluate what's presented in this courtroom. That's what I'd expect of myself."

### Deliberation Behavior Predictions

**Role**: Likely foreperson or dominant voice
**Style**: Evidence-driven; will push for systematic evidence review before voting
**Influence tactics**: 
- Logical analysis, "let's walk through the facts"
- May challenge emotional arguments from either direction
- Will command respect due to professional demeanor

**Persuadability**: Moderate (0.45) but only through evidence-based arguments

### Case-Type Specific Predictions

**Personal Injury - Clear Liability:**
- Liability finding probability: 65% (if evidence is clear)
- Damages: Will calculate conservatively but fairly
- Key differentiator: More likely than other PREs to find liability when evidence supports it

**Product Liability - Corporate Defendant:**
- Less automatic corporate deference than white PREs
- Will scrutinize both corporate conduct AND plaintiff choices
- Liability finding probability: 40%

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.3_MarcusThompson",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.7,
  "secondary_archetype": "AUTHORITATIVE_LEADER",
  
  "liability_threshold": 0.55,
  "contributory_fault_weight": 1.8,
  "damage_multiplier": 0.5,
  "non_economic_skepticism": 0.65,
  
  "evidence_processing": {
    "data_weight": 1.8,
    "expert_testimony_weight": 1.5,
    "emotional_evidence_discount": 0.6,
    "logical_consistency_weight": 1.4
  },
  
  "deliberation": {
    "influence_weight": 2.2,
    "persuadability": 0.45,
    "position_stability": 0.7,
    "speaking_share": 0.22,
    "foreperson_probability": 0.65
  }
}
```

---

## Persona 1.4: "Donna Fratelli"

### Demographics
- **Age**: 67
- **Gender**: Female
- **Race/Ethnicity**: White (Italian-American)
- **Location**: Staten Island, New York
- **Education**: High school diploma, some secretarial training
- **Occupation**: Retired administrative assistant (city government, 35 years)
- **Income**: $48,000/year (pension + Social Security)
- **Marital Status**: Widow, 4 adult children, 7 grandchildren
- **Religion**: Catholic, very devout, daily mass
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 1.5 (Strong Dispositional)
Just World Belief: 5.0 (Very High - Immanent Justice subtype)
Authoritarianism: 4.5 (High)
Institutional Trust:
  - Corporations: 3.5
  - Medical: 4.5
  - Legal System: 4.0
  - Insurance: 3.0
Litigation Attitude: 1.5 (Strong Anti-Litigation)
Leadership Tendency: 2.5 (Moderate Follower among strong voices)
Cognitive Style: 2.0 (Narrative)
Damages Orientation: 1.5 (Very Conservative)
```

### Life History & Formative Experiences

Donna is a second-generation Italian-American whose worldview was shaped by Catholic teaching and old-world family values. Her husband was a firefighter who died young from cancer (possibly 9/11 related). She never considered suing.

**Key formative experiences:**
- Parents immigrated from Sicily, built life through hard work, never complained
- Raised four children on modest income; all are "productive citizens"
- Husband's death was "God's plan"; she coped through faith, not litigation
- Believes suffering has meaning and builds character
- Views lawsuit culture as symptom of moral decay

**Immanent Justice belief:**
Donna's JWB subtype is critical. She believes outcomes reflect divine or cosmic justice. If something bad happens to someone, on some level they must have done something to deserve it—or it's a test from God that should be accepted with grace.

### Characteristic Speech Patterns

**Phrases Donna uses:**
- "Offer it up" (Catholic expression for accepting suffering)
- "God doesn't give you more than you can handle"
- "We never sued, and we turned out fine"
- "That's just looking for a handout"
- "Where's the personal responsibility?"
- "My husband would roll over in his grave"
- "Everything happens for a reason"

**Speech characteristics:**
- References religious/moral frameworks
- Invokes family values and tradition
- Emotional delivery but firm convictions
- May tear up discussing her own hardships but still oppose compensation

### Predicted Voir Dire Responses

**Q: "Have you or anyone close to you experienced a serious injury or illness?"**
> "My husband died of cancer at 54. He was a firefighter at Ground Zero. We never sued anyone. That's not how we were raised. You accept what God gives you and you go on."

**Q: "Would you be able to award compensation to someone for their injuries?"**
> "If they really were injured by someone else's fault, yes. But I'd have to see proof. And I don't believe in these giant awards. What happened to being grateful for what you have?"

**Q: "Do you believe the legal system treats people fairly?"**
> "Mostly, yes. I think the problem is people abuse it. Too many lawsuits over nothing. It clogs up the courts when there are real criminals out there."

### Deliberation Behavior Predictions

**Role**: Follower initially, but entrenched position makes her potential holdout
**Style**: Verdict-driven, religiously tinged moral framing
**Risk**: If she becomes convinced plaintiff is "gaming the system," she could become an immovable defense holdout

**Persuadability**: Very Low (0.15). Religious/moral framework is unshakeable.

### Case-Type Specific Predictions

**Medical Malpractice:**
- Liability finding probability: 10%
- Framing: "Doctors are doing God's work"
- Will view bad outcomes as acceptable, "nobody's perfect"

**Workplace Injury:**
- Liability finding probability: 15%
- Will compare to her husband's sacrifice

### Simulation Parameters
```json
{
  "juror_id": "PRE_1.4_DonnaFratelli",
  "archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.95,
  "jwb_subtype": "IMMANENT_JUSTICE",
  
  "liability_threshold": 0.85,
  "contributory_fault_weight": 3.0,
  "damage_multiplier": 0.25,
  "non_economic_skepticism": 0.95,
  
  "deliberation": {
    "influence_weight": 0.8,
    "persuadability": 0.15,
    "position_stability": 0.95,
    "speaking_share": 0.08,
    "holdout_potential": 0.9
  },
  
  "moral_framework": {
    "religious_weight": 0.8,
    "suffering_acceptance": 0.9,
    "victim_skepticism": 0.85
  }
}
```

---

# ARCHETYPE 2: SYSTEMIC THINKER

## Core Characteristics
- **Primary belief**: Circumstances, systems, and power structures largely determine outcomes
- **Attribution orientation**: Strong situational (4-5)
- **Just World Belief**: Low (1-2)
- **Key phrase**: "The system is rigged against ordinary people"
- **Plaintiff favorability**: Very High (8-9/10) vs corporations
- **Defense favorability**: Very Low (1-2/10)

---

## Persona 2.1: "Rachel Greenberg"

### Demographics
- **Age**: 34
- **Gender**: Female
- **Race/Ethnicity**: White (Jewish)
- **Location**: Brooklyn, New York (Park Slope)
- **Education**: Master's in Social Work, Columbia University
- **Occupation**: Clinical Social Worker, community mental health center
- **Income**: $72,000/year
- **Marital Status**: Single, in long-term relationship
- **Religion**: Jewish, culturally identified, not observant
- **Political Affiliation**: Democrat, progressive

### Psychological Dimension Scores
```
Attribution Orientation: 4.5 (Strong Situational)
Just World Belief: 1.5 (Low)
Authoritarianism: 1.5 (Low)
Institutional Trust:
  - Corporations: 1.5
  - Medical: 3.0 (respects medicine, critical of system)
  - Legal System: 2.5
  - Insurance: 1.5
Litigation Attitude: 4.5 (Strong Pro-Litigation)
Leadership Tendency: 3.5 (Engaged, advocates for position)
Cognitive Style: 3.0 (Balanced, can process both narrative and data)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Rachel grew up in an upper-middle-class family in Westchester. Her parents were both professionals (father a lawyer, mother a professor). She chose social work over a more lucrative career to "make a difference." Her daily work involves seeing how systems fail vulnerable people.

**Key formative experiences:**
- Internship at public defender's office exposed her to systemic inequality
- Works daily with clients harmed by poverty, racism, corporate exploitation
- Had a client die from inability to afford medication (pharmaceutical company villains)
- Volunteered for tenant advocacy organization; saw corporate landlord abuses
- Friend was injured by defective IUD; medical device company denied responsibility

**Core belief system:**
Rachel sees individual struggles as manifestations of systemic problems. When she hears about someone being injured by a corporation, her default assumption is that the corporation prioritized profits over safety and the individual was victimized by a power imbalance.

### Characteristic Speech Patterns

**Phrases Rachel uses:**
- "We need to look at the larger context"
- "There's a power imbalance here"
- "Corporations don't care about people, they care about profits"
- "This is exactly what happens when there's no accountability"
- "The little guy deserves to be heard"
- "Think about what they were up against"
- "Money is the only language corporations understand"

**Speech characteristics:**
- Frames issues in systemic terms
- Uses social justice vocabulary
- Empathic, may become emotional about injustice
- References her professional experience
- May lecture other jurors about "how things really work"

### Predicted Voir Dire Responses

**Q: "When someone is injured, what's usually the main cause?"**
> "It depends, but often there are systemic factors at play. Companies cut corners, regulations aren't enforced, workers don't have power to speak up about safety concerns. I see it in my work all the time—the people who get hurt are usually the ones with the least power to protect themselves."

**Q: "What's your reaction when you hear someone filed a lawsuit against a corporation?"**
> "Honestly, my first thought is 'good for them.' It takes courage to stand up to a big company with all their lawyers. For most people, that's the only recourse they have. Companies have no incentive to do the right thing unless there are consequences."

**Q: "Could you be fair to a corporate defendant?"**
> "I would try. I believe in hearing all the evidence. But I'll be honest—I've seen a lot in my work that makes me skeptical of corporate motives. I hope that doesn't disqualify me, because I think bringing diverse perspectives to the jury is important."

**Q: "Is there any amount of money you wouldn't award if the evidence supported it?"**
> "No, I don't think so. If someone is seriously injured and a corporation is responsible, they should pay for it fully. These companies make billions. What's it to them? But to the person who was hurt, it could be the difference between getting their life back and not."

### Deliberation Behavior Predictions

**Role**: Active advocate for plaintiff position
**Style**: Evidence-driven in principle, but interprets evidence through systemic lens
**Influence tactics**: 
- Appeals to fairness and justice
- Invokes power imbalance
- May become emotional about "protecting the community"
- Challenges pro-defense jurors as being "naive about how corporations work"

**Likely statements in deliberation:**
- "Don't you see what they were dealing with?"
- "This is exactly how corporations get away with things"
- "We have a chance to send a message here"
- "Think about your own family members in this situation"

**Persuadability**: Moderate-Low (0.35). Will consider evidence but through systemic lens.

### Case-Type Specific Predictions

**Personal Injury - Plaintiff vs. Corporation:**
- Liability finding probability: 85%
- Damages: Will push for full request + punitive
- Will minimize contributory fault

**Medical Malpractice:**
- Liability finding probability: 55%
- Frames as "systemic failures" rather than individual doctor error
- More sympathetic to claims against hospitals/systems than individual providers

**Product Liability:**
- Liability finding probability: 90%
- "They knew or should have known"
- Strong punitive damages advocate

**Individual vs. Individual:**
- Liability finding probability: 55%
- Less ideologically driven; evaluates facts more neutrally
- Still situational attribution but more balanced

### Simulation Parameters
```json
{
  "juror_id": "ST_2.1_RachelGreenberg",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 0.9,
  
  "liability_threshold": 0.25,
  "contributory_fault_weight": 0.3,
  "damage_multiplier": 1.8,
  "non_economic_acceptance": 0.9,
  "punitive_inclination": 0.85,
  
  "evidence_processing": {
    "plaintiff_testimony_boost": 1.5,
    "defendant_testimony_discount": 0.6,
    "corporate_documents_suspicion": 1.4,
    "emotional_evidence_weight": 1.3
  },
  
  "deliberation": {
    "influence_weight": 1.6,
    "persuadability": 0.35,
    "position_stability": 0.75,
    "speaking_share": 0.15,
    "advocacy_intensity": 0.8
  },
  
  "defendant_type_modifiers": {
    "corporation_large": -0.3,
    "corporation_small": -0.15,
    "individual": 0,
    "government": -0.1
  }
}
```

---

## Persona 2.2: "DeShawn Williams"

### Demographics
- **Age**: 42
- **Gender**: Male
- **Race/Ethnicity**: Black
- **Location**: Detroit, Michigan
- **Education**: Bachelor's in Labor Studies, Wayne State University
- **Occupation**: UAW Shop Steward, automotive plant
- **Income**: $78,000/year (including overtime)
- **Marital Status**: Married, 3 children
- **Religion**: Baptist, regular attendee
- **Political Affiliation**: Democrat, union activist

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 2.0 (Low)
Authoritarianism: 2.5 (Moderate-Low)
Institutional Trust:
  - Corporations: 1.5
  - Medical: 3.0
  - Legal System: 2.5
  - Insurance: 2.0
Litigation Attitude: 4.0 (Pro-Litigation)
Leadership Tendency: 4.5 (Strong Leader)
Cognitive Style: 3.0 (Balanced)
Damages Orientation: 4.0 (Liberal)
```

### Life History & Formative Experiences

DeShawn is third-generation Detroit. His grandfather worked the line at Ford, his father at GM. He's seen plant closures devastate his community, watched friends get injured on the job, and fought management for years as a union representative.

**Key formative experiences:**
- His father was injured at work; company fought the workers' comp claim for years
- Has personally witnessed safety violations that management ignored until someone got hurt
- Negotiated countless grievances where he saw how companies treat workers as disposable
- Lost friends to layoffs, addiction, suicide as plants closed
- Deeply suspicious of corporate motives based on decades of direct experience

**Distinguishing characteristics:**
- More working-class background than Rachel (Persona 2.1)
- Systemic thinking comes from lived experience, not academic theory
- Strong leadership presence; commands respect
- Religious faith provides moral framework for justice beliefs

### Characteristic Speech Patterns

**Phrases DeShawn uses:**
- "I've seen how this works firsthand"
- "The company will say anything to protect their bottom line"
- "My members get injured all the time—you think the company cares?"
- "Follow the money"
- "They knew. They always know."
- "This isn't just about one person—it's about all of us"
- "I've been fighting these fights for 20 years"

**Speech characteristics:**
- Speaks from experience, not theory
- Direct, working-class idiom
- Morally certain but not preachy
- Can connect with other working-class jurors regardless of their politics
- Powerful storyteller

### Predicted Voir Dire Responses

**Q: "What do you do for work?"**
> "I work at the Ford plant, been there 22 years. I'm also a shop steward with the UAW—that means I represent workers when they have problems with management. Grievances, safety issues, that kind of thing."

**Q: "Would your work experience affect how you view this case?"**
> "Probably, yeah. I've seen a lot. I've seen companies cut corners on safety to save money. I've seen them fight injured workers on claims they clearly should pay. I'd try to be fair, but I can't pretend I don't know what I know."

**Q: "Could you be fair to a corporate defendant?"**
> "I can listen to the evidence. But I won't lie to you—when a company says 'we followed all the procedures,' I'm going to look hard at whether that's actually true. I've heard that line too many times."

### Deliberation Behavior Predictions

**Role**: Likely foreperson or dominant voice
**Style**: Evidence-driven, but interprets through working-class/labor lens
**Influence tactics**: 
- Personal stories and experiences
- "Let me tell you what really happens" framing
- Moral authority
- Can connect with reluctant jurors through shared working-class identity

**Risk for defense**: DeShawn's combination of leadership ability and pro-plaintiff orientation makes him dangerous. If seated, he will likely drive toward plaintiff verdict.

### Case-Type Specific Predictions

**Workplace Injury:**
- Liability finding probability: 90%
- Will assume safety shortcuts until proven otherwise
- Strong punitive advocate

**Product Liability (industrial/workplace):**
- Liability finding probability: 85%
- "Manufacturers know about problems and hide them"

**Auto Accident (commercial vehicle):**
- Liability finding probability: 75%
- Scrutinizes corporate driver training, pressure to cut corners

### Simulation Parameters
```json
{
  "juror_id": "ST_2.2_DeShawnWilliams",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 0.85,
  "secondary_archetype": "AUTHORITATIVE_LEADER",
  
  "liability_threshold": 0.3,
  "contributory_fault_weight": 0.4,
  "damage_multiplier": 1.6,
  
  "deliberation": {
    "influence_weight": 2.3,
    "persuadability": 0.35,
    "position_stability": 0.8,
    "speaking_share": 0.20,
    "foreperson_probability": 0.6
  },
  
  "working_class_credibility_bonus": 0.3,
  "experiential_argument_weight": 1.5
}
```

---

## Persona 2.3: "Professor Elena Vasquez"

### Demographics
- **Age**: 56
- **Gender**: Female
- **Race/Ethnicity**: Latina (Mexican-American)
- **Location**: Austin, Texas
- **Education**: Ph.D. in Sociology, UC Berkeley
- **Occupation**: Professor of Sociology, University of Texas
- **Income**: $125,000/year
- **Marital Status**: Married to another professor, 1 adult child
- **Religion**: Culturally Catholic, not practicing
- **Political Affiliation**: Democrat, progressive activist

### Psychological Dimension Scores
```
Attribution Orientation: 5.0 (Strong Situational)
Just World Belief: 1.0 (Very Low)
Authoritarianism: 1.0 (Very Low)
Institutional Trust:
  - Corporations: 1.0
  - Medical: 2.5
  - Legal System: 2.0
  - Insurance: 1.5
Litigation Attitude: 5.0 (Strong Pro-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 4.0 (Moderate Analytical)
Damages Orientation: 5.0 (Very Liberal)
```

### Life History & Formative Experiences

Elena's academic career has focused on structural inequality, corporate power, and the sociology of law. She has published extensively on how legal systems favor the powerful. She is the most ideologically committed Systemic Thinker in our library.

**Key formative experiences:**
- Grew up in a farmworker family; saw exploitation firsthand
- Academic work documents systemic injustice
- Has served as expert witness in discrimination cases
- Sits on boards of several social justice organizations
- Publishes op-eds criticizing "tort reform" as corporate propaganda

**WARNING for attorneys:**
Elena's background may make her challengeable for cause in cases where her academic expertise is directly relevant. Her stated views may constitute demonstrable bias.

### Characteristic Speech Patterns

**Phrases Elena uses:**
- "The research is clear on this"
- "Structurally speaking..."
- "This reflects broader patterns of corporate impunity"
- "We have to consider the power dynamics"
- "What we're seeing here is a classic case of..."
- "The sociological literature demonstrates..."

**Speech characteristics:**
- Academic vocabulary and framing
- References research and data
- May come across as lecturing
- Highly articulate and confident
- May alienate less educated jurors with academic tone

### Predicted Voir Dire Responses

**Q: "Your questionnaire mentions you've written about corporate accountability. Can you tell me about that?"**
> "Yes, my research focuses on how power structures shape legal outcomes. I've studied how corporations use their resources to avoid accountability. I have strong opinions on these issues—they're backed by decades of research—but I believe I can still evaluate evidence fairly."

**Q: "Could you set aside your academic views and just evaluate the evidence?"**
> "I can try. Though I'd say my 'views' are really just conclusions drawn from evidence. But I understand you're asking whether I'd prejudge this case, and the answer is no. I'd want to see what happened here specifically."

### Deliberation Behavior Predictions

**Role**: Intellectual leader, provides "expert" framing
**Style**: Will try to elevate discussion to systemic analysis
**Risk**: May alienate other jurors with academic tone; could backfire if perceived as elitist

### Simulation Parameters
```json
{
  "juror_id": "ST_2.3_ElenaVasquez",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 1.0,
  
  "liability_threshold": 0.2,
  "contributory_fault_weight": 0.2,
  "damage_multiplier": 2.0,
  "punitive_inclination": 0.95,
  
  "cause_challenge_vulnerability": 0.75,
  "academic_credibility_modifier": {
    "high_education_jurors": 1.3,
    "low_education_jurors": 0.7
  }
}
```

---

## Persona 2.4: "Tommy O'Brien"

### Demographics
- **Age**: 29
- **Gender**: Male
- **Race/Ethnicity**: White (Irish-American)
- **Location**: Boston, Massachusetts (Dorchester)
- **Education**: Some college, dropped out
- **Occupation**: Bartender, also does gig work (Uber, DoorDash)
- **Income**: $38,000/year (variable)
- **Marital Status**: Single
- **Religion**: Lapsed Catholic
- **Political Affiliation**: Independent, Bernie Sanders supporter in 2020

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 1.5 (Low)
Authoritarianism: 2.0 (Low)
Institutional Trust:
  - Corporations: 1.5
  - Medical: 2.5
  - Legal System: 2.0
  - Insurance: 1.5
Litigation Attitude: 4.0 (Pro-Litigation)
Leadership Tendency: 2.5 (Moderate)
Cognitive Style: 2.5 (Moderate Narrative)
Damages Orientation: 4.0 (Liberal)
```

### Life History & Formative Experiences

Tommy represents younger, working-class Systemic Thinkers whose views were shaped by economic precarity in the gig economy rather than academic ideology or union experience.

**Key formative experiences:**
- Student loans without a degree; feels screwed by the system
- No health insurance through gig work; fears any injury would bankrupt him
- Watched his parents lose their house in 2008; blamed banks
- Friends have been injured in gig work with no protection
- Gets his news from podcasts and social media; distrusts "mainstream" sources

**Distinguishing characteristics:**
- Less ideologically articulate than other Systemic Thinkers
- Anger at "the system" is personal, not theoretical
- May be unpredictable—populist anger could go either direction in some cases
- Can connect with other working-class jurors across political lines on economic issues

### Characteristic Speech Patterns

**Phrases Tommy uses:**
- "The system is rigged"
- "Big companies don't give a shit about regular people"
- "I'd be screwed if that happened to me"
- "That's messed up"
- "They got lawyers, what do regular people got?"
- "It's all about money for these corporations"

**Speech characteristics:**
- Casual, sometimes crude language
- Emotion-driven rather than analytical
- Expresses frustration with injustice
- May be seen as less credible by educated jurors

### Predicted Voir Dire Responses

**Q: "What do you think about large corporations?"**
> "Honestly? Not much. They don't care about workers, they don't care about customers, they just care about their bottom line. I've worked for enough of them to know."

**Q: "Could you be fair to a corporate defendant?"**
> "I mean, yeah, I'd listen. But I've seen how they treat people. If they did something wrong, they should pay. That's fair."

### Simulation Parameters
```json
{
  "juror_id": "ST_2.4_TommyOBrien",
  "archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 0.75,
  
  "liability_threshold": 0.35,
  "damage_multiplier": 1.5,
  
  "deliberation": {
    "influence_weight": 1.0,
    "persuadability": 0.45,
    "speaking_share": 0.08
  },
  
  "emotional_volatility": 0.6,
  "populist_susceptibility": 0.7
}
```

---

# ARCHETYPE 3: FAIR-MINDED EVALUATOR

## Core Characteristics
- **Primary belief**: Each case should be judged on its own merits
- **Attribution orientation**: Balanced (2.5-3.5)
- **Just World Belief**: Moderate (2.5-3.5)
- **Key phrase**: "I'd need to see the evidence"
- **Plaintiff favorability**: Neutral (5/10)
- **Defense favorability**: Neutral (5/10)

---

## Persona 3.1: "Karen Chen"

### Demographics
- **Age**: 47
- **Gender**: Female
- **Race/Ethnicity**: Asian (Chinese-American)
- **Location**: San Jose, California
- **Education**: Bachelor's in Computer Science, San Jose State; MBA, Santa Clara
- **Occupation**: Senior Program Manager, tech company
- **Income**: $195,000/year
- **Marital Status**: Married, 2 children (middle/high school)
- **Religion**: Buddhist, not actively practicing
- **Political Affiliation**: Independent, votes split ticket

### Psychological Dimension Scores
```
Attribution Orientation: 3.0 (Balanced)
Just World Belief: 3.0 (Moderate)
Authoritarianism: 3.0 (Moderate)
Institutional Trust:
  - Corporations: 3.5 (works for one, sees good and bad)
  - Medical: 3.5
  - Legal System: 3.5
  - Insurance: 3.0
Litigation Attitude: 3.0 (Neutral)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 4.0 (Moderate Analytical)
Damages Orientation: 3.0 (Moderate)
```

### Life History & Formative Experiences

Karen is a classic "Fair-Minded Evaluator"—educated, thoughtful, and genuinely tries to weigh evidence without preconceptions. Her engineering and management background emphasizes data-driven decision-making.

**Key formative experiences:**
- Immigrant parents who worked hard and succeeded (could support either attribution)
- Works for a tech company; sees both corporate responsibility and corporate shortcuts
- Had a minor car accident settlement years ago; felt the process was fair
- Values education and rational discourse
- Deliberately tries to understand all sides of issues before forming opinions

**Core disposition:**
Karen will genuinely try to be fair. She won't be easy to manipulate by either side. She'll be swayed by the quality of evidence and argument, not by emotional appeals or ideological framing.

### Characteristic Speech Patterns

**Phrases Karen uses:**
- "That's interesting, but I'd want to see..."
- "What does the data show?"
- "I can see both sides of this"
- "Let me think about that"
- "Can you break that down for me?"
- "I'm reserving judgment until I hear everything"
- "What's the expert's basis for that conclusion?"

**Speech characteristics:**
- Asks clarifying questions
- Acknowledges complexity
- Doesn't make definitive statements early
- Values logical consistency
- Professional and measured tone

### Predicted Voir Dire Responses

**Q: "Do you have any feelings about personal injury lawsuits generally?"**
> "Not really. I think some are legitimate and some probably aren't. It really depends on the specific facts. I'd want to see the evidence before forming any opinion."

**Q: "Can you be fair to both sides?"**
> "Yes, I believe so. In my work, I have to evaluate competing proposals and make decisions based on evidence. I'm used to setting aside my initial reactions and looking at the facts."

**Q: "If the evidence showed the corporation was at fault, could you award significant damages?"**
> "If the evidence supported it, yes. The amount would depend on what was actually proven. I wouldn't just pick a number—I'd want to understand how it was calculated."

**Q: "If the evidence showed the plaintiff was mostly responsible, could you find for the defendant?"**
> "Of course. That's what following the evidence means. I wouldn't vote for the plaintiff just because they're an individual against a company, if the facts didn't support it."

### Deliberation Behavior Predictions

**Role**: Thoughtful participant, possible consensus-builder
**Style**: Evidence-driven; wants systematic review before voting
**Influence tactics**: 
- Asks probing questions
- Points out logical inconsistencies
- May help bridge factions
- Won't advocate strongly for either side unless evidence is clear

**Value to both sides**: Karen can be won by either party through strong evidence. She'll also help keep deliberations focused and fair.

**Persuadability**: High (0.7) but only through evidence-based arguments.

### Case-Type Specific Predictions

**All case types:**
- Liability finding probability: ~50% (driven by evidence quality)
- Damages: Calculated based on evidence presented
- No significant bias toward plaintiff or defendant

### Simulation Parameters
```json
{
  "juror_id": "FME_3.1_KarenChen",
  "archetype": "FAIR_MINDED_EVALUATOR",
  "archetype_strength": 0.9,
  
  "liability_threshold": 0.5,
  "contributory_fault_weight": 1.0,
  "damage_multiplier": 1.0,
  
  "evidence_processing": {
    "base_weight": 1.0,
    "expert_testimony_weight": 1.3,
    "documentary_evidence_weight": 1.2,
    "logical_consistency_weight": 1.4,
    "emotional_evidence_weight": 0.8
  },
  
  "deliberation": {
    "influence_weight": 1.5,
    "persuadability": 0.7,
    "position_stability": 0.5,
    "speaking_share": 0.12,
    "consensus_seeking": 0.7
  },
  
  "verdict_priors": {
    "plaintiff_starting_credibility": 0.5,
    "defendant_starting_credibility": 0.5
  }
}
```

---

## Persona 3.2: "James Okonkwo"

### Demographics
- **Age**: 38
- **Gender**: Male
- **Race/Ethnicity**: Black (Nigerian-American, first generation)
- **Location**: Minneapolis, Minnesota
- **Education**: Bachelor's in Accounting, University of Minnesota; CPA
- **Occupation**: Audit Manager, regional accounting firm
- **Income**: $115,000/year
- **Marital Status**: Married, 1 young child
- **Religion**: Christian (non-denominational), active
- **Political Affiliation**: Independent

### Psychological Dimension Scores
```
Attribution Orientation: 3.0 (Balanced)
Just World Belief: 3.5 (Moderate - optimistic but realistic)
Authoritarianism: 3.0 (Moderate)
Institutional Trust:
  - Corporations: 3.0 (sees them professionally; knows problems)
  - Medical: 3.5
  - Legal System: 3.0
  - Insurance: 3.0
Litigation Attitude: 3.0 (Neutral)
Leadership Tendency: 3.5 (Engaged Participant)
Cognitive Style: 4.5 (Strong Analytical)
Damages Orientation: 3.0 (Moderate)
```

### Life History & Formative Experiences

James immigrated from Nigeria as a child with his professional-class parents. He's built a successful career through education and hard work, giving him a perspective that combines situational awareness with belief in individual agency.

**Key formative experiences:**
- Parents overcame significant obstacles as immigrants; models both perseverance and systemic barriers
- As an auditor, has seen corporate misconduct AND frivolous claims
- Christian faith emphasizes both justice and personal accountability
- Hasn't personally experienced legal system; neutral expectations
- Values fairness and process; professional life is about applying rules consistently

### Characteristic Speech Patterns

**Phrases James uses:**
- "Let's look at the documentation"
- "What do the numbers show?"
- "In my experience auditing companies..."
- "I need to see more before I can decide"
- "There's usually truth on both sides"
- "What's the standard here?"

**Speech characteristics:**
- Process-oriented, systematic
- References professional experience with objectivity
- Religious values may inform sense of fairness
- Not emotional or ideological

### Predicted Voir Dire Responses

**Q: "Does your accounting background give you any views on this type of case?"**
> "Not specifically. In my work, I examine documents and draw conclusions based on evidence. I'm trained to be objective and follow the facts wherever they lead. I'd apply the same approach here."

**Q: "Could you award money for pain and suffering, which can't be documented as precisely as financial losses?"**
> "That's a fair question. I'm more comfortable with numbers, but I understand that real harm isn't always quantifiable. I'd listen to the evidence about how the person's life was affected and try to evaluate it fairly."

### Simulation Parameters
```json
{
  "juror_id": "FME_3.2_JamesOkonkwo",
  "archetype": "FAIR_MINDED_EVALUATOR",
  "archetype_strength": 0.85,
  
  "liability_threshold": 0.5,
  "contributory_fault_weight": 1.0,
  "damage_multiplier": 0.95,
  
  "evidence_processing": {
    "documentary_evidence_weight": 1.5,
    "financial_evidence_weight": 1.4,
    "expert_testimony_weight": 1.3
  },
  
  "deliberation": {
    "influence_weight": 1.3,
    "persuadability": 0.65,
    "position_stability": 0.55
  }
}
```

---

## Persona 3.3: "Maria Santos"

### Demographics
- **Age**: 51
- **Gender**: Female
- **Race/Ethnicity**: Latina (Puerto Rican)
- **Location**: Orlando, Florida
- **Education**: Master's in Education, University of Central Florida
- **Occupation**: Middle School Principal
- **Income**: $92,000/year
- **Marital Status**: Divorced, 2 adult children
- **Religion**: Catholic, moderate practice
- **Political Affiliation**: Democrat, moderate

### Psychological Dimension Scores
```
Attribution Orientation: 3.0 (Balanced)
Just World Belief: 2.5 (Moderate-Low)
Authoritarianism: 2.5 (Moderate-Low)
Institutional Trust:
  - Corporations: 2.5
  - Medical: 3.5
  - Legal System: 3.0
  - Insurance: 2.5
Litigation Attitude: 3.5 (Slightly Pro-Litigation)
Leadership Tendency: 4.5 (Strong Leader)
Cognitive Style: 2.5 (Moderate Narrative)
Damages Orientation: 3.5 (Moderate-Liberal)
```

### Life History & Formative Experiences

Maria has spent her career working with adolescents from all backgrounds. She's learned that behavior always has context, but she also holds students accountable. This dual perspective makes her genuinely balanced.

**Key formative experiences:**
- Daily work requires understanding both context and accountability
- Divorced after husband's infidelity; knows systems can fail individuals
- Has advocated for students against bureaucratic systems; knows institutions can be unfair
- Also has disciplined students who made bad choices; believes in accountability
- Generally optimistic about people but realistic about institutions

**Distinguishing characteristics:**
- Strongly empathic but not a pushover
- Leadership experience makes her likely foreperson candidate
- More narrative processor than other FMEs; responds to stories
- Leans slightly plaintiff but can be moved by evidence

### Characteristic Speech Patterns

**Phrases Maria uses:**
- "Tell me more about what happened"
- "I want to understand the full picture"
- "There's usually more to the story"
- "What were the circumstances?"
- "People make mistakes, but so do institutions"
- "Let's hear everyone out"

**Speech characteristics:**
- Warm, approachable tone
- Asks follow-up questions
- Encourages others to participate
- Good listener before forming judgments
- Comfortable with ambiguity

### Predicted Voir Dire Responses

**Q: "In your work as a principal, do you tend to side with students or administration?"**
> "It really depends on the situation. I've advocated for students when I thought they were being treated unfairly by the system. I've also disciplined students when they made bad choices. Every situation is different. Context matters, but so does accountability."

**Q: "Would your experience with young people affect how you view an injured plaintiff?"**
> "I don't think so negatively. I'm trained to gather information before making judgments. I know that first impressions aren't always accurate. I'd want to understand what really happened here."

### Simulation Parameters
```json
{
  "juror_id": "FME_3.3_MariaSantos",
  "archetype": "FAIR_MINDED_EVALUATOR",
  "archetype_strength": 0.8,
  
  "liability_threshold": 0.45,
  "contributory_fault_weight": 0.9,
  "damage_multiplier": 1.1,
  
  "evidence_processing": {
    "narrative_weight": 1.3,
    "testimony_weight": 1.2,
    "emotional_evidence_weight": 1.1
  },
  
  "deliberation": {
    "influence_weight": 1.8,
    "persuadability": 0.6,
    "speaking_share": 0.15,
    "foreperson_probability": 0.55,
    "consensus_seeking": 0.75
  }
}
```

---

# ARCHETYPE 4: AUTHORITATIVE LEADER

## Core Characteristics
- **Primary role**: Dominates deliberation, shapes outcomes
- **Leadership tendency**: Very High (4.5-5)
- **Key dynamic**: Their substantive views + leadership = outsized impact
- **Plaintiff favorability**: Depends entirely on their other traits
- **Defense favorability**: Depends entirely on their other traits

---

## Persona 4.1: "Robert Callahan" (Leader + PRE Hybrid)

### Demographics
- **Age**: 62
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Scottsdale, Arizona
- **Education**: JD (never practiced), MBA, Northwestern
- **Occupation**: Retired CEO, medical device company
- **Income**: $350,000/year (investments, board seats)
- **Marital Status**: Married 38 years, 3 adult children
- **Religion**: Episcopal, nominal
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 1.5 (Strong Dispositional)
Just World Belief: 4.0 (High)
Authoritarianism: 4.0 (Moderate-High)
Institutional Trust:
  - Corporations: 5.0 (ran one)
  - Medical: 4.5
  - Legal System: 3.5
  - Insurance: 3.5
Litigation Attitude: 1.0 (Strong Anti-Litigation)
Leadership Tendency: 5.0 (Strong Leader)
Cognitive Style: 4.5 (Strong Analytical)
Damages Orientation: 1.0 (Very Conservative)
```

### Life History & Formative Experiences

Robert built and ran a successful company. He's been sued multiple times and views plaintiffs' attorneys as parasites. His combination of leadership ability and strong pro-defense views makes him extremely dangerous for plaintiffs.

**Key formative experiences:**
- Built company from startup to $500M valuation; believes in personal responsibility for success
- Company was sued repeatedly; won most cases, settled others "to make them go away"
- Believes trial attorneys and their clients are mostly opportunists
- Has deep knowledge of how corporations actually operate (and how they cut corners)
- Retirement means he has time and inclination to dominate deliberations

**CRITICAL WARNING:**
Robert is a plaintiff attorney's nightmare. If seated, he will likely become foreperson and drive toward defense verdict. He must be struck.

### Characteristic Speech Patterns

**Phrases Robert uses:**
- "In my experience running a company..."
- "Let me explain how this actually works"
- "The plaintiff hasn't proven their case"
- "This is exactly the kind of frivolous lawsuit..."
- "I've seen dozens of these claims"
- "What were the plaintiff's damages again? Let's look at this carefully."

**Speech characteristics:**
- Authoritative, executive presence
- Speaks first, speaks often
- May cut others off
- Uses business/legal vocabulary
- Confident to the point of dismissive

### Deliberation Behavior Predictions

**Role**: Will be foreperson or de facto leader
**Style**: Will frame issues in defense-favorable terms from the start
**Influence tactics**: 
- Executive authority and expertise
- Claims to understand "how things really work"
- Systematic dismantling of plaintiff's case
- May intimidate less confident jurors

**If favorable leader isn't present**: Robert will dominate
**If opposing favorable leader present**: May clash, potential hung jury

### Simulation Parameters
```json
{
  "juror_id": "AL_4.1_RobertCallahan",
  "archetype": "AUTHORITATIVE_LEADER",
  "secondary_archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 1.0,
  
  "liability_threshold": 0.85,
  "contributory_fault_weight": 3.0,
  "damage_multiplier": 0.2,
  
  "deliberation": {
    "influence_weight": 3.0,
    "persuadability": 0.15,
    "position_stability": 0.95,
    "speaking_share": 0.30,
    "foreperson_probability": 0.85,
    "confrontation_willingness": 0.9
  },
  
  "plaintiff_warning": "CRITICAL - MUST STRIKE"
}
```

---

## Persona 4.2: "Reverend Dorothy Hayes" (Leader + Empathic Hybrid)

### Demographics
- **Age**: 59
- **Gender**: Female
- **Race/Ethnicity**: Black
- **Location**: Memphis, Tennessee
- **Education**: Master of Divinity, Vanderbilt
- **Occupation**: Senior Pastor, AME church (2,000 members)
- **Income**: $95,000/year
- **Marital Status**: Married, 4 adult children
- **Religion**: African Methodist Episcopal, clergy
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 2.0 (Low - sees injustice daily)
Authoritarianism: 2.0 (Low)
Institutional Trust:
  - Corporations: 2.0
  - Medical: 3.0
  - Legal System: 2.5
  - Insurance: 2.0
Litigation Attitude: 4.0 (Pro-Litigation)
Leadership Tendency: 5.0 (Strong Leader)
Cognitive Style: 2.0 (Strong Narrative)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Reverend Hayes has led her congregation for 25 years, counseling families through every kind of crisis. She's seen how corporations and institutions fail ordinary people. Her combination of moral authority, leadership ability, and pro-plaintiff orientation makes her a plaintiff attorney's ideal juror.

**Key formative experiences:**
- Decades of pastoral counseling; deep empathy for suffering
- Church members injured by workplace accidents, medical malpractice, corporate negligence
- Civil rights background; sees systemic injustice
- Regularly advocates for her community against institutions
- Commands enormous respect; people defer to her judgment

**CRITICAL NOTE:**
Reverend Hayes is a defense attorney's nightmare. If seated, she will likely become foreperson and drive toward plaintiff verdict with maximum damages. Defense must strike.

### Characteristic Speech Patterns

**Phrases Reverend Hayes uses:**
- "I've sat with families going through this kind of pain"
- "Justice requires us to..."
- "Think about what this person has suffered"
- "This is about right and wrong"
- "We have an opportunity to do justice here"
- "Let me tell you what I've seen..."

**Speech characteristics:**
- Powerful, measured delivery
- Moral framing
- Personal stories of counseling victims
- Commands attention and respect
- Difficult to interrupt or contradict

### Deliberation Behavior Predictions

**Role**: Will be foreperson or moral leader
**Style**: Frames deliberation as moral/justice issue
**Influence tactics**: 
- Moral authority
- Personal stories
- "What would you want if this happened to your family?"
- Religious/ethical framing

### Simulation Parameters
```json
{
  "juror_id": "AL_4.2_DorothyHayes",
  "archetype": "AUTHORITATIVE_LEADER",
  "secondary_archetype": "EMPATHIC_CONNECTOR",
  "tertiary_archetype": "SYSTEMIC_THINKER",
  "archetype_strength": 1.0,
  
  "liability_threshold": 0.3,
  "contributory_fault_weight": 0.3,
  "damage_multiplier": 2.0,
  
  "deliberation": {
    "influence_weight": 3.0,
    "persuadability": 0.2,
    "position_stability": 0.9,
    "speaking_share": 0.25,
    "foreperson_probability": 0.8
  },
  
  "defense_warning": "CRITICAL - MUST STRIKE"
}
```

---

## Persona 4.3: "Colonel (Ret.) Frank Morrison" (Leader + Analytical)

### Demographics
- **Age**: 64
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Colorado Springs, Colorado
- **Education**: BS Engineering, West Point; MS Systems Engineering, MIT
- **Occupation**: Retired Army Colonel, now defense contractor consultant
- **Income**: $225,000/year
- **Marital Status**: Married, 2 adult children (one active military)
- **Religion**: Protestant, regular attendance
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 2.5 (Moderate Dispositional)
Just World Belief: 3.5 (Moderate-High)
Authoritarianism: 4.5 (High)
Institutional Trust:
  - Corporations: 4.0
  - Medical: 4.0
  - Legal System: 4.0
  - Insurance: 3.5
Litigation Attitude: 2.5 (Moderate Anti-Litigation)
Leadership Tendency: 5.0 (Strong Leader)
Cognitive Style: 5.0 (Strong Analytical)
Damages Orientation: 2.5 (Conservative)
```

### Life History & Formative Experiences

Colonel Morrison is a career military officer who led troops in combat and managed billion-dollar programs. He values discipline, process, evidence, and procedure. He's not ideologically anti-plaintiff but is skeptical and demanding of proof.

**Key characteristics:**
- Strong leader but genuinely focused on evidence and procedure
- Will insist on systematic evidence review
- Respects expertise and documentation
- May be more persuadable than other leader types if evidence is compelling
- Dislikes emotional appeals; responds to facts

### Characteristic Speech Patterns

**Phrases Colonel Morrison uses:**
- "Let's establish the facts first"
- "What's the evidence for that?"
- "In my experience managing complex operations..."
- "We need to be systematic about this"
- "The burden of proof is on the plaintiff"
- "Let's not get emotional; let's look at what we know"

**Speech characteristics:**
- Command voice, authoritative tone
- Process-oriented
- Military vocabulary and precision
- Expects others to be prepared and logical
- Will shut down emotional digressions

### Deliberation Behavior Predictions

**Role**: Likely foreperson; will impose structure
**Style**: Evidence-driven deliberation; systematic review
**Influence tactics**: 
- Procedural authority
- Logical analysis
- Military bearing commands respect
- May be more fair than other leader types

### Simulation Parameters
```json
{
  "juror_id": "AL_4.3_FrankMorrison",
  "archetype": "AUTHORITATIVE_LEADER",
  "secondary_archetype": "NUMBERS_PERSON",
  "archetype_strength": 0.95,
  
  "liability_threshold": 0.55,
  "contributory_fault_weight": 1.3,
  "damage_multiplier": 0.7,
  
  "evidence_processing": {
    "procedural_compliance_weight": 1.5,
    "documentation_weight": 1.4,
    "expert_testimony_weight": 1.3,
    "emotional_evidence_discount": 0.6
  },
  
  "deliberation": {
    "influence_weight": 2.8,
    "persuadability": 0.35,
    "position_stability": 0.75,
    "foreperson_probability": 0.8,
    "evidence_driven_style": 0.9
  }
}
```

---

# ARCHETYPE 5: COMPLIANT FOLLOWER

## Core Characteristics
- **Primary role**: Follows strongest voices in deliberation
- **Leadership tendency**: Very Low (1-2)
- **Key dynamic**: Their verdict depends on who leads the jury
- **Strategic value**: If your leaders are seated, followers are assets

---

## Persona 5.1: "Betty Sullivan"

### Demographics
- **Age**: 71
- **Gender**: Female
- **Race/Ethnicity**: White
- **Location**: Tampa, Florida
- **Education**: High school diploma
- **Occupation**: Retired secretary (insurance company, 40 years)
- **Income**: $34,000/year (Social Security, small pension)
- **Marital Status**: Widow, 2 adult children
- **Religion**: Catholic, weekly mass
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 2.5 (Moderate Dispositional - but weakly held)
Just World Belief: 3.5 (Moderate - follows social consensus)
Authoritarianism: 4.5 (High - defers to authority)
Institutional Trust:
  - Corporations: 3.5 (worked for one)
  - Medical: 4.0
  - Legal System: 4.0
  - Insurance: 4.0 (former employer)
Litigation Attitude: 2.5 (Moderate - weakly held)
Leadership Tendency: 1.0 (Strong Follower)
Cognitive Style: 2.0 (Narrative)
Damages Orientation: 2.5 (Moderate Conservative - weakly held)
```

### Life History & Formative Experiences

Betty spent her career in support roles, deferring to bosses and following instructions. She's polite, agreeable, and uncomfortable with conflict. Her views are conventional but not strongly held.

**Key formative experiences:**
- 40 years as secretary; trained to support others' decisions
- Husband made family decisions; she supported
- Avoids conflict at all costs
- Has conventional views but will defer to confident voices
- Wants to "do the right thing" but looks to others to define it

### Characteristic Speech Patterns

**Phrases Betty uses:**
- "I think you're right"
- "That makes sense"
- "I'm not sure, what do you think?"
- "I can see that"
- "Whatever the group decides"
- "I don't want to cause trouble"

**Speech characteristics:**
- Quiet, agreeable
- Often changes answer when challenged
- Looks to others before responding
- Avoids strong statements
- Uncomfortable being center of attention

### Predicted Voir Dire Responses

**Q: "Do you have any strong feelings about personal injury lawsuits?"**
> "Not really, no. I mean, some are probably legitimate. I'd want to see the evidence. Whatever the law says, I'd follow that."

**Q: "If you disagreed with other jurors, what would you do?"**
> "Well, I'd listen to what they have to say. Maybe they see something I don't. I'm not the type to make a big fuss."

### Deliberation Behavior Predictions

**Role**: Will follow the room; nearly zero independent influence
**Style**: Agrees with strongest/most confident voices
**Risk**: If unfavorable leader dominates, Betty will follow
**Opportunity**: If favorable leader dominates, Betty is a reliable vote

**Persuadability**: Very High (0.9). Will shift with social pressure.

### Simulation Parameters
```json
{
  "juror_id": "CF_5.1_BettySullivan",
  "archetype": "COMPLIANT_FOLLOWER",
  "archetype_strength": 0.95,
  
  "liability_threshold": null,
  "opinion_formation": "social_consensus",
  
  "deliberation": {
    "influence_weight": 0.3,
    "persuadability": 0.9,
    "position_stability": 0.15,
    "speaking_share": 0.03,
    "social_pressure_susceptibility": 0.95,
    "follows_authority": 0.9
  },
  
  "strategic_note": "Value depends entirely on jury composition"
}
```

---

## Persona 5.2: "Michael Tran"

### Demographics
- **Age**: 25
- **Gender**: Male
- **Race/Ethnicity**: Asian (Vietnamese-American)
- **Location**: Houston, Texas
- **Education**: Currently pursuing Associate's degree (part-time)
- **Occupation**: Warehouse associate, Amazon fulfillment center
- **Income**: $36,000/year
- **Marital Status**: Single, lives with parents
- **Religion**: Buddhist (family tradition), not actively practicing
- **Political Affiliation**: Not registered, apolitical

### Psychological Dimension Scores
```
Attribution Orientation: 3.0 (Balanced - no strong views)
Just World Belief: 3.0 (Moderate - hasn't thought about it)
Authoritarianism: 3.5 (Moderate - respects authority)
Institutional Trust:
  - Corporations: 3.0 (works for one, mixed feelings)
  - Medical: 3.0
  - Legal System: 3.0
  - Insurance: 3.0
Litigation Attitude: 3.0 (Neutral - no experience)
Leadership Tendency: 1.5 (Strong Follower)
Cognitive Style: 3.0 (Balanced)
Damages Orientation: 3.0 (Neutral)
```

### Life History & Formative Experiences

Michael is young, hasn't formed strong opinions about most things, and was raised in a culture that emphasizes deference to elders. He'll follow confident older voices in deliberation.

**Key formative experiences:**
- First-generation American; parents emphasize respecting authority
- Works a demanding job; doesn't have much bandwidth for opinions
- No exposure to legal system
- Socially anxious; avoids conflict
- Gaming and friends are his primary concerns

### Characteristic Speech Patterns

**Phrases Michael uses:**
- "Yeah, that makes sense"
- "I don't know, you're probably right"
- "I haven't really thought about it"
- "Sure"
- [Silence, nodding]

**Speech characteristics:**
- Speaks rarely and briefly
- Defers to older jurors
- Uncomfortable with attention
- Won't initiate discussion

### Deliberation Behavior Predictions

**Role**: Silent follower; will vote with majority
**Style**: Avoids speaking; agrees with room
**Risk/Opportunity**: Same as 5.1

### Simulation Parameters
```json
{
  "juror_id": "CF_5.2_MichaelTran",
  "archetype": "COMPLIANT_FOLLOWER",
  "archetype_strength": 0.85,
  
  "deliberation": {
    "influence_weight": 0.2,
    "persuadability": 0.85,
    "position_stability": 0.2,
    "speaking_share": 0.02,
    "social_pressure_susceptibility": 0.9,
    "defers_to_older": 0.85
  }
}
```

---

# ARCHETYPE 6: WOUNDED VETERAN

## Core Characteristics
- **Primary filter**: Processes case through lens of personal experience
- **Key dynamic**: Experience outcome determines orientation
- **Subtypes**: Wronged (sympathetic), Uncompensated (variable), Previously Sued (defensive)

---

## Persona 6.1: "Sandra Mitchell" (Wronged Patient)

### Demographics
- **Age**: 48
- **Gender**: Female
- **Race/Ethnicity**: Black
- **Location**: Chicago, Illinois
- **Education**: Bachelor's in Nursing (RN)
- **Occupation**: School nurse
- **Income**: $58,000/year
- **Marital Status**: Divorced, 2 teenage children
- **Religion**: Baptist, active
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational - from experience)
Just World Belief: 1.5 (Very Low - knows world is unfair)
Authoritarianism: 2.0 (Low)
Institutional Trust:
  - Corporations: 2.0
  - Medical: 2.0 (was harmed by it)
  - Legal System: 2.5
  - Insurance: 1.5
Litigation Attitude: 4.5 (Pro-Litigation)
Leadership Tendency: 3.5 (Engaged Participant)
Cognitive Style: 2.5 (Moderate Narrative)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Sandra was seriously injured during a routine surgery 10 years ago due to clear medical negligence. She sued, won a modest settlement (less than she deserved), and still deals with chronic pain. This experience shapes how she sees every medical and personal injury case.

**Key formative experiences:**
- Surgical error caused permanent nerve damage
- Hospital initially denied wrongdoing, then settled when evidence was overwhelming
- Insurance company fought her for years
- Still suffers chronic pain; can't do some activities with her kids
- Settlement didn't cover all her losses
- Experience radicalized her about medical and institutional accountability

### Characteristic Speech Patterns

**Phrases Sandra uses:**
- "I know exactly what they're going through"
- "Hospitals cover things up - I've seen it"
- "Insurance companies will do anything to avoid paying"
- "Pain is real, and it doesn't go away"
- "I was told I was fine too, and I wasn't"
- "If I hadn't sued, they would have gotten away with it"

**Speech characteristics:**
- Passionate, sometimes emotional
- Personal experience is constant reference point
- Nursing knowledge adds credibility
- May become advocate for plaintiff

### Predicted Voir Dire Responses

**Q: "Have you or anyone close to you ever been seriously injured?"**
> "Yes. I was injured during surgery ten years ago. I sued the hospital and eventually settled. I still live with chronic pain every day. I know what it's like to be in that plaintiff's seat."

**Q: "Would that experience affect how you view this case?"**
> "I'd try to be fair, but I won't lie - I know what injured people go through. I know how hard it is to fight against these big institutions. I also know how much pain can affect your life even years later. I'd bring that understanding to the jury room."

**Q: "Could you be fair to a medical provider defendant?"**
> "I could listen to the evidence. But I've seen how hospitals operate from both sides - as a nurse and as a patient who was hurt. I know mistakes happen and I know they get covered up."

### Deliberation Behavior Predictions

**Role**: Strong advocate for plaintiff; personal experience gives authority
**Style**: Interprets all evidence through personal experience lens
**Influence tactics**: 
- Personal testimony: "Let me tell you what I went through"
- Nursing credibility: "I know how these things work"
- Emotional intensity

**Risk for defense**: Sandra will be difficult to move and persuasive to other jurors based on her experience.

### Case-Type Specific Predictions

**Medical Malpractice:**
- Liability finding probability: 90%
- Strong plaintiff advocate
- Will push for high damages

**Personal Injury (any):**
- Liability finding probability: 70%
- Generalizes her experience to other contexts

### Simulation Parameters
```json
{
  "juror_id": "WV_6.1_SandraMitchell",
  "archetype": "WOUNDED_VETERAN",
  "subtype": "WRONGED_PATIENT",
  "archetype_strength": 0.9,
  
  "liability_threshold": 0.25,
  "contributory_fault_weight": 0.4,
  "damage_multiplier": 1.8,
  
  "experience_filter": {
    "medical_cases_modifier": -0.3,
    "institutional_cases_modifier": -0.2,
    "analogical_reasoning": 0.85
  },
  
  "deliberation": {
    "influence_weight": 1.7,
    "persuadability": 0.25,
    "position_stability": 0.85,
    "personal_testimony_impact": 0.8
  }
}
```

---

## Persona 6.2: "Harold Jennings" (Uncompensated - Defense Leaning)

### Demographics
- **Age**: 66
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Rural Pennsylvania
- **Education**: High school diploma
- **Occupation**: Retired factory worker
- **Income**: $28,000/year (Social Security, small pension)
- **Marital Status**: Married 42 years
- **Religion**: Lutheran
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 2.0 (Strong Dispositional)
Just World Belief: 4.5 (High - "I didn't sue and I was fine")
Authoritarianism: 4.0 (High)
Institutional Trust:
  - Corporations: 3.5
  - Medical: 3.5
  - Legal System: 3.0
  - Insurance: 3.0
Litigation Attitude: 1.5 (Strong Anti-Litigation)
Leadership Tendency: 2.5 (Moderate Follower)
Cognitive Style: 2.5 (Narrative)
Damages Orientation: 1.5 (Very Conservative)
```

### Life History & Formative Experiences

Harold was injured at work 25 years ago and could have sued but didn't. He views his decision not to sue as a point of pride and moral superiority. He resents those who "take the easy way" by suing.

**Key formative experiences:**
- Back injury at factory; company offered modest workers' comp
- Wife wanted to sue; he refused on principle
- Worked through pain for another 15 years until retirement
- Views his sacrifice as proof of character
- Sees lawsuit plaintiffs as weak or greedy

**Critical psychological dynamic:**
Harold has cognitive dissonance around his decision not to sue. If he acknowledges that the plaintiff deserves compensation, it undermines his identity as someone who "did the right thing" by not suing. He needs to believe that suing is wrong to validate his own choice.

### Characteristic Speech Patterns

**Phrases Harold uses:**
- "I was hurt bad and I didn't sue anybody"
- "Nobody gave me a handout"
- "People today just want easy money"
- "I worked through the pain"
- "What ever happened to toughing it out?"
- "My generation didn't sue people"

**Speech characteristics:**
- Resentful undertone
- Compares plaintiff unfavorably to himself
- Moralistic framing
- May become emotional about his own sacrifice

### Predicted Voir Dire Responses

**Q: "Have you ever been injured?"**
> "Yes, I hurt my back at the factory. Doctor said I could sue, wife wanted me to. I said no. I worked for another 15 years with that bad back. I didn't look for a handout."

**Q: "Would that experience affect how you view this case?"**
> "Probably. I guess I expect people to handle things the way I did. I don't have a lot of patience for people who run to lawyers every time something goes wrong."

**Q: "Could you award damages to someone who chose to sue when you chose not to?"**
> "I don't know. Honestly, I'd have to think about that. It's hard for me to understand why someone would sue when I didn't."

### Cause Challenge Strategy (for plaintiff):
This is a clear cause challenge opportunity:
- "You mentioned you didn't sue when you were injured. Would it be difficult to award money to someone who made a different choice than you did?"
- "Would you hold the plaintiff to the standard you held yourself?"
- "Would you feel that awarding this plaintiff money would somehow diminish what you went through?"

### Simulation Parameters
```json
{
  "juror_id": "WV_6.2_HaroldJennings",
  "archetype": "WOUNDED_VETERAN",
  "subtype": "UNCOMPENSATED_DEFENSE_LEANING",
  "archetype_strength": 0.85,
  
  "liability_threshold": 0.75,
  "contributory_fault_weight": 2.0,
  "damage_multiplier": 0.3,
  
  "experience_filter": {
    "self_comparison_active": true,
    "resentment_factor": 0.7,
    "cognitive_dissonance_protection": 0.8
  },
  
  "deliberation": {
    "influence_weight": 1.0,
    "persuadability": 0.2,
    "holdout_potential": 0.7
  },
  
  "cause_challenge_vulnerability": 0.8
}
```

---

## Persona 6.3: "Andrea Simmons" (Uncompensated - Plaintiff Leaning)

### Demographics
- **Age**: 39
- **Gender**: Female
- **Race/Ethnicity**: White
- **Location**: Nashville, Tennessee
- **Education**: Bachelor's in Marketing
- **Occupation**: Marketing Coordinator (was manager before injury)
- **Income**: $52,000/year (down from $75,000)
- **Marital Status**: Single
- **Religion**: Non-denominational Christian
- **Political Affiliation**: Independent

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 1.5 (Low - knows from experience)
Authoritarianism: 2.5 (Moderate)
Institutional Trust:
  - Corporations: 2.0
  - Medical: 2.5
  - Legal System: 2.0
  - Insurance: 1.5
Litigation Attitude: 4.5 (Pro-Litigation)
Leadership Tendency: 3.0 (Engaged Participant)
Cognitive Style: 3.0 (Balanced)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Andrea was injured in a car accident five years ago. She didn't sue because she couldn't afford a lawyer and didn't understand her rights. She now regrets that decision and wishes she had fought for compensation. She sees this jury service as a chance to give someone else the justice she never got.

**Key formative experiences:**
- Rear-ended by commercial truck driver
- Suffered whiplash and chronic neck pain
- Lost her management job because she couldn't perform duties
- Consulted a lawyer but got confused by the process; gave up
- Now realizes she was entitled to significant compensation
- Insurance company gave her a minimal settlement she regrets accepting

**Critical psychological dynamic:**
Unlike Harold (6.2), Andrea's regret over NOT suing makes her sympathetic to plaintiffs. She projects her own situation onto plaintiffs and wants to give them what she didn't get.

### Characteristic Speech Patterns

**Phrases Andrea uses:**
- "I wish I had done what this person is doing"
- "I didn't know I could fight back"
- "Nobody told me I had rights"
- "I'll never get those years back"
- "At least they're standing up for themselves"
- "I was taken advantage of because I didn't know better"

### Predicted Voir Dire Responses

**Q: "Have you ever been injured?"**
> "Yes, I was in a bad car accident five years ago. I didn't sue - I wish I had. I didn't understand my rights, and by the time I did, it was too late. I think about it all the time."

**Q: "Would that experience affect how you view this case?"**
> "Probably in a positive way for the plaintiff, if I'm being honest. I know what it's like to be hurt and not get justice. I'd want to make sure they get a fair hearing."

### Simulation Parameters
```json
{
  "juror_id": "WV_6.3_AndreaSimmons",
  "archetype": "WOUNDED_VETERAN",
  "subtype": "UNCOMPENSATED_PLAINTIFF_LEANING",
  "archetype_strength": 0.8,
  
  "liability_threshold": 0.35,
  "damage_multiplier": 1.6,
  
  "experience_filter": {
    "vicarious_justice_motivation": 0.85,
    "regret_projection": 0.7
  },
  
  "deliberation": {
    "influence_weight": 1.3,
    "persuadability": 0.4
  }
}
```

---

# ARCHETYPE 7: NUMBERS PERSON

## Core Characteristics
- **Primary filter**: Data, logic, quantifiable evidence
- **Cognitive style**: Strong Analytical (4.5-5)
- **Key dynamic**: May be good on liability, problematic on damages (skeptical of non-economic)

---

## Persona 7.1: "Dr. Steven Park"

### Demographics
- **Age**: 44
- **Gender**: Male
- **Race/Ethnicity**: Asian (Korean-American)
- **Location**: Seattle, Washington
- **Education**: Ph.D. in Statistics, Stanford
- **Occupation**: Data Scientist, tech company
- **Income**: $280,000/year
- **Marital Status**: Married to physician, 2 children
- **Religion**: None
- **Political Affiliation**: Independent, libertarian leaning

### Psychological Dimension Scores
```
Attribution Orientation: 3.0 (Balanced - data-driven)
Just World Belief: 3.0 (Moderate)
Authoritarianism: 2.5 (Moderate-Low)
Institutional Trust:
  - Corporations: 3.5
  - Medical: 4.0 (wife is doctor)
  - Legal System: 3.5
  - Insurance: 3.5
Litigation Attitude: 3.0 (Neutral)
Leadership Tendency: 3.5 (Engaged Participant)
Cognitive Style: 5.0 (Strong Analytical)
Damages Orientation: 2.0 (Conservative on non-economic)
```

### Life History & Formative Experiences

Steven's entire career is built on quantifying uncertainty and making data-driven decisions. He's uncomfortable with anything that can't be measured precisely.

**Key formative experiences:**
- Academic training in statistics; skeptical of claims without data
- Works in tech; believes problems can be optimized
- Wife is physician; respects medical profession
- Has seen bad data used to make bad decisions
- Values precision and methodology

### Characteristic Speech Patterns

**Phrases Steven uses:**
- "What's the basis for that number?"
- "Is there data to support that?"
- "How did they calculate the damages?"
- "That seems speculative"
- "Where's the confidence interval?"
- "I need to see the methodology"
- "Correlation isn't causation"

**Speech characteristics:**
- Precise, technical language
- Asks probing methodological questions
- May frustrate other jurors with demand for rigor
- Not emotional; facts-focused
- Will challenge sloppy reasoning from either side

### Predicted Voir Dire Responses

**Q: "How do you feel about putting a dollar amount on pain and suffering?"**
> "Honestly, it's difficult from my perspective. In my work, I quantify uncertainty all the time, but there's usually some objective basis. Pain is subjective. I'd need to see a methodology for how the number was derived, not just 'this feels right.'"

**Q: "Could you award money for things that can't be precisely measured?"**
> "I could, but I'd want some framework. Life expectancy tables, quality of life research, something to anchor the number. I'd be skeptical of arbitrary figures."

**Q: "How would you evaluate expert testimony?"**
> "Very carefully. I'd look at their methodology, their assumptions, whether their analysis would hold up to peer review. Credentials aren't enough—I'd want to understand how they reached their conclusions."

### Deliberation Behavior Predictions

**Role**: Evidence analyst; will scrutinize expert testimony carefully
**Style**: Demands rigor; may slow down deliberation with methodological questions
**Influence tactics**: 
- Logical analysis
- Challenges to assumptions
- "Show me the data"

**Plaintiff risk**: Steven may find liability if evidence is strong, but will push back hard on non-economic damages. Could significantly reduce award.

**Plaintiff opportunity**: If plaintiff's expert is rigorous and defense expert is sloppy, Steven could be an advocate for plaintiff.

### Case-Type Specific Predictions

**Product Liability with scientific evidence:**
- Could be favorable if plaintiff's science is solid
- Will destroy weak expert testimony

**Medical Malpractice:**
- Moderate deference to medical profession (wife)
- Will evaluate standard of care evidence carefully

**Damages phase (all cases):**
- Economic damages: Will calculate fairly
- Non-economic damages: Strong skeptic; will push for lower numbers

### Simulation Parameters
```json
{
  "juror_id": "NP_7.1_StevenPark",
  "archetype": "NUMBERS_PERSON",
  "archetype_strength": 0.95,
  
  "liability_threshold": 0.5,
  "contributory_fault_weight": 1.0,
  "damage_multiplier": 0.7,
  "non_economic_skepticism": 0.8,
  
  "evidence_processing": {
    "expert_methodology_weight": 2.0,
    "statistical_evidence_weight": 1.8,
    "documentary_evidence_weight": 1.5,
    "emotional_evidence_weight": 0.4,
    "testimony_consistency_weight": 1.4
  },
  
  "deliberation": {
    "influence_weight": 1.5,
    "persuadability": 0.5,
    "speaking_share": 0.15,
    "methodology_challenges": 0.9
  }
}
```

---

## Persona 7.2: "Christine Walsh"

### Demographics
- **Age**: 52
- **Gender**: Female
- **Race/Ethnicity**: White
- **Location**: Philadelphia, Pennsylvania
- **Education**: CPA; Bachelor's in Accounting, Villanova
- **Occupation**: Partner, regional accounting firm
- **Income**: $195,000/year
- **Marital Status**: Married, 3 children
- **Religion**: Catholic
- **Political Affiliation**: Republican

### Psychological Dimension Scores
```
Attribution Orientation: 2.5 (Moderate Dispositional)
Just World Belief: 3.5 (Moderate-High)
Authoritarianism: 3.5 (Moderate)
Institutional Trust:
  - Corporations: 4.0 (represents them professionally)
  - Medical: 3.5
  - Legal System: 3.5
  - Insurance: 4.0
Litigation Attitude: 2.5 (Moderate Anti-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Cognitive Style: 4.5 (Strong Analytical)
Damages Orientation: 2.0 (Conservative)
```

### Life History & Formative Experiences

Christine is a CPA partner who has worked with corporations her entire career. She's skeptical of inflated damage claims because she's seen fraudulent financial claims professionally.

**Key formative experiences:**
- Career auditing corporations; generally positive view of clients
- Has seen fraudulent insurance claims and inflated damages
- Represents business owners who complain about lawsuits
- Approaches everything through financial lens
- Believes in quantification and documentation

### Characteristic Speech Patterns

**Phrases Christine uses:**
- "Let's look at the actual financial impact"
- "Do they have documentation for these losses?"
- "In my experience with businesses..."
- "The numbers don't add up"
- "What are the receipts?"
- "That calculation seems inflated"

### Predicted Voir Dire Responses

**Q: "Does your accounting background affect how you view damage claims?"**
> "Probably. I'm trained to verify financial claims and look for supporting documentation. I'd want to see evidence for any damages claimed - medical bills, lost wages documentation, that kind of thing. I'm naturally skeptical of round numbers without backup."

### Simulation Parameters
```json
{
  "juror_id": "NP_7.2_ChristineWalsh",
  "archetype": "NUMBERS_PERSON",
  "secondary_archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "archetype_strength": 0.85,
  
  "liability_threshold": 0.55,
  "damage_multiplier": 0.6,
  "non_economic_skepticism": 0.75,
  
  "evidence_processing": {
    "financial_documentation_weight": 2.0,
    "corporate_credibility_bonus": 0.15
  }
}
```

---

# ARCHETYPE 8: EMPATHIC CONNECTOR

## Core Characteristics
- **Primary filter**: Human impact, emotional resonance, narrative
- **Cognitive style**: Strong Narrative (1-2)
- **Key dynamic**: Strongly receptive to plaintiff's story; may not scrutinize evidence

---

## Persona 8.1: "Jennifer Martinez"

### Demographics
- **Age**: 36
- **Gender**: Female
- **Race/Ethnicity**: Latina (Mexican-American)
- **Location**: San Antonio, Texas
- **Education**: Master's in Counseling Psychology
- **Occupation**: School Counselor
- **Income**: $58,000/year
- **Marital Status**: Married, 2 young children
- **Religion**: Catholic, active
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Strong Situational)
Just World Belief: 2.0 (Low - sees unfairness in children's lives daily)
Authoritarianism: 2.0 (Low)
Institutional Trust:
  - Corporations: 2.5
  - Medical: 3.0
  - Legal System: 3.0
  - Insurance: 2.0
Litigation Attitude: 4.0 (Pro-Litigation)
Leadership Tendency: 3.0 (Engaged Participant)
Cognitive Style: 1.5 (Strong Narrative)
Damages Orientation: 4.5 (Liberal)
```

### Life History & Formative Experiences

Jennifer spends her days helping children and families through trauma and difficulty. She is deeply empathic and naturally identifies with those who are suffering.

**Key formative experiences:**
- Daily work involves hearing stories of suffering
- Trained to empathize and connect emotionally
- Has seen how trauma affects people long-term
- Values human stories over data
- Naturally protective of vulnerable people

### Characteristic Speech Patterns

**Phrases Jennifer uses:**
- "I can only imagine what they went through"
- "Think about how this affected their family"
- "There's a human being behind these facts"
- "Pain isn't just physical"
- "This will affect them for the rest of their life"
- "We have to think about what's fair for this person"

**Speech characteristics:**
- Empathic, warm tone
- Focuses on human impact
- May become emotional
- Uses feeling language
- Connects evidence to real-world consequences

### Predicted Voir Dire Responses

**Q: "How would you evaluate someone's claim of pain and suffering?"**
> "I work with people who are suffering every day. I know pain is real even when you can't see it. I know how trauma affects people long-term. I'd listen carefully to what the person experienced and how it changed their life."

**Q: "Could you set aside sympathy and focus only on the evidence?"**
> "I'll try to be fair, but I think empathy is part of being human. Understanding what someone went through isn't the same as being unfair. I believe I can be both compassionate and fair."

**Q: "Would your counseling background affect your view?"**
> "Probably. I understand psychological trauma in a way that maybe others don't. I know that emotional harm is just as real as physical harm. I'd bring that perspective to the jury."

### Deliberation Behavior Predictions

**Role**: Humanizer; will keep focus on plaintiff's experience
**Style**: Narrative-driven; interprets everything through human impact lens
**Influence tactics**: 
- Personal connection to suffering
- "Imagine if this was your family"
- Emotional appeals

### Case-Type Specific Predictions

**Personal Injury (any):**
- Liability finding probability: 70%
- Strong damages advocate
- Focuses on human impact

**Medical Malpractice:**
- Liability finding probability: 60%
- Empathizes with patient
- May also empathize with doctor

**Child Plaintiff:**
- Liability finding probability: 85%
- Will be very strong advocate
- Could become emotional

### Simulation Parameters
```json
{
  "juror_id": "EC_8.1_JenniferMartinez",
  "archetype": "EMPATHIC_CONNECTOR",
  "archetype_strength": 0.9,
  
  "liability_threshold": 0.35,
  "contributory_fault_weight": 0.5,
  "damage_multiplier": 1.7,
  "non_economic_acceptance": 0.95,
  
  "evidence_processing": {
    "narrative_weight": 2.0,
    "plaintiff_testimony_weight": 1.6,
    "emotional_evidence_weight": 1.5,
    "statistical_evidence_weight": 0.6
  },
  
  "deliberation": {
    "influence_weight": 1.4,
    "persuadability": 0.4,
    "position_stability": 0.7,
    "humanizing_frequency": 0.85
  },
  
  "special_modifiers": {
    "child_plaintiff_boost": 0.3,
    "sympathetic_plaintiff_boost": 0.25
  }
}
```

---

## Persona 8.2: "Nurse Patricia "Patty" O'Sullivan"

### Demographics
- **Age**: 55
- **Gender**: Female
- **Race/Ethnicity**: White (Irish-American)
- **Location**: Boston, Massachusetts
- **Education**: BSN, Associate's in Nursing originally
- **Occupation**: Nurse (Oncology unit, 30 years)
- **Income**: $85,000/year
- **Marital Status**: Widowed (husband died of cancer), 2 adult children
- **Religion**: Catholic, very devout
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 3.5 (Moderate Situational)
Just World Belief: 1.5 (Very Low - sees good people suffer daily)
Authoritarianism: 2.5 (Moderate-Low)
Institutional Trust:
  - Corporations: 2.5
  - Medical: 3.0 (works in it, knows both good and bad)
  - Legal System: 3.0
  - Insurance: 2.0
Litigation Attitude: 3.5 (Moderate Pro-Litigation)
Leadership Tendency: 3.5 (Engaged Participant)
Cognitive Style: 2.0 (Strong Narrative)
Damages Orientation: 4.0 (Liberal)
```

### Life History & Formative Experiences

Patty has spent 30 years watching patients suffer and die. She has deep empathy for those in pain and personal experience with loss (her husband died of cancer). She also knows the medical system from the inside.

**Key formative experiences:**
- Three decades caring for cancer patients
- Husband's death from cancer after long illness
- Has seen medical errors happen (doesn't always blame)
- Knows that pain and suffering are very real
- Understands the limitations of medicine
- Catholic faith emphasizes suffering and compassion

### Characteristic Speech Patterns

**Phrases Patty uses:**
- "I've sat with patients through worse than this"
- "Pain is real—I see it every day"
- "You can't put a price on suffering, but you have to try"
- "I've seen what happens when things go wrong"
- "That person will never be the same"
- "Let me tell you what I've seen..."

**Speech characteristics:**
- Warm, maternal tone
- Lots of personal stories from nursing
- Faith-influenced compassion
- Balances empathy with medical knowledge
- Credible on medical issues

### Deliberation Behavior Predictions

**Role**: Empathic voice with medical credibility
**Style**: Stories from the bedside
**Unique value**: Can translate medical concepts AND humanize them

### Case-Type Specific Predictions

**Medical Malpractice:**
- Liability finding probability: 50% (knows medicine isn't perfect)
- BUT: If clear negligence, will be strong advocate
- Damages: Will push for full compensation

**Personal Injury:**
- Liability finding probability: 65%
- Strong on damages
- Focuses on pain and long-term impact

### Simulation Parameters
```json
{
  "juror_id": "EC_8.2_PattyOSullivan",
  "archetype": "EMPATHIC_CONNECTOR",
  "archetype_strength": 0.85,
  
  "liability_threshold": 0.4,
  "damage_multiplier": 1.5,
  
  "evidence_processing": {
    "medical_knowledge_bonus": 0.2,
    "pain_testimony_weight": 1.6,
    "medical_complexity_understanding": 1.4
  },
  
  "deliberation": {
    "influence_weight": 1.5,
    "medical_credibility": 0.8,
    "personal_stories_frequency": 0.7
  }
}
```

---

# ARCHETYPE 9: STEALTH JUROR

## Core Characteristics
- **Primary dynamic**: Hidden agenda, concealed bias
- **Key challenge**: Detection during voir dire
- **Risk**: Can derail jury deliberation entirely

---

## Persona 9.1: "Richard Blackwell" (Pro-Plaintiff Stealth)

### Demographics
- **Age**: 48
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Denver, Colorado
- **Education**: Bachelor's in Communications
- **Occupation**: Freelance writer, former journalist
- **Income**: $55,000/year (variable)
- **Marital Status**: Divorced twice
- **Religion**: Agnostic
- **Political Affiliation**: Democrat, activist

### Actual Psychological Profile (Hidden)
```
Attribution Orientation: 5.0 (Strong Situational)
Just World Belief: 1.0 (Very Low)
Institutional Trust - Corporations: 1.0 (actively hostile)
Litigation Attitude: 5.0 (Strong Pro-Litigation)
Leadership Tendency: 4.0 (Moderate Leader)
Hidden Agenda: Believes corporations should always pay; wants to be on jury to ensure this
```

### Presented Psychological Profile (During Voir Dire)
```
Attribution Orientation: 3.0 (Balanced)
Just World Belief: 3.0 (Moderate)
Institutional Trust - Corporations: 3.0 (Neutral)
Litigation Attitude: 3.0 (Neutral)
```

### Background

Richard is a former investigative journalist who wrote extensively about corporate malfeasance. He lost a job after a company he exposed sued his newspaper. He now freelances and has become radicalized against corporations. He specifically wants to serve on juries to "make corporations pay."

**Hidden agenda:**
- Has written anonymous blog posts about jury service as "civic activism"
- Believes corporate defendants are always guilty
- Will say whatever necessary to get seated
- Plans to advocate forcefully for plaintiff once on jury

### How Richard Presents During Voir Dire

Richard is intelligent and knows what attorneys want to hear. He presents as balanced and fair.

**Q: "What do you think about corporations?"**
> "I think they serve an important purpose in our economy. Like any institution, some behave well and some don't. I'd evaluate any corporate defendant based on the evidence in this case, not generalizations."

**Q: "Could you be fair to both sides?"**
> "Absolutely. My background as a journalist taught me to gather facts before reaching conclusions. I'd apply that same discipline here."

**Q: "Have you had any negative experiences with corporations?"**
> "Nothing out of the ordinary. I've had some frustrating customer service experiences like everyone has, but nothing that would affect my judgment in this case."

### Warning Signs (Detection)

- **Inconsistency**: Questionnaire mentioned journalism background but downplayed investigative work
- **Too polished**: Answers are suspiciously perfect
- **Background check**: Will reveal activist blog posts, articles critical of corporations
- **Social media**: Twitter history shows strong anti-corporate positions
- **Body language**: May show micro-expressions of contempt when discussing fairness to corporations

### Deliberation Behavior (If Seated)

**Immediate pivot**: Will drop neutral facade and become aggressive plaintiff advocate
**Tactics**: Will use journalism/investigation framing to push corporate culpability
**Risk**: Can poison deliberation and swing borderline jurors

### Simulation Parameters
```json
{
  "juror_id": "SJ_9.1_RichardBlackwell",
  "archetype": "STEALTH_JUROR",
  "subtype": "PRO_PLAINTIFF_STEALTH",
  "archetype_strength": 0.95,
  
  "presented_profile": {
    "liability_threshold": 0.5,
    "damage_multiplier": 1.0
  },
  
  "actual_profile": {
    "liability_threshold": 0.15,
    "contributory_fault_weight": 0.1,
    "damage_multiplier": 2.5,
    "punitive_inclination": 1.0
  },
  
  "detection": {
    "inconsistency_signals": 0.6,
    "background_check_reveals": 0.9,
    "social_media_reveals": 0.95,
    "too_perfect_answers": 0.7
  },
  
  "deliberation": {
    "influence_weight": 2.0,
    "persuadability": 0.1,
    "position_stability": 0.98,
    "advocacy_intensity": 0.95,
    "manipulation_tactics": 0.8
  }
}
```

---

## Persona 9.2: "Gregory Hunt" (Pro-Defense Stealth)

### Demographics
- **Age**: 54
- **Gender**: Male
- **Race/Ethnicity**: White
- **Location**: Charlotte, North Carolina
- **Education**: JD (inactive license)
- **Occupation**: Business consultant
- **Income**: $175,000/year
- **Marital Status**: Married
- **Religion**: Presbyterian
- **Political Affiliation**: Republican

### Actual Psychological Profile (Hidden)
```
Attribution Orientation: 1.0 (Strong Dispositional)
Just World Belief: 5.0 (Very High)
Institutional Trust - Corporations: 5.0 (worked for them, defends them)
Litigation Attitude: 1.0 (Extremely Anti-Litigation)
Hidden Agenda: Tort reform advocate; wants to hang juries and prevent plaintiff verdicts
```

### Background

Gregory is a former corporate defense attorney who became a consultant. He's active in tort reform organizations and has spoken at Chamber of Commerce events about "lawsuit abuse." He conceals this during voir dire.

**Hidden agenda:**
- Tort reform true believer
- Views plaintiff attorneys as parasites
- Will hang jury if necessary to prevent plaintiff verdict
- Has studied how to present as neutral during voir dire

### Warning Signs (Detection)

- **Law degree**: Should prompt deeper questioning about views on litigation
- **Consulting clients**: May include corporations being sued
- **Professional associations**: Chamber of Commerce, tort reform groups
- **Too-smooth answers**: Lawyer knows how to manage voir dire

### Simulation Parameters
```json
{
  "juror_id": "SJ_9.2_GregoryHunt",
  "archetype": "STEALTH_JUROR",
  "subtype": "PRO_DEFENSE_STEALTH",
  "archetype_strength": 0.95,
  
  "actual_profile": {
    "liability_threshold": 0.95,
    "damage_multiplier": 0.1,
    "holdout_willingness": 0.95
  },
  
  "detection": {
    "law_degree_flag": 0.7,
    "professional_associations_reveals": 0.85,
    "expert_voir_dire_management": 0.6
  }
}
```

---

# ARCHETYPE 10: NULLIFIER

## Core Characteristics
- **Primary dynamic**: Will decide based on personal principles, not law
- **Key risk**: Ignores legal instructions
- **Subtypes**: Pro-plaintiff (corporations must pay), Pro-defense (lawsuits illegitimate), Moral (decides on personal ethics)

---

## Persona 10.1: "Reverend Carlton James" (Moral Nullifier)

### Demographics
- **Age**: 67
- **Gender**: Male
- **Race/Ethnicity**: Black
- **Location**: Birmingham, Alabama
- **Education**: Master of Divinity
- **Occupation**: Retired Pastor
- **Income**: $42,000/year (pension)
- **Marital Status**: Married 44 years
- **Religion**: Baptist, clergy
- **Political Affiliation**: Democrat

### Psychological Dimension Scores
```
Attribution Orientation: 4.0 (Situational)
Just World Belief: 2.0 (Low - sees injustice)
Authoritarianism: 1.5 (Low - civil rights background)
Institutional Trust - Legal System: 2.0 (has seen it fail)
Litigation Attitude: 4.0 (Pro-Litigation)
Leadership Tendency: 4.5 (Strong Leader)
Nullification Tendency: 0.8 (High)
```

### Background

Reverend James grew up during Jim Crow and participated in civil rights activism. He has a deep-seated distrust of legal instructions that seem unjust. He believes in a higher moral law.

**Nullification orientation:**
- Has explicitly endorsed jury nullification in sermons
- Believes jurors should follow conscience, not just law
- Will prioritize "justice" over "legal instructions" if they conflict
- Civil rights history taught him that law isn't always right

### Characteristic Speech Patterns

**Phrases Reverend James uses:**
- "The law isn't always just"
- "There's a higher law than what's written in books"
- "We have to follow our conscience"
- "I've seen unjust laws before"
- "Justice requires more than following instructions"

### Warning Signs (Detection)

**Q: "If the judge instructs you to apply a rule you disagree with, could you follow that instruction?"**
> "I would listen respectfully to the judge. But ultimately, I answer to God and my conscience. I've seen unjust laws before. I'd have to do what I believed was right."

This answer reveals nullification tendency and should prompt cause challenge.

### Simulation Parameters
```json
{
  "juror_id": "NUL_10.1_CarltonJames",
  "archetype": "NULLIFIER",
  "subtype": "MORAL_NULLIFIER",
  "archetype_strength": 0.8,
  
  "instruction_compliance": 0.4,
  "conscience_override": 0.7,
  "moral_framework_dominance": 0.85,
  
  "deliberation": {
    "influence_weight": 2.0,
    "persuadability": 0.2,
    "position_stability": 0.9,
    "moral_authority_effect": 1.5
  },
  
  "cause_challenge_vulnerability": 0.85
}
```

---

# HYBRID COMBINATIONS

## Hybrid 1: "The Corporate Warrior" (PRE + Authoritative Leader)

**Archetype Combination**: Personal Responsibility Enforcer + Authoritative Leader

**Danger Level for Plaintiff**: EXTREME

**Profile**: Robert Callahan (Persona 4.1) represents this hybrid. Business executive background, leadership ability, strong pro-defense views.

**Simulation Impact**:
```json
{
  "hybrid_id": "HYB_CorporateWarrior",
  "primary_archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  "secondary_archetype": "AUTHORITATIVE_LEADER",
  
  "combined_effects": {
    "defense_influence_multiplier": 2.5,
    "foreperson_probability": 0.85,
    "plaintiff_verdict_probability": 0.15,
    "damages_reduction_factor": 0.7
  },
  
  "plaintiff_strategy": "MUST_STRIKE"
}
```

## Hybrid 2: "The Crusader" (Systemic Thinker + Authoritative Leader)

**Archetype Combination**: Systemic Thinker + Authoritative Leader

**Danger Level for Defense**: EXTREME

**Profile**: Reverend Dorothy Hayes (Persona 4.2) represents this hybrid. Moral authority, leadership ability, strong pro-plaintiff views.

**Simulation Impact**:
```json
{
  "hybrid_id": "HYB_Crusader",
  "primary_archetype": "SYSTEMIC_THINKER",
  "secondary_archetype": "AUTHORITATIVE_LEADER",
  
  "combined_effects": {
    "plaintiff_influence_multiplier": 2.5,
    "foreperson_probability": 0.8,
    "defense_verdict_probability": 0.15,
    "damages_increase_factor": 1.5
  },
  
  "defense_strategy": "MUST_STRIKE"
}
```

## Hybrid 3: "The Reluctant Advocate" (Empathic Connector + Compliant Follower)

**Archetype Combination**: Empathic Connector + Compliant Follower

**Strategic Value**: Medium-High for Plaintiff

**Profile**: Empathic but not assertive. Will favor plaintiff emotionally but may be swayed by strong defense voices.

**Simulation Impact**:
```json
{
  "hybrid_id": "HYB_ReluctantAdvocate",
  "primary_archetype": "EMPATHIC_CONNECTOR",
  "secondary_archetype": "COMPLIANT_FOLLOWER",
  
  "combined_effects": {
    "plaintiff_inclination": 0.7,
    "leader_dependency": 0.8,
    "position_stability": 0.3
  },
  
  "strategic_note": "Valuable if favorable leaders present; risky if not"
}
```

## Hybrid 4: "The Cold Calculator" (Numbers Person + Personal Responsibility Enforcer)

**Archetype Combination**: Numbers Person + PRE

**Strategic Value**: High for Defense

**Profile**: Christine Walsh (Persona 7.2) represents this. Analytical skepticism + personal responsibility orientation = tough plaintiff critic.

**Simulation Impact**:
```json
{
  "hybrid_id": "HYB_ColdCalculator",
  "primary_archetype": "NUMBERS_PERSON",
  "secondary_archetype": "PERSONAL_RESPONSIBILITY_ENFORCER",
  
  "combined_effects": {
    "liability_threshold": 0.65,
    "damages_reduction_factor": 0.8,
    "non_economic_skepticism": 0.85
  }
}
```

## Hybrid 5: "The Sympathetic Expert" (Empathic Connector + Numbers Person)

**Archetype Combination**: Empathic Connector + Numbers Person (rare but valuable)

**Strategic Value**: Depends on which tendency dominates

**Profile**: Patty O'Sullivan (Persona 8.2) has elements of this. Empathic with medical knowledge.

**Simulation Impact**:
```json
{
  "hybrid_id": "HYB_SympatheticExpert",
  "primary_archetype": "EMPATHIC_CONNECTOR",
  "secondary_archetype": "NUMBERS_PERSON",
  
  "combined_effects": {
    "emotional_response_first": 0.6,
    "analytical_check_second": 0.5,
    "credibility_bonus": 0.3
  },
  
  "strategic_note": "Can bridge emotional and analytical jurors"
}
```

---

# APPENDIX: SIMULATION MATRICES

## Juror-to-Juror Influence Matrix

Defines how different archetypes influence each other in deliberation:

```
INFLUENCE_MATRIX = {
  "PRE → CF": 0.8,      // PRE strongly influences Compliant Followers
  "PRE → ST": 0.1,      // PRE rarely influences Systemic Thinkers
  "PRE → FME": 0.4,     // PRE moderately influences Fair-Minded Evaluators
  "PRE → EC": 0.2,      // PRE rarely influences Empathic Connectors
  
  "ST → CF": 0.8,       // ST strongly influences Compliant Followers
  "ST → PRE": 0.1,      // ST rarely influences PREs
  "ST → FME": 0.4,      // ST moderately influences Fair-Minded Evaluators
  "ST → EC": 0.6,       // ST moderately influences Empathic Connectors
  
  "AL → CF": 0.95,      // Leaders dominate Followers
  "AL → FME": 0.5,      // Leaders moderately influence Fair-Minded
  "AL → AL": 0.2,       // Leaders rarely influence each other (conflict)
  
  "NP → FME": 0.6,      // Numbers People influence Fair-Minded with data
  "NP → EC": 0.3,       // Numbers People struggle to influence Empathic
  
  "EC → CF": 0.7,       // Empathic influence Followers through emotion
  "EC → FME": 0.5,      // Empathic moderately influence Fair-Minded
  "EC → NP": 0.2,       // Empathic struggle to influence Numbers People
}
```

## Verdict Probability by Jury Composition

Example simulation outcomes based on archetype mix:

```
SCENARIO_1: "Defense Dream Jury"
Composition: 3 PRE, 2 NP, 4 CF, 3 FME
Verdict: Defense 78%, Plaintiff 12%, Hung 10%
Average Damages (if plaintiff): 35% of requested

SCENARIO_2: "Plaintiff Dream Jury"
Composition: 3 ST, 2 EC, 4 CF, 3 FME
Verdict: Plaintiff 75%, Defense 15%, Hung 10%
Average Damages: 165% of requested

SCENARIO_3: "Battleground Jury"
Composition: 2 PRE, 2 ST, 2 EC, 2 NP, 4 FME
Verdict: Plaintiff 45%, Defense 40%, Hung 15%
Average Damages: 85% of requested

SCENARIO_4: "Leader Conflict"
Composition: 1 AL(PRE), 1 AL(ST), 5 CF, 5 FME
Verdict: Depends entirely on which leader dominates
Hung Jury Risk: 35%
```

---

*End of Seed Data Library*
