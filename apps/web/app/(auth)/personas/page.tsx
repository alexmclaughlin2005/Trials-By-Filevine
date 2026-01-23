'use client';

import { Button } from '@/components/ui/button';
import { Plus, Filter, AlertTriangle, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Select } from '@/components/ui/select';

interface Persona {
  id: string;
  name: string;
  nickname?: string;
  description?: string;
  tagline?: string;
  archetype?: string;
  archetypeStrength?: number;
  secondaryArchetype?: string;
  sourceType: string;
  attributes?: Record<string, unknown>;
  signals?: string[];
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  demographics?: {
    occupation?: string;
    age_range?: string;
    [key: string]: unknown;
  };
}

const ARCHETYPE_LABELS: Record<string, string> = {
  bootstrapper: 'The Bootstrapper',
  crusader: 'The Crusader',
  scale_balancer: 'The Scale-Balancer',
  captain: 'The Captain',
  chameleon: 'The Chameleon',
  scarred: 'The Scarred',
  calculator: 'The Calculator',
  heart: 'The Heart',
  trojan_horse: 'The Trojan Horse',
  maverick: 'The Maverick',
};

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPersonas() {
      try {
        setLoading(true);
        const data = await apiClient.get<{ personas: Persona[] }>('/personas');
        setPersonas(data.personas);
        setFilteredPersonas(data.personas);
      } catch (err) {
        console.error('Error fetching personas:', err);
        setError('Failed to load personas');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonas();
  }, []);

  useEffect(() => {
    if (selectedArchetype === 'all') {
      setFilteredPersonas(personas);
    } else {
      setFilteredPersonas(
        personas.filter((p) => p.archetype === selectedArchetype)
      );
    }
  }, [selectedArchetype, personas]);

  const archetypeCounts = personas.reduce(
    (acc, p) => {
      const archetype = p.archetype || 'unclassified';
      acc[archetype] = (acc[archetype] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Persona Library</h1>
            <p className="text-muted-foreground">
              {personas.length} behavioral personas for juror classification
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Persona
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
          <Select
            value={selectedArchetype}
            onChange={(e) => setSelectedArchetype(e.target.value)}
            className="w-[240px]"
          >
            <option value="all">All Archetypes ({personas.length})</option>
            {Object.entries(ARCHETYPE_LABELS).map(([key, label]) => {
              const count = archetypeCounts[key] || 0;
              if (count === 0) return null;
              return (
                <option key={key} value={key}>
                  {label} ({count})
                </option>
              );
            })}
            {archetypeCounts['unclassified'] && (
              <option value="unclassified">
                Unclassified ({archetypeCounts['unclassified']})
              </option>
            )}
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading personas...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Personas Grid */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPersonas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}

          {/* Add new persona card */}
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <div>
              <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Create a custom persona
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPersonas.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No personas found for this archetype.
          </p>
        </div>
      )}
    </div>
  );
}

function PersonaCard({ persona }: { persona: Persona }) {
  const displayName = persona.nickname || persona.name;
  const archetype = persona.archetype
    ? ARCHETYPE_LABELS[persona.archetype] || persona.archetype
    : 'Unclassified';

  const description =
    persona.tagline ||
    persona.description ||
    `${archetype} persona`;

  // Extract attributes from various sources
  const attributes: string[] = [];

  if (persona.signals && Array.isArray(persona.signals)) {
    attributes.push(...persona.signals.slice(0, 3));
  }

  if (persona.demographics) {
    if (persona.demographics.occupation) {
      attributes.push(persona.demographics.occupation);
    }
    if (persona.demographics.age_range) {
      attributes.push(persona.demographics.age_range);
    }
  }

  // Limit to 3 attributes
  const displayAttributes = attributes.slice(0, 3);

  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{archetype}</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
          {persona.sourceType}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {description}
      </p>

      {displayAttributes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {displayAttributes.map((attr, idx) => (
            <span
              key={idx}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              {attr}
            </span>
          ))}
        </div>
      )}

      {/* Danger Levels */}
      {(persona.plaintiffDangerLevel !== undefined ||
        persona.defenseDangerLevel !== undefined) && (
        <div className="mb-4 flex items-center gap-4 text-xs">
          {persona.plaintiffDangerLevel !== undefined && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">
                P: {persona.plaintiffDangerLevel}/5
              </span>
            </div>
          )}
          {persona.defenseDangerLevel !== undefined && (
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">
                D: {persona.defenseDangerLevel}/5
              </span>
            </div>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full">
        View Details
      </Button>
    </div>
  );
}
