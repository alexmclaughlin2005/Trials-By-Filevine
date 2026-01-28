import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { FullTranscriptPDFDocument } from '@/src/lib/pdf/templates/FullTranscriptPDFDocument';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';
import type { TranscriptPDFData, StatementData, PersonaSummaryData } from '@/src/lib/pdf/types';

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Await params in Next.js 15+
    const { conversationId } = await context.params;

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

    // Fetch all statements
    const statementsRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/statements`,
      { headers }
    );
    if (!statementsRes.ok) {
      return NextResponse.json(
        { error: 'Statements not found' },
        { status: 404 }
      );
    }
    const statementsData = await statementsRes.json();

    // Sort statements by sequence number
    const statements: StatementData[] = statementsData.sort(
      (a: { sequenceNumber: number }, b: { sequenceNumber: number }) => a.sequenceNumber - b.sequenceNumber
    );

    // Get persona summaries from conversation response (optional, for summary page)
    const personaSummaries: PersonaSummaryData[] | undefined = conversation.personaSummaries || undefined;

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
    const pdfData: TranscriptPDFData = {
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
      statements,
      caseInfo: {
        id: caseInfo.id,
        name: caseInfo.name,
        caseNumber: caseInfo.caseNumber,
        jurisdiction: caseInfo.jurisdiction,
        clientName: caseInfo.clientName,
      },
      personaSummaries,
    };

    // Generate PDF
    const pdfDocument = React.createElement(FullTranscriptPDFDocument, { data: pdfData });
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename(
      'focus-group-transcript',
      caseInfo.name
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
    console.error('Error generating transcript PDF:', error);

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
