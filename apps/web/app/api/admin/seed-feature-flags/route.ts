import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST() {
  try {
    const response = await fetch(`${API_URL}/admin/seed-feature-flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to seed feature flags' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error seeding feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to seed feature flags' },
      { status: 500 }
    );
  }
}
