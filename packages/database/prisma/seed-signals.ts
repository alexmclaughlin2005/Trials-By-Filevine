/**
 * Signal Library Seed Data
 * 
 * Initial signals for the juror-persona matching system.
 * These signals are extracted from juror data and used to match jurors to personas.
 * 
 * Phase 1: Foundation - Signal System & Data Models
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

interface SignalDefinition {
  signalId: string;
  name: string;
  category: 'DEMOGRAPHIC' | 'BEHAVIORAL' | 'ATTITUDINAL' | 'LINGUISTIC' | 'SOCIAL';
  extractionMethod: 'FIELD_MAPPING' | 'PATTERN_MATCH' | 'NLP_CLASSIFICATION' | 'MANUAL';
  sourceField?: string;
  patterns?: string[];
  valueType: 'BOOLEAN' | 'CATEGORICAL' | 'NUMERIC' | 'TEXT';
  possibleValues?: string[];
  description: string;
}

const signals: SignalDefinition[] = [
  // ============================================
  // DEMOGRAPHIC SIGNALS
  // ============================================
  
  {
    signalId: 'OCCUPATION_HEALTHCARE',
    name: 'Healthcare Professional',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: [
      'nurse|doctor|physician|surgeon|therapist|pharmacist|dentist|veterinarian|medical|healthcare|health care',
    ],
    description: 'Juror works in healthcare field',
  },
  {
    signalId: 'OCCUPATION_TECH',
    name: 'Technology Professional',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: [
      'engineer|programmer|developer|software|IT|tech|technology|computer|data scientist|analyst',
    ],
    description: 'Juror works in technology field',
  },
  {
    signalId: 'OCCUPATION_EDUCATION',
    name: 'Education Professional',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: ['teacher|professor|educator|principal|administrator|school'],
    description: 'Juror works in education field',
  },
  {
    signalId: 'OCCUPATION_LEGAL',
    name: 'Legal Professional',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: ['lawyer|attorney|judge|paralegal|legal|law'],
    description: 'Juror works in legal field',
  },
  {
    signalId: 'OCCUPATION_BUSINESS',
    name: 'Business Professional',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: ['manager|executive|CEO|CFO|business|corporate|entrepreneur|owner'],
    description: 'Juror works in business/management',
  },
  {
    signalId: 'OCCUPATION_FIRST_RESPONDER',
    name: 'First Responder',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'occupation',
    valueType: 'BOOLEAN',
    patterns: ['police|officer|firefighter|paramedic|EMT|sheriff|deputy'],
    description: 'Juror is a first responder',
  },
  {
    signalId: 'EDUCATION_BACHELORS',
    name: 'Bachelor\'s Degree',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'education',
    valueType: 'BOOLEAN',
    patterns: ['bachelor|bachelor\'s|BA|BS|undergraduate'],
    description: 'Juror has bachelor\'s degree',
  },
  {
    signalId: 'EDUCATION_ADVANCED',
    name: 'Advanced Degree',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'education',
    valueType: 'BOOLEAN',
    patterns: ['master|MBA|MS|MA|PhD|doctorate|JD|MD|graduate'],
    description: 'Juror has advanced degree (master\'s or higher)',
  },
  {
    signalId: 'AGE_RANGE_18_30',
    name: 'Age 18-30',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'age',
    valueType: 'BOOLEAN',
    description: 'Juror is between 18-30 years old',
  },
  {
    signalId: 'AGE_RANGE_31_50',
    name: 'Age 31-50',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'age',
    valueType: 'BOOLEAN',
    description: 'Juror is between 31-50 years old',
  },
  {
    signalId: 'AGE_RANGE_51_PLUS',
    name: 'Age 51+',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'age',
    valueType: 'BOOLEAN',
    description: 'Juror is 51 years or older',
  },
  {
    signalId: 'MARITAL_STATUS_MARRIED',
    name: 'Married',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'maritalStatus',
    valueType: 'BOOLEAN',
    patterns: ['married|marriage'],
    description: 'Juror is married',
  },
  {
    signalId: 'MARITAL_STATUS_SINGLE',
    name: 'Single',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'maritalStatus',
    valueType: 'BOOLEAN',
    patterns: ['single|never married'],
    description: 'Juror is single',
  },
  {
    signalId: 'HAS_CHILDREN',
    name: 'Has Children',
    category: 'DEMOGRAPHIC',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'children',
    valueType: 'BOOLEAN',
    description: 'Juror has children',
  },

  // ============================================
  // BEHAVIORAL SIGNALS
  // ============================================

  {
    signalId: 'PRIOR_JURY_SERVICE',
    name: 'Prior Jury Service',
    category: 'BEHAVIORAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'priorJuryService',
    valueType: 'BOOLEAN',
    description: 'Juror has served on a jury before',
  },
  {
    signalId: 'LITIGATION_EXPERIENCE_PARTY',
    name: 'Litigation Experience (Party)',
    category: 'BEHAVIORAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'litigationHistory',
    valueType: 'BOOLEAN',
    patterns: ['party|plaintiff|defendant|sued|suing'],
    description: 'Juror has been a party to litigation',
  },
  {
    signalId: 'LITIGATION_EXPERIENCE_WITNESS',
    name: 'Litigation Experience (Witness)',
    category: 'BEHAVIORAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'litigationHistory',
    valueType: 'BOOLEAN',
    patterns: ['witness|testified|deposition'],
    description: 'Juror has been a witness in litigation',
  },
  {
    signalId: 'VOTING_HISTORY_REGULAR',
    name: 'Regular Voter',
    category: 'BEHAVIORAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'votingHistory',
    valueType: 'BOOLEAN',
    description: 'Juror votes regularly in elections',
  },

  // ============================================
  // ATTITUDINAL SIGNALS (from research/voir dire)
  // ============================================

  {
    signalId: 'AUTHORITY_DEFERENCE_HIGH',
    name: 'High Authority Deference',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'trust.*expert|follow.*rule|they.*know|respect.*authority|defer.*to',
      'authority.*knows|experts.*right|rules.*exist.*reason',
    ],
    description: 'Juror shows high deference to authority figures',
  },
  {
    signalId: 'AUTHORITY_DEFERENCE_LOW',
    name: 'Low Authority Deference',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'question.*authority|challenge.*rule|think.*for.*myself|don.*blindly.*trust',
      'experts.*wrong|rules.*arbitrary|authority.*corrupt',
    ],
    description: 'Juror questions authority and rules',
  },
  {
    signalId: 'CORPORATE_TRUST_LOW',
    name: 'Low Corporate Trust',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'corporations.*greedy|big.*business.*bad|companies.*don.*care|corporate.*corruption',
      'corporations.*profit|companies.*exploit|big.*business.*untrustworthy',
    ],
    description: 'Juror has low trust in corporations',
  },
  {
    signalId: 'CORPORATE_TRUST_HIGH',
    name: 'High Corporate Trust',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'corporations.*good|business.*creates.*jobs|companies.*responsible|corporate.*benefit',
      'big.*business.*necessary|corporations.*innovate|companies.*contribute',
    ],
    description: 'Juror has high trust in corporations',
  },
  {
    signalId: 'RISK_TOLERANCE_LOW',
    name: 'Low Risk Tolerance',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'prefer.*safe|avoid.*risk|careful.*decisions|conservative.*approach',
      'risk.*averse|play.*it.*safe|better.*safe.*sorry',
    ],
    description: 'Juror has low risk tolerance',
  },
  {
    signalId: 'RISK_TOLERANCE_HIGH',
    name: 'High Risk Tolerance',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'take.*chances|willing.*risk|bold.*decisions|calculated.*risk',
      'risk.*taker|comfortable.*uncertainty|embrace.*risk',
    ],
    description: 'Juror has high risk tolerance',
  },
  {
    signalId: 'EVIDENCE_ORIENTATION_HIGH',
    name: 'High Evidence Orientation',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'need.*proof|show.*evidence|data.*matters|facts.*important',
      'evidence.*decide|proof.*required|see.*data|require.*proof',
    ],
    description: 'Juror requires strong evidence to make decisions',
  },
  {
    signalId: 'EMOTIONAL_RESPONSIVENESS_HIGH',
    name: 'High Emotional Responsiveness',
    category: 'ATTITUDINAL',
    extractionMethod: 'NLP_CLASSIFICATION',
    valueType: 'BOOLEAN',
    patterns: [
      'feel.*strongly|emotions.*matter|heart.*decides|empathy.*important',
      'emotional.*impact|feel.*for.*people|compassion.*matters',
    ],
    description: 'Juror is highly responsive to emotional appeals',
  },

  // ============================================
  // LINGUISTIC SIGNALS (from voir dire)
  // ============================================

  {
    signalId: 'HEDGING_LANGUAGE',
    name: 'Hedging Language',
    category: 'LINGUISTIC',
    extractionMethod: 'PATTERN_MATCH',
    valueType: 'BOOLEAN',
    patterns: [
      'maybe|perhaps|might|could|possibly|sort.*of|kind.*of|I.*think|I.*guess',
      'not.*sure|uncertain|unclear|maybe.*not',
    ],
    description: 'Juror uses hedging language (uncertainty markers)',
  },
  {
    signalId: 'CERTAINTY_MARKERS',
    name: 'Certainty Markers',
    category: 'LINGUISTIC',
    extractionMethod: 'PATTERN_MATCH',
    valueType: 'BOOLEAN',
    patterns: [
      'definitely|absolutely|certainly|always|never|clearly|obviously|without.*doubt',
      'I.*know|I.*believe|I.*am.*sure|no.*question',
    ],
    description: 'Juror uses certainty markers (strong convictions)',
  },
  {
    signalId: 'QUESTIONING_LANGUAGE',
    name: 'Questioning Language',
    category: 'LINGUISTIC',
    extractionMethod: 'PATTERN_MATCH',
    valueType: 'BOOLEAN',
    patterns: [
      'why|how|what.*if|I.*wonder|I.*question|seems.*like|but.*what.*about',
      'could.*you.*explain|I.*don.*understand|need.*clarification',
    ],
    description: 'Juror uses questioning language (analytical thinking)',
  },

  // ============================================
  // SOCIAL SIGNALS (from research)
  // ============================================

  {
    signalId: 'POLITICAL_AFFILIATION_DEMOCRAT',
    name: 'Democratic Party Affiliation',
    category: 'SOCIAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'politicalAffiliation',
    valueType: 'BOOLEAN',
    patterns: ['democrat|democratic|liberal|progressive|D|blue'],
    description: 'Juror is affiliated with Democratic party',
  },
  {
    signalId: 'POLITICAL_AFFILIATION_REPUBLICAN',
    name: 'Republican Party Affiliation',
    category: 'SOCIAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'politicalAffiliation',
    valueType: 'BOOLEAN',
    patterns: ['republican|conservative|GOP|R|red'],
    description: 'Juror is affiliated with Republican party',
  },
  {
    signalId: 'POLITICAL_AFFILIATION_INDEPENDENT',
    name: 'Independent/No Party Affiliation',
    category: 'SOCIAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'politicalAffiliation',
    valueType: 'BOOLEAN',
    patterns: ['independent|unaffiliated|no.*party|NPA|NP'],
    description: 'Juror is independent or unaffiliated',
  },
  {
    signalId: 'DONATION_HISTORY',
    name: 'Political Donation History',
    category: 'SOCIAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'donations',
    valueType: 'BOOLEAN',
    description: 'Juror has made political donations',
  },
  {
    signalId: 'ORGANIZATIONAL_MEMBERSHIPS',
    name: 'Organizational Memberships',
    category: 'SOCIAL',
    extractionMethod: 'FIELD_MAPPING',
    sourceField: 'organizations',
    valueType: 'BOOLEAN',
    description: 'Juror is member of organizations',
  },
];

export async function seedSignals() {
  console.log('Seeding signals...');

  for (const signalDef of signals) {
    await prisma.signal.upsert({
      where: { signalId: signalDef.signalId },
      create: {
        signalId: signalDef.signalId,
        name: signalDef.name,
        category: signalDef.category,
        extractionMethod: signalDef.extractionMethod,
        sourceField: signalDef.sourceField || undefined,
        patterns: signalDef.patterns ? signalDef.patterns : undefined,
        valueType: signalDef.valueType,
        possibleValues: signalDef.possibleValues ? signalDef.possibleValues : undefined,
        description: signalDef.description,
      },
      update: {
        name: signalDef.name,
        category: signalDef.category,
        extractionMethod: signalDef.extractionMethod,
        sourceField: signalDef.sourceField || undefined,
        patterns: signalDef.patterns ? signalDef.patterns : undefined,
        valueType: signalDef.valueType,
        possibleValues: signalDef.possibleValues ? signalDef.possibleValues : undefined,
        description: signalDef.description,
      },
    });
  }

  console.log(`Seeded ${signals.length} signals`);
}

// Run if called directly
if (require.main === module) {
  seedSignals()
    .catch((error) => {
      console.error('Error seeding signals:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
