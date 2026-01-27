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

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  console.log('=== PDF Export Route Handler Called ===');
  try {
    // Await params in Next.js 15+
    const { conversationId } = await context.params;
    console.log('Conversation ID:', conversationId);

    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    console.log('Auth token:', authToken ? 'present' : 'missing');

    if (!authToken) {
      console.error('No auth token provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Make direct authenticated fetch calls with the token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    console.log('API URL:', apiUrl);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    // Fetch conversation data
    console.log('Fetching conversation from:', `${apiUrl}/focus-groups/conversations/${conversationId}`);
    const conversationRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}`,
      { headers }
    );
    console.log('Conversation response status:', conversationRes.status);
    if (!conversationRes.ok) {
      const errorText = await conversationRes.text();
      console.error(`Failed to fetch conversation: ${conversationRes.status}`, errorText);
      return NextResponse.json(
        { error: 'Conversation not found', details: errorText },
        { status: 404 }
      );
    }

    console.log('About to parse conversation JSON...');
    let conversation;
    try {
      conversation = await conversationRes.json();
      console.log('Conversation fetched successfully');
      console.log('Conversation keys:', Object.keys(conversation));
      console.log('Conversation session:', conversation.session ? 'present' : 'null');
      console.log('Conversation sessionId:', conversation.sessionId);
    } catch (parseError) {
      console.error('Failed to parse conversation JSON:', parseError);
      throw parseError;
    }

    // Fetch takeaways
    console.log('Fetching takeaways from:', `${apiUrl}/focus-groups/conversations/${conversationId}/takeaways`);
    const takeawaysRes = await fetch(
      `${apiUrl}/focus-groups/conversations/${conversationId}/takeaways`,
      { headers }
    );
    console.log('Takeaways response status:', takeawaysRes.status);
    if (!takeawaysRes.ok) {
      const errorText = await takeawaysRes.text();
      console.error(`Failed to fetch takeaways: ${takeawaysRes.status}`, errorText);
      return NextResponse.json(
        { error: 'Takeaways not found. Please generate takeaways first.', details: errorText },
        { status: 404 }
      );
    }
    const takeawaysResponse = await takeawaysRes.json();
    console.log('Takeaways parsed successfully');

    // Fetch case information
    let caseId = conversation.session?.caseId || conversation.caseId;
    console.log('Initial caseId from conversation:', caseId);

    // If caseId not in conversation, try to fetch the session
    if (!caseId && conversation.sessionId) {
      console.log('Fetching session to get caseId, sessionId:', conversation.sessionId);
      const sessionRes = await fetch(
        `${apiUrl}/focus-groups/sessions/${conversation.sessionId}`,
        { headers }
      );
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        caseId = session.caseId;
        console.log('Got caseId from session:', caseId);
      }
    }

    // If still no caseId, try to extract from referer URL
    if (!caseId) {
      const referer = request.headers.get('referer');
      console.log('Trying referer for caseId, referer:', referer);
      if (referer) {
        const match = referer.match(/\/cases\/([a-f0-9-]+)\//);
        if (match) {
          caseId = match[1];
          console.log('Extracted caseId from referer:', caseId);
        }
      }
    }

    console.log('Final caseId:', caseId);

    if (!caseId) {
      console.error('No caseId found in conversation, session, or referer');
      return NextResponse.json(
        { error: 'Case ID not found' },
        { status: 400 }
      );
    }

    const caseRes = await fetch(`${apiUrl}/cases/${caseId}`, { headers });
    console.log('Case response status:', caseRes.status);
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
