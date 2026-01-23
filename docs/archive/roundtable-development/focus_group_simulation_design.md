# LLM-Based Focus Group Simulation: Design Pattern

## Overview

This document describes the data model and orchestration pattern for simulating jury focus group deliberations using LLM-powered personas. The goal is to create a realistic roundtable discussion where AI-embodied juror personas interpret case facts, react to arguments, and influence each other through conversation—just as real jurors do in deliberation.

---

## 1. The Core Mental Model

Think of this as a **moderated roundtable** with distinct personality types. Each persona:

1. **Receives the same case facts** as stimulus
2. **Interprets those facts through their unique lens** (values, biases, life experience)
3. **Listens to what others have said** before contributing
4. **Speaks with a frequency proportional to their social role** (leaders dominate, followers defer)

The simulation produces a conversation transcript that reveals:
- Which arguments resonate with which personas
- Where consensus forms or fractures
- What objections arise naturally
- How social dynamics influence opinion formation

---

## 2. Persona Data Structure

### 2.1 Core Persona Attributes

Each persona needs enough depth to generate consistent, believable responses:

```
Persona {
  id: string
  name: string                    // "Maria, the Skeptical Engineer"
  demographic_summary: string     // Age, occupation, family status, location
  
  // Psychological profile
  worldview: string               // Core beliefs about how the world works
  values: string[]                // What they prioritize (fairness, personal responsibility, etc.)
  biases: string[]                // Known cognitive tendencies
  emotional_triggers: string[]    // Topics that provoke strong reactions
  
  // Deliberation behavior
  leadership_level: enum          // LEADER | INFLUENCER | FOLLOWER | PASSIVE
  communication_style: string     // "Direct and analytical" vs "Empathetic and story-driven"
  persuasion_susceptibility: string  // What kinds of arguments move them
  
  // Case-relevant signals
  relevant_life_experiences: string[] // Experiences that color their interpretation
  likely_sympathies: string       // Who they'll naturally identify with
  likely_concerns: string         // What they'll worry about
}
```

### 2.2 Leadership Levels Explained

| Level | Description | Speaking Behavior |
|-------|-------------|-------------------|
| **LEADER** | Dominates discussion, sets tone, others look to them | Speaks first and often. Responds to nearly every statement. Attempts to build consensus. |
| **INFLUENCER** | Strong opinions, respected but doesn't dominate | Speaks regularly. Engages with 60-70% of discussion points. May challenge leader. |
| **FOLLOWER** | Has opinions but waits for social cues | Speaks when addressed or when strongly moved. Agrees/disagrees with leaders. |
| **PASSIVE** | Rarely contributes, internal processing | Only speaks when directly called on or when topic hits personal experience. Very brief responses. |

### 2.3 Persona Prompt Template

Each persona needs a system prompt that establishes their identity:

```
You are {name}, participating in a jury deliberation.

ABOUT YOU:
{demographic_summary}

YOUR WORLDVIEW:
{worldview}

WHAT YOU VALUE:
{values as prose}

YOUR TENDENCIES:
{biases and communication_style}

RELEVANT LIFE EXPERIENCE:
{relevant_life_experiences}

HOW YOU PARTICIPATE:
You are a {leadership_level} in group discussions. {behavioral guidance based on level}

YOUR TASK:
Based on the case facts presented and what other jurors have said, share your perspective. 
Stay in character. Your response should reflect your values, experiences, and natural speaking style.
```

---

## 3. Case Facts Presentation

### 3.1 Fact Structure

Case facts should be structured for clear interpretation:

```
CaseContext {
  case_summary: string            // Brief neutral summary
  
  // Plaintiff's presentation
  plaintiff_narrative: string     // Their story
  plaintiff_arguments: string[]   // Key points they want jury to accept
  plaintiff_evidence: Evidence[]  // Supporting materials
  
  // Defense presentation
  defense_narrative: string
  defense_arguments: string[]
  defense_evidence: Evidence[]
  
  // Contested issues
  disputed_facts: string[]        // Where stories conflict
  legal_questions: string[]       // What jury must decide
}

Evidence {
  description: string
  source: string
  emotional_weight: enum          // HIGH | MEDIUM | LOW
  relevance_to_personas: string   // Why this might matter to certain types
}
```

### 3.2 Fact Presentation Prompt

```
THE CASE BEFORE YOU:
{case_summary}

WHAT THE PLAINTIFF CLAIMS:
{plaintiff_narrative}

Key arguments:
{plaintiff_arguments}

WHAT THE DEFENSE CLAIMS:
{defense_narrative}

Key arguments:
{defense_arguments}

THE KEY QUESTIONS YOU MUST DECIDE:
{legal_questions}
```

---

## 4. Conversation Orchestration

### 4.1 The Conversation Flow

The simulation is **argument-centric**. For each argument being tested, a conversation unfolds:

```
Argument Simulation Flow:

1. ARGUMENT PRESENTATION
   - Present the specific argument/evidence to the group
   - Frame the question: "What do you think about [this claim]?"

2. INITIAL REACTIONS (ensure everyone speaks once)
   - Leaders speak first, setting initial framing
   - Influencers respond with their take
   - Followers and Passives give brief initial reactions
   - Goal: Every persona on record before deeper discussion

3. DYNAMIC DELIBERATION
   - Turn-taking based on leadership weights + conversation triggers
   - Each speaker responds to accumulated discussion
   - Natural back-and-forth emerges (leader challenges, influencer counters, etc.)
   - Continues until:
     a) Convergence detected (no new points being raised)
     b) Leaders hit max (5 statements)
     c) Conversation naturally winds down

4. CAPTURE FINAL POSITIONS
   - Extract where each persona landed on this argument
   - Note: Not a separate "round" - derived from their last substantive statement
```

**Key Insight**: This isn't a formal debate with rigid rounds. It's a conversation that breathes—sometimes quick back-and-forth between two personas, sometimes a leader monologue that others briefly react to. The orchestrator's job is to keep it natural while ensuring minimum participation.

### 4.2 Turn-Taking Logic

**Hard Constraints (per argument being tested):**
- Every persona speaks **at least once**
- No persona speaks **more than 5 times**
- Simulation ends when all personas have spoken and either:
  - Natural convergence is detected, OR
  - Leaders have hit their max (5), OR
  - No new substantive points are being raised

```
TurnManager {
  personas: Persona[]
  conversation_history: Statement[]
  speak_counts: Map<persona_id, int>  // Track per-argument
  
  can_speak(persona) -> bool {
    return speak_counts[persona.id] < 5
  }
  
  must_still_speak() -> Persona[] {
    return personas.filter(p => speak_counts[p.id] == 0)
  }
  
  determine_next_speaker() -> Persona | null {
    // Priority 1: Anyone who hasn't spoken yet (ensure minimum 1)
    unspeaking = must_still_speak()
    if (unspeaking.length > 0):
      return select_by_leadership(unspeaking)  // Leaders first among unspeaking
    
    // Priority 2: Natural conversation flow based on leadership
    eligible = personas.filter(p => can_speak(p))
    if (eligible.length == 0):
      return null  // Simulation complete
    
    // Weight selection by leadership level and conversation triggers
    return weighted_select(eligible, weights={
      LEADER: 0.40,      // Leaders speak most often
      INFLUENCER: 0.30,  // Influencers speak regularly  
      FOLLOWER: 0.20,    // Followers chime in sometimes
      PASSIVE: 0.10      // Passives rarely volunteer
    })
  }
  
  should_continue() -> bool {
    // Must continue if anyone hasn't spoken
    if (must_still_speak().length > 0):
      return true
    
    // Can continue if leaders haven't maxed out and conversation has momentum
    leaders = personas.filter(p => p.leadership_level == LEADER)
    leaders_maxed = leaders.every(l => speak_counts[l.id] >= 5)
    
    if (leaders_maxed):
      return false
      
    // Check for convergence or repetition
    return !detect_stagnation(conversation_history)
  }
}
```

### 4.3 Context Accumulation

Each persona's turn receives:

```
PersonaTurnContext {
  case_facts: CaseContext                    // Always included
  full_conversation: Statement[]             // Everything said so far
  last_speaker_statement: Statement          // Specifically highlighted
  addressed_to_me: Statement[] | null        // If anyone mentioned them
  
  // Prompt assembly:
  "Here's what has been discussed so far:
   {conversation formatted as transcript}
   
   {last_speaker.name} just said:
   '{last_speaker_statement.content}'
   
   {if addressed_to_me}
   Note: {speaker} directed a comment at you: '{content}'
   {/if}
   
   As {persona.name}, respond to the discussion."
}
```

### 4.4 Response Length Guidance

Leadership level should influence response length:

| Level | Typical Response | Guidance in Prompt |
|-------|------------------|-------------------|
| LEADER | 3-5 sentences, may ask questions of others | "Share your view fully. You often ask others what they think." |
| INFLUENCER | 2-4 sentences, takes clear positions | "State your position clearly. You're not shy about disagreeing." |
| FOLLOWER | 1-2 sentences, often references others | "Keep it brief. You might reference what someone else said." |
| PASSIVE | 1 sentence, very guarded | "A short response. You don't say much unless it really matters." |

---

## 5. Statement Data Model

### 5.1 Statement Structure

```
Statement {
  id: string
  sequence_number: int            // Order in conversation (1, 2, 3...)
  persona_id: string
  persona_name: string
  content: string
  timestamp: datetime             // When generated (for logging/debugging)
  
  // Analysis (populated post-generation)
  sentiment: enum               // PLAINTIFF_LEANING | DEFENSE_LEANING | NEUTRAL | CONFLICTED
  key_points: string[]          // Extracted arguments made
  addressed_to: string[] | null // Other persona names mentioned or responded to
  emotional_intensity: float    // 0-1 scale
  agreement_signals: string[]   // Who they agreed with
  disagreement_signals: string[] // Who they pushed back on
}
```

### 5.2 Conversation Transcript Format

For feeding back into subsequent prompts:

```
---
ARGUMENT BEING DISCUSSED:
"The company had documented safety procedures that the plaintiff failed to follow."

DISCUSSION:

ROBERT (Retired Military, Leader):
"Based on what we've heard, the company clearly had processes in place. The question 
is whether the plaintiff followed them. In my experience, when people don't follow 
established procedures, accidents happen. What do others think?"

MARIA (Engineer, Influencer):
"I'm not so sure. The procedures might have existed on paper, but were they realistic 
to follow in practice? I've seen plenty of workplace policies that look good but 
aren't actually workable."

JANET (Teacher, Follower):
"Robert makes a good point about procedures. But Maria's right too—I wonder if anyone 
actually trained the plaintiff properly."

DEREK (Retail Worker, Passive):
"Hard to say yet."

ROBERT (Retired Military, Leader):
"Janet raises a good point about training. But at some point, you have to take 
responsibility. The procedures were there. The training was offered. What more 
should the company have done?"

MARIA (Engineer, Influencer):
"Offered? Or required? There's a difference. And were they given time to actually 
complete it, or was it one of those 'do this on your own time' situations?"

...
---
```

Note: The transcript is a simple speaker-attributed format. Leadership levels are included in the transcript fed to personas so they understand the social dynamics at play.

---

## 6. LLM Orchestration Pattern

### 6.1 Single-Persona Call Structure

Each persona response is a separate LLM call:

```
LLM Call Structure:
{
  system: "{persona_system_prompt}",
  
  user: "
    CASE FACTS:
    {case_context}
    
    DISCUSSION SO FAR:
    {formatted_conversation_transcript}
    
    The last speaker was {name}. They said:
    '{statement}'
    
    Now it's your turn. As {persona_name}, share your thoughts on what's been 
    discussed. {length_guidance_for_leadership_level}
  "
}
```

### 6.2 Orchestration Pseudocode

```
function simulate_argument(personas, case_context, argument):
  conversation = []
  speak_counts = {p.id: 0 for p in personas}
  
  # Phase 1: Ensure every persona gives initial reaction
  # Order by leadership (leaders first, passives last)
  ordered = sort_by_leadership(personas)
  
  for persona in ordered:
    context = build_context(case_context, argument, conversation, persona)
    response = call_llm_as_persona(persona, context)
    conversation.append(Statement(persona, response))
    speak_counts[persona.id] += 1
  
  # Phase 2: Dynamic deliberation until natural conclusion
  while should_continue(personas, speak_counts, conversation):
    next_speaker = determine_next_speaker(personas, speak_counts, conversation)
    if next_speaker is None:
      break
      
    context = build_context(case_context, argument, conversation, next_speaker)
    response = call_llm_as_persona(next_speaker, context)
    conversation.append(Statement(next_speaker, response))
    speak_counts[next_speaker.id] += 1
    
    # Early exit if conversation is going in circles
    if detect_repetition(conversation, window=4):
      break
  
  return conversation


function run_focus_group(personas, case_context, arguments_to_test):
  """
  Run a full focus group session testing multiple arguments.
  Each argument gets its own conversation simulation.
  """
  results = {}
  
  for argument in arguments_to_test:
    conversation = simulate_argument(personas, case_context, argument)
    analysis = analyze_conversation(conversation, argument)
    results[argument.id] = {
      'conversation': conversation,
      'analysis': analysis
    }
  
  # Generate cross-argument synthesis
  synthesis = synthesize_results(results, personas)
  
  return FocusGroupReport(results, synthesis)
```

---

## 7. Output Analysis

### 7.1 Post-Simulation Analysis

After the simulation runs, analyze the transcript:

```
FocusGroupReport {
  verdict_prediction: {
    plaintiff_votes: int,
    defense_votes: int,
    undecided: int,
    confidence: float
  }
  
  argument_effectiveness: {
    argument: string,
    resonated_with: Persona[],
    failed_with: Persona[],
    effectiveness_score: float
  }[]
  
  identified_weaknesses: {
    issue: string,
    raised_by: Persona,
    severity: enum,
    suggested_response: string
  }[]
  
  consensus_points: string[]      // Where agreement formed
  fracture_points: string[]       // Where disagreement persists
  
  persona_journey: {
    persona: Persona,
    starting_position: string,
    ending_position: string,
    key_moments: Statement[]      // Statements where they shifted
  }[]
}
```

### 7.2 Visualization Outputs

- **Sentiment Timeline**: Position of each persona over rounds
- **Influence Map**: Who influenced whom (based on addressed_to and position shifts)
- **Argument Heat Map**: Which arguments got traction with which personas

---

## 8. Special Scenarios

### 8.1 Drawing Out Passive Personas

Since every persona must speak at least once, passives will always contribute in the initial reaction phase. For their initial (and possibly only) statement, the prompt should acknowledge their reticence:

```
// For PASSIVE personas on their first turn:
prompt += "
  You've been listening to the discussion. You don't usually speak up much, 
  but share your honest reaction—even if it's brief.
"

// If a PASSIVE speaks again (rare), it should feel motivated:
prompt += "
  Something in the recent discussion struck a chord with you. 
  What made you want to add to what you said earlier?
"
```

### 8.2 Argument A/B Testing

For comparing different framings of the same argument:

```
function compare_argument_framings(personas, case_context, framing_a, framing_b):
  # Run identical panel against both framings
  result_a = simulate_argument(personas, case_context, framing_a)
  result_b = simulate_argument(personas, case_context, framing_b)
  
  comparison = {
    'framing_a': extract_positions(result_a),
    'framing_b': extract_positions(result_b),
    'shifts': identify_position_changes(result_a, result_b),
    'recommendation': determine_stronger_framing(result_a, result_b)
  }
  
  return comparison
```

### 8.3 Full Deliberation Mode (Future)

For simulating complete jury deliberation (beyond individual argument testing):

```
function full_deliberation(personas, case_context):
  """
  Longer-form simulation where personas discuss the entire case,
  not just individual arguments. Uses same mechanics but with
  broader scope and more total statements allowed.
  """
  # Present full case (plaintiff + defense narratives)
  # Run extended conversation with higher max (e.g., 10 statements per persona)
  # Explicitly prompt for verdict discussion at the end
  # Track position evolution across the full deliberation
```

This is a future enhancement once argument-level simulation is working well.

---

## 9. Key Design Decisions

### 9.1 Why Separate LLM Calls Per Persona?

- **Consistency**: Each persona maintains their own "voice" without bleed-through
- **Controllability**: Can adjust temperature/parameters per persona type
- **Debuggability**: Easy to trace which persona said what
- **Parallelization**: Initial reactions could potentially run concurrently

### 9.2 Why Accumulate Full Context?

Real deliberation involves memory. Jurors reference earlier statements, build on others' points, and shift positions based on accumulated discussion. Each persona needs the full transcript to behave realistically.

### 9.3 Why Leadership-Based Speaking Probability?

Research shows that jury deliberation is heavily influenced by high-status participants. Leaders set anchors, frame the discussion, and disproportionately influence outcomes. Simulating this dynamic produces more realistic results than equal-time rotation.

### 9.4 Why Argument-Centric (Not Full Deliberation)?

Testing individual arguments provides:
- **Actionable feedback**: Know exactly which argument resonated or failed
- **Faster iteration**: Run many argument tests quickly
- **Cleaner signal**: Easier to attribute reactions to specific content
- **Practical utility**: Attorneys want to know "will this argument work?" not just "what will the jury think generally?"

Full deliberation can be a future enhancement for final pre-trial simulation.

---

## 10. Implementation Notes for Engineering

### 10.1 Scaling Considerations

- 12 jurors × 5 rounds × 1 statement each = 60+ LLM calls per simulation
- Context windows grow with each round (may need summarization for long deliberations)
- Consider caching persona system prompts

### 10.2 Prompt Engineering Priorities

1. Persona consistency (they should "sound like themselves" across rounds)
2. Appropriate response length (don't let leaders ramble, don't force passives to over-speak)
3. Natural conversation flow (responses should feel like reactions, not isolated statements)
4. Avoiding "AI-isms" (the personas should sound like real people, not helpful assistants)

### 10.3 Testing Strategy

- Unit test persona consistency (same persona, same prompt, similar outputs)
- Test leadership dynamics (leaders should demonstrably speak more)
- Test influence patterns (do followers shift toward leader positions?)
- Regression test on known case scenarios

---

## 11. Open Questions

1. **Stagnation detection**: How do we reliably detect when a conversation is "going in circles"? Semantic similarity of recent statements? Explicit "I agree with what's been said" detection?

2. **Cross-argument memory**: When testing multiple arguments in sequence, should personas "remember" their positions from prior arguments? Or does each argument start fresh?

3. **Persona consistency across arguments**: If Maria was skeptical on Argument 1, should that skepticism carry into Argument 2? Or should each argument be evaluated independently?

4. **Temperature tuning by leadership level**: Should Leaders have higher temperature (more varied, confident responses) or lower (more consistent, predictable)? Initial hypothesis: Leaders slightly higher, Passives lower.

5. **Multi-panel efficiency**: When running the same arguments against different jury compositions, what can be parallelized vs. must be sequential?

---

## 12. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Statements per persona | Min 1, Max 5 | Ensures all voices heard without runaway conversations |
| Facilitator/Foreperson | Not included (for now) | Keep it simpler; let dynamics emerge naturally |
| Persona relationships | Emergent, not explicit | More realistic; avoids over-engineering social dynamics |
| Round structure | Dynamic, not fixed | Conversation should breathe naturally, not hit arbitrary round counts |
