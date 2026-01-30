'use client';

import { useState } from 'react';
import { useCaseVoirDireQuestions, type CaseVoirDireQuestion } from '@/hooks/use-case-voir-dire-questions';
import { useVoirDireResponses } from '@/hooks/use-voir-dire-responses';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, CheckCircle2, MessageSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface VoirDireManagerProps {
  caseId: string;
  jurorId: string;
  onAddResponse: (questionId?: string, questionText?: string) => void;
}

export function VoirDireManager({
  caseId,
  jurorId,
  onAddResponse,
}: VoirDireManagerProps) {
  const [showQuestions, setShowQuestions] = useState(true);
  const [showResponses, setShowResponses] = useState(true);

  const { data: questionsData, isLoading: questionsLoading } = useCaseVoirDireQuestions(caseId, {
    jurorId,
  });
  const { data: responsesData, isLoading: responsesLoading } = useVoirDireResponses(jurorId, {
    orderBy: 'timestamp',
    order: 'desc',
  });

  const questions = questionsData?.questions || [];
  const responses = responsesData?.responses || [];

  // Get answered question IDs
  const answeredQuestionIds = new Set(
    responses
      .filter((r) => r.questionId && r.questionType === 'CASE_LEVEL')
      .map((r) => r.questionId!)
  );

  const unansweredQuestions = questions.filter((q) => !answeredQuestionIds.has(q.id));
  const answeredQuestions = questions.filter((q) => answeredQuestionIds.has(q.id));

  return (
    <div className="space-y-4">
      {/* Header with Add Response Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-filevine-gray-900">Voir Dire</h3>
        <Button
          onClick={() => onAddResponse()}
          variant="primary"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Response
        </Button>
      </div>

      {/* Case-Level Questions Section */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex w-full items-center justify-between text-left"
          >
            <h4 className="text-sm font-medium text-filevine-gray-700">
              Case-Level Questions ({questions.length})
            </h4>
            <span className="text-filevine-gray-400">
              {showQuestions ? '−' : '+'}
            </span>
          </button>

          {showQuestions && (
            <div className="space-y-2 pl-2 border-l-2 border-filevine-gray-200">
              {/* Unanswered Questions */}
              {unansweredQuestions.length > 0 && (
                <div className="space-y-2">
                  {unansweredQuestions.map((question) => (
                    <button
                      key={question.id}
                      onClick={() => onAddResponse(question.id, question.questionText)}
                      className="w-full rounded-lg border border-filevine-gray-200 bg-white p-3 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <HelpCircle className="h-4 w-4 text-filevine-blue flex-shrink-0" />
                            <p className="text-sm font-medium text-filevine-gray-900">
                              {question.questionText}
                            </p>
                          </div>
                          {question.questionCategory && (
                            <p className="text-xs text-filevine-gray-500 ml-6">
                              {question.questionCategory}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-filevine-gray-400 ml-2">Click to answer</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Answered Questions */}
              {answeredQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-filevine-gray-500 uppercase tracking-wide mt-4 mb-2">
                    Answered ({answeredQuestions.length})
                  </p>
                  {answeredQuestions.map((question) => {
                    const questionResponses = responses.filter(
                      (r) => r.questionId === question.id && r.questionType === 'CASE_LEVEL'
                    );
                    const latestResponse = questionResponses[0];

                    return (
                      <button
                        key={question.id}
                        onClick={() => onAddResponse(question.id, question.questionText)}
                        className="w-full rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-3 text-left transition-colors hover:border-filevine-blue hover:bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-4 w-4 text-filevine-green flex-shrink-0" />
                              <p className="text-sm font-medium text-filevine-gray-900">
                                {question.questionText}
                              </p>
                            </div>
                            {latestResponse && (
                              <div className="ml-6 mt-1">
                                {latestResponse.yesNoAnswer !== null && (
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold mr-2 ${
                                      latestResponse.yesNoAnswer
                                        ? 'bg-filevine-green/20 text-filevine-green-700'
                                        : 'bg-filevine-red/20 text-filevine-red-700'
                                    }`}
                                  >
                                    {latestResponse.yesNoAnswer ? 'Yes' : 'No'}
                                  </span>
                                )}
                                <span className="text-xs text-filevine-gray-600 line-clamp-1">
                                  {latestResponse.responseSummary}
                                </span>
                                <span className="text-xs text-filevine-gray-400 ml-2">
                                  {format(new Date(latestResponse.responseTimestamp), 'MMM d')}
                                </span>
                              </div>
                            )}
                            {questionResponses.length > 1 && (
                              <p className="text-xs text-filevine-gray-500 ml-6 mt-1">
                                {questionResponses.length} responses
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Response History Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowResponses(!showResponses)}
          className="flex w-full items-center justify-between text-left"
        >
          <h4 className="text-sm font-medium text-filevine-gray-700">
            Response History ({responses.length})
          </h4>
          <span className="text-filevine-gray-400">
            {showResponses ? '−' : '+'}
          </span>
        </button>

        {showResponses && (
          <div className="space-y-2 pl-2 border-l-2 border-filevine-gray-200">
            {responsesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-filevine-blue" />
                <span className="ml-2 text-sm text-filevine-gray-600">Loading responses...</span>
              </div>
            ) : responses.length === 0 ? (
              <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-filevine-gray-400" />
                <p className="mt-2 text-sm font-medium text-filevine-gray-900">
                  No voir dire responses yet
                </p>
                <p className="mt-1 text-xs text-filevine-gray-600">
                  Record questions and responses to track voir dire interactions
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-lg border border-filevine-gray-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-filevine-gray-900 mb-1">
                          {response.questionText}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {response.yesNoAnswer !== null && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                response.yesNoAnswer
                                  ? 'bg-filevine-green/20 text-filevine-green-700'
                                  : 'bg-filevine-red/20 text-filevine-red-700'
                              }`}
                            >
                              {response.yesNoAnswer ? 'Yes' : 'No'}
                            </span>
                          )}
                          <span className="text-xs text-filevine-gray-600">
                            {response.responseSummary}
                          </span>
                        </div>
                        <p className="text-xs text-filevine-gray-500 mt-1">
                          {format(new Date(response.responseTimestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State - No Questions */}
      {!questionsLoading && questions.length === 0 && responses.length === 0 && (
        <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-8 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-filevine-gray-400" />
          <p className="mt-4 text-sm font-medium text-filevine-gray-900">
            No voir dire questions or responses
          </p>
          <p className="mt-1 text-sm text-filevine-gray-600">
            Create case-level questions or record responses to get started
          </p>
        </div>
      )}
    </div>
  );
}
