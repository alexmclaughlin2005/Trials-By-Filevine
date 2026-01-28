'use client';

import { Button } from '@/components/ui/button';
import { Plus, Filter, AlertTriangle, Shield, Copy, Edit, FileText, Grid, List } from 'lucide-react';
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
import { ArchetypeBrowser } from '@/components/archetype-browser';
import { PersonaListV2 } from '@/components/persona-list-v2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    gender?: string;
    location?: string;
    income?: string;
    [key: string]: unknown;
  };
  // V2 Fields
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
  backstory?: string;
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
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    nickname: '',
    description: '',
    tagline: '',
    occupation: '',
    age: '',
    gender: '',
    location: '',
    income: '',
    plaintiffDangerLevel: 0,
    defenseDangerLevel: 0,
  });
  const [notesPersona, setNotesPersona] = useState<Persona | null>(null);
  const [notesForm, setNotesForm] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [viewMode, setViewMode] = useState<'archetypes' | 'personas'>('archetypes');

  useEffect(() => {
    async function fetchPersonas() {
      try {
        setLoading(true);
        // Fetch V2 personas with all new fields
        const data = await apiClient.get<{ personas: Persona[] }>('/personas?version=2');

        // Load notes from localStorage for system personas
        const personasWithNotes = data.personas.map((persona) => {
          if (persona.sourceType === 'system' && user?.organization?.id) {
            const notesKey = `persona_notes_${user.organization.id}_${persona.id}`;
            const savedNotes = localStorage.getItem(notesKey);
            if (savedNotes) {
              return {
                ...persona,
                attributes: { ...persona.attributes, user_notes: savedNotes },
              };
            }
          }
          return persona;
        });

        setPersonas(personasWithNotes);
        setFilteredPersonas(personasWithNotes);
      } catch (err) {
        console.error('Error fetching personas:', err);
        setError('Failed to load personas');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonas();
  }, [user?.organization?.id]);

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
      // Map to backend schema format (name, description, attributes, voirDireApproach, challengeStrategy)
      const clonedPersona = {
        name: `${persona.name} (Copy)`,
        description: persona.description || persona.tagline || `${persona.archetype || 'Custom'} persona`,
        attributes: {
          // Store all persona-specific data in attributes
          nickname: persona.nickname ? `${persona.nickname} (Copy)` : undefined,
          archetype: persona.archetype,
          archetypeStrength: persona.archetypeStrength,
          secondaryArchetype: persona.secondaryArchetype,
          demographics: persona.demographics,
          signals: persona.signals,
          plaintiffDangerLevel: persona.plaintiffDangerLevel,
          defenseDangerLevel: persona.defenseDangerLevel,
          tagline: persona.tagline,
          ...(persona.attributes || {}),
        },
        voirDireApproach: undefined,
        challengeStrategy: undefined,
      };

      const response = await apiClient.post<{ persona: Persona }>('/personas', clonedPersona);

      // Add to list
      const newPersonas = [...personas, response.persona];
      setPersonas(newPersonas);
      setFilteredPersonas(newPersonas);

      // Close detail modal and open edit mode for the cloned persona
      setSelectedPersona(null);
      handleEdit(response.persona);
    } catch (error) {
      console.error('Error cloning persona:', error);
      alert('Failed to clone persona. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setEditForm({
      name: persona.name,
      nickname: persona.nickname || '',
      description: persona.description || '',
      tagline: persona.tagline || '',
      occupation: persona.demographics?.occupation || '',
      age: persona.demographics?.age_range || '',
      gender: persona.demographics?.gender || '',
      location: persona.demographics?.location || '',
      income: persona.demographics?.income || '',
      plaintiffDangerLevel: persona.plaintiffDangerLevel || 0,
      defenseDangerLevel: persona.defenseDangerLevel || 0,
    });
    setSelectedPersona(null); // Close detail modal if open
  };

  const handleSaveEdit = async () => {
    if (!editingPersona) return;

    try {
      // Map to backend schema format
      const updatedPersona = {
        name: editForm.name,
        description: editForm.description || editForm.tagline || `${editingPersona.archetype || 'Custom'} persona`,
        attributes: {
          ...editingPersona.attributes,
          nickname: editForm.nickname || undefined,
          tagline: editForm.tagline || undefined,
          demographics: {
            occupation: editForm.occupation || undefined,
            age_range: editForm.age || undefined,
            gender: editForm.gender || undefined,
            location: editForm.location || undefined,
            income: editForm.income || undefined,
          },
          plaintiffDangerLevel: editForm.plaintiffDangerLevel,
          defenseDangerLevel: editForm.defenseDangerLevel,
        },
      };

      const response = await apiClient.patch<{ persona: Persona }>(
        `/personas/${editingPersona.id}`,
        updatedPersona
      );

      // Update in lists
      const updatedPersonas = personas.map((p) =>
        p.id === editingPersona.id ? response.persona : p
      );
      setPersonas(updatedPersonas);
      setFilteredPersonas(
        updatedPersonas.filter((p) =>
          selectedArchetype === 'all' ? true : p.archetype === selectedArchetype
        )
      );

      // Close edit modal
      setEditingPersona(null);
      alert('Persona updated successfully!');
    } catch (error) {
      console.error('Error updating persona:', error);
      alert('Failed to update persona. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPersona(null);
    setEditForm({
      name: '',
      nickname: '',
      description: '',
      tagline: '',
      occupation: '',
      age: '',
      gender: '',
      location: '',
      income: '',
      plaintiffDangerLevel: 0,
      defenseDangerLevel: 0,
    });
  };

  const handleOpenNotes = (persona: Persona) => {
    setNotesPersona(persona);
    // Get existing notes from attributes if they exist
    const existingNotes = (persona.attributes as Record<string, unknown>)?.user_notes as string || '';
    setNotesForm(existingNotes);
    setSelectedPersona(null); // Close detail modal if open
  };

  const handleSaveNotes = async () => {
    if (!notesPersona || !user?.organization?.id) return;

    setIsSavingNotes(true);
    try {
      // For system personas, we need to create a user-specific note
      // For user-created personas, we can update the persona directly
      const isSystemPersona = notesPersona.sourceType === 'system';

      if (isSystemPersona) {
        // Store notes in a separate structure (you could also clone the persona)
        // For now, we'll use localStorage as a simple solution
        const notesKey = `persona_notes_${user.organization.id}_${notesPersona.id}`;
        localStorage.setItem(notesKey, notesForm);

        // Update local state
        const updatedPersonas = personas.map((p) =>
          p.id === notesPersona.id
            ? { ...p, attributes: { ...p.attributes, user_notes: notesForm } }
            : p
        );
        setPersonas(updatedPersonas);
        setFilteredPersonas(
          updatedPersonas.filter((p) =>
            selectedArchetype === 'all' ? true : p.archetype === selectedArchetype
          )
        );
      } else {
        // Update user-created persona in database
        const updatedPersona = {
          attributes: {
            ...notesPersona.attributes,
            user_notes: notesForm,
          },
        };

        await apiClient.patch(`/personas/${notesPersona.id}`, updatedPersona);

        // Update local state
        const updatedPersonas = personas.map((p) =>
          p.id === notesPersona.id
            ? { ...p, attributes: { ...p.attributes, user_notes: notesForm } }
            : p
        );
        setPersonas(updatedPersonas);
        setFilteredPersonas(
          updatedPersonas.filter((p) =>
            selectedArchetype === 'all' ? true : p.archetype === selectedArchetype
          )
        );
      }

      setNotesPersona(null);
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesPersona(null);
    setNotesForm('');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Persona Library</h1>
            <p className="text-muted-foreground">
              {personas.length} behavioral personas across 10 archetypes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'archetypes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('archetypes')}
              >
                <Grid className="mr-2 h-4 w-4" />
                Archetypes
              </Button>
              <Button
                variant={viewMode === 'personas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('personas')}
              >
                <List className="mr-2 h-4 w-4" />
                Personas
              </Button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Persona
            </Button>
          </div>
        </div>

        {/* Filters - Only show in personas view */}
        {viewMode === 'personas' && (
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
        )}
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

      {/* Content - Archetype View */}
      {!loading && !error && viewMode === 'archetypes' && (
        <ArchetypeBrowser
          onArchetypeSelect={(archetypeId) => {
            setSelectedArchetype(archetypeId);
            setViewMode('personas');
          }}
        />
      )}

      {/* Content - Persona List View */}
      {!loading && !error && viewMode === 'personas' && (
        <>
          <PersonaListV2
            personas={filteredPersonas}
            onPersonaSelect={(personaId) => {
              const persona = personas.find(p => p.id === personaId);
              if (persona) setSelectedPersona(persona);
            }}
            allowFilters={false}
          />

          {/* Add new persona card */}
          {filteredPersonas.length > 0 && (
            <div className="mt-6 flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <div>
                <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Create a custom persona
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredPersonas.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No personas found for this archetype.
              </p>
            </div>
          )}
        </>
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
                {/* Instant Read (V2) */}
                {selectedPersona.instantRead && (
                  <div className="bg-filevine-blue-50 border border-filevine-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-2 text-filevine-blue-900">Instant Read</h3>
                    <p className="text-sm text-filevine-blue-800">{selectedPersona.instantRead}</p>
                  </div>
                )}

                {/* Tagline */}
                {selectedPersona.tagline && !selectedPersona.instantRead && (
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

                {/* Verdict Lean (V2) */}
                {selectedPersona.archetypeVerdictLean && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Verdict Lean</h3>
                    <p className="text-sm font-medium text-filevine-gray-700">{selectedPersona.archetypeVerdictLean}</p>
                  </div>
                )}

                {/* Phrases You'll Hear (V2) */}
                {selectedPersona.phrasesYoullHear && selectedPersona.phrasesYoullHear.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Phrases You&apos;ll Hear</h3>
                    <div className="space-y-2">
                      {selectedPersona.phrasesYoullHear.slice(0, 5).map((phrase, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-filevine-gray-400 mt-0.5">💬</span>
                          <p className="text-filevine-gray-700 italic">&ldquo;{phrase}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verdict Prediction (V2) */}
                {selectedPersona.verdictPrediction && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Verdict Prediction</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Liability Finding Probability</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-filevine-gray-200 rounded-full h-2">
                            <div
                              className="bg-filevine-blue-600 h-2 rounded-full"
                              style={{ width: `${(selectedPersona.verdictPrediction.liability_finding_probability || 0) * 100}%` }}
                            />
                          </div>
                          <p className="text-sm font-semibold w-12 text-right">
                            {Math.round((selectedPersona.verdictPrediction.liability_finding_probability || 0) * 100)}%
                          </p>
                        </div>
                      </div>
                      {selectedPersona.verdictPrediction.damages_if_liability && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Damages if Liability</p>
                          <p className="text-sm text-filevine-gray-700">{selectedPersona.verdictPrediction.damages_if_liability}</p>
                        </div>
                      )}
                      {selectedPersona.verdictPrediction.role_in_deliberation && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Role in Deliberation</p>
                          <p className="text-sm text-filevine-gray-700">{selectedPersona.verdictPrediction.role_in_deliberation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Strike or Keep (V2) */}
                {selectedPersona.strikeOrKeep && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Strike or Keep Strategy</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPersona.strikeOrKeep.plaintiff_strategy && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-orange-900 mb-1">Plaintiff Strategy</p>
                          <p className="text-sm text-orange-800">{selectedPersona.strikeOrKeep.plaintiff_strategy}</p>
                        </div>
                      )}
                      {selectedPersona.strikeOrKeep.defense_strategy && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Defense Strategy</p>
                          <p className="text-sm text-blue-800">{selectedPersona.strikeOrKeep.defense_strategy}</p>
                        </div>
                      )}
                    </div>
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
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleOpenNotes(selectedPersona)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Notes
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setSelectedPersona(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Persona Modal */}
      <Dialog open={!!editingPersona} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClick={handleCancelEdit} />
          {editingPersona && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Persona</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Basic Information</h3>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter persona name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter nickname (optional)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={editForm.tagline}
                      onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter a short tagline"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Enter persona description"
                    />
                  </div>
                </div>

                {/* Demographics */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Demographics</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Age Range
                      </label>
                      <input
                        type="text"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., 45, 35-45"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Gender
                      </label>
                      <input
                        type="text"
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., Female, Male"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g., Part-time retail associate"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., Phoenix, Arizona"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Income
                      </label>
                      <input
                        type="text"
                        value={editForm.income}
                        onChange={(e) => setEditForm({ ...editForm, income: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., 24000, $20k-$30k"
                      />
                    </div>
                  </div>
                </div>

                {/* Danger Levels */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Danger Levels</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        <AlertTriangle className="inline h-4 w-4 text-orange-500 mr-1" />
                        Plaintiff Danger (0-5)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={editForm.plaintiffDangerLevel}
                        onChange={(e) => setEditForm({ ...editForm, plaintiffDangerLevel: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        <Shield className="inline h-4 w-4 text-blue-500 mr-1" />
                        Defense Danger (0-5)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={editForm.defenseDangerLevel}
                        onChange={(e) => setEditForm({ ...editForm, defenseDangerLevel: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editForm.name.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={!!notesPersona} onOpenChange={handleCancelNotes}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClick={handleCancelNotes} />
          {notesPersona && (
            <>
              <DialogHeader>
                <DialogTitle>Personal Notes</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {notesPersona.nickname || notesPersona.name}
                </p>
              </DialogHeader>

              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">
                  Add your personal notes about this persona
                </label>
                <textarea
                  value={notesForm}
                  onChange={(e) => setNotesForm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={10}
                  placeholder="Add notes about when to use this persona, key insights, case-specific observations, etc."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {notesPersona.sourceType === 'system'
                    ? 'Notes for system personas are stored locally for your organization.'
                    : 'These notes are saved with this persona.'}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelNotes}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
