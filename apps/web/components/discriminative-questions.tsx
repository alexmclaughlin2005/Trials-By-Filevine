'use client';

import { useState } from 'react';
import {
  useSuggestedQuestionsForJuror,
  useGenerateJurorQuestions,
  useRecordQuestionUsage,
  type SuggestedQuestion,
} from '@/hooks/use-discriminative-questions';
import { Button } from './ui/button';
import { Loader2, HelpCircle, TrendingUp, Users } from 'lucide-react';

interface DiscriminativeQuestionsProps {
  jurorId: string;
  organizationId: string;
  caseId?: string;
  onAskQuestion?: (questionId: string, questionText: string) => void;
}

export function DiscriminativeQuestions({
  jurorId,
  organizationId,
  caseId,
  onAskQuestion,
}: DiscriminativeQuestionsProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const { data: questions, isLoading, refetch } = useSuggestedQuestionsForJuror(jurorId);
  const generateQuestionsMutation = useGenerateJurorQuestions();
  const recordUsageMutation = useRecordQuestionUsage();

  const handleGenerateQuestions = async () => {
    try {
      await generateQuestionsMutation.mutateAsync({ jurorId, organizationId });
      refetch();
    } catch (err) {
      console.error('Failed to generate questions:', err);
    }
  };

  const handleQuestionClick = async (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    } else {
      setExpandedQuestionId(questionId);
      // Record usage when question is expanded
      try {
        await recordUsageMutation.mutateAsync(questionId);
      } catch (err) {
        console.error('Failed to record question usage:', err);
      }
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800';
    if (score >= 0.6) return 'bg-orange-100 text-orange-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatDiscriminatesBetween = (discriminatesBetween: any) => {
    if (typeof discriminatesBetween === 'object' && discriminatesBetween.personaAName) {
      return `${discriminatesBetween.personaAName} vs ${discriminatesBetween.personaBName}`;
    }
    return 'Multiple personas';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-filevine-gray-600">
            AI-generated questions designed to maximize information gain and resolve ambiguous persona matches
          </p>
        </div>
        <Button
          onClick={handleGenerateQuestions}
          disabled={generateQuestionsMutation.isPending}
          variant="primary"
        >
          {generateQuestionsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <HelpCircle className="mr-2 h-4 w-4" />
              Generate Questions
            </>
          )}
        </Button>
      </div>

      {generateQuestionsMutation.isError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Failed to generate questions. Please try again.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
        </div>
      )}

      {!isLoading && questions && questions.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            No questions generated yet. Click "Generate Questions" to create strategic voir dire questions for this juror.
          </p>
        </div>
      )}

      {questions && questions.length > 0 && (
        <div className="space-y-3">
          {questions
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map((question) => (
              <div
                key={question.id}
                className="rounded-lg border border-filevine-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => handleQuestionClick(question.id)}
                  className="w-full flex items-start justify-between p-4 hover:bg-filevine-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-filevine-blue flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-filevine-gray-900">
                          {question.questionText}
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(question.priorityScore)}`}
                          >
                            Priority: {(question.priorityScore * 100).toFixed(0)}%
                          </span>
                          <span className="rounded-full bg-filevine-gray-100 px-2 py-1 text-xs font-medium text-filevine-gray-700">
                            {question.questionCategory}
                          </span>
                          <span className="text-xs text-filevine-gray-600">
                            Discriminates: {formatDiscriminatesBetween(question.discriminatesBetween)}
                          </span>
                          {question.averageInformationGain && (
                            <span className="flex items-center gap-1 text-xs text-filevine-gray-600">
                              <TrendingUp className="h-3 w-3" />
                              Info Gain: {(question.averageInformationGain * 100).toFixed(1)}%
                            </span>
                          )}
                          {question.timesAsked > 0 && (
                            <span className="text-xs text-filevine-gray-500">
                              Asked {question.timesAsked} time{question.timesAsked !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedQuestionId === question.id && (
                  <div className="border-t border-filevine-gray-200 p-4 bg-filevine-gray-50 space-y-4">
                    {question.priorityRationale && (
                      <div>
                        <h5 className="text-xs font-semibold text-filevine-gray-700 mb-1">
                          Why This Question?
                        </h5>
                        <p className="text-sm text-filevine-gray-700">
                          {question.priorityRationale}
                        </p>
                      </div>
                    )}

                    {question.responseInterpretations && (
                      <div>
                        <h5 className="text-xs font-semibold text-filevine-gray-700 mb-2">
                          Response Interpretations
                        </h5>
                        <div className="space-y-2">
                          {Object.entries(question.responseInterpretations).map(([response, interpretation]: [string, any]) => (
                            <div
                              key={response}
                              className="rounded-md border border-filevine-gray-200 bg-white p-3"
                            >
                              <div className="text-xs font-medium text-filevine-gray-900 mb-1">
                                If response indicates: "{response}"
                              </div>
                              <div className="text-sm text-filevine-gray-700">
                                {interpretation.interpretation || interpretation}
                              </div>
                              {interpretation.expectedSignals && (
                                <div className="mt-2 text-xs text-filevine-gray-600">
                                  Expected signals: {interpretation.expectedSignals.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.followUpQuestions && Array.isArray(question.followUpQuestions) && question.followUpQuestions.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-filevine-gray-700 mb-2">
                          Follow-up Questions
                        </h5>
                        <ul className="space-y-1">
                          {question.followUpQuestions.map((followUp, idx) => (
                            <li key={idx} className="text-sm text-filevine-gray-700">
                              • {followUp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {onAskQuestion && (
                      <div className="pt-2 border-t border-filevine-gray-200">
                        <Button
                          onClick={() => onAskQuestion(question.id, question.questionText)}
                          variant="primary"
                          size="sm"
                          className="w-full"
                        >
                          Ask This Question
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
