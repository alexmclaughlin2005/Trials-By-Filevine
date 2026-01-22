'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useResearchSummarizer } from '@/hooks/use-research-summarizer';

interface ResearchArtifact {
  id: string;
  sourceType: string;
  sourceName: string | null;
  sourceUrl: string | null;
  rawContent: string | null;
  extractedSnippets?: any;
  signals?: any;
  matchRationale?: string | null;
}

interface ResearchSummarizerProps {
  jurorId: string;
  artifacts: ResearchArtifact[];
  onSummariesGenerated?: () => void;
}

export function ResearchSummarizer({
  jurorId,
  artifacts,
  onSummariesGenerated,
}: ResearchSummarizerProps) {
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const { mutate: summarize, data, isPending, error } = useResearchSummarizer();

  const handleSummarize = () => {
    summarize(
      {
        jurorId,
        artifactIds: selectedArtifactIds.length > 0 ? selectedArtifactIds : undefined,
      },
      {
        onSuccess: () => {
          onSummariesGenerated?.();
        },
      }
    );
  };

  const toggleArtifact = (artifactId: string) => {
    setSelectedArtifactIds((prev) =>
      prev.includes(artifactId) ? prev.filter((id) => id !== artifactId) : [...prev, artifactId]
    );
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'mixed':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (artifacts.length === 0) {
    return (
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6">
        <p className="text-sm text-filevine-gray-600">No research artifacts available to analyze</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            AI Research Analysis
          </h3>
          <p className="text-sm text-filevine-gray-600">
            Extract persona signals and insights from research artifacts
          </p>
        </div>
        <Button onClick={handleSummarize} disabled={isPending} variant="primary">
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Analyzing...
            </>
          ) : (
            'Analyze Research'
          )}
        </Button>
      </div>

      {/* Artifact selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-filevine-gray-700">
          Select artifacts to analyze (or analyze all):
        </p>
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <label
              key={artifact.id}
              className="flex items-center space-x-3 rounded border border-filevine-gray-200 bg-white p-3 hover:bg-filevine-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedArtifactIds.includes(artifact.id)}
                onChange={() => toggleArtifact(artifact.id)}
                className="h-4 w-4 rounded border-gray-300 text-filevine-blue focus:ring-filevine-blue"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-filevine-gray-900">
                  {artifact.sourceName || artifact.sourceType}
                </p>
                {artifact.sourceUrl && (
                  <a
                    href={artifact.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-filevine-blue hover:underline"
                  >
                    {artifact.sourceUrl}
                  </a>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to analyze research'}
          </p>
        </div>
      )}

      {data?.message && !data.summaries?.length && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">{data.message}</p>
        </div>
      )}

      {/* Results */}
      {data?.summaries && data.summaries.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-filevine-gray-900">Analysis Results</h4>

          {data.summaries.map((summary) => {
            const artifact = artifacts.find((a) => a.id === summary.artifactId);

            return (
              <div
                key={summary.artifactId}
                className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-filevine-gray-900">
                      {artifact?.sourceName || artifact?.sourceType}
                    </h5>
                    <p className="mt-1 text-sm text-filevine-gray-700">{summary.summary}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getSentimentColor(summary.sentiment)}`}
                  >
                    {summary.sentiment}
                  </span>
                </div>

                {/* Key Themes */}
                {summary.keyThemes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-filevine-gray-700">Key Themes:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {summary.keyThemes.map((theme, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-filevine-gray-100 px-3 py-1 text-xs text-filevine-gray-700"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Persona Signals */}
                {summary.personaSignals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-filevine-gray-700">Persona Signals:</p>
                    <div className="mt-2 space-y-3">
                      {summary.personaSignals.map((signal, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-filevine-blue px-2 py-0.5 text-xs font-semibold text-white">
                                  {signal.category}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${getConfidenceColor(signal.confidence)}`}
                                >
                                  {(signal.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-filevine-gray-900">{signal.signal}</p>
                              {signal.evidence.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-filevine-gray-600">
                                    Evidence:
                                  </p>
                                  <ul className="mt-1 space-y-1">
                                    {signal.evidence.map((ev, j) => (
                                      <li key={j} className="text-xs text-filevine-gray-700">
                                        • {ev}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <p className="mt-2 text-xs italic text-filevine-gray-600">
                                Relevance: {signal.relevance}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Snippets */}
                {summary.extractedSnippets.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-filevine-gray-700">Key Excerpts:</p>
                    <div className="mt-2 space-y-2">
                      {summary.extractedSnippets.map((snippet, i) => (
                        <div
                          key={i}
                          className="rounded-md border-l-4 border-filevine-blue bg-filevine-gray-50 p-3"
                        >
                          <p className="text-sm text-filevine-gray-900">"{snippet.text}"</p>
                          <p className="mt-1 text-xs text-filevine-gray-600">{snippet.context}</p>
                          <span
                            className={`mt-1 inline-block text-xs font-medium ${
                              snippet.relevance === 'high'
                                ? 'text-red-600'
                                : snippet.relevance === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {snippet.relevance} relevance
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {summary.warnings && summary.warnings.length > 0 && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">⚠️ Warnings:</p>
                    <ul className="mt-2 space-y-1">
                      {summary.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-red-700">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
