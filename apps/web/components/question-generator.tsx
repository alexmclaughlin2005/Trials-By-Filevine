'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useQuestionGenerator } from '@/hooks/use-question-generator';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface QuestionGeneratorProps {
  caseId: string;
}

export function QuestionGenerator({ caseId }: QuestionGeneratorProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('opening');

  const { mutate: generate, data: questions, isPending, error } = useQuestionGenerator();

  const handleGenerate = () => {
    generate({ caseId });
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-700';
    if (priority >= 6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const categories = [
    { id: 'opening', label: 'Opening Questions', key: 'openingQuestions' },
    { id: 'persona', label: 'Persona Identification', key: 'personaIdentificationQuestions' },
    { id: 'case', label: 'Case-Specific', key: 'caseSpecificQuestions' },
    { id: 'challenge', label: 'Challenge for Cause', key: 'challengeForCauseQuestions' },
  ];

  const currentQuestions = questions
    ? questions[categories.find((c) => c.id === activeCategory)?.key as keyof typeof questions]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Voir Dire Question Generator
          </h3>
          <p className="text-sm text-filevine-gray-600">
            Generate strategic questions tailored to your case and target personas
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isPending} variant="primary">
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Generating...
            </>
          ) : (
            'Generate Questions'
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to generate questions'}
          </p>
        </div>
      )}

      {questions && (
        <div className="space-y-6">
          {/* Strategy Overview */}
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold text-filevine-gray-900">General Strategy</h4>
            <p className="mt-2 text-sm text-filevine-gray-700">{questions.generalStrategy}</p>

            {questions.timingNotes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-filevine-gray-700">Timing Notes:</p>
                <ul className="mt-2 space-y-1">
                  {questions.timingNotes.map((note, i) => (
                    <li key={i} className="text-sm text-filevine-gray-600">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="border-b border-filevine-gray-200">
            <div className="flex space-x-8">
              {categories.map((category) => {
                const count =
                  questions[category.key as keyof typeof questions]?.length || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'border-filevine-blue text-filevine-blue'
                        : 'border-transparent text-filevine-gray-500 hover:border-filevine-gray-300 hover:text-filevine-gray-700'
                    }`}
                  >
                    {category.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {Array.isArray(currentQuestions) && currentQuestions.length > 0 ? (
              (currentQuestions as Array<{
                question: string;
                purpose: string;
                priority: number;
                targetPersonas?: string[];
                listenFor: string[];
                redFlags: string[];
                idealAnswers: string[];
                legalNotes?: string;
                followUps?: Array<{ question: string; trigger: string; listenFor?: string[] }>;
              }>)
                .sort((a, b) => b.priority - a.priority)
                .map((q, index: number) => {
                  const isExpanded = expandedQuestions.has(index);

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-filevine-gray-200 bg-white shadow-sm"
                    >
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="flex w-full items-start gap-4 p-6 text-left hover:bg-filevine-gray-50"
                      >
                        <div className="flex-shrink-0 pt-1">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-filevine-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-filevine-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-base font-medium text-filevine-gray-900">
                              {q.question}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(q.priority)}`}
                            >
                              Priority: {q.priority}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-filevine-gray-600">
                            <span className="font-medium">Purpose:</span> {q.purpose}
                          </p>

                          {q.targetPersonas && q.targetPersonas.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {q.targetPersonas.map((persona: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-filevine-blue px-2 py-0.5 text-xs text-white"
                                >
                                  {persona}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-filevine-gray-200 bg-filevine-gray-50 p-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Listen For */}
                            <div>
                              <p className="text-sm font-semibold text-filevine-gray-900">
                                Listen For:
                              </p>
                              <ul className="mt-2 space-y-1">
                                {q.listenFor.map((item: string, i: number) => (
                                  <li key={i} className="text-sm text-filevine-gray-700">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Red Flags */}
                            <div>
                              <p className="text-sm font-semibold text-red-700">Red Flags:</p>
                              <ul className="mt-2 space-y-1">
                                {q.redFlags.map((flag: string, i: number) => (
                                  <li key={i} className="text-sm text-red-600">
                                    ⚠ {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Ideal Answers */}
                            <div>
                              <p className="text-sm font-semibold text-green-700">
                                Ideal Answers:
                              </p>
                              <ul className="mt-2 space-y-1">
                                {q.idealAnswers.map((answer: string, i: number) => (
                                  <li key={i} className="text-sm text-green-600">
                                    ✓ {answer}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Legal Notes */}
                            {q.legalNotes && (
                              <div>
                                <p className="text-sm font-semibold text-filevine-gray-900">
                                  Legal Notes:
                                </p>
                                <p className="mt-2 text-sm text-filevine-gray-700">
                                  {q.legalNotes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Follow-ups */}
                          {q.followUps && q.followUps.length > 0 && (
                            <div className="mt-6">
                              <p className="text-sm font-semibold text-filevine-gray-900">
                                Follow-up Questions:
                              </p>
                              <div className="mt-3 space-y-3">
                                {q.followUps.map((followUp, i: number) => (
                                  <div
                                    key={i}
                                    className="rounded-md border-l-4 border-filevine-blue bg-white p-3"
                                  >
                                    <p className="text-sm font-medium text-filevine-gray-900">
                                      {followUp.question}
                                    </p>
                                    <p className="mt-1 text-xs text-filevine-gray-600">
                                      <span className="font-medium">When:</span> {followUp.trigger}
                                    </p>
                                    {followUp.listenFor && followUp.listenFor.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-filevine-gray-600">
                                          Listen for:
                                        </p>
                                        <ul className="mt-1">
                                          {followUp.listenFor.map((item: string, j: number) => (
                                            <li key={j} className="text-xs text-filevine-gray-600">
                                              • {item}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-8 text-center">
                <p className="text-filevine-gray-600">
                  No {categories.find((c) => c.id === activeCategory)?.label.toLowerCase()} available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
