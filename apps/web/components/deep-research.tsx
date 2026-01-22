'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DeepResearchProps {
  candidateId: string;
  candidateName: string;
  caseType: string;
  caseIssues?: string[];
  clientPosition: 'plaintiff' | 'defense';
}

interface SynthesisProfile {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  profile?: any;
  data_richness?: string;
  confidence_overall?: string;
  concerns_count?: number;
  favorable_count?: number;
  web_search_count?: number;
  input_tokens?: number;
  output_tokens?: number;
  processing_time_ms?: number;
  error_message?: string;
}

export function DeepResearch({
  candidateId,
  candidateName,
  caseType,
  caseIssues = [],
  clientPosition,
}: DeepResearchProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [profile, setProfile] = useState<SynthesisProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if synthesis already exists on mount
  useEffect(() => {
    checkExistingProfile();
  }, [candidateId]);

  const checkExistingProfile = async () => {
    try {
      const result = await apiClient.get<any>(`/candidates/${candidateId}/synthesis`);
      if (result.status === 'completed' && result.profile_id) {
        const profileData = await apiClient.get<SynthesisProfile>(`/synthesis/${result.profile_id}`);
        setProfile(profileData);
      } else if (result.status === 'processing') {
        setProfile({ id: result.job_id, status: 'processing' });
        startPolling();
      }
    } catch (err) {
      // No existing profile, that's fine
    }
  };

  const startSynthesis = async () => {
    try {
      setIsStarting(true);
      setError(null);

      const result = await apiClient.post<any>(`/candidates/${candidateId}/synthesize`, {
        case_context: {
          case_type: caseType || 'general civil',
          key_issues: caseIssues.length > 0 ? caseIssues : ['liability', 'damages'],
          client_position: clientPosition,
        },
      });

      setProfile({ id: result.job_id, status: 'processing' });
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start synthesis');
    } finally {
      setIsStarting(false);
    }
  };

  const startPolling = () => {
    setIsPolling(true);
    pollStatus();
  };

  const pollStatus = async () => {
    let attempts = 0;
    const maxAttempts = 40; // 40 attempts * 2 seconds = 80 seconds max

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Synthesis timed out. Please try again.');
        setIsPolling(false);
        return;
      }

      try {
        const result = await apiClient.get<any>(`/candidates/${candidateId}/synthesis`);

        if (result.status === 'completed' && result.profile_id) {
          const profileData = await apiClient.get<SynthesisProfile>(`/synthesis/${result.profile_id}`);
          setProfile(profileData);
          setIsPolling(false);
        } else if (result.status === 'failed') {
          setError(result.error || 'Synthesis failed');
          setIsPolling(false);
        } else {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check status');
        setIsPolling(false);
      }
    };

    poll();
  };

  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;

    const colors = {
      high: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-orange-100 text-orange-700 border-orange-200',
    };

    return (
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${colors[confidence as keyof typeof colors]}`}>
        {confidence.toUpperCase()} CONFIDENCE
      </span>
    );
  };

  const getRichnessBadge = (richness?: string) => {
    if (!richness) return null;

    const colors = {
      comprehensive: 'bg-green-100 text-green-700 border-green-200',
      moderate: 'bg-blue-100 text-blue-700 border-blue-200',
      sparse: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    return (
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${colors[richness as keyof typeof colors]}`}>
        {richness.toUpperCase()} DATA
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-filevine-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-filevine-blue" />
            Deep Research Synthesis
          </h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            AI-powered research with web search for {candidateName}
          </p>
        </div>

        {!profile && !isPolling && (
          <Button
            onClick={startSynthesis}
            disabled={isStarting}
            className="flex items-center gap-2"
            size="sm"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start Deep Research
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isPolling && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-filevine-blue animate-spin" />
          <p className="text-filevine-gray-900 font-medium">Synthesizing juror profile...</p>
          <p className="text-sm text-filevine-gray-600 mt-2">
            This may take 10-60 seconds while Claude searches the web and analyzes data
          </p>
        </div>
      )}

      {profile?.status === 'completed' && profile.profile && (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="flex items-center gap-3 pb-4 border-b border-filevine-gray-200">
            {getConfidenceBadge(profile.confidence_overall)}
            {getRichnessBadge(profile.data_richness)}
            {profile.web_search_count !== undefined && profile.web_search_count > 0 && (
              <span className="rounded-full border border-filevine-blue bg-blue-50 px-3 py-1 text-xs font-semibold text-filevine-blue">
                {profile.web_search_count} WEB SEARCHES
              </span>
            )}
          </div>

          {/* Summary */}
          {profile.profile.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Executive Summary</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{profile.profile.summary}</p>
            </div>
          )}

          {/* Strategic Indicators */}
          <div className="grid grid-cols-2 gap-4">
            {profile.concerns_count !== undefined && profile.concerns_count > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-orange-900">Concerns</h3>
                </div>
                <p className="text-2xl font-bold text-orange-900">{profile.concerns_count}</p>
                <p className="text-xs text-orange-700 mt-1">potential risks identified</p>
              </div>
            )}

            {profile.favorable_count !== undefined && profile.favorable_count > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Favorable</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">{profile.favorable_count}</p>
                <p className="text-xs text-green-700 mt-1">positive indicators found</p>
              </div>
            )}
          </div>

          {/* Voir Dire Recommendations */}
          {profile.profile.voir_dire_recommendations?.suggested_questions && (
            <div className="border border-filevine-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-filevine-gray-900 mb-3">
                Suggested Voir Dire Questions
              </h3>
              <div className="space-y-3">
                {profile.profile.voir_dire_recommendations.suggested_questions.slice(0, 3).map((q: any, i: number) => (
                  <div key={i} className="bg-filevine-gray-50 rounded-md p-3">
                    <p className="text-sm font-medium text-filevine-gray-900 mb-1">
                      {i + 1}. {q.question}
                    </p>
                    <p className="text-xs text-filevine-gray-600 italic">{q.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {profile.profile.voir_dire_recommendations?.potential_concerns && profile.profile.voir_dire_recommendations.potential_concerns.length > 0 && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">Potential Concerns</h3>
              <div className="space-y-2">
                {profile.profile.voir_dire_recommendations.potential_concerns.map((c: any, i: number) => (
                  <div key={i} className="bg-white rounded-md p-3 border border-orange-200">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        c.severity === 'high' ? 'bg-red-100 text-red-700' :
                        c.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.severity?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-filevine-gray-900">{c.concern}</p>
                        <p className="text-xs text-filevine-gray-600 mt-1">{c.evidence}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorable Indicators */}
          {profile.profile.voir_dire_recommendations?.favorable_indicators && profile.profile.voir_dire_recommendations.favorable_indicators.length > 0 && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Favorable Indicators</h3>
              <div className="space-y-2">
                {profile.profile.voir_dire_recommendations.favorable_indicators.map((f: any, i: number) => (
                  <div key={i} className="bg-white rounded-md p-3 border border-green-200">
                    <p className="text-sm font-medium text-filevine-gray-900">{f.indicator}</p>
                    <p className="text-xs text-filevine-gray-600 mt-1">{f.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Metadata */}
          <div className="text-xs text-filevine-gray-500 pt-4 border-t border-filevine-gray-200">
            <div className="flex items-center justify-between">
              <span>
                Processed in {profile.processing_time_ms ? `${(profile.processing_time_ms / 1000).toFixed(1)}s` : 'N/A'}
              </span>
              <span>
                {profile.input_tokens && profile.output_tokens
                  ? `${profile.input_tokens.toLocaleString()} in / ${profile.output_tokens.toLocaleString()} out tokens`
                  : 'Token usage not available'}
              </span>
            </div>
          </div>
        </div>
      )}

      {!profile && !isPolling && !error && (
        <div className="text-center py-12 text-filevine-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-filevine-gray-300" />
          <p className="text-sm mb-2">
            Start deep research to generate a comprehensive juror profile
          </p>
          <p className="text-xs text-filevine-gray-400">
            Uses Claude AI with web search to find and analyze public information
          </p>
        </div>
      )}
    </div>
  );
}
