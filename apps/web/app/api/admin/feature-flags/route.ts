import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const flags = await prisma.featureFlag.findMany({
      where: {
        organizationId: null, // Only global flags
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}
