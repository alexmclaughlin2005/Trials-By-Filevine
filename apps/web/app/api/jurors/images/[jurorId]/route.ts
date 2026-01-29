import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for juror images
 * Proxies images from API Gateway to avoid CORS issues with Next.js Image component
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jurorId: string }> }
) {
  try {
    const { jurorId } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // Get timestamp from query params for cache busting
    const searchParams = request.nextUrl.searchParams;
    const timestamp = searchParams.get('t') || Date.now().toString();
    
    // Fetch image from API Gateway
    // Use 'no-store' to prevent caching - images can be regenerated and we want fresh versions
    const response = await fetch(`${apiUrl}/jurors/images/${jurorId}?t=${timestamp}`, {
      cache: 'no-store', // Don't cache - images can be regenerated
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return image with proper headers for Next.js Image component
    // Use shorter cache with revalidation - allows images to update when regenerated
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour, but revalidate
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error proxying juror image:', error);
    return new NextResponse(null, { status: 500 });
  }
}
