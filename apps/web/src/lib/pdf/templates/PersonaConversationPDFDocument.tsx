/**
 * PersonaConversationPDFDocument
 *
 * Professional PDF report for individual persona conversation
 * Includes: Position shifts, main points, concerns, questions, all statements, social dynamics
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
import type { PersonaSummaryPDFData } from '../types';

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
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 1.5,
  },

  // Bullet lists
  bulletList: {
    marginTop: spacing.xs,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bulletPoint: {
    width: 15,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 1.4,
  },

  // Statement card
  statementCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 3,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statementMeta: {
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[500],
  },
  sentimentBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: fontSize.xs,
  },
  statementText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 1.4,
  },

  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
  },

  // Social dynamics
  socialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  socialColumn: {
    flex: 1,
  },
  socialTitle: {
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[500],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  socialName: {
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },

  // Position shift highlight
  shiftBox: {
    backgroundColor: colors.blue[50],
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.blue[500],
    marginBottom: spacing.lg,
  },
  shiftText: {
    fontSize: fontSize.sm,
    color: colors.blue[900],
    lineHeight: 1.5,
  },
});

interface Props {
  data: PersonaSummaryPDFData;
}

export function PersonaConversationPDFDocument({ data }: Props) {
  const { conversation, personaSummary, caseInfo, statements } = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title="TrialForge"
          subtitle="Persona Conversation Report"
        />

        <View style={baseStyles.container}>
          <Text style={styles.coverBrand}>Conversation Analysis</Text>
          <Text style={styles.coverType}>Individual Juror Performance</Text>

          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Persona:</Text>
              <Text style={styles.coverMetaValue}>
                {sanitizeText(personaSummary.personaName)}
              </Text>
            </View>

            {personaSummary.persona?.archetypeName && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Archetype:</Text>
                <Text style={styles.coverMetaValue}>
                  {sanitizeText(personaSummary.persona.archetypeName)}
                </Text>
              </View>
            )}

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
              <Text style={styles.coverMetaLabel}>Total Statements:</Text>
              <Text style={styles.coverMetaValue}>
                {personaSummary.totalStatements}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Position:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.coverMetaValue}>
                  {personaSummary.initialPosition.toUpperCase()}
                </Text>
                {personaSummary.positionShifted && (
                  <>
                    <Text style={{ marginHorizontal: spacing.xs }}>→</Text>
                    <Text style={styles.coverMetaValue}>
                      {personaSummary.finalPosition.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.blue[600], marginLeft: spacing.sm }}>
                      (Shifted)
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Influence Level:</Text>
              <Text style={styles.coverMetaValue}>
                {personaSummary.influenceLevel.toUpperCase()}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Emotional Intensity:</Text>
              <Text style={styles.coverMetaValue}>
                {Math.round(personaSummary.averageEmotionalIntensity * 100)}%
              </Text>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Summary Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title={`${personaSummary.personaName} - Conversation`}
          subtitle={caseInfo.name}
        />

        <View style={baseStyles.container}>
          {/* Position Shift Description */}
          {personaSummary.positionShifted && personaSummary.shiftDescription && (
            <View style={styles.shiftBox}>
              <Text style={[styles.sectionTitle, { color: colors.blue[700] }]}>
                Why They Shifted
              </Text>
              <Text style={styles.shiftText}>
                {sanitizeText(personaSummary.shiftDescription)}
              </Text>
            </View>
          )}

          {/* Key Points */}
          {personaSummary.mainPoints.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Key Points Made</Text>
              <View style={styles.bulletList}>
                {personaSummary.mainPoints.map((point, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {sanitizeText(point)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Concerns Raised */}
          {personaSummary.concernsRaised.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Concerns Raised</Text>
              <View style={styles.bulletList}>
                {personaSummary.concernsRaised.map((concern, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {sanitizeText(concern)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Questions Asked */}
          {personaSummary.questionsAsked.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Questions Asked</Text>
              <View style={styles.bulletList}>
                {personaSummary.questionsAsked.map((question, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {sanitizeText(question)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Social Dynamics */}
          <View style={styles.socialGrid}>
            {personaSummary.agreedWithMost.length > 0 && (
              <View style={styles.socialColumn}>
                <Text style={styles.socialTitle}>Agreed With</Text>
                {personaSummary.agreedWithMost.map((name, idx) => (
                  <View key={idx} style={[styles.socialName, { backgroundColor: colors.green[50], color: colors.green[700] }]}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.green[700] }}>
                      {sanitizeText(name)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {personaSummary.disagreedWithMost.length > 0 && (
              <View style={styles.socialColumn}>
                <Text style={styles.socialTitle}>Disagreed With</Text>
                {personaSummary.disagreedWithMost.map((name, idx) => (
                  <View key={idx} style={[styles.socialName, { backgroundColor: colors.red[50], color: colors.red[700] }]}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.red[700] }}>
                      {sanitizeText(name)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {personaSummary.influencedBy.length > 0 && (
              <View style={styles.socialColumn}>
                <Text style={styles.socialTitle}>Influenced By</Text>
                {personaSummary.influencedBy.map((name, idx) => (
                  <View key={idx} style={[styles.socialName, { backgroundColor: colors.purple[50], color: colors.purple[700] }]}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.purple[700] }}>
                      {sanitizeText(name)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Statements Pages */}
      {statements && statements.length > 0 && statements.map((statement, idx) => {
        const isNewPage = idx % 6 === 0;
        const pageNumber = Math.floor(idx / 6) + 3;

        if (!isNewPage) return null;

        const pageStatements = statements.slice(idx, idx + 6);

        return (
          <Page key={idx} size="LETTER" style={baseStyles.page}>
            <PDFHeader
              title={`${personaSummary.personaName} - Statements`}
              subtitle={caseInfo.name}
                />

            <View style={baseStyles.container}>
              <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>
                All Statements ({statements.length} total)
              </Text>

              {pageStatements.map((stmt) => (
                <View key={stmt.id} style={styles.statementCard}>
                  <View style={styles.statementHeader}>
                    <Text style={styles.statementMeta}>
                      Statement {stmt.sequenceNumber} (Round {stmt.speakCount})
                    </Text>
                    {stmt.sentiment && (
                      <View style={[
                        styles.sentimentBadge,
                        {
                          backgroundColor:
                            stmt.sentiment === 'plaintiff_leaning' ? colors.green[100] :
                            stmt.sentiment === 'defense_leaning' ? colors.red[100] :
                            colors.gray[100],
                        },
                      ]}>
                        <Text style={{
                          fontSize: fontSize.xs,
                          color:
                            stmt.sentiment === 'plaintiff_leaning' ? colors.green[700] :
                            stmt.sentiment === 'defense_leaning' ? colors.red[700] :
                            colors.gray[700],
                        }}>
                          {stmt.sentiment.replace('_', ' ')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.statementText}>
                    {sanitizeText(stmt.content)}
                  </Text>
                </View>
              ))}
            </View>

            <PDFFooter />
          </Page>
        );
      })}
    </Document>
  );
}
