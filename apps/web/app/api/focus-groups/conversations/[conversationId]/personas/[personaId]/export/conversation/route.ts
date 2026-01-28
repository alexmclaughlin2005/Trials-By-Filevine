import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { PersonaConversationPDFDocument } from '@/src/lib/pdf/templates/PersonaConversationPDFDocument';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';
import type { PersonaSummaryPDFData, StatementData } from '@/src/lib/pdf/types';

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
  try {
    // Await params in Next.js 15+
    const { conversationId, personaId } = await context.params;

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
      return NextResponse.json(
        { error: 'Persona summary not found' },
        { status: 404 }
      );
    }

    // Fetch statements and filter for this persona
    const statementsRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/statements`,
      { headers }
    );
    let statements: StatementData[] = [];
    if (statementsRes.ok) {
      const allStatements = await statementsRes.json();
      // Filter statements for this persona
      statements = allStatements
        .filter((stmt: { personaId: string }) => stmt.personaId === personaId)
        .sort((a: { sequenceNumber: number }, b: { sequenceNumber: number }) => a.sequenceNumber - b.sequenceNumber);
    }

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
    const pdfData: PersonaSummaryPDFData = {
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
      caseInfo: {
        id: caseInfo.id,
        name: caseInfo.name,
        caseNumber: caseInfo.caseNumber,
        jurisdiction: caseInfo.jurisdiction,
        clientName: caseInfo.clientName,
      },
      statements,
    };

    // Generate PDF
    const pdfDocument = React.createElement(PersonaConversationPDFDocument, { data: pdfData });
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename(
      'persona-conversation',
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
    console.error('Error generating persona conversation PDF:', error);

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Resource not found. Please ensure the conversation exists.' },
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
