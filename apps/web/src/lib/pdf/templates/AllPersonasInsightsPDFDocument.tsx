/**
 * All Personas Insights PDF Document
 *
 * Generates a comprehensive PDF with insights for all personas in a single document
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { baseStyles, colors, fontSize, spacing } from '../styles/pdfStyles';
import { PDFHeader } from '../components/PDFHeader';
import { PDFFooter } from '../components/PDFFooter';
import { sanitizeText } from '../utils/formatters';

interface PersonaInsightData {
  personaId: string;
  personaName: string;
  archetype?: string;
  position?: string;
  caseInterpretation: string;
  keyBiases: string[];
  decisionDrivers: string[];
  persuasionStrategy: string;
  vulnerabilities: string[];
  strengths: string[];
}

interface AllPersonasInsightsPDFData {
  conversationId: string;
  conversationTitle: string;
  caseInfo: {
    id: string;
    name: string;
    caseNumber?: string;
    jurisdiction?: string;
    clientName?: string;
  };
  personas: PersonaInsightData[];
}

const styles = StyleSheet.create({
  coverBrand: {
    fontSize: fontSize['4xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  coverType: {
    fontSize: fontSize['2xl'],
    color: colors.gray[700],
    marginBottom: spacing['3xl'],
    textAlign: 'center',
  },
  coverMetaItem: {
    marginBottom: spacing.sm,
  },
  coverMetaLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  coverMetaValue: {
    fontSize: fontSize.lg,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[900],
  },
  personaDivider: {
    marginTop: spacing['3xl'],
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.primary[500],
  },
  personaHeader: {
    fontSize: fontSize['2xl'],
    fontFamily: 'Helvetica-Bold',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  personaSubheader: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.base,
    lineHeight: 1.6,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  bullet: {
    width: 16,
    fontSize: fontSize.base,
    color: colors.primary[600],
  },
  listText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 1.5,
    color: colors.gray[700],
  },
  badge: {
    display: 'inline-block',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    marginRight: spacing.sm,
  },
});

export function AllPersonasInsightsPDFDocument({ data }: { data: AllPersonasInsightsPDFData }) {
  const { conversationTitle, caseInfo, personas } = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title="TrialForge"
          subtitle="All Personas Case Insights"
        />

        <View style={baseStyles.container}>
          <Text style={styles.coverBrand}>All Personas</Text>
          <Text style={styles.coverType}>Comprehensive Case Insights Report</Text>

          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Case</Text>
              <Text style={styles.coverMetaValue}>{sanitizeText(caseInfo.name)}</Text>
            </View>

            {caseInfo.caseNumber && (
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Case Number</Text>
                <Text style={styles.coverMetaValue}>{sanitizeText(caseInfo.caseNumber)}</Text>
              </View>
            )}

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Conversation</Text>
              <Text style={styles.coverMetaValue}>{sanitizeText(conversationTitle)}</Text>
            </View>

            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Total Personas</Text>
              <Text style={styles.coverMetaValue}>{personas.length}</Text>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Persona Pages */}
      {personas.map((persona, index) => (
        <React.Fragment key={persona.personaId}>
          <Page size="LETTER" style={baseStyles.page}>
            <PDFHeader
              title="All Personas Insights"
              subtitle={caseInfo.name}
            />

            <View style={baseStyles.container}>
              {/* Persona Header */}
              <View style={index === 0 ? {} : styles.personaDivider}>
                <Text style={styles.personaHeader}>
                  {sanitizeText(persona.personaName)}
                </Text>
                {persona.archetype && (
                  <Text style={styles.personaSubheader}>
                    {sanitizeText(persona.archetype.replace(/_/g, ' '))}
                  </Text>
                )}
              </View>

              {/* Case Interpretation */}
              <Text style={styles.sectionTitle}>How They See the Case</Text>
              <Text style={styles.bodyText}>
                {sanitizeText(persona.caseInterpretation)}
              </Text>

              {/* Key Biases */}
              {persona.keyBiases && persona.keyBiases.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Key Biases</Text>
                  {persona.keyBiases.map((bias, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{sanitizeText(bias)}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Decision Drivers */}
              {persona.decisionDrivers && persona.decisionDrivers.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Decision Drivers</Text>
                  {persona.decisionDrivers.map((driver, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{sanitizeText(driver)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            <PDFFooter />
          </Page>

          {/* Page 2 for this persona - Persuasion Strategy & Vulnerabilities */}
          <Page size="LETTER" style={baseStyles.page}>
            <PDFHeader
              title="All Personas Insights"
              subtitle={caseInfo.name}
            />

            <View style={baseStyles.container}>
              <Text style={styles.personaHeader}>
                {sanitizeText(persona.personaName)} (continued)
              </Text>

              {/* Persuasion Strategy */}
              <Text style={styles.sectionTitle}>Persuasion Strategy</Text>
              <Text style={styles.bodyText}>
                {sanitizeText(persona.persuasionStrategy)}
              </Text>

              {/* Vulnerabilities */}
              {persona.vulnerabilities && persona.vulnerabilities.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Vulnerabilities</Text>
                  {persona.vulnerabilities.map((vuln, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{sanitizeText(vuln)}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Strengths */}
              {persona.strengths && persona.strengths.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Strengths</Text>
                  {persona.strengths.map((strength, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{sanitizeText(strength)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            <PDFFooter />
          </Page>
        </React.Fragment>
      ))}
    </Document>
  );
}
