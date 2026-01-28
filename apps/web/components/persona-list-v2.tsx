'use client';

import { useState } from 'react';
import { PersonaCardV2 } from './persona-card-v2';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Filter } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  archetype?: string;
  instantRead?: string;
  archetypeVerdictLean?: string;
  phrasesYoullHear?: string[];
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strikeOrKeep?: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  demographics?: {
    age_range?: string;
    occupation?: string;
    political_affiliation?: string;
  };
  backstory?: string;
  tagline?: string;
}

interface PersonaListV2Props {
  personas: Persona[];
  onPersonaSelect?: (personaId: string) => void;
  showStrategy?: boolean;
  side?: 'plaintiff' | 'defense';
  allowFilters?: boolean;
}

export function PersonaListV2({
  personas,
  onPersonaSelect,
  showStrategy = false,
  side,
  allowFilters = true
}: PersonaListV2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [dangerFilter, setDangerFilter] = useState<string>('all');
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);

  // Get unique archetypes from personas
  const archetypes = Array.from(new Set(personas.map(p => p.archetype).filter(Boolean)));

  // Filter personas based on search and filters
  const filteredPersonas = personas.filter(persona => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        persona.name.toLowerCase().includes(query) ||
        persona.instantRead?.toLowerCase().includes(query) ||
        persona.tagline?.toLowerCase().includes(query) ||
        persona.backstory?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Archetype filter
    if (selectedArchetype !== 'all' && persona.archetype !== selectedArchetype) {
      return false;
    }

    // Danger level filter (for plaintiff side)
    if (dangerFilter !== 'all' && side === 'plaintiff') {
      const dangerLevel = persona.plaintiffDangerLevel;
      if (dangerFilter === 'high' && (dangerLevel === undefined || dangerLevel < 4)) return false;
      if (dangerFilter === 'medium' && (dangerLevel === undefined || dangerLevel < 2 || dangerLevel > 3)) return false;
      if (dangerFilter === 'low' && (dangerLevel === undefined || dangerLevel > 1)) return false;
    }

    // Danger level filter (for defense side)
    if (dangerFilter !== 'all' && side === 'defense') {
      const dangerLevel = persona.defenseDangerLevel;
      if (dangerFilter === 'high' && (dangerLevel === undefined || dangerLevel < 4)) return false;
      if (dangerFilter === 'medium' && (dangerLevel === undefined || dangerLevel < 2 || dangerLevel > 3)) return false;
      if (dangerFilter === 'low' && (dangerLevel === undefined || dangerLevel > 1)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      {allowFilters && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-filevine-gray-400" />
            <Input
              type="text"
              placeholder="Search personas by name, instant read, or backstory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-filevine-gray-600" />
              <span className="text-sm font-medium text-filevine-gray-700">Filters:</span>
            </div>

            {/* Archetype Filter */}
            <Select
              value={selectedArchetype}
              onChange={(e) => setSelectedArchetype(e.target.value)}
              className="w-[200px]"
            >
              <option value="all">All Archetypes</option>
              {archetypes.map(archetype => (
                <option key={archetype} value={archetype}>
                  {formatArchetypeName(archetype)}
                </option>
              ))}
            </Select>

            {/* Danger Level Filter */}
            {side && (
              <Select
                value={dangerFilter}
                onChange={(e) => setDangerFilter(e.target.value)}
                className="w-[180px]"
              >
                <option value="all">All Danger Levels</option>
                <option value="high">High Danger (4-5)</option>
                <option value="medium">Medium Danger (2-3)</option>
                <option value="low">Low Danger (1)</option>
              </Select>
            )}

            {/* Active Filters Display */}
            {(selectedArchetype !== 'all' || dangerFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-filevine-gray-600">
                  {filteredPersonas.length} result{filteredPersonas.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedArchetype('all');
                    setDangerFilter('all');
                  }}
                  className="text-sm text-filevine-blue-600 hover:text-filevine-blue-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count & Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-sm">
          {filteredPersonas.length} {filteredPersonas.length === 1 ? 'Persona' : 'Personas'}
        </Badge>
        {selectedArchetype !== 'all' && (
          <Badge variant="outline" className="text-sm">
            {formatArchetypeName(selectedArchetype)}
          </Badge>
        )}
        {dangerFilter !== 'all' && (
          <Badge variant="outline" className="text-sm">
            {dangerFilter} danger
          </Badge>
        )}
      </div>

      {/* Persona Grid */}
      {filteredPersonas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-filevine-gray-600">No personas match your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedArchetype('all');
              setDangerFilter('all');
            }}
            className="mt-2 text-sm text-filevine-blue-600 hover:text-filevine-blue-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPersonas.map(persona => (
            <PersonaCardV2
              key={persona.id}
              persona={persona}
              expanded={expandedPersona === persona.id}
              onSelect={() => {
                setExpandedPersona(expandedPersona === persona.id ? null : persona.id);
                onPersonaSelect?.(persona.id);
              }}
              showStrategy={showStrategy}
              side={side}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to format archetype names
function formatArchetypeName(archetype?: string): string {
  if (!archetype) return 'Unclassified';

  const nameMap: Record<string, string> = {
    bootstrapper: 'The Bootstrapper',
    crusader: 'The Crusader',
    scale_balancer: 'The Scale-Balancer',
    captain: 'The Captain',
    chameleon: 'The Chameleon',
    heart: 'The Heart',
    calculator: 'The Calculator',
    scarred: 'The Scarred',
    trojan_horse: 'The Trojan Horse',
    maverick: 'The Maverick'
  };
  return nameMap[archetype] || archetype;
}
