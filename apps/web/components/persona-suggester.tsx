'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { usePersonaSuggestions } from '@/hooks/use-persona-suggestions';

interface Persona {
  id: string;
  name: string;
  description: string;
  type: string;
  attributes: Record<string, any>;
}

interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
}

interface PersonaSuggesterProps {
  jurorId: string;
  caseId?: string;
  onPersonaSelected?: (personaId: string, suggestion: PersonaSuggestion) => void;
}

export function PersonaSuggester({ jurorId, caseId, onPersonaSelected }: PersonaSuggesterProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { mutate: getSuggestions, data: suggestions, isPending, error } = usePersonaSuggestions();

  const handleAnalyze = () => {
    setShowSuggestions(false);
    getSuggestions(
      { jurorId, caseId },
      {
        onSuccess: () => {
          setShowSuggestions(true);
        },
      }
    );
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            AI Persona Suggestions
          </h3>
          <p className="text-sm text-filevine-gray-600">
            Use Claude AI to analyze this juror and suggest matching personas
          </p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={isPending}
          variant="primary"
        >
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Analyzing...
            </>
          ) : (
            'Analyze with AI'
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to analyze juror'}
          </p>
        </div>
      )}

      {showSuggestions && (!suggestions || suggestions.length === 0) && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            No persona suggestions found. Try adding more juror information.
          </p>
        </div>
      )}

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.persona.id}
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
                        {suggestion.persona.name}
                      </h4>
                      <p className="text-sm text-filevine-gray-600">
                        {suggestion.persona.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm font-medium text-filevine-gray-700">
                      Confidence:
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceBgColor(suggestion.confidence)} ${getConfidenceColor(suggestion.confidence)}`}
                    >
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </span>
                    {suggestion.persona.type === 'system' && (
                      <span className="rounded-full bg-filevine-gray-100 px-3 py-1 text-xs font-medium text-filevine-gray-700">
                        System Persona
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-filevine-gray-900">
                      Analysis
                    </h5>
                    <p className="mt-2 text-sm text-filevine-gray-700">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {suggestion.keyMatches.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-filevine-gray-900">
                        Key Matches
                      </h5>
                      <ul className="mt-2 space-y-1">
                        {suggestion.keyMatches.map((match, i) => (
                          <li
                            key={i}
                            className="flex items-start text-sm text-filevine-gray-700"
                          >
                            <span className="mr-2 text-green-500">✓</span>
                            {match}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {suggestion.potentialConcerns.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-filevine-gray-900">
                        Potential Concerns
                      </h5>
                      <ul className="mt-2 space-y-1">
                        {suggestion.potentialConcerns.map((concern, i) => (
                          <li
                            key={i}
                            className="flex items-start text-sm text-filevine-gray-700"
                          >
                            <span className="mr-2 text-yellow-500">⚠</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onPersonaSelected?.(suggestion.persona.id, suggestion)
                    }
                  >
                    Select Persona
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
