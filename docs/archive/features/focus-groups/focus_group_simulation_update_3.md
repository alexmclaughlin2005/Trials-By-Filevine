# Focus Group Simulation: Design Update #3

**Date**: January 26, 2026  
**Relates to**: `focus_group_simulation_design.md`, Updates #1 and #2  
**Problem Observed**: Test output showed repetitive content, indistinguishable voices, and failure to exit stagnant conversation

---

## Problem Summary

A test simulation produced 19 statements that:
- Recycled the same 5-6 facts repeatedly (e.g., "fifteen-foot throw" appeared 6 times)
- Had personas who all sounded alike (same cadence, same sentence structures)
- Failed to detect stagnation—should have ended around statement 10-12
- Lacked response length variation (every statement was a long paragraph)
- Ignored dissent rather than engaging with it directly

This update addresses two root causes: **weak persona differentiation** and **insufficient novelty/stagnation controls**.

---

## Part 1: Stronger Persona Differentiation

### 1.1 Voice Attributes in Persona Definition

Add explicit speech pattern guidance to each persona:

```
Persona {
  // ... existing fields ...
  
  // NEW: Voice differentiation
  vocabulary_level: enum        // PLAIN | EDUCATED | TECHNICAL | FOLKSY
  sentence_style: enum          // SHORT_PUNCHY | MEASURED | VERBOSE | FRAGMENTED
  speech_patterns: string[]     // Characteristic phrases, verbal tics
  response_tendency: enum       // BRIEF | MODERATE | ELABORATE
  engagement_style: enum        // DIRECT_CHALLENGE | BUILDS_ON_OTHERS | ASKS_QUESTIONS | DEFLECTS
}
```

**Example Persona Differentiation:**

| Persona | Vocabulary | Sentence Style | Patterns | Length | Engagement |
|---------|------------|----------------|----------|--------|------------|
| Union Boss Umberto | Plain | Short, punchy | "Look," "Let's be honest," "At the end of the day" | Moderate | Direct challenge |
| Dorothy (Retired Teacher) | Educated | Measured, complete thoughts | "What concerns me is," "I keep thinking about" | Elaborate | Builds on others |
| Marcus (Engineer) | Technical | Logical, structured | "When you think about," "The data shows" | Moderate | Asks questions |
| Albert (Retired Cop) | Plain | Short, declarative | "Here's the thing," "Plain and simple" | Brief | Direct statements |

### 1.2 Updated Persona System Prompt

The system prompt must enforce voice characteristics:

```
You are {name}, participating in a jury deliberation.

ABOUT YOU:
{demographic_summary}

YOUR WORLDVIEW:
{worldview}

HOW YOU TALK:
- You use {vocabulary_level} vocabulary
- Your sentences tend to be {sentence_style}
- You often say things like: {speech_patterns as examples}
- You typically give {response_tendency} responses
- When others speak, you tend to {engagement_style}

{if response_tendency == BRIEF}
Keep your response to 1-3 sentences. You don't ramble.
{/if}

{if response_tendency == MODERATE}
Keep your response to 3-5 sentences. Make your point and stop.
{/if}

{if response_tendency == ELABORATE}
You can take 4-7 sentences when you have something important to say.
{/if}

CRITICAL: Sound like yourself, not like a lawyer or a formal report. Use your natural speech patterns.
```

### 1.3 Voice Consistency Check

After generating a response, optionally run a quick validation:

```
function validate_voice(persona, response):
  checks = {
    'length_appropriate': check_length(response, persona.response_tendency),
    'uses_characteristic_phrases': check_patterns(response, persona.speech_patterns),
    'avoids_other_voices': check_no_crossover(response, other_personas)
  }
  
  if not checks['length_appropriate']:
    // Regenerate with stronger length guidance
    
  return checks
```

---

## Part 2: Repetition Reduction

### 2.1 The Novelty Requirement

Each statement must add something new. Enforce this in the prompt:

```
DISCUSSION SO FAR:
{transcript}

KEY POINTS ALREADY ESTABLISHED:
{extracted_key_points}

YOUR TASK:
Respond to the discussion as {persona_name}. 

IMPORTANT: The following points have already been made. Do NOT repeat them:
- {point_1}
- {point_2}
- {point_3}
...

You must either:
1. Add a NEW point or observation not yet raised
2. Directly challenge or question something a specific person said
3. Share a personal reaction or experience that adds new texture
4. Ask a question that moves the discussion forward

Do not restate points others have made, even in different words.
```

### 2.2 Key Point Extraction (Between Turns)

After each statement, extract and track key points to prevent repetition:

```
function extract_key_points(statement):
  // Use LLM to extract factual claims and arguments
  prompt = """
  Extract the key factual claims and arguments from this statement.
  Return as a bullet list of short phrases.
  
  Statement: {statement.content}
  """
  return llm_extract(prompt)

function update_established_points(conversation):
  all_points = []
  for statement in conversation:
    points = extract_key_points(statement)
    all_points.extend(points)
  
  // Deduplicate semantically similar points
  return deduplicate_semantic(all_points)
```

### 2.3 Strengthened Stagnation Detection

The current "2 semantically similar turns" rule isn't working. New approach:

```
function detect_stagnation(conversation, established_points):
  if len(conversation) < 4:
    return false
  
  recent = conversation[-3:]
  
  // Check 1: Are recent statements just restating established points?
  for statement in recent:
    new_points = extract_key_points(statement)
    novel_points = filter_novel(new_points, established_points)
    
    if len(novel_points) == 0:
      statement.is_repetitive = true
  
  // Stagnation = 2+ consecutive statements with no novel points
  repetitive_streak = count_trailing_repetitive(conversation)
  
  if repetitive_streak >= 2:
    return true
  
  // Check 2: Are people just agreeing without adding?
  agreement_phrases = ["you're right", "exactly", "I agree", "you nailed it", 
                       "you hit the nail", "that's what I was thinking"]
  
  agreement_count = 0
  for statement in recent:
    if contains_any(statement.content.lower(), agreement_phrases):
      if not has_substantive_addition(statement):
        agreement_count += 1
  
  if agreement_count >= 2:
    return true
    
  return false
```

### 2.4 Response Length Caps by Persona Type

Hard caps prevent runaway verbosity:

| Response Tendency | Hard Cap |
|-------------------|----------|
| BRIEF | 75 words |
| MODERATE | 150 words |
| ELABORATE | 250 words |

```
function enforce_length(response, persona):
  max_words = {
    BRIEF: 75,
    MODERATE: 150,
    ELABORATE: 250
  }[persona.response_tendency]
  
  if word_count(response) > max_words:
    // Regenerate with explicit cap
    return regenerate_with_cap(persona, context, max_words)
  
  return response
```

---

## Part 3: Engagement with Dissent

### 3.1 Dissent Detection

Track when someone takes a contrarian position:

```
function detect_dissent(statement, conversation):
  // Check if statement opposes the emerging consensus
  consensus_direction = assess_consensus(conversation)  // PLAINTIFF | DEFENSE | MIXED
  statement_direction = assess_position(statement)
  
  if statement_direction != consensus_direction and consensus_direction != MIXED:
    return {
      is_dissent: true,
      dissenter: statement.persona_name,
      dissent_points: extract_key_points(statement)
    }
  
  return { is_dissent: false }
```

### 3.2 Forced Engagement with Dissent

When dissent is detected, the next 1-2 speakers must engage with it directly:

```
function build_context_after_dissent(dissent_info, next_persona, conversation):
  context = standard_context(conversation)
  
  context += """
  
  NOTE: {dissent_info.dissenter} just raised a contrarian view. Their key points were:
  {dissent_info.dissent_points}
  
  You should directly engage with what {dissent_info.dissenter} said. Either:
  - Explain specifically why you disagree with their reasoning
  - Acknowledge a valid point they made before explaining your view
  - Ask them a clarifying question
  
  Do NOT ignore their argument and just restate your position.
  """
  
  return context
```

### 3.3 Direct Address Prompting

Encourage personas to use each other's names:

```
// Add to persona prompt:
When you respond, refer to other jurors by name when engaging with their points.
Instead of "someone said" or "one point was," say "{Name}, you mentioned..." or 
"I hear what {Name} is saying, but..."
```

---

## Part 4: Short Response Allowance

### 4.1 Allow Minimal Responses

Not every turn needs a full argument. Add response types:

```
ResponseType {
  FULL_ARGUMENT      // Makes substantive points (most responses)
  BRIEF_AGREEMENT    // "Marcus, that's exactly right." (1 sentence)
  BRIEF_DISAGREEMENT // "I don't buy that, Umberto." (1 sentence)  
  CLARIFYING_QUESTION // "Dorothy, what do you mean by...?" (1 sentence)
  PASS               // "I don't have much to add right now." (signals low relevance)
}
```

### 4.2 Prompt for Response Type Selection

Before generating content, determine response type:

```
function determine_response_type(persona, conversation, relevance):
  // Low relevance + already spoke = likely PASS or BRIEF
  if relevance < 0.4 and speak_count[persona.id] > 0:
    return weighted_select([PASS, BRIEF_AGREEMENT], [0.6, 0.4])
  
  // Follower responding to leader they agree with = likely BRIEF_AGREEMENT
  if persona.leadership_level == FOLLOWER:
    last_speaker = conversation[-1].persona
    if last_speaker.leadership_level == LEADER:
      if would_agree(persona, conversation[-1]):
        return weighted_select([BRIEF_AGREEMENT, FULL_ARGUMENT], [0.5, 0.5])
  
  // Most other cases = FULL_ARGUMENT
  return FULL_ARGUMENT
```

### 4.3 Brief Response Templates

For BRIEF_AGREEMENT and BRIEF_DISAGREEMENT, constrain the output:

```
// BRIEF_AGREEMENT prompt addition:
Respond in exactly ONE sentence. Simply acknowledge agreement with a specific person's point.
Example: "Dorothy, you're absolutely right about the training issue."
Example: "That's what I've been thinking too, Marcus."

// BRIEF_DISAGREEMENT prompt addition:
Respond in exactly ONE sentence. Express your disagreement with a specific point.
Example: "Umberto, I just don't see it that way."
Example: "I'm not convinced by that argument."
```

---

## Summary of Changes

| Problem | Solution |
|---------|----------|
| Everyone sounds the same | Add voice attributes (vocabulary, sentence style, speech patterns) to persona definition |
| All responses are long paragraphs | Add response_tendency with hard word caps; allow brief response types |
| Same facts repeated constantly | Extract and track key points; require novelty in each turn |
| Stagnation not detected | Strengthen detection: 2+ turns with no novel points = exit |
| Dissent gets ignored | Force next speakers to directly engage with contrarian points |
| No direct engagement | Prompt personas to use each other's names and address specific arguments |

---

## Expected Outcome

A 12-persona discussion on the same stimulus should now:
- End at 10-15 statements rather than 19+
- Have distinguishable voices (the retired cop sounds different from the retired teacher)
- Feature short interjections alongside fuller arguments
- Directly engage with dissenting views rather than ignoring them
- Not repeat the same facts more than 2-3 times total

---

## Implementation Priority

1. **Novelty requirement in prompt** — Fastest fix, biggest impact
2. **Response length caps** — Easy to implement, prevents rambling
3. **Voice attributes in persona definition** — Requires updating persona data model
4. **Strengthened stagnation detection** — Requires key point extraction pipeline
5. **Dissent engagement forcing** — Requires consensus/dissent detection logic
