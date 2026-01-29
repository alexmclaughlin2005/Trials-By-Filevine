/**
 * EXAMPLE: PersonaCardV2 with Image Display
 * 
 * This is a reference implementation showing how to add headshot images
 * to the PersonaCardV2 component. DO NOT use this file directly - 
 * integrate these changes into persona-card-v2.tsx after generation completes.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, AlertCircle, Shield, Scale, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PersonaV2 {
  id: string;
  name: string;
  nickname?: string;
  tagline?: string;
  archetype?: string;
  imageUrl?: string; // NEW: Image URL field
  instantRead?: string; // V2 field
  [key: string]: unknown; // Allow additional properties
}

interface PersonaCardV2Props {
  persona: PersonaV2;
  expanded?: boolean;
  onSelect?: (personaId: string) => void;
  showStrategy?: boolean;
  side?: 'plaintiff' | 'defense' | 'both';
}

export function PersonaCardV2WithImage({
  persona,
  expanded: defaultExpanded = false,
  onSelect,
  showStrategy = true,
  side = 'both'
}: PersonaCardV2Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [imageError, setImageError] = useState(false);

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Resolve image URL
  const getImageUrl = () => {
    if (!persona.imageUrl) return null;
    
    // If it's already a full URL, use it
    if (persona.imageUrl.startsWith('http')) {
      return persona.imageUrl;
    }
    
    // If it's a relative path like "images/BOOT_1.1_GaryHendricks.png"
    // Extract the filename and serve from /personas/ or API
    const filename = persona.imageUrl.replace('images/', '');
    
    // Option 1: Static files (if copied to public/personas/)
    return `/personas/${filename}`;
    
    // Option 2: API endpoint (if using API route)
    // return `/api/personas/images/${persona.id}`;
  };

  const imageUrl = getImageUrl();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* HEADSHOT IMAGE - NEW */}
          <div className="flex-shrink-0">
            {imageUrl && !imageError ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-filevine-gray-200 bg-filevine-gray-100">
                <Image
                  src={imageUrl}
                  alt={persona.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="80px"
                />
              </div>
            ) : (
              // Fallback: Initials or icon
              <div className="w-20 h-20 rounded-full bg-filevine-blue-100 border-2 border-filevine-blue-200 flex items-center justify-center">
                {persona.name ? (
                  <span className="text-filevine-blue-700 font-semibold text-lg">
                    {getInitials(persona.name)}
                  </span>
                ) : (
                  <User className="h-10 w-10 text-filevine-blue-400" />
                )}
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-xl truncate">{persona.name}</CardTitle>
                  {persona.nickname && persona.nickname !== persona.name && (
                    <span className="text-sm text-filevine-gray-600 truncate">
                      ({persona.nickname})
                    </span>
                  )}
                </div>

                {/* Archetype Badges */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {formatArchetypeName(persona.archetype)}
                  </Badge>
                  {/* ... other badges */}
                </div>

                {/* Instant Read */}
                {'instantRead' in persona && persona.instantRead && (
                  <p className="text-sm text-filevine-gray-700 italic mt-2 line-clamp-2">
                    &ldquo;{persona.instantRead}&rdquo;
                  </p>
                )}
              </div>

              {onSelect && (
                <Button
                  size="sm"
                  onClick={() => onSelect(persona.id)}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Select
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rest of the card content remains the same */}
        {/* Danger Levels, Verdict Prediction, etc. */}
      </CardContent>
    </Card>
  );
}

function formatArchetypeName(archetype: string | undefined): string {
  // ... existing implementation
  return archetype || 'Unclassified';
}
