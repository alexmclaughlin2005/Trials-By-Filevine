'use client';

/**
 * Archetype Classifier Component
 *
 * Classifies jurors into behavioral archetypes and displays results
 */

import { useState } from 'react';
import { useClassifyJuror, type ClassificationResult } from '@/hooks/use-archetype-classifier';

interface ArchetypeClassifierProps {
  jurorId: string;
  caseType?: string;
  jurisdiction?: string;
  ourSide?: 'plaintiff' | 'defense';
}

const ARCHETYPE_COLORS: Record<string, string> = {
  bootstrapper: 'bg-red-100 text-red-800 border-red-300',
  crusader: 'bg-green-100 text-green-800 border-green-300',
  scale_balancer: 'bg-blue-100 text-blue-800 border-blue-300',
  captain: 'bg-purple-100 text-purple-800 border-purple-300',
  chameleon: 'bg-gray-100 text-gray-800 border-gray-300',
  scarred: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  calculator: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  heart: 'bg-pink-100 text-pink-800 border-pink-300',
  trojan_horse: 'bg-orange-100 text-orange-800 border-orange-300',
  maverick: 'bg-teal-100 text-teal-800 border-teal-300',
};

export function ArchetypeClassifier({
  jurorId,
  caseType,
  jurisdiction,
  ourSide,
}: ArchetypeClassifierProps) {
  const [includeResearch, setIncludeResearch] = useState(true);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const classifyMutation = useClassifyJuror();

  const handleClassify = async () => {
    try {
      const response = await classifyMutation.mutateAsync({
        jurorId,
        includeResearch,
        caseType,
        jurisdiction,
        ourSide,
      });
      setResult(response.classification);
    } catch (error) {
      console.error('Classification failed:', error);
    }
  };

  const getDangerColor = (level: number) => {
    if (level >= 4) return 'text-red-600 font-bold';
    if (level >= 3) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="space-y-4">
      {/* Classification Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleClassify}
          disabled={classifyMutation.isPending}
          className="rounded-md bg-filevine-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {classifyMutation.isPending ? 'Classifying...' : 'Classify Juror'}
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeResearch}
            onChange={(e) => setIncludeResearch(e.target.checked)}
            className="rounded border-gray-300"
          />
          Include Research Artifacts
        </label>
      </div>

      {/* Error Display */}
      {classifyMutation.isError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Classification failed. Please try again or check your API configuration.
          </p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Primary Archetype */}
          <div className="rounded-lg border-2 border-filevine-blue bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-filevine-gray-900">
                  Primary Archetype
                </h3>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
                      ARCHETYPE_COLORS[result.primary.archetype] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {result.primary.archetypeName}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-filevine-gray-600">Confidence</div>
                <div
                  className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceColor(
                    result.primary.confidence
                  )}`}
                >
                  {(result.primary.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-filevine-gray-700">
                Archetype Strength
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-filevine-blue"
                  style={{ width: `${result.primary.strength * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-filevine-gray-600">
                {(result.primary.strength * 100).toFixed(0)}% match strength
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-filevine-gray-700">Reasoning</div>
              <p className="mt-1 text-sm text-filevine-gray-900">
                {result.primary.reasoning}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Key Indicators */}
              <div>
                <div className="mb-2 text-sm font-medium text-filevine-gray-700">
                  Key Indicators
                </div>
                <ul className="space-y-1">
                  {result.primary.keyIndicators.map((indicator, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-filevine-gray-900"
                    >
                      <span className="text-green-600">✓</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              {result.primary.concerns.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-filevine-gray-700">
                    Concerns
                  </div>
                  <ul className="space-y-1">
                    {result.primary.concerns.map((concern, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-filevine-gray-900"
                      >
                        <span className="text-yellow-600">⚠</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Archetype */}
          {result.secondary && (
            <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-filevine-gray-900">
                    Secondary Archetype (Hybrid)
                  </h3>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
                        ARCHETYPE_COLORS[result.secondary.archetype] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.secondary.archetypeName}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-filevine-gray-600">Confidence</div>
                  <div
                    className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceColor(
                      result.secondary.confidence
                    )}`}
                  >
                    {(result.secondary.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <p className="text-sm text-filevine-gray-900">
                {result.secondary.reasoning}
              </p>
            </div>
          )}

          {/* Strategic Recommendations */}
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-filevine-gray-900">
              Strategic Assessment
            </h3>

            <div className="mb-6 grid grid-cols-2 gap-6">
              {/* Plaintiff Danger */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-medium text-filevine-gray-700">
                  Plaintiff Danger Level
                </div>
                <div
                  className={`mt-2 text-3xl font-bold ${getDangerColor(
                    result.recommendations.plaintiffDangerLevel
                  )}`}
                >
                  {result.recommendations.plaintiffDangerLevel}/5
                </div>
                <div className="mt-1 text-xs text-filevine-gray-600">
                  {result.recommendations.plaintiffDangerLevel >= 4
                    ? 'High Risk - Priority Strike'
                    : result.recommendations.plaintiffDangerLevel >= 3
                    ? 'Moderate Risk'
                    : 'Low Risk - May Keep'}
                </div>
              </div>

              {/* Defense Danger */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-medium text-filevine-gray-700">
                  Defense Danger Level
                </div>
                <div
                  className={`mt-2 text-3xl font-bold ${getDangerColor(
                    result.recommendations.defenseDangerLevel
                  )}`}
                >
                  {result.recommendations.defenseDangerLevel}/5
                </div>
                <div className="mt-1 text-xs text-filevine-gray-600">
                  {result.recommendations.defenseDangerLevel >= 4
                    ? 'High Risk - Priority Strike'
                    : result.recommendations.defenseDangerLevel >= 3
                    ? 'Moderate Risk'
                    : 'Low Risk - May Keep'}
                </div>
              </div>
            </div>

            {/* Cause Challenge */}
            {result.recommendations.causeChallenge && (
              <div className="mb-4 rounded-md bg-yellow-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-yellow-600">⚖️</span>
                  <span className="font-medium text-yellow-900">
                    Cause Challenge Opportunity
                  </span>
                </div>
                <div className="mb-2 text-sm text-yellow-800">
                  Vulnerability:{' '}
                  {(result.recommendations.causeChallenge.vulnerability * 100).toFixed(0)}%
                </div>
                <div className="text-sm font-medium text-yellow-900">
                  Suggested Questions:
                </div>
                <ul className="mt-2 space-y-1">
                  {result.recommendations.causeChallenge.suggestedQuestions.map(
                    (question, idx) => (
                      <li key={idx} className="text-sm text-yellow-800">
                        • {question}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Voir Dire Questions */}
            {result.recommendations.voirDireQuestions.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium text-filevine-gray-700">
                  Recommended Voir Dire Questions
                </div>
                <ul className="space-y-2">
                  {result.recommendations.voirDireQuestions.map((question, idx) => (
                    <li
                      key={idx}
                      className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Psychological Dimensions */}
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-filevine-gray-900">
              Psychological Profile
            </h3>

            <div className="space-y-3">
              {Object.entries(result.primary.dimensionScores).map(([dimension, score]) => {
                if (dimension === 'institutional_trust') {
                  const trust = score as any;
                  return (
                    <div key={dimension}>
                      <div className="mb-2 text-sm font-medium text-filevine-gray-700">
                        Institutional Trust
                      </div>
                      <div className="ml-4 space-y-2">
                        {Object.entries(trust).map(([entity, value]) => (
                          <DimensionBar
                            key={entity}
                            label={entity
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            value={value as number}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <DimensionBar
                    key={dimension}
                    label={dimension
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    value={score as number}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val <= 2) return 'bg-blue-500';
    if (val <= 3) return 'bg-gray-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-filevine-gray-700">{label}</span>
        <span className="font-medium text-filevine-gray-900">
          {value.toFixed(1)}/5.0
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${getColor(value)}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
