# Juror Profile System - Project Status & Pickup File

## Last Updated: January 2025

## Project Goal
Build a comprehensive juror profiling system for voir dire strategy and jury deliberation simulation. Intended for use in trial consulting software and AI-powered trial preparation tools.

---

## What's Been Built

### Core Framework Documents

| File | Contents | Status |
|------|----------|--------|
| `juror_profile_framework.md` | 8 dimensions, 10 archetypes, simulation architecture | ✅ Complete |
| `juror_personas_seed_data.md` | 20+ detailed personas, hybrid combinations, influence matrices | ✅ Complete |
| `juror_personas_extended_variations.md` | Additional variations, case-type matrices, voir dire Q&A | ✅ Complete |
| `juror_personas_named_expanded.md` | 60+ named personas, regional variations, demographic diversity | ✅ Complete |
| `juror_case_scenarios_deliberations.md` | 12+ case scenarios, 3 deliberation scripts, quick reference | ✅ Complete |

### Archetypes Defined

| # | Archetype | Quick Name | Personas Created |
|---|-----------|------------|------------------|
| 1 | Personal Responsibility Enforcer | "The Bootstrapper" | 10 |
| 2 | Systemic Thinker | "The Crusader" | 10 |
| 3 | Fair-Minded Evaluator | "The Scale-Balancer" | 8 |
| 4 | Authoritative Leader | "The Captain" | 7 |
| 5 | Compliant Follower | "The Chameleon" | 6 |
| 6 | Wounded Veteran | "The Scarred" | 7 |
| 7 | Numbers Person | "The Calculator" | 6 |
| 8 | Empathic Connector | "The Heart" | 7 |
| 9 | Stealth Juror | "The Trojan Horse" | 4 |
| 10 | Nullifier | "The Maverick" | 4 |

**Total Named Personas: ~69**

### Case Types Covered

| Case Type | Archetype Reactions | Deliberation Script |
|-----------|--------------------|--------------------|
| Auto Accident | ✅ | ✅ |
| Medical Malpractice | ✅ | ✅ |
| Product Liability (Consumer) | ✅ | ✅ |
| Slip and Fall / Premises | ✅ | ❌ |
| Trucking Accident | ✅ | ✅ |
| Nursing Home | ✅ | ❌ |
| Workplace Injury | ✅ | ❌ |
| Employment Retaliation | ✅ | ❌ |
| Construction Accident | ✅ | ❌ |
| Pharmaceutical/Drug Defect | ✅ | ❌ |
| Birth Injury | ✅ | ❌ |
| Sexual Abuse Institutional | ✅ | ❌ |
| Automotive Defect | ✅ | ❌ |
| Wrongful Death | Partial | ❌ |

### Regional Variations Covered

| Region | Profile Created | Notes |
|--------|-----------------|-------|
| Texas | ✅ | Conservative, individualist, business-friendly |
| California | ✅ | Progressive, consumer protection, tech influence |
| Florida | ✅ | Variable by area, retiree influence |
| New York | ✅ | Urban/upstate divide, diverse |
| Midwest | ✅ | Union history, pragmatic, "Midwest nice" |
| Deep South | ✅ | Religious, racial dynamics, hospitality culture |
| Pacific Northwest | ✅ | Progressive, environmental, anti-corporate |

---

## What Still Needs Building

### More Personas Needed

**Priority Gaps:**
- [ ] More Asian-American variations across archetypes
- [ ] More Native American representation
- [ ] More LGBTQ+ identified personas (where relevant to case dynamics)
- [ ] More rural variations outside Midwest/South
- [ ] More young professional (25-35) variations
- [ ] More retiree variations (growing jury pool segment)
- [ ] More immigrant/first-generation variations beyond Eastern European

**Archetype Gaps:**
- [ ] Nullifier needs more variations (only 4 currently)
- [ ] Trojan Horse needs more variations (only 4 currently)
- [ ] Chameleon needs more demographic diversity

### More Case Types Needed

- [ ] Class Action / Mass Tort dynamics
- [ ] Insurance Bad Faith
- [ ] Legal Malpractice
- [ ] Securities/Financial Fraud
- [ ] Civil Rights / §1983
- [ ] Intellectual Property (trade secrets)
- [ ] Real Estate / Construction Defect
- [ ] Dog Bite / Animal Attack
- [ ] Dram Shop / Liquor Liability
- [ ] Defamation

### More Deliberation Scripts Needed

- [ ] Premises liability with divided jury
- [ ] Nursing home with Hearts dominating
- [ ] Workplace injury with union/non-union dynamic
- [ ] Med mal with expert battle (dueling Calculators)
- [ ] Low-value case (will jury award anything?)
- [ ] High punitive case (runaway jury risk)
- [ ] Hung jury scenario (Maverick holdout)

### Regional Expansion Needed

- [ ] Mountain West (Colorado, Utah, Nevada)
- [ ] New England (beyond NYC)
- [ ] Southwest (Arizona, New Mexico)
- [ ] Mid-Atlantic (Pennsylvania, New Jersey)
- [ ] Border regions (unique dynamics)

---

## Naming Convention Reference

### Archetype Type Names
1. Bootstrapper, 2. Crusader, 3. Scale-Balancer, 4. Captain, 5. Chameleon, 6. Scarred, 7. Calculator, 8. Heart, 9. Trojan Horse, 10. Maverick

### Persona Naming Pattern
**"[Alliterative Descriptor] [First Name]"**
- Bootstrap Bob, Sued-Twice Sue, Immigrant Dream Ivan
- Union-Strong Ulysses, Nurse Advocate Nadine
- Librarian Linda, Mediator Maria
- CEO Carl, Reverend Righteous
- Go-Along Gail, Nervous Nellie
- Medical-Mistake Michelle, Widowed Wanda
- Data-Driven David, Actuary Andrew
- Counselor Carmen, Sunday-School Sandra
- Activist in Disguise, Tort-Reform Tony
- Libertarian Larry, Conscience-First Clarence

### Persona ID Convention
`[ARCHETYPE_CODE]_[NUMBER]_[Name]`
- BOOT_1.7_ImmigrantDreamIvan
- CRUS_2.7_NurseAdvocateNadine
- SCALE_3.5_LibrarianLinda
- CAPT_4.4_AttorneyAngela
- CHAM_5.3_NervousNellie
- SCAR_6.5_WidowedWanda
- CALC_7.4_ActuaryAndrew
- HEART_8.7_SundaySchoolSandra
- TROJAN_9.3_GrievanceHidingGina
- MAVE_10.2_LibertarianLarry

---

## Key Design Decisions Made

1. **8 Psychological Dimensions** (1-5 scale each):
   - Attribution Orientation
   - Just World Belief (with subtypes)
   - Authoritarianism
   - Institutional Trust (by entity type)
   - Litigation Attitude
   - Leadership Tendency
   - Cognitive Style
   - Damages Orientation

2. **Simulation Parameters per Persona:**
   - liability_threshold
   - contributory_fault_weight
   - damage_multiplier
   - non_economic_skepticism
   - punitive_inclination
   - evidence_processing weights
   - deliberation influence/persuadability

3. **Deliberation Model:**
   - First-ballot majority wins 90%
   - Leaders account for 25-31% speaking time
   - Social pressure susceptibility varies by archetype
   - Faction formation based on archetype clustering

4. **Regional modifiers** adjust archetype strength and expression

5. **Case-type modifiers** adjust specific reactions by case category

---

## To Resume Building Profiles

1. Review gaps list above
2. Pick archetype + demographic combination
3. Follow persona template:
   - Demographics (12 fields)
   - Psychological Dimension Scores (8 dimensions)
   - Life History & Formative Experiences
   - Characteristic Speech Patterns (5-7 phrases)
   - Predicted Voir Dire Responses (3-5 Q&A)
   - Deliberation Behavior Predictions
   - Case-Type Specific Predictions
   - Simulation Parameters (JSON)

4. Assign memorable alliterative name
5. Note any cause challenge vulnerabilities
6. Add regional variant notes if applicable

---

## Files Location
All files should be in working directory. For engineering handoff, these need restructuring into:
- JSON schema for personas
- Separate data files from framework docs
- API-ready format for simulation engine

---

*This pickup file last updated after building ~69 personas across 10 archetypes with regional and case-type variations.*
