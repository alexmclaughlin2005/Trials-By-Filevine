/**
 * Export Focus Group Takeaways as PDF
 *
 * Generates a professional PDF report of key insights from a focus group conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { generatePDFBuffer, generatePDFFilename } from '@/src/lib/pdf/utils/generatePDF';
import { TakeawaysPDFDocument } from '@/src/lib/pdf/templates/TakeawaysPDFDocument';
import type { TakeawaysPDFData } from '@/src/lib/pdf/types';

interface RouteParams {
  params: {
    conversationId: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteParams
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
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    const conversation = await conversationRes.json();

    // Fetch takeaways
    const takeawaysRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/takeaways`,
      { headers }
    );
    if (!takeawaysRes.ok) {
      return NextResponse.json(
        { error: 'Takeaways not found. Please generate takeaways first.' },
        { status: 404 }
      );
    }
    const takeawaysResponse = await takeawaysRes.json();

    // Fetch case information
    const caseId = conversation.session?.caseId || conversation.caseId;
    const caseRes = await fetch(`${apiUrl}/cases/${caseId}`, { headers });
    if (!caseRes.ok) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    const caseInfo = await caseRes.json();

    // Fetch persona summaries
    const summariesRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/persona-summaries`,
      { headers }
    );
    const personaSummaries = summariesRes.ok ? await summariesRes.json() : [];

    // Prepare PDF data
    const pdfData: TakeawaysPDFData = {
      conversation: {
        id: conversation.id,
        argumentId: conversation.argumentId,
        argumentTitle: conversation.argument?.title || 'Untitled Argument',
        startedAt: conversation.startedAt,
        completedAt: conversation.completedAt,
        converged: conversation.converged || false,
        convergenceReason: conversation.convergenceReason,
        consensusAreas: conversation.consensusAreas || [],
        fracturePoints: conversation.fracturePoints || [],
        keyDebatePoints: conversation.keyDebatePoints || [],
        influentialPersonas: conversation.influentialPersonas || [],
      },
      takeaways: {
        whatLanded: takeawaysResponse.takeaways.whatLanded || [],
        whatConfused: takeawaysResponse.takeaways.whatConfused || [],
        whatBackfired: takeawaysResponse.takeaways.whatBackfired || [],
        topQuestions: takeawaysResponse.takeaways.topQuestions || [],
        recommendedEdits: takeawaysResponse.takeaways.recommendedEdits || [],
        promptVersion: takeawaysResponse.promptVersion,
        generatedAt: takeawaysResponse.generatedAt,
      },
      caseInfo: {
        id: caseInfo.id,
        name: caseInfo.name,
        caseNumber: caseInfo.caseNumber,
        jurisdiction: caseInfo.jurisdiction,
        clientName: caseInfo.clientName,
      },
      personaSummaries: personaSummaries || [],
    };

    // Generate PDF
    const pdfDocument = React.createElement(TakeawaysPDFDocument, pdfData);
    const pdfBuffer = await generatePDFBuffer(pdfDocument);

    // Generate filename
    const filename = generatePDFFilename(
      'focus-group-takeaways',
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
    console.error('Error generating takeaways PDF:', error);

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Resource not found. Please ensure the conversation and takeaways exist.' },
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
