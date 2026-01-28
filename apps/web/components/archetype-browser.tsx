'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Users, AlertTriangle, Scale, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Archetype {
  id: string;
  display_name: string;
  verdict_lean?: string;
  what_they_believe?: string;
  how_they_behave_in_deliberation?: string;
  how_to_spot_them?: string[];
  persona_count: number;
}

interface ArchetypeBrowserProps {
  onArchetypeSelect?: (archetypeId: string) => void;
}

export function ArchetypeBrowser({ onArchetypeSelect }: ArchetypeBrowserProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['archetypes'],
    queryFn: async () => {
      return apiClient.get<{ archetypes: Archetype[] }>('/personas/archetypes');
    }
  });

  const handleArchetypeClick = (archetypeId: string) => {
    setSelectedArchetype(archetypeId);
    onArchetypeSelect?.(archetypeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-filevine-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load archetypes. Please try again.
      </div>
    );
  }

  const archetypes: Archetype[] = data?.archetypes || [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-filevine-gray-900 mb-2">
          10 Juror Archetypes
        </h2>
        <p className="text-filevine-gray-600">
          Behavioral profiles to predict juror decision-making
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archetypes.map((archetype) => (
          <ArchetypeCard
            key={archetype.id}
            archetype={archetype}
            isSelected={selectedArchetype === archetype.id}
            onClick={() => handleArchetypeClick(archetype.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ArchetypeCard({
  archetype,
  isSelected,
  onClick
}: {
  archetype: Archetype;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getVerdictLeanColor = (lean?: string) => {
    if (!lean) return 'bg-gray-100 text-gray-700';
    if (lean.includes('STRONG DEFENSE')) return 'bg-red-100 text-red-700';
    if (lean.includes('STRONG PLAINTIFF')) return 'bg-green-100 text-green-700';
    if (lean.includes('SLIGHT DEFENSE')) return 'bg-orange-100 text-orange-700';
    if (lean.includes('SLIGHT PLAINTIFF')) return 'bg-teal-100 text-teal-700';
    if (lean.includes('NEUTRAL')) return 'bg-blue-100 text-blue-700';
    if (lean.includes('DEPENDS') || lean.includes('FOLLOWS') || lean.includes('VARIES')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getVerdictLeanIcon = (lean?: string) => {
    if (!lean) return null;
    if (lean.includes('DEFENSE')) return <AlertTriangle className="h-4 w-4" />;
    if (lean.includes('PLAINTIFF')) return <Scale className="h-4 w-4" />;
    if (lean.includes('NEUTRAL')) return <Scale className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-filevine-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">{archetype.display_name}</CardTitle>
          <div className="flex items-center gap-1 text-xs text-filevine-gray-600">
            <Users className="h-3 w-3" />
            {archetype.persona_count}
          </div>
        </div>

        {archetype.verdict_lean && (
          <Badge className={`w-fit text-xs ${getVerdictLeanColor(archetype.verdict_lean)}`}>
            <span className="mr-1">{getVerdictLeanIcon(archetype.verdict_lean)}</span>
            {archetype.verdict_lean}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Core Belief */}
        {archetype.what_they_believe && (
          <div>
            <h4 className="text-xs font-semibold text-filevine-gray-700 mb-1">
              💭 What They Believe
            </h4>
            <p className="text-sm text-filevine-gray-600 line-clamp-3">
              {archetype.what_they_believe}
            </p>
          </div>
        )}

        {/* Show/Hide Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
        >
          {showDetails ? 'Show Less' : 'Show More'}
        </Button>

        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            {/* Deliberation Behavior */}
            {archetype.how_they_behave_in_deliberation && (
              <div>
                <h4 className="text-xs font-semibold text-filevine-gray-700 mb-1">
                  🗣️ In Deliberation
                </h4>
                <p className="text-sm text-filevine-gray-600">
                  {archetype.how_they_behave_in_deliberation}
                </p>
              </div>
            )}

            {/* How to Spot Them */}
            {archetype.how_to_spot_them && archetype.how_to_spot_them.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-filevine-gray-700 mb-1">
                  🔍 How to Spot Them
                </h4>
                <ul className="space-y-1">
                  {archetype.how_to_spot_them.map((indicator, index) => (
                    <li
                      key={index}
                      className="text-xs text-filevine-gray-600 flex items-start"
                    >
                      <span className="mr-1">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* View Personas Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View {archetype.persona_count} Personas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
