'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { apiClient } from '@/lib/api-client';

interface ArchetypeFilterProps {
  selectedArchetypes: string[];
  onArchetypeToggle: (archetypeId: string) => void;
  showPersonaCounts?: boolean;
  collapsed?: boolean;
}

interface Archetype {
  id: string;
  display_name: string;
  verdict_lean?: string;
  persona_count: number;
}

export function ArchetypeFilter({
  selectedArchetypes,
  onArchetypeToggle,
  showPersonaCounts = true,
  collapsed = false
}: ArchetypeFilterProps) {
  const [isOpen, setIsOpen] = useState(!collapsed);

  const { data, isLoading, error } = useQuery({
    queryKey: ['archetypes'],
    queryFn: async () => {
      return apiClient.get<{ archetypes: Archetype[] }>('/personas/archetypes');
    }
  });

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load archetypes
      </div>
    );
  }

  const archetypes: Archetype[] = data?.archetypes || [];
  const selectedCount = selectedArchetypes.length;
  const totalCount = archetypes.length;

  const getVerdictLeanColor = (lean?: string) => {
    if (!lean) return 'bg-gray-100 text-gray-700';
    if (lean.includes('STRONG DEFENSE')) return 'bg-red-100 text-red-700';
    if (lean.includes('STRONG PLAINTIFF')) return 'bg-green-100 text-green-700';
    if (lean.includes('SLIGHT DEFENSE')) return 'bg-orange-100 text-orange-700';
    if (lean.includes('SLIGHT PLAINTIFF')) return 'bg-teal-100 text-teal-700';
    if (lean.includes('NEUTRAL')) return 'bg-blue-100 text-blue-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-filevine-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 bg-filevine-gray-50 hover:bg-filevine-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-filevine-gray-900">Filter by Archetype</h3>
              {selectedCount > 0 && (
                <Badge variant="default" className="bg-filevine-blue-600">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-filevine-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-filevine-gray-600" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  archetypes.forEach(a => {
                    if (!selectedArchetypes.includes(a.id)) {
                      onArchetypeToggle(a.id);
                    }
                  });
                }}
                disabled={selectedCount === totalCount}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedArchetypes.forEach(id => onArchetypeToggle(id));
                }}
                disabled={selectedCount === 0}
              >
                Clear All
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-filevine-blue-600" />
              </div>
            )}

            {/* Archetype List */}
            {!isLoading && archetypes.length > 0 && (
              <div className="space-y-2">
                {archetypes.map(archetype => {
                  const isSelected = selectedArchetypes.includes(archetype.id);

                  return (
                    <button
                      key={archetype.id}
                      onClick={() => onArchetypeToggle(archetype.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-filevine-blue-500 bg-filevine-blue-50'
                          : 'border-filevine-gray-200 hover:border-filevine-gray-300 hover:bg-filevine-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-filevine-blue-600 bg-filevine-blue-600'
                              : 'border-filevine-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Archetype Info */}
                        <div className="text-left">
                          <div className="font-medium text-filevine-gray-900">
                            {archetype.display_name}
                          </div>
                          {archetype.verdict_lean && (
                            <Badge
                              className={`mt-1 text-xs ${getVerdictLeanColor(archetype.verdict_lean)}`}
                            >
                              {archetype.verdict_lean}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Persona Count */}
                      {showPersonaCounts && (
                        <Badge variant="secondary" className="text-xs">
                          {archetype.persona_count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
