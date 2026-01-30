'use client';

import { useState } from 'react';
import { useJurorMatches, useMatchJuror, useConfirmPersonaMatch, useMatchBreakdown, type EnsembleMatch } from '@/hooks/use-juror-matching';
import { Button } from './ui/button';
import { Loader2, CheckCircle2, XCircle, BarChart3, Info } from 'lucide-react';
import { MatchBreakdownModal } from './match-breakdown-modal';

interface PersonaMatchDashboardProps {
  jurorId: string;
  organizationId: string;
  caseId?: string;
}

export function PersonaMatchDashboard({ jurorId, organizationId, caseId }: PersonaMatchDashboardProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const { data: matches, isLoading, error, refetch } = useJurorMatches(jurorId);
  const matchJurorMutation = useMatchJuror();
  const confirmMatchMutation = useConfirmPersonaMatch();
  const { data: breakdown } = useMatchBreakdown(jurorId, selectedPersonaId);

  const handleMatch = async () => {
    try {
      await matchJurorMutation.mutateAsync({ jurorId, personaIds: undefined });
      refetch();
    } catch (err) {
      console.error('Failed to match juror:', err);
    }
  };

  const handleConfirmMatch = async (personaId: string, mappingId?: string, confirmed: boolean = true) => {
    try {
      await confirmMatchMutation.mutateAsync({
        jurorId,
        mappingId,
        personaId,
        confirmed,
      });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Persona Matching
          </h3>
          <p className="text-sm text-filevine-gray-600">
            AI-powered ensemble matching using signal-based scoring, embedding similarity, and Bayesian updating
          </p>
        </div>
        <Button
          onClick={handleMatch}
          disabled={matchJurorMutation.isPending || isLoading}
          variant="primary"
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
          {matches.map((match, index) => (
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
                      <h4 className="text-lg font-semibold text-filevine-gray-900">
                        {match.personaName || `Persona ${match.personaId.slice(0, 8)}`}
                      </h4>
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

                  {/* Rationale */}
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-filevine-gray-900">Rationale</h5>
                    <p className="mt-2 text-sm text-filevine-gray-700">{match.rationale}</p>
                  </div>

                  {/* Counterfactual */}
                  {match.counterfactual && (
                    <div className="mt-4 rounded-md bg-blue-50 p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-blue-900">What Would Change This Match?</h5>
                          <p className="mt-1 text-sm text-blue-800">{match.counterfactual}</p>
                        </div>
                      </div>
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
                      onClick={() => handleConfirmMatch(match.personaId, undefined, true)}
                      disabled={confirmMatchMutation.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Match
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
    </div>
  );
}
