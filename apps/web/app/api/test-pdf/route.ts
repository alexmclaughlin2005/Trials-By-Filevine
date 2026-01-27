/**
 * Test PDF Generation Route
 *
 * Simple endpoint to verify PDF generation works with sample data
 * DELETE THIS FILE after testing is complete
 */

import { NextResponse } from 'next/server';
import React from 'react';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';
import { TakeawaysPDFDocument } from '@/src/lib/pdf/templates/TakeawaysPDFDocument';
import type { TakeawaysPDFData } from '@/src/lib/pdf/types';

// Sample test data
const sampleData: TakeawaysPDFData = {
  caseInfo: {
    id: 'test-case-1',
    name: 'Smith v. Jones Manufacturing',
    caseNumber: '2025-CV-12345',
    jurisdiction: 'Superior Court of California',
  },
  conversation: {
    id: 'conv-1',
    argumentId: 'arg-1',
    argumentTitle: 'Opening Statement - Plaintiff Liability',
    startedAt: new Date('2026-01-20T10:00:00Z'),
    completedAt: new Date('2026-01-20T11:30:00Z'),
    converged: true,
    convergenceReason: 'Group reached consensus on key liability issues after 45 minutes of discussion.',
    consensusAreas: [
      'Manufacturing defect was clearly established',
      'Company had knowledge of the safety issue',
      'Damages were directly caused by the defect',
    ],
    fracturePoints: [
      'Amount of punitive damages appropriate',
      'Level of individual culpability vs corporate responsibility',
    ],
    keyDebatePoints: [
      'Industry standards at the time',
      'Comparative negligence of the plaintiff',
      'Whether warnings were adequate',
    ],
  },
  takeaways: {
    whatLanded: [
      {
        point: 'The timeline showing company emails about the defect resonated strongly with all jurors',
        personaSupport: ['The Bootstrapper', 'The Scale-Balancer', 'The Heart'],
        evidence: [
          'This is damning evidence - they knew and did nothing.',
          'The emails make it clear management was aware of the problem.',
        ],
      },
      {
        point: 'Personal story of the plaintiff gained significant emotional support',
        personaSupport: ['The Heart', 'The Crusader', 'The Bootstrapper'],
        evidence: [
          'You can see how this completely changed their life.',
          'No amount of money can fix this, but accountability matters.',
        ],
      },
    ],
    whatConfused: [
      {
        point: 'Technical engineering details about the product design were unclear',
        personasConfused: ['The Calculator', 'The Scale-Balancer'],
        severity: 'MEDIUM',
        evidence: [
          'I need someone to explain this in simple terms.',
          'Are we saying this was a design flaw or a manufacturing issue?',
        ],
      },
      {
        point: 'The distinction between actual damages and punitive damages was not well explained',
        personasConfused: ['The Heart', 'The Chameleon'],
        severity: 'HIGH',
        evidence: [
          'Wait, so we decide both types of damages?',
          'I thought punitive was separate from compensatory.',
        ],
      },
    ],
    whatBackfired: [
      {
        point: 'Suggesting the company "deliberately" harmed people felt like overreach',
        personasCritical: ['The Scale-Balancer', 'The Calculator'],
        severity: 'CRITICAL',
        evidence: [
          'That language is too strong - negligence yes, but deliberate harm? No.',
          'This undermines your credibility when you overstate it.',
        ],
      },
      {
        point: 'Attacking the defense expert witness personally rather than their methodology',
        personasCritical: ['The Captain', 'The Scale-Balancer', 'The Scarred'],
        severity: 'HIGH',
        evidence: [
          'The ad hominem attacks make you look desperate.',
          'Focus on discrediting the analysis, not the person.',
        ],
      },
    ],
    topQuestions: [
      {
        question: 'What exactly did the company know and when did they know it?',
        askedByCount: 5,
        personaNames: ['The Bootstrapper', 'The Calculator', 'The Scale-Balancer', 'The Captain', 'The Crusader'],
        severity: 'CRITICAL',
        priority: 'HIGH',
      },
      {
        question: 'How do we separate emotional reaction from legal liability?',
        askedByCount: 3,
        personaNames: ['The Scale-Balancer', 'The Calculator', 'The Chameleon'],
        severity: 'HIGH',
        priority: 'HIGH',
      },
      {
        question: 'What are comparable verdicts in similar cases?',
        askedByCount: 4,
        personaNames: ['The Calculator', 'The Scale-Balancer', 'The Captain', 'The Maverick'],
        severity: 'MEDIUM',
        priority: 'MEDIUM',
      },
    ],
    recommendedEdits: [
      {
        editNumber: 1,
        section: 'Opening Statement - Knowledge',
        type: 'SOFTEN',
        originalText: 'The company deliberately chose profits over safety, knowing full well that people would be harmed.',
        suggestedText: 'The company, despite being aware of the safety concerns through internal reports and emails, chose not to act - prioritizing production schedules and costs over addressing the known risks.',
        reason: 'The word "deliberately" triggers defensive reactions. Focus on the documented knowledge and failure to act rather than ascribing malicious intent. Let the facts speak for themselves.',
        affectedPersonas: ['The Scale-Balancer', 'The Calculator', 'The Captain'],
        priority: 'HIGH',
      },
      {
        editNumber: 2,
        section: 'Technical Explanation',
        type: 'CLARIFY',
        originalText: 'The product had a fatigue failure in the load-bearing member due to inadequate stress analysis during the design phase.',
        suggestedText: 'Think of it like a paperclip you bend back and forth - eventually it breaks. That\'s what happened here, but with a critical safety component. The company didn\'t properly test how the part would hold up over time with repeated use.',
        reason: 'Technical jargon loses jurors. Use relatable analogies that everyone can understand while maintaining accuracy.',
        affectedPersonas: ['The Heart', 'The Bootstrapper', 'The Chameleon'],
        priority: 'HIGH',
      },
      {
        editNumber: 3,
        section: 'Damages Discussion',
        type: 'ADD',
        suggestedText: 'Let me be clear about the two types of damages you\'ll consider. First, compensatory damages - that\'s making the plaintiff whole for medical bills, lost wages, and pain and suffering. Second, punitive damages - that\'s about sending a message that this kind of corporate conduct is unacceptable. These are separate decisions with different purposes.',
        reason: 'Multiple jurors showed confusion about the damages framework. Add a clear, simple explanation early in the presentation.',
        affectedPersonas: ['The Heart', 'The Chameleon', 'The Bootstrapper'],
        priority: 'HIGH',
      },
      {
        editNumber: 4,
        section: 'Expert Witness Rebuttal',
        type: 'REMOVE',
        originalText: 'Their so-called expert has made a career out of testifying for deep-pocketed defendants. Let\'s look at who\'s paying his bills.',
        suggestedText: 'Let\'s examine the methodology their expert used and why it doesn\'t account for the real-world conditions documented in the failure reports.',
        reason: 'Personal attacks on experts damage your credibility. Attack the analysis, not the person. Show why the methodology is flawed.',
        affectedPersonas: ['The Scale-Balancer', 'The Captain', 'The Scarred'],
        priority: 'MEDIUM',
      },
    ],
    promptVersion: 'takeaways-v1.0.0',
    generatedAt: new Date(),
  },
  personaSummaries: [
    {
      personaId: 'persona-1',
      personaName: 'The Bootstrapper',
      totalStatements: 12,
      initialPosition: 'neutral',
      finalPosition: 'favorable',
      positionShifted: true,
      shiftDescription: 'Moved from neutral to favorable after seeing the email evidence',
      mainPoints: ['Timeline matters', 'Actions speak louder than words'],
      concernsRaised: ['Need to see actual harm causation'],
      questionsAsked: ['When did they first know?'],
      influenceLevel: 'high',
      agreedWithMost: ['The Scale-Balancer', 'The Captain'],
      disagreedWithMost: [],
      influencedBy: ['The Calculator'],
      averageSentiment: 'plaintiff_leaning',
      averageEmotionalIntensity: 0.6,
      summary: 'Started skeptical but was convinced by documentary evidence',
    },
    {
      personaId: 'persona-2',
      personaName: 'The Scale-Balancer',
      totalStatements: 15,
      initialPosition: 'neutral',
      finalPosition: 'neutral',
      positionShifted: false,
      mainPoints: ['Need balance', 'Both sides have valid points'],
      concernsRaised: ['Overstatement damages credibility'],
      questionsAsked: ['What are the industry standards?'],
      influenceLevel: 'high',
      agreedWithMost: ['The Calculator'],
      disagreedWithMost: ['The Crusader'],
      influencedBy: [],
      averageSentiment: 'neutral',
      averageEmotionalIntensity: 0.3,
      summary: 'Remained balanced throughout, pushing both sides for evidence',
    },
  ],
};

export async function GET() {
  try {
    // Generate the PDF
    const pdfDocument = React.createElement(TakeawaysPDFDocument, sampleData);
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename('takeaways-test', sampleData.caseInfo.name);

    // Return PDF with proper Buffer type
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating test PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
