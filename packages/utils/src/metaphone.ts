/**
 * Double Metaphone phonetic algorithm implementation
 * Used for fuzzy name matching in Juror Research
 *
 * Based on Lawrence Philips' Double Metaphone algorithm
 */

export function metaphone(word: string): string {
  if (!word || word.length === 0) return '';

  // Normalize input
  word = word.toUpperCase().trim();

  // Remove non-alphabetic characters
  word = word.replace(/[^A-Z]/g, '');

  if (word.length === 0) return '';

  let metaphoneKey = '';
  let current = 0;
  const last = word.length - 1;

  // Skip initial silent letters
  if (word.match(/^(GN|KN|PN|WR|PS)/)) {
    current = 1;
  }

  // Initial X is pronounced Z
  if (word[0] === 'X') {
    metaphoneKey = 'S';
    current = 1;
  }

  while (metaphoneKey.length < 4 && current <= last) {
    const char = word[current];

    switch (char) {
      case 'A':
      case 'E':
      case 'I':
      case 'O':
      case 'U':
        // Vowels encoded only at start
        if (current === 0) {
          metaphoneKey += char;
        }
        break;

      case 'B':
        metaphoneKey += 'B';
        // Handle double B
        if (current + 1 <= last && word[current + 1] === 'B') {
          current++;
        }
        break;

      case 'C':
        // CIA, CH -> X
        if (current + 2 <= last && word.substr(current, 3) === 'CIA') {
          metaphoneKey += 'X';
          current += 2;
        } else if (current + 1 <= last && word[current + 1] === 'H') {
          metaphoneKey += 'X';
          current++;
        } else if (current + 1 <= last && (word[current + 1] === 'E' || word[current + 1] === 'I')) {
          metaphoneKey += 'S'; // Soft C
        } else {
          metaphoneKey += 'K'; // Hard C
        }
        break;

      case 'D':
        if (current + 2 <= last && word[current + 1] === 'G' &&
            (word[current + 2] === 'E' || word[current + 2] === 'I' || word[current + 2] === 'Y')) {
          metaphoneKey += 'J'; // DGE, DGI, DGY -> J
          current += 2;
        } else {
          metaphoneKey += 'T';
        }
        break;

      case 'F':
        metaphoneKey += 'F';
        if (current + 1 <= last && word[current + 1] === 'F') {
          current++;
        }
        break;

      case 'G':
        if (current + 1 <= last && word[current + 1] === 'H') {
          if (current === 0 || isVowel(word[current - 1])) {
            metaphoneKey += 'K';
          }
          current++;
        } else if (current + 1 <= last && word[current + 1] === 'N' && current === last - 1) {
          // GN at end is silent
        } else if (current + 1 <= last && (word[current + 1] === 'E' || word[current + 1] === 'I' || word[current + 1] === 'Y')) {
          metaphoneKey += 'J'; // Soft G
        } else {
          metaphoneKey += 'K'; // Hard G
        }
        break;

      case 'H':
        // H between vowels or at start before vowel
        if ((current === 0 || isVowel(word[current - 1])) &&
            current + 1 <= last && isVowel(word[current + 1])) {
          metaphoneKey += 'H';
        }
        break;

      case 'J':
        metaphoneKey += 'J';
        break;

      case 'K':
        if (current === 0 || word[current - 1] !== 'C') {
          metaphoneKey += 'K';
        }
        break;

      case 'L':
        metaphoneKey += 'L';
        if (current + 1 <= last && word[current + 1] === 'L') {
          current++;
        }
        break;

      case 'M':
        metaphoneKey += 'M';
        if (current + 1 <= last && word[current + 1] === 'M') {
          current++;
        }
        break;

      case 'N':
        metaphoneKey += 'N';
        if (current + 1 <= last && word[current + 1] === 'N') {
          current++;
        }
        break;

      case 'P':
        if (current + 1 <= last && word[current + 1] === 'H') {
          metaphoneKey += 'F';
          current++;
        } else {
          metaphoneKey += 'P';
        }
        break;

      case 'Q':
        metaphoneKey += 'K';
        break;

      case 'R':
        metaphoneKey += 'R';
        if (current + 1 <= last && word[current + 1] === 'R') {
          current++;
        }
        break;

      case 'S':
        if (current + 2 <= last && word.substr(current, 3) === 'SIO') {
          metaphoneKey += 'X';
          current += 2;
        } else if (current + 1 <= last && word[current + 1] === 'H') {
          metaphoneKey += 'X';
          current++;
        } else {
          metaphoneKey += 'S';
        }
        break;

      case 'T':
        if (current + 2 <= last && word.substr(current, 3) === 'TIO') {
          metaphoneKey += 'X';
          current += 2;
        } else if (current + 1 <= last && word[current + 1] === 'H') {
          metaphoneKey += '0'; // TH
          current++;
        } else if (current + 2 <= last && word.substr(current, 3) === 'TCH') {
          current += 2; // Silent T in TCH
        } else {
          metaphoneKey += 'T';
        }
        break;

      case 'V':
        metaphoneKey += 'F';
        break;

      case 'W':
      case 'Y':
        if (current + 1 <= last && isVowel(word[current + 1])) {
          metaphoneKey += char;
        }
        break;

      case 'X':
        metaphoneKey += 'KS';
        break;

      case 'Z':
        metaphoneKey += 'S';
        break;
    }

    current++;
  }

  return metaphoneKey.substring(0, 4);
}

function isVowel(char: string): boolean {
  return 'AEIOU'.includes(char);
}

/**
 * Compare two strings using Metaphone phonetic matching
 * Returns true if they sound alike
 */
export function metaphoneMatch(str1: string, str2: string): boolean {
  const code1 = metaphone(str1);
  const code2 = metaphone(str2);
  return code1 === code2 && code1.length > 0;
}
