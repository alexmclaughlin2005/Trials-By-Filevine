/**
 * Utility functions for getting persona image URLs
 */

/**
 * Get the image URL for a persona
 * @param personaId - The persona ID
 * @param imageUrl - Optional imageUrl from persona object
 * @returns The image URL with cache busting, or null if no image
 */
export function getPersonaImageUrl(personaId: string, imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  
  // Extract personaId from the URL path or use provided personaId
  const match = imageUrl.match(/\/personas\/images\/(.+)$/);
  const extractedId = match ? match[1].split('?')[0] : personaId; // Remove query params if present
  
  // Use Next.js API route proxy - same origin, works with Next.js Image component
  // Add timestamp to bust Next.js image cache when images are regenerated
  return `/api/personas/images/${extractedId}?t=${Date.now()}`;
}
