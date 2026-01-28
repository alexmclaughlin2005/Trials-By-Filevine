import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST() {
  try {
    console.log('[seed-feature-flags] Calling backend:', `${API_URL}/admin/seed-feature-flags`);
    
    const response = await fetch(`${API_URL}/admin/seed-feature-flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[seed-feature-flags] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[seed-feature-flags] Error response:', errorData);
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to seed feature flags',
          message: errorData.message,
          details: errorData.details,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[seed-feature-flags] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[seed-feature-flags] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed feature flags',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
