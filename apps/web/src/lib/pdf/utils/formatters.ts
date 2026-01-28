/**
 * PDF Formatting Utilities
 *
 * Helper functions for formatting data in PDF documents
 */

/**
 * Format a date for display in PDFs
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a date and time for display in PDFs
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a list of names with proper grammar
 * e.g., ["Alice", "Bob", "Charlie"] => "Alice, Bob, and Charlie"
 */
export const formatNameList = (names: string[]): string => {
  if (names.length === 0) return 'None';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  const allButLast = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `${allButLast}, and ${last}`;
};

/**
 * Format a confidence score as a percentage
 */
export const formatConfidence = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};

/**
 * Format position shift for display
 */
export const formatPositionShift = (
  initial: string,
  final: string
): string => {
  if (initial === final) return `Remained ${initial}`;
  return `${titleCase(initial)} → ${titleCase(final)}`;
};

/**
 * Get a color-coded symbol for sentiment
 */
export const getSentimentSymbol = (sentiment: string): string => {
  switch (sentiment) {
    case 'plaintiff_leaning':
      return '↑'; // Up arrow
    case 'defense_leaning':
      return '↓'; // Down arrow
    case 'neutral':
      return '→'; // Right arrow
    case 'conflicted':
      return '↔'; // Left-right arrow
    default:
      return '•';
  }
};

/**
 * Format severity level for display
 */
export const formatSeverity = (severity: string): string => {
  return severity.toUpperCase();
};

/**
 * Format priority level for display
 */
export const formatPriority = (priority: string): string => {
  return priority.toUpperCase();
};

/**
 * Sanitize text for PDF rendering (remove special characters that might cause issues)
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim();
};

/**
 * Split long text into paragraphs for better readability
 */
export const splitIntoParagraphs = (text: string, maxLength: number = 500): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const sentence of sentences) {
    if (currentParagraph.length + sentence.length > maxLength) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = sentence;
    } else {
      currentParagraph += sentence;
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs;
};

/**
 * Format a number with commas (for counts, etc.)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Get checkmark/x symbol for boolean values
 */
export const getBooleanSymbol = (value: boolean): string => {
  return value ? '✓' : '✗';
};
