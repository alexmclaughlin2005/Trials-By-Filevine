import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { AllPersonasInsightsPDFDocument } from '@/src/lib/pdf/templates/AllPersonasInsightsPDFDocument';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

interface PersonaSummary {
  personaId: string;
  personaName: string;
  position?: string;
  persona?: {
    archetype?: string;
  };
}

interface PersonaInsight {
  personaId: string;
  caseInterpretation?: string;
  keyBiases?: string[];
  decisionDrivers?: string[];
  persuasionStrategy?: string;
  vulnerabilities?: string[];
  strengths?: string[];
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
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
        { error: conversationRes.status === 401 ? 'Unauthorized' : 'Conversation not found', details: errorText },
        { status: conversationRes.status }
      );
    }
    const conversation = await conversationRes.json();

    // Get persona summaries from conversation response
    const personaSummaries = conversation.personaSummaries || [];

    if (personaSummaries.length === 0) {
      return NextResponse.json(
        { error: 'No persona summaries found' },
        { status: 404 }
      );
    }

    // Fetch persona insights
    const insightsRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/persona-insights`,
      { headers }
    );

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

    // Fetch case information
    let caseId = conversation.session?.caseId || conversation.caseId;

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

    // Build personas array with insights
    const personas = personaSummaries.map((summary: PersonaSummary) => {
      const insight = insights.find((i: PersonaInsight) => i.personaId === summary.personaId);

      return {
        personaId: summary.personaId,
        personaName: summary.personaName,
        archetype: summary.persona?.archetype,
        position: summary.position,
        caseInterpretation: insight?.caseInterpretation || 'No interpretation available',
        keyBiases: insight?.keyBiases || [],
        decisionDrivers: insight?.decisionDrivers || [],
        persuasionStrategy: insight?.persuasionStrategy || 'No strategy available',
        vulnerabilities: insight?.vulnerabilities || [],
        strengths: insight?.strengths || [],
      };
    });

    // Prepare PDF data
    const pdfData = {
      conversationId: conversation.id,
      conversationTitle: conversation.argument?.title || conversation.argumentTitle || 'Focus Group Discussion',
      caseInfo: {
        id: caseInfo.id,
        name: caseInfo.name,
        caseNumber: caseInfo.caseNumber,
        jurisdiction: caseInfo.jurisdiction,
        clientName: caseInfo.clientName,
      },
      personas,
    };

    // Generate PDF
    const pdfDocument = React.createElement(AllPersonasInsightsPDFDocument, { data: pdfData });
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename(
      'all-personas-insights',
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
    console.error('Error generating all personas PDF:', error);

    if (error instanceof Error) {
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
