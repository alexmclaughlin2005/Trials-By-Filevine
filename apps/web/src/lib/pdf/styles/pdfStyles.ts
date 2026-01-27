/**
 * Shared PDF Styles System
 *
 * Provides consistent styling across all PDF documents.
 * Based on Filevine brand colors and design system.
 */

import { StyleSheet } from '@react-pdf/renderer';

// Filevine Brand Colors (matching Tailwind config)
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic colors
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',

  // Status colors (matching UI)
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    700: '#15803d',
  },
  yellow: {
    50: '#fefce8',
    500: '#eab308',
    700: '#a16207',
  },
  red: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c',
  },
  blue: {
    50: '#eff6ff',
    500: '#3b82f6',
    700: '#1d4ed8',
  },
  purple: {
    50: '#faf5ff',
    500: '#a855f7',
    700: '#7e22ce',
  },
};

// Typography scale
export const fontSize = {
  xs: 8,
  sm: 10,
  base: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
  '5xl': 36,
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

/**
 * Base styles used across all PDF documents
 */
export const baseStyles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: fontSize.base,
    color: colors.gray[900],
    backgroundColor: '#ffffff',
  },

  pageWithHeader: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // Headers
  h1: {
    fontSize: fontSize['4xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },

  h2: {
    fontSize: fontSize['3xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[800],
    marginBottom: spacing.md,
  },

  h3: {
    fontSize: fontSize['2xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },

  h4: {
    fontSize: fontSize.xl,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },

  // Body text
  body: {
    fontSize: fontSize.base,
    lineHeight: 1.6,
    color: colors.gray[700],
  },

  bodyBold: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.6,
    color: colors.gray[900],
  },

  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: 1.5,
    color: colors.gray[600],
  },

  // Layout
  container: {
    marginBottom: spacing['2xl'],
  },

  section: {
    marginBottom: spacing.xl,
  },

  subsection: {
    marginBottom: spacing.lg,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  column: {
    flexDirection: 'column',
  },

  // Dividers
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginVertical: spacing.md,
  },

  dividerThick: {
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[300],
    marginVertical: spacing.lg,
  },

  // Cards and boxes
  card: {
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    marginBottom: spacing.md,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },

  listBullet: {
    width: 16,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },

  listContent: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 1.5,
  },

  // Semantic sections
  successSection: {
    backgroundColor: colors.green[50],
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: spacing.lg,
  },

  warningSection: {
    backgroundColor: colors.yellow[50],
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: spacing.lg,
  },

  dangerSection: {
    backgroundColor: colors.red[50],
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginBottom: spacing.lg,
  },

  infoSection: {
    backgroundColor: colors.blue[50],
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    marginBottom: spacing.lg,
  },

  // Header and footer
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 40,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
    backgroundColor: '#ffffff',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    paddingHorizontal: 40,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },

  // Cover page
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['4xl'],
  },

  coverTitle: {
    fontSize: fontSize['5xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
    marginBottom: spacing['3xl'],
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: fontSize['2xl'],
    color: colors.gray[700],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  coverMeta: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});

/**
 * Severity badge styles matching the UI
 */
export const severityStyles = {
  LOW: {
    backgroundColor: colors.blue[50],
    color: colors.blue[700],
  },
  MEDIUM: {
    backgroundColor: colors.yellow[50],
    color: colors.yellow[700],
  },
  HIGH: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  CRITICAL: {
    backgroundColor: colors.red[50],
    color: colors.red[700],
  },
};

/**
 * Priority badge styles
 */
export const priorityStyles = {
  LOW: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  MEDIUM: {
    backgroundColor: colors.blue[50],
    color: colors.blue[700],
  },
  HIGH: {
    backgroundColor: colors.blue[500],
    color: '#ffffff',
  },
};

/**
 * Position badge styles (juror positions)
 */
export const positionStyles = {
  favorable: {
    backgroundColor: colors.green[50],
    color: colors.green[700],
  },
  neutral: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  unfavorable: {
    backgroundColor: colors.red[50],
    color: colors.red[700],
  },
  mixed: {
    backgroundColor: colors.yellow[50],
    color: colors.yellow[700],
  },
};

/**
 * Influence level badge styles
 */
export const influenceStyles = {
  high: {
    backgroundColor: colors.purple[50],
    color: colors.purple[700],
  },
  medium: {
    backgroundColor: colors.blue[50],
    color: colors.blue[700],
  },
  low: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
};
