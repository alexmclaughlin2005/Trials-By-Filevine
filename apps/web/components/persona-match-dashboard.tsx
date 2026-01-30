'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useJurorMatches, useMatchJuror, useConfirmPersonaMatch, useMatchBreakdown, type EnsembleMatch } from '@/hooks/use-juror-matching';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, CheckCircle2, XCircle, BarChart3, Info, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { MatchBreakdownModal } from './match-breakdown-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { apiClient } from '@/lib/api-client';

interface PersonaMatchDashboardProps {
  jurorId: string;
  organizationId: string;
  caseId?: string;
  onHeaderActionsReady?: (actions: React.ReactNode) => void;
}

interface Persona {
  id: string;
  name: string;
  archetype?: string;
  description?: string;
  instantRead?: string;
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

function formatArchetypeName(archetype: string | undefined): string {
  if (!archetype) return 'Unclassified';
  return ARCHETYPE_LABELS[archetype] || archetype.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function PersonaMatchDashboard({ jurorId, organizationId, caseId, onHeaderActionsReady }: PersonaMatchDashboardProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const { data: matches, isLoading, error, refetch } = useJurorMatches(jurorId);
  const matchJurorMutation = useMatchJuror();
  const confirmMatchMutation = useConfirmPersonaMatch();
  const { data: breakdown } = useMatchBreakdown(jurorId, selectedPersonaId);

  // Fetch available personas when search dialog opens
  useEffect(() => {
    if (showSearchDialog) {
      setSearchLoading(true);
      apiClient.get<{ personas: Persona[] }>('/personas?version=2')
        .then((data) => {
          setAvailablePersonas(data.personas);
        })
        .catch((err) => {
          console.error('Failed to fetch personas:', err);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }
  }, [showSearchDialog]);

  // Filter personas based on search query
  const filteredPersonas = availablePersonas.filter((persona) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      persona.name.toLowerCase().includes(query) ||
      persona.description?.toLowerCase().includes(query) ||
      persona.instantRead?.toLowerCase().includes(query) ||
      formatArchetypeName(persona.archetype).toLowerCase().includes(query)
    );
  });

  // Get already matched persona IDs
  const matchedPersonaIds = new Set(matches?.map(m => m.personaId) || []);

  const handleAddPersona = async (personaId: string) => {
    try {
      // Add persona without regenerating all matches
      await matchJurorMutation.mutateAsync({ jurorId, personaIds: [personaId], regenerate: false });
      refetch();
      setShowSearchDialog(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to add persona match:', err);
    }
  };

  const handleMatch = useCallback(async () => {
    try {
      // Explicitly regenerate matches
      await matchJurorMutation.mutateAsync({ jurorId, personaIds: undefined, regenerate: true });
      refetch();
    } catch (err) {
      console.error('Failed to match juror:', err);
    }
  }, [jurorId, matchJurorMutation, refetch]);

  const handleConfirmMatch = async (personaId: string, mappingId?: string, confirmed: boolean = true) => {
    try {
      await confirmMatchMutation.mutateAsync({
        jurorId,
        mappingId,
        personaId,
        confirmed,
      });
      // Refetch to get updated matches (will now only show the confirmed one)
      refetch();
    } catch (err) {
      console.error('Failed to confirm match:', err);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100';
    if (confidence >= 0.6) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Memoize header actions to avoid recreating on every render
  const headerActions = useMemo(() => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        onClick={() => setShowSearchDialog(true)}
        variant="outline"
        size="sm"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Persona
      </Button>
      <Button
        onClick={handleMatch}
        disabled={matchJurorMutation.isPending || isLoading}
        variant="primary"
        size="sm"
      >
        {matchJurorMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Matching...
          </>
        ) : (
          <>
            <BarChart3 className="mr-2 h-4 w-4" />
            Run Matching
          </>
        )}
      </Button>
    </div>
  ), [handleMatch, matchJurorMutation.isPending, isLoading]);

  // Expose header actions to parent - use useLayoutEffect to ensure it runs before paint
  useLayoutEffect(() => {
    if (onHeaderActionsReady) {
      onHeaderActionsReady(headerActions);
    }
  }, [onHeaderActionsReady, headerActions]);

  return (
    <div className="space-y-4">

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to load matches'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
        </div>
      )}

      {!isLoading && matches && matches.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            No matches found. Click "Run Matching" to analyze this juror against available personas.
          </p>
        </div>
      )}

      {matches && matches.length > 0 && (
        <div className="space-y-4">
          {matches.length >= 5 && !matches[0].isConfirmed && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              Showing top 5 matches. Use "Add Persona" to search for and add additional personas.
            </div>
          )}
          {matches.slice(0, 5).map((match, index) => (
            <div
              key={match.personaId}
              className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-filevine-blue text-sm font-semibold text-white">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-filevine-gray-900">
                          {match.personaName || `Persona ${match.personaId.slice(0, 8)}`}
                        </h4>
                        {match.personaArchetype && (
                          <span className="rounded-full bg-filevine-blue/10 px-2 py-0.5 text-xs font-medium text-filevine-blue">
                            {formatArchetypeName(match.personaArchetype)}
                          </span>
                        )}
                      </div>
                      {match.personaDescription && (
                        <p className="text-sm text-filevine-gray-600">
                          {match.personaDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score and Confidence */}
                  <div className="mt-4 flex items-center gap-4">
                    <div>
                      <span className="text-sm font-medium text-filevine-gray-700">
                        Match Score:
                      </span>
                      <span className={`ml-2 text-lg font-semibold ${getScoreColor(match.probability)}`}>
                        {(match.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-filevine-gray-700">
                        Confidence:
                      </span>
                      <span
                        className={`ml-2 rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceBgColor(match.confidence)} ${getConfidenceColor(match.confidence)}`}
                      >
                        {(match.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Method Scores Breakdown */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="rounded-md bg-filevine-gray-50 p-3">
                      <div className="text-xs font-medium text-filevine-gray-600">Signal-Based</div>
                      <div className="mt-1 text-sm font-semibold text-filevine-gray-900">
                        {(match.methodScores.signalBased * 100).toFixed(0)}%
                      </div>
                      <div className="mt-1 text-xs text-filevine-gray-500">
                        Conf: {(match.methodConfidences.signalBased * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="rounded-md bg-filevine-gray-50 p-3">
                      <div className="text-xs font-medium text-filevine-gray-600">Embedding</div>
                      <div className="mt-1 text-sm font-semibold text-filevine-gray-900">
                        {(match.methodScores.embedding * 100).toFixed(0)}%
                      </div>
                      <div className="mt-1 text-xs text-filevine-gray-500">
                        Conf: {(match.methodConfidences.embedding * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="rounded-md bg-filevine-gray-50 p-3">
                      <div className="text-xs font-medium text-filevine-gray-600">Bayesian</div>
                      <div className="mt-1 text-sm font-semibold text-filevine-gray-900">
                        {(match.methodScores.bayesian * 100).toFixed(0)}%
                      </div>
                      <div className="mt-1 text-xs text-filevine-gray-500">
                        Conf: {(match.methodConfidences.bayesian * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Reasoning (Rationale + Counterfactual) */}
                  {(match.rationale || match.counterfactual) && (
                    <div className="mt-4 rounded-md border border-filevine-gray-200 bg-white overflow-hidden">
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedReasoning);
                          if (newExpanded.has(match.personaId)) {
                            newExpanded.delete(match.personaId);
                          } else {
                            newExpanded.add(match.personaId);
                          }
                          setExpandedReasoning(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-filevine-gray-50 transition-colors"
                      >
                        <h5 className="text-sm font-semibold text-filevine-gray-900">Reasoning</h5>
                        {expandedReasoning.has(match.personaId) ? (
                          <ChevronUp className="h-4 w-4 text-filevine-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-filevine-gray-400" />
                        )}
                      </button>
                      {expandedReasoning.has(match.personaId) && (
                        <div className="px-3 pb-3 space-y-4">
                          {/* Rationale */}
                          {match.rationale && (
                            <div>
                              <h6 className="text-xs font-semibold text-filevine-gray-700 mb-1">Rationale</h6>
                              <p className="text-sm text-filevine-gray-700">{match.rationale}</p>
                            </div>
                          )}
                          {/* Counterfactual */}
                          {match.counterfactual && (
                            <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h6 className="text-xs font-semibold text-blue-900 mb-1">What Would Change This Match?</h6>
                                  <p className="text-sm text-blue-800">{match.counterfactual}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPersonaId(match.personaId)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Breakdown
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmMatch(match.personaId, match.mappingId, true)}
                      disabled={confirmMatchMutation.isPending || match.isConfirmed}
                    >
                      {match.isConfirmed ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Match
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPersonaId && breakdown && (
        <MatchBreakdownModal
          isOpen={!!selectedPersonaId}
          onClose={() => setSelectedPersonaId(null)}
          breakdown={breakdown}
        />
      )}

      {/* Search/Add Persona Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search and Add Persona</DialogTitle>
            <DialogClose onClick={() => setShowSearchDialog(false)} />
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-filevine-gray-400" />
              <Input
                type="text"
                placeholder="Search personas by name, description, or archetype..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Personas List */}
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
              </div>
            ) : filteredPersonas.length === 0 ? (
              <div className="text-center py-8 text-sm text-filevine-gray-600">
                No personas found matching your search.
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredPersonas.map((persona) => {
                  const isAlreadyMatched = matchedPersonaIds.has(persona.id);
                  return (
                    <div
                      key={persona.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        isAlreadyMatched
                          ? 'border-filevine-gray-200 bg-filevine-gray-50 opacity-60'
                          : 'border-filevine-gray-200 hover:border-filevine-blue hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-filevine-gray-900">{persona.name}</h5>
                            {persona.archetype && (
                              <span className="rounded-full bg-filevine-blue/10 px-2 py-0.5 text-xs font-medium text-filevine-blue">
                                {formatArchetypeName(persona.archetype)}
                              </span>
                            )}
                          </div>
                          {persona.instantRead && (
                            <p className="mt-1 text-sm text-filevine-gray-600">{persona.instantRead}</p>
                          )}
                          {persona.description && (
                            <p className="mt-1 text-sm text-filevine-gray-500 line-clamp-2">{persona.description}</p>
                          )}
                        </div>
                        <Button
                          variant={isAlreadyMatched ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => !isAlreadyMatched && handleAddPersona(persona.id)}
                          disabled={isAlreadyMatched}
                        >
                          {isAlreadyMatched ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Already Matched
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
