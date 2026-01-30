import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for persona images
 * Proxies images from API Gateway to avoid CORS issues with Next.js Image component
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    const { personaId } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // Get timestamp from query params for cache busting
    const searchParams = request.nextUrl.searchParams;
    const timestamp = searchParams.get('t') || Date.now().toString();
    
    // Fetch image from API Gateway
    // Use 'no-store' to prevent caching - images can be regenerated and we want fresh versions
    // Add timestamp to URL to ensure fresh fetch
    // Set redirect: 'follow' to automatically follow redirects (e.g., to Vercel Blob URLs)
    const response = await fetch(`${apiUrl}/personas/images/${personaId}?t=${timestamp}`, {
      cache: 'no-store', // Don't cache - images can be regenerated
      redirect: 'follow', // Follow redirects (e.g., to Vercel Blob URLs)
    });

    if (!response.ok) {
      console.error(`Failed to fetch persona image: ${response.status} ${response.statusText}`);
      return new NextResponse(null, { status: response.status });
    }

    // Get image data (fetch will automatically follow redirects to Vercel Blob URLs)
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
    console.error('Error proxying persona image:', error);
    return new NextResponse(null, { status: 500 });
  }
}
