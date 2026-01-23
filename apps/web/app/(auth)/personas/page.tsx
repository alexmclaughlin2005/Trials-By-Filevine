'use client';

import { Button } from '@/components/ui/button';
import { Plus, Filter, AlertTriangle, Shield, X, Copy, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';

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
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleClone = async (persona: Persona) => {
    if (isCloning) return;

    if (!user?.organization?.id) {
      alert('You must be logged in to clone personas.');
      return;
    }

    setIsCloning(true);
    try {
      // Create a cloned persona with modified name and organization
      const clonedPersona = {
        ...persona,
        name: `${persona.name} (Copy)`,
        nickname: persona.nickname ? `${persona.nickname} (Copy)` : undefined,
        sourceType: 'user_created',
        organizationId: user.organization.id,
      };

      // Remove ID so a new one is generated
      const { id, ...personaData } = clonedPersona;

      const response = await apiClient.post<{ persona: Persona }>('/personas', personaData);

      // Add to list
      setPersonas([...personas, response.persona]);
      setFilteredPersonas([...filteredPersonas, response.persona]);

      // Close modal and show success
      setSelectedPersona(null);
      alert('Persona cloned successfully!');
    } catch (error) {
      console.error('Error cloning persona:', error);
      alert('Failed to clone persona. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleEdit = (persona: Persona) => {
    // For now, just alert - you can implement a full edit form later
    alert('Edit functionality coming soon! This will open an editor to modify the persona details.');
    // TODO: Implement edit form
  };

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
            <PersonaCard
              key={persona.id}
              persona={persona}
              onClick={() => setSelectedPersona(persona)}
            />
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

      {/* Persona Detail Modal */}
      <Dialog open={!!selectedPersona} onOpenChange={() => setSelectedPersona(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClick={() => setSelectedPersona(null)} />
          {selectedPersona && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedPersona.nickname || selectedPersona.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedPersona.archetype
                      ? ARCHETYPE_LABELS[selectedPersona.archetype] || selectedPersona.archetype
                      : 'Unclassified'}
                  </span>
                  {selectedPersona.archetypeStrength && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(selectedPersona.archetypeStrength * 100)}% match)
                    </span>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Tagline */}
                {selectedPersona.tagline && (
                  <div>
                    <p className="text-lg italic text-muted-foreground">{selectedPersona.tagline}</p>
                  </div>
                )}

                {/* Danger Levels */}
                {(selectedPersona.plaintiffDangerLevel !== undefined ||
                  selectedPersona.defenseDangerLevel !== undefined) && (
                  <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
                    {selectedPersona.plaintiffDangerLevel !== undefined && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Plaintiff Danger</p>
                          <p className="text-lg font-semibold">{selectedPersona.plaintiffDangerLevel}/5</p>
                        </div>
                      </div>
                    )}
                    {selectedPersona.defenseDangerLevel !== undefined && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Defense Danger</p>
                          <p className="text-lg font-semibold">{selectedPersona.defenseDangerLevel}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Demographics */}
                {selectedPersona.demographics && Object.keys(selectedPersona.demographics).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Demographics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedPersona.demographics).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signals/Attributes */}
                {selectedPersona.signals && selectedPersona.signals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Key Signals</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPersona.signals.map((signal, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedPersona.description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedPersona.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleClone(selectedPersona)}
                    disabled={isCloning}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {isCloning ? 'Cloning...' : 'Clone'}
                  </Button>
                  {selectedPersona.sourceType === 'user_created' && (
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedPersona)}
                      disabled={isEditing}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={() => setSelectedPersona(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonaCard({
  persona,
  onClick,
}: {
  persona: Persona;
  onClick: () => void;
}) {
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

      <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
        View Details
      </Button>
    </div>
  );
}
