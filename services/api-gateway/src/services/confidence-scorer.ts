import { parseName, calculateNameSimilarity } from '@trialforge/utils';

export interface JurorSearchQuery {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  city?: string;
  zipCode?: string;
  occupation?: string;
}

export interface DataSourceMatch {
  fullName: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  birthYear?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  occupation?: string;
  employer?: string;
  email?: string;
  phone?: string;
  sourceType: string; // voter_record | fec_donation | people_search
  rawData?: any;
}

export interface ScoreFactors {
  nameScore: number;          // 0-40 points
  nameReason: string;
  ageScore: number;           // 0-20 points
  ageReason: string;
  locationScore: number;      // 0-20 points
  locationReason: string;
  occupationScore: number;    // 0-10 points
  occupationReason: string;
  corroborationScore: number; // 0-10 points
  corroborationReason: string;
  totalScore: number;         // 0-100
}

export interface ScoredCandidate extends DataSourceMatch {
  confidenceScore: number;
  scoreFactors: ScoreFactors;
}

/**
 * Score a candidate match against a juror search query
 *
 * Scoring breakdown:
 * - Name: 0-40 points (Last: 0-20, First: 0-15, Middle: 0-5)
 * - Age: 0-20 points (Exact: 20, ±2 years: 15, ±5 years: 8)
 * - Location: 0-20 points (City: 20, County: 12, State: 5)
 * - Occupation: 0-10 points (Fuzzy string match)
 * - Corroboration: 0-10 points (Additional data sources)
 *
 * Total: 0-100 points
 */
export function scoreCandidate(
  query: JurorSearchQuery,
  candidate: DataSourceMatch
): ScoredCandidate {
  const factors: ScoreFactors = {
    nameScore: 0,
    nameReason: '',
    ageScore: 0,
    ageReason: '',
    locationScore: 0,
    locationReason: '',
    occupationScore: 0,
    occupationReason: '',
    corroborationScore: 0,
    corroborationReason: '',
    totalScore: 0,
  };

  // Name Scoring (0-40 points)
  factors.nameScore = scoreNameMatch(query, candidate);
  factors.nameReason = getNameScoreReason(query, candidate, factors.nameScore);

  // Age Scoring (0-20 points)
  if (query.age && (candidate.age || candidate.birthYear)) {
    const candidateAge = candidate.age || (new Date().getFullYear() - candidate.birthYear!);
    const ageDiff = Math.abs(query.age - candidateAge);

    if (ageDiff === 0) {
      factors.ageScore = 20;
      factors.ageReason = 'Exact age match';
    } else if (ageDiff <= 2) {
      factors.ageScore = 15;
      factors.ageReason = `Age within 2 years (±${ageDiff})`;
    } else if (ageDiff <= 5) {
      factors.ageScore = 8;
      factors.ageReason = `Age within 5 years (±${ageDiff})`;
    } else {
      factors.ageScore = 0;
      factors.ageReason = `Age difference too large (±${ageDiff} years)`;
    }
  } else {
    factors.ageReason = 'No age data available for comparison';
  }

  // Location Scoring (0-20 points)
  if (query.city && candidate.city) {
    const cityMatch = normalizeString(query.city) === normalizeString(candidate.city);
    if (cityMatch) {
      factors.locationScore = 20;
      factors.locationReason = `Same city: ${candidate.city}`;
    }
  } else if (query.zipCode && candidate.zipCode) {
    // ZIP code matching
    const zip5Query = query.zipCode.substring(0, 5);
    const zip5Candidate = candidate.zipCode.substring(0, 5);

    if (zip5Query === zip5Candidate) {
      factors.locationScore = 20;
      factors.locationReason = `Same ZIP code: ${zip5Candidate}`;
    } else if (zip5Query.substring(0, 3) === zip5Candidate.substring(0, 3)) {
      // Same ZIP3 (same region)
      factors.locationScore = 12;
      factors.locationReason = `Same region (ZIP3: ${zip5Query.substring(0, 3)})`;
    }
  }

  if (factors.locationScore === 0 && candidate.state) {
    // At minimum, check state
    factors.locationScore = 5;
    factors.locationReason = `Same state: ${candidate.state}`;
  }

  if (factors.locationScore === 0) {
    factors.locationReason = 'No location data available';
  }

  // Occupation Scoring (0-10 points)
  if (query.occupation && candidate.occupation) {
    const similarity = stringSimilarity(
      normalizeString(query.occupation),
      normalizeString(candidate.occupation)
    );

    if (similarity > 0.8) {
      factors.occupationScore = 10;
      factors.occupationReason = `Strong occupation match: ${candidate.occupation}`;
    } else if (similarity > 0.5) {
      factors.occupationScore = 5;
      factors.occupationReason = `Partial occupation match: ${candidate.occupation}`;
    } else {
      factors.occupationScore = 0;
      factors.occupationReason = `Different occupation: ${candidate.occupation}`;
    }
  } else {
    factors.occupationReason = 'No occupation data available';
  }

  // Corroboration bonus (scored separately based on multiple sources)
  // This will be calculated by the Search Orchestrator when clustering matches
  factors.corroborationScore = 0;
  factors.corroborationReason = 'Single source';

  // Calculate total
  factors.totalScore = Math.round(
    factors.nameScore +
    factors.ageScore +
    factors.locationScore +
    factors.occupationScore +
    factors.corroborationScore
  );

  return {
    ...candidate,
    confidenceScore: factors.totalScore,
    scoreFactors: factors,
  };
}

/**
 * Score name match (0-40 points)
 * - Last name: 0-20 points
 * - First name: 0-15 points
 * - Middle name/initial: 0-5 points
 */
function scoreNameMatch(query: JurorSearchQuery, candidate: DataSourceMatch): number {
  let score = 0;

  // Build full names for comparison
  const queryFullName = query.fullName || `${query.firstName || ''} ${query.lastName || ''}`.trim();
  const candidateFullName = candidate.fullName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();

  if (!queryFullName || !candidateFullName) {
    return 0;
  }

  try {
    const parsedQuery = parseName(queryFullName);
    const parsedCandidate = parseName(candidateFullName);

    // Last name scoring (0-20 points)
    if (parsedQuery.lastName && parsedCandidate.lastName) {
      if (parsedQuery.lastName === parsedCandidate.lastName) {
        score += 20; // Exact match
      } else if (parsedQuery.metaphoneLast === parsedCandidate.metaphoneLast &&
                 parsedQuery.metaphoneLast.length > 0) {
        score += 12; // Phonetic match (sounds the same)
      } else {
        const lastNameSim = stringSimilarity(parsedQuery.lastName, parsedCandidate.lastName);
        if (lastNameSim > 0.7) {
          score += 8; // Similar but not exact
        }
      }
    }

    // First name scoring (0-15 points)
    if (parsedQuery.firstName && parsedCandidate.firstName) {
      if (parsedQuery.firstName === parsedCandidate.firstName) {
        score += 15; // Exact match
      } else if (parsedQuery.metaphoneFirst === parsedCandidate.metaphoneFirst &&
                 parsedQuery.metaphoneFirst.length > 0) {
        score += 10; // Phonetic match
      } else if (parsedQuery.firstName.length === 1 || parsedCandidate.firstName.length === 1) {
        // One is an initial
        if (parsedQuery.firstName[0] === parsedCandidate.firstName[0]) {
          score += 3; // Initial match
        }
      } else {
        const firstNameSim = stringSimilarity(parsedQuery.firstName, parsedCandidate.firstName);
        if (firstNameSim > 0.7) {
          score += 6; // Similar but not exact
        }
      }
    }

    // Middle name scoring (0-5 points)
    if (parsedQuery.middleName && parsedCandidate.middleName) {
      if (parsedQuery.middleName === parsedCandidate.middleName) {
        score += 5; // Exact match
      } else if (parsedQuery.middleName[0] === parsedCandidate.middleName[0]) {
        score += 2; // Initial match
      }
    }
  } catch (error) {
    // If parsing fails, fall back to simple comparison
    const similarity = calculateNameSimilarity(queryFullName, candidateFullName);
    score = Math.round(similarity * 0.4); // Scale to 0-40
  }

  return Math.min(40, score);
}

/**
 * Generate human-readable reason for name score
 */
function getNameScoreReason(
  query: JurorSearchQuery,
  candidate: DataSourceMatch,
  score: number
): string {
  const queryFullName = query.fullName || `${query.firstName || ''} ${query.lastName || ''}`.trim();
  const candidateFullName = candidate.fullName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();

  try {
    const parsedQuery = parseName(queryFullName);
    const parsedCandidate = parseName(candidateFullName);

    const reasons: string[] = [];

    // Last name
    if (parsedQuery.lastName === parsedCandidate.lastName) {
      reasons.push('Exact last name match');
    } else if (parsedQuery.metaphoneLast === parsedCandidate.metaphoneLast &&
               parsedQuery.metaphoneLast.length > 0) {
      reasons.push('Phonetic last name match');
    } else if (stringSimilarity(parsedQuery.lastName, parsedCandidate.lastName) > 0.7) {
      reasons.push('Similar last name');
    } else {
      reasons.push('Different last name');
    }

    // First name
    if (parsedQuery.firstName === parsedCandidate.firstName) {
      reasons.push('exact first name');
    } else if (parsedQuery.metaphoneFirst === parsedCandidate.metaphoneFirst &&
               parsedQuery.metaphoneFirst.length > 0) {
      reasons.push('phonetic first name match');
    } else if (parsedQuery.firstName[0] === parsedCandidate.firstName[0]) {
      reasons.push('first initial match');
    } else {
      reasons.push('different first name');
    }

    return reasons.join(', ');
  } catch (error) {
    if (score >= 30) return 'Strong name similarity';
    if (score >= 15) return 'Moderate name similarity';
    return 'Weak name match';
  }
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate string similarity using Levenshtein distance (0-1 scale)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate corroboration bonus for clustered matches
 * Called when multiple data sources have been linked together
 */
export function calculateCorroborationBonus(sourceCount: number): number {
  if (sourceCount <= 1) return 0;
  if (sourceCount === 2) return 3;
  if (sourceCount === 3) return 6;
  return 10; // 4+ sources = maximum bonus
}
