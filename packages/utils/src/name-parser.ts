import { metaphone } from './metaphone';

export interface ParsedName {
  fullName: string;       // Normalized: "Maria L Garcia"
  firstName: string;      // "Maria"
  lastName: string;       // "Garcia"
  middleName?: string;    // "L"
  suffix?: string;        // "Jr", "III", etc.
  confidence: number;     // 0-100
  metaphoneFirst: string; // Phonetic encoding of first name
  metaphoneLast: string;  // Phonetic encoding of last name
}

const SUFFIXES = ['JR', 'SR', 'II', 'III', 'IV', 'V', 'ESQ', 'MD', 'PHD', 'DDS'];
const PREFIXES = ['MR', 'MRS', 'MS', 'MISS', 'DR', 'REV', 'HON'];

/**
 * Parse a name string into structured components
 *
 * Handles formats:
 * - "First Last"
 * - "First Middle Last"
 * - "Last, First"
 * - "Last, First Middle"
 * - "First M. Last"
 * - "First Last Jr."
 *
 * @param input - Raw name string
 * @returns Parsed name with confidence score
 */
export function parseName(input: string): ParsedName {
  if (!input || input.trim().length === 0) {
    throw new Error('Name input cannot be empty');
  }

  // Step 1: Normalize
  let normalized = input
    .trim()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[^\w\s\-'.,]/g, '')   // Remove special chars except apostrophes, hyphens, periods, commas
    .replace(/\./g, ' ')            // Convert periods to spaces
    .toUpperCase();

  // Remove prefixes
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix + ' ')) {
      normalized = normalized.substring(prefix.length + 1).trim();
    }
  }

  // Step 2: Detect format (Last, First or First Last)
  const isLastFirst = normalized.includes(',');

  let firstName = '';
  let lastName = '';
  let middleName: string | undefined;
  let suffix: string | undefined;
  let confidence = 100;

  if (isLastFirst) {
    // "Last, First" or "Last, First Middle" format
    const parts = normalized.split(',').map(p => p.trim());

    if (parts.length < 2) {
      confidence = 50;
      lastName = parts[0];
      firstName = '';
    } else {
      lastName = parts[0];
      const remainingParts = parts[1].split(' ').filter(p => p.length > 0);

      // Check for suffix
      if (remainingParts.length > 0) {
        const lastPart = remainingParts[remainingParts.length - 1];
        if (SUFFIXES.includes(lastPart)) {
          suffix = lastPart;
          remainingParts.pop();
        }
      }

      if (remainingParts.length === 0) {
        confidence = 50;
      } else if (remainingParts.length === 1) {
        firstName = remainingParts[0];
      } else if (remainingParts.length === 2) {
        firstName = remainingParts[0];
        middleName = remainingParts[1];
      } else {
        // More than 2 names after comma - combine extras into middle
        firstName = remainingParts[0];
        middleName = remainingParts.slice(1).join(' ');
        confidence = 85;
      }
    }
  } else {
    // "First Last" format
    const parts = normalized.split(' ').filter(p => p.length > 0);

    if (parts.length === 0) {
      throw new Error('Could not parse name');
    } else if (parts.length === 1) {
      // Only one name provided
      lastName = parts[0];
      firstName = '';
      confidence = 40;
    } else {
      // Check for suffix at end
      const lastPart = parts[parts.length - 1];
      if (SUFFIXES.includes(lastPart)) {
        suffix = lastPart;
        parts.pop();
      }

      if (parts.length === 0) {
        throw new Error('Could not parse name');
      } else if (parts.length === 1) {
        lastName = parts[0];
        firstName = '';
        confidence = 40;
      } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
      } else if (parts.length === 3) {
        firstName = parts[0];
        middleName = parts[1];
        lastName = parts[2];
      } else {
        // More than 3 parts - last is last name, first is first name, rest is middle
        firstName = parts[0];
        middleName = parts.slice(1, -1).join(' ');
        lastName = parts[parts.length - 1];
        confidence = 90;
      }
    }
  }

  // Further reduce confidence if name parts are very short (likely initials only)
  if (firstName.length === 1) {
    confidence = Math.min(confidence, 70);
  }
  if (lastName.length === 1) {
    confidence = Math.min(confidence, 60);
  }

  // Build full name
  const fullNameParts: string[] = [];
  if (firstName) fullNameParts.push(firstName);
  if (middleName) fullNameParts.push(middleName);
  if (lastName) fullNameParts.push(lastName);
  if (suffix) fullNameParts.push(suffix);

  const fullName = fullNameParts.join(' ');

  // Generate phonetic encodings
  const metaphoneFirst = firstName ? metaphone(firstName) : '';
  const metaphoneLast = lastName ? metaphone(lastName) : '';

  return {
    fullName,
    firstName,
    lastName,
    middleName,
    suffix,
    confidence,
    metaphoneFirst,
    metaphoneLast,
  };
}

/**
 * Calculate similarity between two names (0-100 scale)
 *
 * @param name1 - First name to compare
 * @param name2 - Second name to compare
 * @returns Similarity score (0-100)
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const parsed1 = parseName(name1);
  const parsed2 = parseName(name2);

  let score = 0;

  // Compare last names (most important - worth 50 points)
  if (parsed1.lastName === parsed2.lastName) {
    score += 50;
  } else if (parsed1.metaphoneLast === parsed2.metaphoneLast && parsed1.metaphoneLast.length > 0) {
    score += 35; // Phonetic match
  } else if (levenshteinSimilarity(parsed1.lastName, parsed2.lastName) > 0.7) {
    score += 25; // Similar but not exact
  }

  // Compare first names (worth 40 points)
  if (parsed1.firstName === parsed2.firstName) {
    score += 40;
  } else if (parsed1.metaphoneFirst === parsed2.metaphoneFirst && parsed1.metaphoneFirst.length > 0) {
    score += 28; // Phonetic match
  } else if (parsed1.firstName.length === 1 || parsed2.firstName.length === 1) {
    // One is an initial - check if it matches
    if (parsed1.firstName[0] === parsed2.firstName[0]) {
      score += 15;
    }
  } else if (levenshteinSimilarity(parsed1.firstName, parsed2.firstName) > 0.7) {
    score += 20; // Similar but not exact
  }

  // Compare middle names if both present (worth 10 points)
  if (parsed1.middleName && parsed2.middleName) {
    if (parsed1.middleName === parsed2.middleName) {
      score += 10;
    } else if (parsed1.middleName[0] === parsed2.middleName[0]) {
      score += 5; // Initial match
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate Levenshtein similarity between two strings (0-1 scale)
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
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
