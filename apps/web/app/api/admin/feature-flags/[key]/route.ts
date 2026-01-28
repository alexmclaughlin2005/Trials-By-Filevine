import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const body = await request.json();
    const { enabled } = body;

    // Find existing flag
    const existing = await prisma.featureFlag.findFirst({
      where: {
        key,
        organizationId: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Update flag
    const flag = await prisma.featureFlag.update({
      where: { id: existing.id },
      data: {
        enabled,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
