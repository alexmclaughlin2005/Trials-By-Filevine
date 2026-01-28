import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { PersonaInsightsPDFDocument } from '@/src/lib/pdf/templates/PersonaInsightsPDFDocument';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';
import type { PersonaInsightsPDFData } from '@/src/lib/pdf/types';

interface RouteContext {
  params: Promise<{
    conversationId: string;
    personaId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  console.log('=== Persona Insights PDF Export Route Called ===');
  try {
    // Await params in Next.js 15+
    const { conversationId, personaId } = await context.params;
    console.log('conversationId:', conversationId, 'personaId:', personaId);

    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Make direct authenticated fetch calls with the token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    // Fetch conversation data
    const conversationRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}`,
      { headers }
    );
    if (!conversationRes.ok) {
      const errorText = await conversationRes.text();
      console.error(`Failed to fetch conversation: ${conversationRes.status}`, errorText);
      return NextResponse.json(
        { error: 'Conversation not found', details: errorText },
        { status: 404 }
      );
    }
    const conversation = await conversationRes.json();

    // Get persona summaries from conversation response
    const personaSummaries = conversation.personaSummaries || [];
    const personaSummary = personaSummaries.find((s: { personaId: string }) => s.personaId === personaId);

    if (!personaSummary) {
      console.error('Persona summary not found for personaId:', personaId);
      console.error('Available personaIds:', personaSummaries.map((s: { personaId: string }) => s.personaId));
      return NextResponse.json(
        { error: 'Persona summary not found' },
        { status: 404 }
      );
    }

    // Fetch persona insights
    console.log('Fetching persona insights from:', `${apiUrl}/focus-groups/conversations/${conversationId}/persona-insights`);
    const insightsRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/persona-insights`,
      { headers }
    );
    console.log('Persona insights response status:', insightsRes.status);

    if (!insightsRes.ok) {
      const errorText = await insightsRes.text();
      console.error('Failed to fetch persona insights:', insightsRes.status, errorText);
      return NextResponse.json(
        { error: 'Persona insights not found. Please generate insights first.', details: errorText },
        { status: 404 }
      );
    }

    const insightsResponse = await insightsRes.json();
    const insights = insightsResponse.insights || [];
    console.log('Fetched insights count:', Array.isArray(insights) ? insights.length : 'not an array');
    console.log('Looking for personaId:', personaId);

    const personaInsight = insights.find((i: { personaId: string }) => i.personaId === personaId);

    if (!personaInsight) {
      console.error('Persona insight not found for personaId:', personaId);
      console.error('Available personaIds:', insights.map((i: { personaId: string }) => i.personaId));
      return NextResponse.json(
        { error: 'Persona insight not found for this persona' },
        { status: 404 }
      );
    }

    console.log('Found persona insight for:', personaInsight.personaName);

    // Fetch case information
    let caseId = conversation.session?.caseId || conversation.caseId;

    // If caseId not in conversation, try to fetch the session
    if (!caseId && conversation.sessionId) {
      const sessionRes = await fetch(
        `${apiUrl}/focus-groups/sessions/${conversation.sessionId}`,
        { headers }
      );
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        caseId = session.caseId;
      }
    }

    // If still no caseId, try to extract from referer URL
    if (!caseId) {
      const referer = request.headers.get('referer');
      if (referer) {
        const match = referer.match(/\/cases\/([a-f0-9-]+)\//);
        if (match) {
          caseId = match[1];
        }
      }
    }

    if (!caseId) {
      console.error('No caseId found in conversation, session, or referer');
      return NextResponse.json(
        { error: 'Case ID not found' },
        { status: 400 }
      );
    }

    const caseRes = await fetch(`${apiUrl}/cases/${caseId}`, { headers });
    if (!caseRes.ok) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    const caseInfo = await caseRes.json();

    // Prepare PDF data
    const pdfData: PersonaInsightsPDFData = {
      conversation: {
        id: conversation.id,
        argumentId: conversation.argumentId,
        argumentTitle: conversation.argument?.title || conversation.argumentTitle || 'Untitled Argument',
        startedAt: conversation.startedAt,
        completedAt: conversation.completedAt,
        converged: conversation.converged || false,
        convergenceReason: conversation.convergenceReason,
        consensusAreas: conversation.consensusAreas || [],
        fracturePoints: conversation.fracturePoints || [],
        keyDebatePoints: conversation.keyDebatePoints || [],
        influentialPersonas: conversation.influentialPersonas || [],
      },
      personaSummary: {
        personaId: personaSummary.personaId,
        personaName: personaSummary.personaName,
        totalStatements: personaSummary.totalStatements,
        initialPosition: personaSummary.initialPosition,
        finalPosition: personaSummary.finalPosition,
        positionShifted: personaSummary.positionShifted,
        shiftDescription: personaSummary.shiftDescription,
        mainPoints: personaSummary.mainPoints || [],
        concernsRaised: personaSummary.concernsRaised || [],
        questionsAsked: personaSummary.questionsAsked || [],
        influenceLevel: personaSummary.influenceLevel,
        agreedWithMost: personaSummary.agreedWithMost || [],
        disagreedWithMost: personaSummary.disagreedWithMost || [],
        influencedBy: personaSummary.influencedBy || [],
        averageSentiment: personaSummary.averageSentiment,
        averageEmotionalIntensity: personaSummary.averageEmotionalIntensity,
        summary: personaSummary.summary || '',
        persona: personaSummary.persona,
      },
      personaInsight: {
        personaId: personaInsight.personaId,
        personaName: personaInsight.personaName,
        caseInterpretation: personaInsight.caseInterpretation,
        keyBiases: personaInsight.keyBiases || [],
        decisionDrivers: personaInsight.decisionDrivers || [],
        persuasionStrategy: personaInsight.persuasionStrategy,
        vulnerabilities: personaInsight.vulnerabilities || [],
        strengths: personaInsight.strengths || [],
      },
      caseInfo: {
        id: caseInfo.id,
        name: caseInfo.name,
        caseNumber: caseInfo.caseNumber,
        jurisdiction: caseInfo.jurisdiction,
        clientName: caseInfo.clientName,
      },
    };

    // Generate PDF
    const pdfDocument = React.createElement(PersonaInsightsPDFDocument, { data: pdfData });
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename(
      'persona-case-insights',
      `${caseInfo.name}-${personaSummary.personaName}`
    );

    // Return PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating persona insights PDF:', error);

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Resource not found. Please ensure the conversation and insights exist.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate PDF', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while generating the PDF' },
      { status: 500 }
    );
  }
}
