'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ScoreFactors {
  nameScore: number;
  nameReason: string;
  ageScore: number;
  ageReason: string;
  locationScore: number;
  locationReason: string;
  occupationScore: number;
  occupationReason: string;
  corroborationScore: number;
  corroborationReason: string;
  totalScore: number;
}

interface Candidate {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  occupation?: string;
  employer?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  confidenceScore: number;
  sourceType: string;
  isConfirmed: boolean;
  isRejected: boolean;
  scoreFactors: ScoreFactors;
  profile?: any;
}

interface JurorResearchPanelProps {
  jurorId: string;
  jurorName: string;
  jurorInfo: {
    firstName: string;
    lastName: string;
    age?: number;
    city?: string;
    zipCode?: string;
    occupation?: string;
  };
  initialCandidates?: Candidate[];
  onCandidateConfirmed?: () => void;
}

export function JurorResearchPanel({
  jurorId,
  jurorName,
  jurorInfo,
  initialCandidates = [],
  onCandidateConfirmed,
}: JurorResearchPanelProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    try {
      setSearching(true);
      setError(null);

      console.log('Starting search for juror:', jurorId);
      const result = await apiClient.post<any>(`/jurors/${jurorId}/search`, {});
      console.log('Search result:', result);
      setCandidates(result.candidates || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async (candidateId: string) => {
    try {
      await apiClient.post(`/jurors/candidates/${candidateId}/confirm`, {});

      // Update local state
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, isConfirmed: true, isRejected: false } : c
        )
      );

      // Trigger parent refetch to show Deep Research section
      if (onCandidateConfirmed) {
        onCandidateConfirmed();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm');
    }
  };

  const handleReject = async (candidateId: string) => {
    try {
      await apiClient.post(`/jurors/candidates/${candidateId}/reject`, {});

      // Remove from local state
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const toggleExpanded = (candidateId: string) => {
    setExpandedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getSourceBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'voter_record':
        return 'bg-blue-100 text-blue-700';
      case 'fec_donation':
        return 'bg-purple-100 text-purple-700';
      case 'mock':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Identity Research</h2>
        <Button
          onClick={(e) => {
            e.preventDefault();
            console.log('Button clicked!');
            handleSearch();
          }}
          disabled={searching}
          className="flex items-center gap-2"
          size="sm"
          type="button"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search Public Records
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            No candidate matches found.
            <br />
            Click "Search Public Records" to find potential identity matches.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Found {candidates.length} potential {candidates.length === 1 ? 'match' : 'matches'}
          </p>

          {candidates.map((candidate, index) => {
            const candidateKey = candidate.id || `${candidate.fullName}-${index}`;
            const isExpanded = expandedCandidates.has(candidateKey);

            return (
              <div
                key={candidateKey}
                className="border rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {candidate.fullName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(
                          candidate.confidenceScore
                        )}`}
                      >
                        {candidate.confidenceScore}% Match
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(
                          candidate.sourceType
                        )}`}
                      >
                        {candidate.sourceType.replace('_', ' ')}
                      </span>
                      {candidate.isConfirmed && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          ✓ Confirmed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Age:</span>{' '}
                        <span className="font-medium">{candidate.age || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Occupation:</span>{' '}
                        <span className="font-medium">{candidate.occupation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>{' '}
                        <span className="font-medium">
                          {candidate.city && candidate.state
                            ? `${candidate.city}, ${candidate.state}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {(candidate.phone || candidate.email) && (
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        {candidate.phone && <span>📞 {candidate.phone}</span>}
                        {candidate.email && <span>✉️ {candidate.email}</span>}
                      </div>
                    )}

                    <button
                      onClick={() => toggleExpanded(candidateKey)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          View Score Breakdown
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-1.5">
                        <div key={`${candidateKey}-name`} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Name: {candidate.scoreFactors.nameReason}
                          </span>
                          <span className="font-medium text-gray-900">
                            {candidate.scoreFactors.nameScore}/40
                          </span>
                        </div>
                        <div key={`${candidateKey}-age`} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Age: {candidate.scoreFactors.ageReason}
                          </span>
                          <span className="font-medium text-gray-900">
                            {candidate.scoreFactors.ageScore}/20
                          </span>
                        </div>
                        <div key={`${candidateKey}-location`} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Location: {candidate.scoreFactors.locationReason}
                          </span>
                          <span className="font-medium text-gray-900">
                            {candidate.scoreFactors.locationScore}/20
                          </span>
                        </div>
                        <div key={`${candidateKey}-occupation`} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Occupation: {candidate.scoreFactors.occupationReason}
                          </span>
                          <span className="font-medium text-gray-900">
                            {candidate.scoreFactors.occupationScore}/10
                          </span>
                        </div>
                        <div key={`${candidateKey}-corroboration`} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Corroboration: {candidate.scoreFactors.corroborationReason}
                          </span>
                          <span className="font-medium text-gray-900">
                            {candidate.scoreFactors.corroborationScore}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!candidate.isConfirmed && !candidate.isRejected && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(candidate.id)}
                        className="text-green-600 hover:bg-green-50 border-green-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(candidate.id)}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
