# Juror Profile System - Engineering Handoff

## Overview

This package contains seed data and specifications for building a juror profiling and deliberation simulation system. The system is designed to:

1. **Profile jurors** during voir dire based on questionnaire responses and observable behavior
2. **Predict verdict tendencies** based on archetype classification
3. **Simulate deliberations** to forecast outcomes based on jury composition
4. **Guide attorney strategy** for strikes and cause challenges

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        JUROR PROFILER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   INPUT      │    │  CLASSIFIER  │    │   OUTPUT     │      │
│  │              │    │              │    │              │      │
│  │ • Voir Dire  │───▶│ • Dimension  │───▶│ • Archetype  │      │
│  │   Responses  │    │   Scoring    │    │ • Danger Lvl │      │
│  │ • Demograph. │    │ • Archetype  │    │ • Strike Rec │      │
│  │ • Observat.  │    │   Matching   │    │ • Questions  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DELIBERATION SIMULATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  JURY COMP   │    │  SIMULATION  │    │  PREDICTION  │      │
│  │              │    │              │    │              │      │
│  │ • 12 Jurors  │───▶│ • Evidence   │───▶│ • Verdict %  │      │
│  │ • Archetypes │    │   Processing │    │ • Damages $  │      │
│  │ • Leaders    │    │ • Influence  │    │ • Hung Risk  │      │
│  │ • Followers  │    │ • Voting     │    │ • Key Jurors │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. Dimension (Enum)

```typescript
enum Dimension {
  ATTRIBUTION_ORIENTATION = "attribution_orientation",     // 1=dispositional, 5=situational
  JUST_WORLD_BELIEF = "just_world_belief",                 // 1=low, 5=high
  AUTHORITARIANISM = "authoritarianism",                   // 1=low, 5=high
  INSTITUTIONAL_TRUST_CORP = "institutional_trust_corp",   // 1=low, 5=high
  INSTITUTIONAL_TRUST_MEDICAL = "institutional_trust_medical",
  INSTITUTIONAL_TRUST_LEGAL = "institutional_trust_legal",
  INSTITUTIONAL_TRUST_INSURANCE = "institutional_trust_insurance",
  LITIGATION_ATTITUDE = "litigation_attitude",             // 1=anti, 5=pro
  LEADERSHIP_TENDENCY = "leadership_tendency",             // 1=follower, 5=leader
  COGNITIVE_STYLE = "cognitive_style",                     // 1=narrative, 5=analytical
  DAMAGES_ORIENTATION = "damages_orientation"              // 1=conservative, 5=liberal
}
```

### 2. Archetype (Enum)

```typescript
enum Archetype {
  BOOTSTRAPPER = "bootstrapper",           // Personal Responsibility Enforcer
  CRUSADER = "crusader",                   // Systemic Thinker
  SCALE_BALANCER = "scale_balancer",       // Fair-Minded Evaluator
  CAPTAIN = "captain",                     // Authoritative Leader
  CHAMELEON = "chameleon",                 // Compliant Follower
  SCARRED = "scarred",                     // Wounded Veteran
  CALCULATOR = "calculator",               // Numbers Person
  HEART = "heart",                         // Empathic Connector
  TROJAN_HORSE = "trojan_horse",           // Stealth Juror
  MAVERICK = "maverick"                    // Nullifier
}
```

### 3. JurorPersona (Interface)

```typescript
interface JurorPersona {
  // Identity
  persona_id: string;                      // e.g., "BOOT_1.7_ImmigrantDreamIvan"
  nickname: string;                        // e.g., "Immigrant Dream Ivan"
  archetype: Archetype;
  archetype_strength: number;              // 0.0 - 1.0
  secondary_archetype?: Archetype;
  variant?: string;                        // e.g., "MILITARY_PROCEDURAL"
  
  // Demographics
  demographics: {
    age: number;
    gender: "male" | "female" | "non_binary";
    race_ethnicity: string;
    location_city: string;
    location_state: string;
    location_type: "urban" | "suburban" | "rural";
    education: string;
    occupation: string;
    income: number;
    marital_status: string;
    religion: string;
    political_affiliation: string;
  };
  
  // Psychological Profile
  dimensions: {
    attribution_orientation: number;       // 1.0 - 5.0
    just_world_belief: number;
    jwb_subtype?: "self" | "others" | "immanent";
    authoritarianism: number;
    institutional_trust: {
      corporations: number;
      medical: number;
      legal_system: number;
      insurance: number;
    };
    litigation_attitude: number;
    leadership_tendency: number;
    cognitive_style: number;
    damages_orientation: number;
  };
  
  // Behavioral Data
  characteristic_phrases: string[];        // 5-7 typical phrases
  life_experiences: string[];              // Key formative experiences
  
  // Simulation Parameters
  simulation: {
    liability_threshold: number;           // 0.0 - 1.0, evidence needed for liability
    contributory_fault_weight: number;     // multiplier for plaintiff fault
    damage_multiplier: number;             // multiplier on damages
    non_economic_skepticism: number;       // 0.0 - 1.0
    punitive_inclination: number;          // 0.0 - 1.0
    
    evidence_processing: {
      plaintiff_testimony_weight: number;
      defendant_testimony_weight: number;
      expert_plaintiff_weight: number;
      expert_defendant_weight: number;
      documentary_weight: number;
      emotional_evidence_weight: number;
    };
    
    deliberation: {
      influence_weight: number;            // How much they influence others
      persuadability: number;              // How easily persuaded
      position_stability: number;          // How firm in initial position
      speaking_share: number;              // % of deliberation time
      social_pressure_susceptibility: number;
      foreperson_probability: number;
    };
  };
  
  // Case-Specific Modifiers
  case_modifiers?: {
    [case_type: string]: {
      liability_modifier: number;          // Added to base threshold
      damages_modifier: number;            // Multiplied with base
      special_notes?: string;
    };
  };
  
  // Strategic Guidance
  strategy: {
    plaintiff_danger_level: number;        // 1-5, 5 = must strike
    defense_danger_level: number;          // 1-5, 5 = must strike
    cause_challenge_vulnerability: number; // 0.0 - 1.0
    recommended_voir_dire_questions: string[];
    cause_challenge_script?: string;
  };
}
```

### 4. CaseType (Enum)

```typescript
enum CaseType {
  AUTO_ACCIDENT = "auto_accident",
  TRUCKING_ACCIDENT = "trucking_accident",
  MEDICAL_MALPRACTICE = "medical_malpractice",
  PRODUCT_LIABILITY = "product_liability",
  PREMISES_LIABILITY = "premises_liability",
  WORKPLACE_INJURY = "workplace_injury",
  NURSING_HOME = "nursing_home",
  WRONGFUL_DEATH = "wrongful_death",
  EMPLOYMENT = "employment",
  CONSTRUCTION = "construction",
  PHARMACEUTICAL = "pharmaceutical",
  BIRTH_INJURY = "birth_injury",
  SEXUAL_ABUSE = "sexual_abuse",
  AUTOMOTIVE_DEFECT = "automotive_defect"
}
```

### 5. JurySimulation (Interface)

```typescript
interface JurySimulation {
  case_type: CaseType;
  plaintiff_type: "individual" | "class";
  defendant_type: "individual" | "small_business" | "corporation" | "government" | "medical";
  
  jurors: JurorInSimulation[];
  
  evidence_strength: {
    liability: number;                     // 0.0 - 1.0, objective strength
    damages_economic: number;              // Dollar amount claimed
    damages_non_economic: number;          // Dollar amount claimed
    punitive_basis: number;                // 0.0 - 1.0, strength of punitive case
  };
  
  run_simulation(): SimulationResult;
}

interface JurorInSimulation {
  seat_number: number;
  persona: JurorPersona;
  
  // Dynamic state during simulation
  current_liability_belief: number;
  current_damages_position: number;
  has_spoken: boolean;
  faction?: "plaintiff" | "defense" | "undecided";
}

interface SimulationResult {
  verdict: "plaintiff" | "defense" | "hung";
  verdict_probability: {
    plaintiff: number;
    defense: number;
    hung: number;
  };
  
  damages_if_plaintiff: {
    economic: number;
    non_economic: number;
    punitive: number;
    total: number;
  };
  
  key_jurors: {
    most_influential: string;              // persona_id
    likely_foreperson: string;
    swing_votes: string[];
    potential_holdouts: string[];
  };
  
  deliberation_summary: {
    rounds_to_verdict: number;
    faction_shifts: FactionShift[];
    critical_moments: string[];
  };
}
```

---

## File Structure for Implementation

```
/juror-profile-system
├── /data
│   ├── /personas
│   │   ├── bootstrappers.json           # All Bootstrapper personas
│   │   ├── crusaders.json               # All Crusader personas
│   │   ├── scale_balancers.json
│   │   ├── captains.json
│   │   ├── chameleons.json
│   │   ├── scarred.json
│   │   ├── calculators.json
│   │   ├── hearts.json
│   │   ├── trojan_horses.json
│   │   └── mavericks.json
│   │
│   ├── /case_types
│   │   ├── auto_accident.json           # Archetype reactions for case type
│   │   ├── medical_malpractice.json
│   │   ├── product_liability.json
│   │   └── ...
│   │
│   ├── /regions
│   │   ├── texas.json                   # Regional modifiers
│   │   ├── california.json
│   │   └── ...
│   │
│   ├── /voir_dire
│   │   ├── questions_by_dimension.json  # Questions that surface each dimension
│   │   ├── cause_challenge_scripts.json
│   │   └── rehabilitation_patterns.json
│   │
│   └── /deliberation
│       ├── influence_matrix.json        # Archetype-to-archetype influence
│       ├── faction_dynamics.json
│       └── sample_scripts.json
│
├── /schemas
│   ├── persona.schema.json
│   ├── case_type.schema.json
│   ├── simulation.schema.json
│   └── result.schema.json
│
├── /src
│   ├── /classifier
│   │   ├── dimension_scorer.ts          # Score dimensions from inputs
│   │   ├── archetype_matcher.ts         # Match to closest archetype
│   │   └── confidence_calculator.ts
│   │
│   ├── /simulator
│   │   ├── evidence_processor.ts        # How jurors process evidence
│   │   ├── deliberation_engine.ts       # Simulate deliberation rounds
│   │   ├── influence_calculator.ts      # Model juror-to-juror influence
│   │   └── verdict_predictor.ts
│   │
│   └── /strategy
│       ├── strike_recommender.ts        # Recommend peremptory strikes
│       ├── cause_challenge_generator.ts
│       └── question_suggester.ts
│
└── /docs
    ├── FRAMEWORK.md                     # Psychological framework explanation
    ├── ARCHETYPES.md                    # Detailed archetype descriptions
    ├── SIMULATION_MODEL.md              # How simulation works
    └── API.md                           # API documentation
```

---

## Key Algorithms

### 1. Archetype Classification

```python
def classify_juror(dimension_scores: Dict[str, float]) -> Tuple[Archetype, float]:
    """
    Match dimension scores to closest archetype.
    Returns archetype and confidence score.
    """
    
    # Archetype centroids (mean dimension scores for each archetype)
    centroids = load_archetype_centroids()
    
    # Calculate Euclidean distance to each centroid
    distances = {}
    for archetype, centroid in centroids.items():
        dist = euclidean_distance(dimension_scores, centroid)
        distances[archetype] = dist
    
    # Find closest archetype
    closest = min(distances, key=distances.get)
    
    # Calculate confidence (inverse of distance, normalized)
    confidence = 1 / (1 + distances[closest])
    
    # Check for hybrid (if second-closest is within threshold)
    sorted_archetypes = sorted(distances.items(), key=lambda x: x[1])
    if sorted_archetypes[1][1] - sorted_archetypes[0][1] < HYBRID_THRESHOLD:
        return (closest, sorted_archetypes[1][0]), confidence
    
    return closest, confidence
```

### 2. Deliberation Simulation

```python
def simulate_deliberation(jury: List[Juror], case: Case, max_rounds: int = 10) -> Verdict:
    """
    Simulate jury deliberation using influence model.
    """
    
    # Initialize juror positions based on evidence and archetype
    for juror in jury:
        juror.position = calculate_initial_position(juror, case)
    
    for round in range(max_rounds):
        # Determine speaking order (weighted by leadership)
        speakers = weighted_shuffle(jury, weight=lambda j: j.leadership_tendency)
        
        for speaker in speakers:
            argument = speaker.generate_argument()
            
            for listener in jury:
                if listener != speaker:
                    # Calculate influence
                    influence = calculate_influence(speaker, listener, argument)
                    
                    # Apply social pressure from majority
                    majority = get_majority_position(jury)
                    social_pressure = listener.social_susceptibility * majority_strength(jury)
                    
                    # Update listener position
                    listener.position = update_position(
                        listener.position,
                        influence,
                        social_pressure,
                        listener.position_stability
                    )
        
        # Check for unanimous verdict
        if is_unanimous(jury):
            return create_verdict(jury, round)
        
        # Check for hung jury conditions
        if is_deadlocked(jury, round):
            return HungJury(jury, round)
    
    return FinalVerdict(majority_position(jury), max_rounds)
```

### 3. Influence Calculation

```python
def calculate_influence(speaker: Juror, listener: Juror, argument: Argument) -> float:
    """
    Calculate how much speaker influences listener.
    """
    
    # Base influence from speaker's influence_weight
    base = speaker.influence_weight
    
    # Modify by listener's persuadability
    base *= listener.persuadability
    
    # Archetype-to-archetype modifier
    archetype_modifier = INFLUENCE_MATRIX[speaker.archetype][listener.archetype]
    base *= archetype_modifier
    
    # Argument type modifier (emotional vs logical)
    if argument.type == "emotional":
        if listener.cognitive_style < 3:  # Narrative processor
            base *= 1.3
        else:  # Analytical processor
            base *= 0.7
    elif argument.type == "logical":
        if listener.cognitive_style > 3:  # Analytical processor
            base *= 1.3
        else:
            base *= 0.8
    
    # Credibility factors (shared experience, expertise)
    if speaker.has_relevant_expertise(argument.topic):
        base *= 1.4
    
    return base
```

---

## API Endpoints (Suggested)

### Juror Profiling

```
POST /api/v1/profile/score
Body: { questionnaire_responses: {...}, demographics: {...}, observations: {...} }
Response: { dimensions: {...}, archetype: "bootstrapper", confidence: 0.85, ... }

GET /api/v1/profile/persona/{archetype}
Response: { personas: [...] }  // All personas for archetype

GET /api/v1/profile/persona/{persona_id}
Response: { persona: {...} }  // Full persona detail
```

### Simulation

```
POST /api/v1/simulate/deliberation
Body: { 
  jurors: [{ seat: 1, archetype: "bootstrapper", dimensions: {...} }, ...],
  case: { type: "medical_malpractice", evidence_strength: {...} }
}
Response: {
  verdict_probability: { plaintiff: 0.35, defense: 0.55, hung: 0.10 },
  expected_damages: { economic: 500000, non_economic: 750000, ... },
  key_jurors: {...}
}

POST /api/v1/simulate/strike-impact
Body: {
  current_jury: [...],
  strike_options: ["seat_3", "seat_7"],
  case: {...}
}
Response: {
  recommendations: [
    { strike: "seat_3", new_plaintiff_probability: 0.42 },
    { strike: "seat_7", new_plaintiff_probability: 0.38 }
  ]
}
```

### Strategy

```
GET /api/v1/strategy/questions?archetype=bootstrapper&goal=cause_challenge
Response: { questions: [...], scripts: [...] }

POST /api/v1/strategy/evaluate-jury
Body: { jurors: [...], case: {...}, side: "plaintiff" }
Response: {
  overall_rating: "unfavorable",
  danger_jurors: [...],
  swing_jurors: [...],
  recommendations: [...]
}
```

---

## Testing Strategy

### Unit Tests
- Dimension scoring from various input combinations
- Archetype classification accuracy
- Influence calculation edge cases

### Integration Tests
- End-to-end simulation runs
- API endpoint validation
- Data loading and persona matching

### Validation Tests
- Compare simulation predictions to historical verdict data (if available)
- Expert review of archetype classifications
- A/B testing of strategy recommendations

### Simulation Tests
- Run 1000+ simulations per jury composition to get stable probabilities
- Test edge cases (all same archetype, extreme splits, etc.)
- Validate that influence matrix produces expected dynamics

---

## Performance Considerations

- **Persona Matching**: Should be O(1) lookup after initial classification
- **Simulation**: Single run should complete in <100ms
- **Batch Simulations**: Support running 1000+ simulations in parallel for confidence intervals
- **Caching**: Cache archetype centroids and influence matrices in memory

---

## Future Enhancements

1. **ML-Based Classification**: Train model on actual voir dire data to improve archetype prediction
2. **Real-Time Updates**: Update juror profiles dynamically during trial based on observed reactions
3. **Jurisdiction-Specific Models**: Train separate models for different venues with distinct patterns
4. **Attorney Modeling**: Model opposing counsel's likely strikes to predict final jury composition
5. **Evidence Impact Modeling**: Predict which evidence elements will move which juror types

---

## Source Data Files

The following markdown files contain the source content that needs to be parsed into JSON:

| File | Contains | Parse Into |
|------|----------|------------|
| `juror_profile_framework.md` | Dimension/archetype definitions | schemas/*.json |
| `juror_personas_seed_data.md` | 20+ detailed personas | data/personas/*.json |
| `juror_personas_extended_variations.md` | Case matrices, Q&A | data/case_types/*.json, data/voir_dire/*.json |
| `juror_personas_named_expanded.md` | 60+ named personas, regions | data/personas/*.json, data/regions/*.json |
| `juror_case_scenarios_deliberations.md` | Case scenarios, scripts | data/case_types/*.json, data/deliberation/*.json |

---

## Contact / Questions

For questions about the psychological framework, archetype definitions, or simulation logic, refer to the FRAMEWORK.md and ARCHETYPES.md documentation.

For questions about implementation, API design, or performance requirements, contact the engineering lead.
