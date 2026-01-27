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
import { apiClient } from '@/lib/api-client';

interface RouteParams {
  params: {
    conversationId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { conversationId } = params;

    // Fetch conversation data
    const conversation = await apiClient.get<any>(
      `/focus-groups/conversations/${conversationId}`
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch takeaways
    const takeawaysResponse = await apiClient.get<any>(
      `/focus-groups/conversations/${conversationId}/takeaways`
    );

    if (!takeawaysResponse || !takeawaysResponse.takeaways) {
      return NextResponse.json(
        { error: 'Takeaways not found. Please generate takeaways first.' },
        { status: 404 }
      );
    }

    // Fetch case information
    const caseInfo = await apiClient.get<any>(
      `/cases/${conversation.session?.caseId || conversation.caseId}`
    );

    // Fetch persona summaries
    const personaSummaries = await apiClient.get<any>(
      `/focus-groups/conversations/${conversationId}/persona-summaries`
    );

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
