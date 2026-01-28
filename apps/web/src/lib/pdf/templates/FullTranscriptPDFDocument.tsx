/**
 * FullTranscriptPDFDocument
 *
 * Professional PDF report for complete focus group transcript
 * Includes: All statements from all personas in chronological order with metadata
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
  formatDateTime,
  sanitizeText,
} from '../utils/formatters';
import type { TranscriptPDFData } from '../types';

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
    width: 150,
  },
  coverMetaValue: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    flex: 1,
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  personaName: {
    fontSize: fontSize.sm,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
  },
  statementMeta: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  sentimentBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
  },
  sentimentText: {
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
  },
  statementText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 1.5,
  },

  // Section divider
  sectionDivider: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.gray[300],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[700],
    textAlign: 'center',
  },

  // Summary stats
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  statValue: {
    fontSize: fontSize.lg,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
});

interface Props {
  data: TranscriptPDFData;
}

export function FullTranscriptPDFDocument({ data }: Props) {
  const { conversation, statements, caseInfo, personaSummaries } = data;

  // Calculate stats
  const totalStatements = statements.length;
  const uniquePersonas = new Set(statements.map(s => s.personaName)).size;
  const rounds = Math.max(...statements.map(s => s.speakCount), 0);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title="TrialForge"
          subtitle="Focus Group Transcript"
        />

        <View style={baseStyles.container}>
          <Text style={styles.coverBrand}>Complete Transcript</Text>
          <Text style={styles.coverType}>Full Focus Group Conversation</Text>

          <View style={{ marginBottom: spacing.xl }}>
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
              <Text style={styles.coverMetaLabel}>Argument Tested:</Text>
              <Text style={styles.coverMetaValue}>
                {sanitizeText(conversation.argumentTitle || 'Untitled')}
              </Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Session Started:</Text>
              <Text style={styles.coverMetaValue}>
                {formatDateTime(conversation.startedAt)}
              </Text>
            </View>

            {conversation.completedAt && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Session Completed:</Text>
                <Text style={styles.coverMetaValue}>
                  {formatDateTime(conversation.completedAt)}
                </Text>
              </View>
            )}

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Converged:</Text>
              <Text style={styles.coverMetaValue}>
                {conversation.converged ? 'Yes' : 'No'}
              </Text>
            </View>

            {conversation.converged && conversation.convergenceReason && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Convergence Reason:</Text>
                <Text style={styles.coverMetaValue}>
                  {sanitizeText(conversation.convergenceReason)}
                </Text>
              </View>
            )}
          </View>

          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalStatements}</Text>
              <Text style={styles.statLabel}>STATEMENTS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{uniquePersonas}</Text>
              <Text style={styles.statLabel}>PERSONAS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{rounds}</Text>
              <Text style={styles.statLabel}>ROUNDS</Text>
            </View>
          </View>
        </View>

        <PDFFooter
          pageNumber={1}
          caseName={caseInfo.name}
          confidential
        />
      </Page>

      {/* Transcript Pages */}
      {statements.map((statement, idx) => {
        const isNewPage = idx % 5 === 0;
        const pageNumber = Math.floor(idx / 5) + 2;

        if (!isNewPage) return null;

        const pageStatements = statements.slice(idx, idx + 5);

        // Check if we're starting a new round
        const currentRound = statement.speakCount;
        const isNewRound = idx === 0 || statements[idx - 1].speakCount !== currentRound;

        return (
          <Page key={idx} size="LETTER" style={baseStyles.page}>
            <PDFHeader
              title="Focus Group Transcript"
              subtitle={caseInfo.name}
            />

            <View style={baseStyles.container}>
              {isNewRound && (
                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionTitle}>
                    Round {currentRound}
                  </Text>
                </View>
              )}

              {pageStatements.map((stmt) => {
                // Check if this statement starts a new round on this page
                const stmtIsNewRound =
                  stmt.id !== statement.id &&
                  pageStatements.findIndex(s => s.id === stmt.id) > 0 &&
                  pageStatements[pageStatements.findIndex(s => s.id === stmt.id) - 1].speakCount !== stmt.speakCount;

                return (
                  <React.Fragment key={stmt.id}>
                    {stmtIsNewRound && (
                      <View style={styles.sectionDivider}>
                        <Text style={styles.sectionTitle}>
                          Round {stmt.speakCount}
                        </Text>
                      </View>
                    )}

                    <View style={styles.statementCard}>
                      <View style={styles.statementHeader}>
                        <View>
                          <Text style={styles.personaName}>
                            {sanitizeText(stmt.personaName)}
                          </Text>
                          <Text style={styles.statementMeta}>
                            Statement #{stmt.sequenceNumber} • Round {stmt.speakCount}
                          </Text>
                        </View>
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
                            <Text style={[
                              styles.sentimentText,
                              {
                                color:
                                  stmt.sentiment === 'plaintiff_leaning' ? colors.green[700] :
                                  stmt.sentiment === 'defense_leaning' ? colors.red[700] :
                                  colors.gray[700],
                              },
                            ]}>
                              {stmt.sentiment.replace('_', ' ')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.statementText}>
                        {sanitizeText(stmt.content)}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            <PDFFooter
              pageNumber={pageNumber}
              caseName={caseInfo.name}
              confidential
            />
          </Page>
        );
      })}

      {/* Persona Summary Page (if available) */}
      {personaSummaries && personaSummaries.length > 0 && (
        <Page size="LETTER" style={baseStyles.page}>
          <PDFHeader
            title="Focus Group Transcript - Persona Summary"
            subtitle={caseInfo.name}
          />

          <View style={baseStyles.container}>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>
                Persona Summary
              </Text>
            </View>

            {personaSummaries.map((persona, idx) => (
              <View key={idx} style={styles.statementCard}>
                <Text style={styles.personaName}>
                  {sanitizeText(persona.personaName)}
                </Text>
                <Text style={styles.statementMeta}>
                  {persona.totalStatements} statements • {persona.influenceLevel} influence • {persona.initialPosition}
                  {persona.positionShifted && ` → ${persona.finalPosition}`}
                </Text>
                {persona.summary && (
                  <Text style={[styles.statementText, { marginTop: spacing.xs }]}>
                    {sanitizeText(persona.summary)}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <PDFFooter
            pageNumber={Math.ceil(statements.length / 5) + 2}
            caseName={caseInfo.name}
            confidential
          />
        </Page>
      )}
    </Document>
  );
}
