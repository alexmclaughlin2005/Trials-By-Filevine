/**
 * PersonaInsightsPDFDocument
 *
 * Professional PDF report for individual persona case insights
 * Includes: Case Interpretation, Key Biases, Decision Drivers, Persuasion Strategy, Vulnerabilities, Strengths
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  baseStyles,
  colors,
  fontSize,
  spacing,
} from '../styles/pdfStyles';
import { PDFHeader } from '../components/PDFHeader';
import { PDFFooter } from '../components/PDFFooter';
import {
  formatDate,
  sanitizeText,
} from '../utils/formatters';
import type { PersonaInsightsPDFData } from '../types';

// Component-specific styles
const styles = StyleSheet.create({
  // Cover page
  coverBrand: {
    fontSize: fontSize['2xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  coverType: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    marginBottom: spacing['3xl'],
  },
  coverMetaItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  coverMetaLabel: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    width: 120,
  },
  coverMetaValue: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    flex: 1,
  },

  // Section boxes
  sectionBox: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
    marginBottom: spacing.md,
  },
  sectionText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 1.6,
  },

  // Bullet lists
  bulletList: {
    marginTop: spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 20,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 1.5,
  },

  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 3,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontFamily: 'Helvetica-Bold',
  },
  positionBadge: {
    backgroundColor: colors.blue[50],
  },
  positionBadgeText: {
    color: colors.blue[700],
  },
  influenceBadge: {
    backgroundColor: colors.purple[50],
  },
  influenceBadgeText: {
    color: colors.purple[700],
  },

  // Two-column grid for vulnerabilities and strengths
  twoColumnGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  vulnerabilityItem: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.red[500],
    backgroundColor: colors.red[50],
    marginBottom: spacing.sm,
  },
  strengthItem: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.green[500],
    backgroundColor: colors.green[50],
    marginBottom: spacing.sm,
  },
});

interface Props {
  data: PersonaInsightsPDFData;
}

export function PersonaInsightsPDFDocument({ data }: Props) {
  const { conversation, personaSummary, personaInsight, caseInfo } = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title="TrialForge"
          subtitle="Case Insights Report"
        />

        <View style={baseStyles.container}>
          <Text style={styles.coverBrand}>Persona Case Insights</Text>
          <Text style={styles.coverType}>Psychological Analysis & Persuasion Strategy</Text>

          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Persona:</Text>
              <Text style={styles.coverMetaValue}>
                {sanitizeText(personaSummary.personaName)}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Case:</Text>
              <Text style={styles.coverMetaValue}>
                {sanitizeText(caseInfo.name)}
              </Text>
            </View>

            {caseInfo.clientName && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Client:</Text>
                <Text style={styles.coverMetaValue}>
                  {sanitizeText(caseInfo.clientName)}
                </Text>
              </View>
            )}

            {caseInfo.caseNumber && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Case Number:</Text>
                <Text style={styles.coverMetaValue}>
                  {sanitizeText(caseInfo.caseNumber)}
                </Text>
              </View>
            )}

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Argument:</Text>
              <Text style={styles.coverMetaValue}>
                {sanitizeText(conversation.argumentTitle || 'Untitled')}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Session Date:</Text>
              <Text style={styles.coverMetaValue}>
                {formatDate(conversation.startedAt)}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Position:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.badge, styles.positionBadge]}>
                  <Text style={[styles.badgeText, styles.positionBadgeText]}>
                    {personaSummary.initialPosition.toUpperCase()}
                  </Text>
                </View>
                {personaSummary.positionShifted && (
                  <>
                    <Text style={{ marginHorizontal: spacing.xs }}>→</Text>
                    <View style={[styles.badge, styles.positionBadge]}>
                      <Text style={[styles.badgeText, styles.positionBadgeText]}>
                        {personaSummary.finalPosition.toUpperCase()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Influence Level:</Text>
              <View style={[styles.badge, styles.influenceBadge]}>
                <Text style={[styles.badgeText, styles.influenceBadgeText]}>
                  {personaSummary.influenceLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Case Interpretation Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title={`${personaSummary.personaName} - Case Insights`}
          subtitle={caseInfo.name}
        />

        <View style={baseStyles.container}>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>
              🎯 How They See the Case
            </Text>
            <Text style={styles.sectionText}>
              {sanitizeText(personaInsight.caseInterpretation)}
            </Text>
          </View>

          {/* Key Biases */}
          {personaInsight.keyBiases.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>
                ⚠️ Key Biases & Lenses
              </Text>
              <View style={styles.bulletList}>
                {personaInsight.keyBiases.map((bias, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {sanitizeText(bias)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Decision Drivers */}
          {personaInsight.decisionDrivers.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>
                📊 What Drives Their Decision
              </Text>
              <View style={styles.bulletList}>
                {personaInsight.decisionDrivers.map((driver, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {sanitizeText(driver)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <PDFFooter />
      </Page>

      {/* Persuasion Strategy Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title={`${personaSummary.personaName} - Case Insights`}
          subtitle={caseInfo.name}
        />

        <View style={baseStyles.container}>
          {/* Persuasion Strategy */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>
              💡 Persuasion Strategy
            </Text>
            <Text style={styles.sectionText}>
              {sanitizeText(personaInsight.persuasionStrategy)}
            </Text>
          </View>

          {/* Vulnerabilities and Strengths */}
          <View style={styles.twoColumnGrid}>
            {/* Vulnerabilities Column */}
            {personaInsight.vulnerabilities.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.columnTitle}>
                  Vulnerabilities to Address
                </Text>
                {personaInsight.vulnerabilities.map((vuln, idx) => (
                  <View key={idx} style={styles.vulnerabilityItem}>
                    <Text style={[styles.sectionText, { fontSize: fontSize.sm }]}>
                      {sanitizeText(vuln)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Strengths Column */}
            {personaInsight.strengths.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.columnTitle}>
                  Strengths to Leverage
                </Text>
                {personaInsight.strengths.map((strength, idx) => (
                  <View key={idx} style={styles.strengthItem}>
                    <Text style={[styles.sectionText, { fontSize: fontSize.sm }]}>
                      {sanitizeText(strength)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
}
