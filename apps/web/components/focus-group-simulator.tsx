'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useFocusGroupSimulation } from '@/hooks/use-focus-group';

interface Argument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
}

interface FocusGroupSimulatorProps {
  caseId: string;
  arguments: Argument[];
}

export function FocusGroupSimulator({ caseId, arguments: caseArguments }: FocusGroupSimulatorProps) {
  const [selectedArgumentId, setSelectedArgumentId] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState<'quick' | 'detailed' | 'deliberation'>(
    'detailed'
  );

  const { mutate: simulate, data, isPending, error } = useFocusGroupSimulation();

  const handleSimulate = () => {
    if (!selectedArgumentId) return;

    simulate({
      caseId,
      argumentId: selectedArgumentId,
      simulationMode,
    });
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.5) return 'text-green-600';
    if (score < -0.5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'favorable':
        return 'bg-green-100 text-green-700';
      case 'unfavorable':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Focus Group Simulation
        </h3>
        <p className="text-sm text-filevine-gray-600">
          Test your arguments with AI-powered jury simulations
        </p>
      </div>

      {/* Configuration */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {/* Argument Selection */}
          <div>
            <label className="block text-sm font-medium text-filevine-gray-700">
              Select Argument to Test
            </label>
            <select
              value={selectedArgumentId}
              onChange={(e) => setSelectedArgumentId(e.target.value)}
              className="mt-2 block w-full rounded-md border border-filevine-gray-300 px-3 py-2 focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
            >
              <option value="">Choose an argument...</option>
              {caseArguments.map((arg) => (
                <option key={arg.id} value={arg.id}>
                  {arg.title} ({arg.argumentType})
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Mode */}
          <div>
            <label className="block text-sm font-medium text-filevine-gray-700">
              Simulation Mode
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                {
                  value: 'quick' as const,
                  label: 'Quick',
                  description: 'Brief initial reactions',
                },
                {
                  value: 'detailed' as const,
                  label: 'Detailed',
                  description: 'Comprehensive feedback',
                },
                {
                  value: 'deliberation' as const,
                  label: 'Deliberation',
                  description: 'Full jury discussion',
                },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSimulationMode(mode.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    simulationMode === mode.value
                      ? 'border-filevine-blue bg-blue-50'
                      : 'border-filevine-gray-200 hover:border-filevine-gray-300'
                  }`}
                >
                  <p className="font-medium text-filevine-gray-900">{mode.label}</p>
                  <p className="mt-1 text-xs text-filevine-gray-600">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <Button
            onClick={handleSimulate}
            disabled={!selectedArgumentId || isPending}
            variant="primary"
            className="w-full"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Running Simulation...
              </>
            ) : (
              'Run Focus Group Simulation'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to run simulation'}
          </p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Overall Reception */}
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold text-filevine-gray-900">Overall Reception</h4>
            <p className="mt-2 text-sm text-filevine-gray-700">{data.result.overallReception}</p>

            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-filevine-gray-600">Average Sentiment</p>
                <p
                  className={`text-2xl font-bold ${getSentimentColor(data.result.averageSentiment)}`}
                >
                  {data.result.averageSentiment > 0 ? '+' : ''}
                  {data.result.averageSentiment.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Persona Reactions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-filevine-gray-900">Persona Reactions</h4>

            {data.result.personaReactions.map((reaction, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h5 className="text-lg font-semibold text-filevine-gray-900">
                        {reaction.personaName}
                      </h5>
                      {reaction.verdictLean && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getVerdictColor(reaction.verdictLean)}`}
                        >
                          {reaction.verdictLean}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-filevine-gray-700">
                      {reaction.initialReaction}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-filevine-gray-600">Sentiment:</span>
                        <span
                          className={`ml-2 font-semibold ${getSentimentColor(reaction.sentimentScore)}`}
                        >
                          {reaction.sentimentScore > 0 ? '+' : ''}
                          {reaction.sentimentScore.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-filevine-gray-600">Confidence:</span>
                        <span className="ml-2 font-semibold text-filevine-gray-900">
                          {(reaction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {/* Persuasive Elements */}
                      {reaction.persuasiveElements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700">
                            ✓ What Worked:
                          </p>
                          <ul className="mt-2 space-y-1">
                            {reaction.persuasiveElements.map((element, i) => (
                              <li key={i} className="text-sm text-green-600">
                                • {element}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {reaction.weaknesses.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700">✗ Weaknesses:</p>
                          <ul className="mt-2 space-y-1">
                            {reaction.weaknesses.map((weakness, i) => (
                              <li key={i} className="text-sm text-red-600">
                                • {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {reaction.concerns.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-filevine-gray-700">
                            Concerns:
                          </p>
                          <ul className="mt-2 space-y-1">
                            {reaction.concerns.map((concern, i) => (
                              <li key={i} className="text-sm text-filevine-gray-600">
                                • {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Questions */}
                      {reaction.questions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-filevine-gray-700">
                            Questions:
                          </p>
                          <ul className="mt-2 space-y-1">
                            {reaction.questions.map((question, i) => (
                              <li key={i} className="text-sm text-filevine-gray-600">
                                • {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deliberation Summary */}
          {data.result.deliberationSummary && (
            <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-semibold text-filevine-gray-900">Deliberation Discussion</h4>

              <div className="mt-4 space-y-4">
                {data.result.deliberationSummary.exchanges.map((exchange, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border-l-4 border-filevine-blue bg-filevine-gray-50 p-4"
                  >
                    <p className="font-medium text-filevine-gray-900">
                      {exchange.speakerPersona}:
                    </p>
                    <p className="mt-1 text-sm text-filevine-gray-700">
                      "{exchange.statement}"
                    </p>
                    {exchange.influence.length > 0 && (
                      <p className="mt-2 text-xs italic text-filevine-gray-600">
                        Impact: {exchange.influence.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-green-700">Consensus Areas:</p>
                  <ul className="mt-2 space-y-1">
                    {data.result.deliberationSummary.consensusAreas.map((area, i) => (
                      <li key={i} className="text-sm text-green-600">
                        ✓ {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-red-700">Divisive Issues:</p>
                  <ul className="mt-2 space-y-1">
                    {data.result.deliberationSummary.divisiveIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-600">
                        ⚠ {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="font-semibold text-filevine-gray-900">Recommendations</h4>

            {data.result.recommendations
              .sort((a, b) => b.priority - a.priority)
              .map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-filevine-blue px-2 py-1 text-xs font-semibold text-white">
                          {rec.category}
                        </span>
                        <span className="text-xs font-semibold text-filevine-gray-600">
                          Priority: {rec.priority}/10
                        </span>
                      </div>

                      <h5 className="mt-2 font-semibold text-filevine-gray-900">
                        {rec.title}
                      </h5>
                      <p className="mt-1 text-sm text-filevine-gray-700">{rec.description}</p>

                      {rec.affectedPersonas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {rec.affectedPersonas.map((persona, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-filevine-gray-100 px-2 py-1 text-xs text-filevine-gray-700"
                            >
                              {persona}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Strengths & Weaknesses Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h5 className="font-semibold text-green-900">Strengths to Emphasize</h5>
              <ul className="mt-3 space-y-2">
                {data.result.strengthsToEmphasize.map((strength, i) => (
                  <li key={i} className="text-sm text-green-700">
                    ✓ {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h5 className="font-semibold text-red-900">Weaknesses to Address</h5>
              <ul className="mt-3 space-y-2">
                {data.result.weaknessesToAddress.map((weakness, i) => (
                  <li key={i} className="text-sm text-red-700">
                    ✗ {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
