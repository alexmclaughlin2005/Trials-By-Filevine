/**
 * TakeawaysPDFDocument
 *
 * Professional PDF report for Focus Group Key Takeaways
 * Includes: What Landed, What Confused, What Backfired, Top Questions, Recommended Edits
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  baseStyles,
  colors,
  fontSize,
  spacing,
  severityStyles,
  priorityStyles,
} from '../styles/pdfStyles';
import { PDFHeader } from '../components/PDFHeader';
import { PDFFooter } from '../components/PDFFooter';
import {
  formatDate,
  formatDateTime,
  formatNameList,
  sanitizeText,
} from '../utils/formatters';
import type { TakeawaysPDFData } from '../types';

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

  // Executive summary
  summaryBox: {
    backgroundColor: colors.blue[50],
    padding: spacing.lg,
    borderRadius: 4,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontFamily: 'Helvetica-Bold',
    color: colors.blue[700],
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 1.6,
  },

  // Item cards
  itemCard: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  itemPoint: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    lineHeight: 1.5,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    marginRight: spacing.xs,
  },
  evidenceSection: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  evidenceLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[600],
    marginBottom: 4,
  },
  evidenceItem: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 1.5,
    marginBottom: 4,
    fontStyle: 'italic',
  },

  // Questions section
  questionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 4,
  },
  questionText: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    lineHeight: 1.5,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionMetaText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },

  // Edit recommendations
  editCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  editNumber: {
    fontSize: fontSize.base,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
  },
  editSection: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  editTypeAndPriority: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  textBlock: {
    marginBottom: spacing.sm,
  },
  textBlockLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  textBlockContent: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 1.5,
    padding: spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  editReason: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 1.5,
    marginTop: spacing.sm,
  },

  // Persona list
  personaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  personaChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.purple[50],
    color: colors.purple[700],
    fontSize: fontSize.xs,
    borderRadius: 3,
  },
});

type TakeawaysPDFDocumentProps = TakeawaysPDFData;

export const TakeawaysPDFDocument: React.FC<TakeawaysPDFDocumentProps> = ({
  conversation,
  takeaways,
  caseInfo,
  personaSummaries = [],
}) => {
  const participantNames = personaSummaries.map((p) => p.personaName);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <View style={baseStyles.coverPage}>
          <Text style={styles.coverBrand}>Juries by Filevine</Text>
          <Text style={styles.coverType}>Focus Group Key Takeaways</Text>

          <Text style={baseStyles.coverTitle}>{caseInfo.name}</Text>

          <View style={{ marginTop: spacing['2xl'], width: '100%' }}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Argument:</Text>
              <Text style={styles.coverMetaValue}>
                {conversation.argumentTitle || 'Untitled Argument'}
              </Text>
            </View>

            {caseInfo.caseNumber && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Case Number:</Text>
                <Text style={styles.coverMetaValue}>{caseInfo.caseNumber}</Text>
              </View>
            )}

            {caseInfo.jurisdiction && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Jurisdiction:</Text>
                <Text style={styles.coverMetaValue}>{caseInfo.jurisdiction}</Text>
              </View>
            )}

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Session Date:</Text>
              <Text style={styles.coverMetaValue}>
                {formatDate(conversation.completedAt || conversation.startedAt)}
              </Text>
            </View>

            {participantNames.length > 0 && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Participants:</Text>
                <Text style={styles.coverMetaValue}>{formatNameList(participantNames)}</Text>
              </View>
            )}

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Generated:</Text>
              <Text style={styles.coverMetaValue}>
                {formatDateTime(takeaways.generatedAt || new Date())}
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="LETTER" style={baseStyles.pageWithHeader}>
        <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>Executive Summary</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Convergence Status</Text>
            <Text style={styles.summaryText}>
              {conversation.converged
                ? `The group reached convergence. ${conversation.convergenceReason || ''}`
                : 'The group did not reach convergence. Multiple perspectives remained.'}
            </Text>
          </View>

          {conversation.consensusAreas && conversation.consensusAreas.length > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Key Consensus Areas</Text>
              {conversation.consensusAreas.map((area, idx) => (
                <Text key={idx} style={[styles.summaryText, { marginBottom: spacing.xs }]}>
                  • {sanitizeText(area)}
                </Text>
              ))}
            </View>
          )}

          {conversation.fracturePoints && conversation.fracturePoints.length > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Main Fracture Points</Text>
              {conversation.fracturePoints.map((point, idx) => (
                <Text key={idx} style={[styles.summaryText, { marginBottom: spacing.xs }]}>
                  • {sanitizeText(point)}
                </Text>
              ))}
            </View>
          )}
        </View>

        <PDFFooter generatedAt={takeaways.generatedAt} />
      </Page>

      {/* What Landed Section */}
      {takeaways.whatLanded.length > 0 && (
        <Page size="LETTER" style={baseStyles.pageWithHeader}>
          <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

          <View style={baseStyles.successSection}>
            <Text style={[baseStyles.h3, { color: colors.success }]}>✓ What Landed</Text>
            <Text style={baseStyles.bodySmall}>
              Arguments and points that resonated positively with the jury panel
            </Text>
          </View>

          {takeaways.whatLanded.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <Text style={styles.itemPoint}>{sanitizeText(item.point)}</Text>

              {item.personaSupport.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>
                    Supported by: {formatNameList(item.personaSupport)}
                  </Text>
                </View>
              )}

              {item.evidence.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>Evidence:</Text>
                  {item.evidence.slice(0, 2).map((evidence, evidenceIdx) => (
                    <Text key={evidenceIdx} style={styles.evidenceItem}>
                      &ldquo;{sanitizeText(evidence)}&rdquo;
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <PDFFooter generatedAt={takeaways.generatedAt} />
        </Page>
      )}

      {/* What Confused Section */}
      {takeaways.whatConfused.length > 0 && (
        <Page size="LETTER" style={baseStyles.pageWithHeader}>
          <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

          <View style={baseStyles.warningSection}>
            <Text style={[baseStyles.h3, { color: colors.warning }]}>? What Confused</Text>
            <Text style={baseStyles.bodySmall}>
              Points that raised questions or caused confusion among jurors
            </Text>
          </View>

          {takeaways.whatConfused.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemMeta}>
                <View style={[styles.badge, severityStyles[item.severity]]}>
                  <Text>{item.severity}</Text>
                </View>
              </View>

              <Text style={styles.itemPoint}>{sanitizeText(item.point)}</Text>

              {item.personasConfused.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>
                    Confused: {formatNameList(item.personasConfused)}
                  </Text>
                </View>
              )}

              {item.evidence.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>Evidence:</Text>
                  {item.evidence.slice(0, 2).map((evidence, evidenceIdx) => (
                    <Text key={evidenceIdx} style={styles.evidenceItem}>
                      &ldquo;{sanitizeText(evidence)}&rdquo;
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <PDFFooter generatedAt={takeaways.generatedAt} />
        </Page>
      )}

      {/* What Backfired Section */}
      {takeaways.whatBackfired.length > 0 && (
        <Page size="LETTER" style={baseStyles.pageWithHeader}>
          <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

          <View style={baseStyles.dangerSection}>
            <Text style={[baseStyles.h3, { color: colors.danger }]}>✗ What Backfired</Text>
            <Text style={baseStyles.bodySmall}>
              Arguments that triggered negative reactions or skepticism
            </Text>
          </View>

          {takeaways.whatBackfired.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemMeta}>
                <View style={[styles.badge, severityStyles[item.severity]]}>
                  <Text>{item.severity}</Text>
                </View>
              </View>

              <Text style={styles.itemPoint}>{sanitizeText(item.point)}</Text>

              {item.personasCritical.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>
                    Critical: {formatNameList(item.personasCritical)}
                  </Text>
                </View>
              )}

              {item.evidence.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceLabel}>Evidence:</Text>
                  {item.evidence.slice(0, 2).map((evidence, evidenceIdx) => (
                    <Text key={evidenceIdx} style={styles.evidenceItem}>
                      &ldquo;{sanitizeText(evidence)}&rdquo;
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <PDFFooter generatedAt={takeaways.generatedAt} />
        </Page>
      )}

      {/* Top Questions Section */}
      {takeaways.topQuestions.length > 0 && (
        <Page size="LETTER" style={baseStyles.pageWithHeader}>
          <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

          <View style={baseStyles.section}>
            <Text style={baseStyles.h2}>Top Questions to Prepare For</Text>
            <Text style={baseStyles.bodySmall}>
              Questions raised by multiple jurors, sorted by priority
            </Text>
          </View>

          {takeaways.topQuestions
            .sort((a, b) => {
              const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .map((item, idx) => (
              <View key={idx} style={styles.questionCard}>
                <Text style={styles.questionText}>{sanitizeText(item.question)}</Text>

                <View style={styles.questionMeta}>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    <View style={[styles.badge, priorityStyles[item.priority]]}>
                      <Text>{item.priority} PRIORITY</Text>
                    </View>
                    <View style={[styles.badge, severityStyles[item.severity]]}>
                      <Text>{item.severity}</Text>
                    </View>
                  </View>

                  <Text style={styles.questionMetaText}>
                    Asked by {item.askedByCount} {item.askedByCount === 1 ? 'juror' : 'jurors'}
                  </Text>
                </View>

                {item.personaNames.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={styles.evidenceLabel}>
                      {formatNameList(item.personaNames)}
                    </Text>
                  </View>
                )}
              </View>
            ))}

          <PDFFooter generatedAt={takeaways.generatedAt} />
        </Page>
      )}

      {/* Recommended Edits Section */}
      {takeaways.recommendedEdits.length > 0 && (
        <Page size="LETTER" style={baseStyles.pageWithHeader}>
          <PDFHeader title="Focus Group Takeaways" subtitle={caseInfo.name} />

          <View style={baseStyles.section}>
            <Text style={baseStyles.h2}>Recommended Argument Edits</Text>
            <Text style={baseStyles.bodySmall}>
              Strategic improvements based on jury feedback and concerns
            </Text>
          </View>

          {takeaways.recommendedEdits
            .sort((a, b) => {
              const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .map((edit, idx) => (
              <View key={idx} style={styles.editCard}>
                <View style={styles.editHeader}>
                  <Text style={styles.editNumber}>Edit #{edit.editNumber}</Text>
                  <Text style={styles.editSection}>{edit.section}</Text>
                </View>

                <View style={styles.editTypeAndPriority}>
                  <View style={[styles.badge, { backgroundColor: colors.blue[50], color: colors.blue[700] }]}>
                    <Text>{edit.type}</Text>
                  </View>
                  <View style={[styles.badge, priorityStyles[edit.priority]]}>
                    <Text>{edit.priority} PRIORITY</Text>
                  </View>
                </View>

                {edit.originalText && (
                  <View style={styles.textBlock}>
                    <Text style={styles.textBlockLabel}>Current Text:</Text>
                    <Text style={styles.textBlockContent}>{sanitizeText(edit.originalText)}</Text>
                  </View>
                )}

                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>
                    {edit.originalText ? 'Suggested Text:' : 'Suggested Addition:'}
                  </Text>
                  <Text style={styles.textBlockContent}>{sanitizeText(edit.suggestedText)}</Text>
                </View>

                <Text style={styles.editReason}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Reason: </Text>
                  {sanitizeText(edit.reason)}
                </Text>

                {edit.affectedPersonas.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={styles.evidenceLabel}>Affects:</Text>
                    <View style={styles.personaList}>
                      {edit.affectedPersonas.map((persona, pIdx) => (
                        <View key={pIdx} style={styles.personaChip}>
                          <Text>{persona}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

          <PDFFooter generatedAt={takeaways.generatedAt} />
        </Page>
      )}
    </Document>
  );
};
