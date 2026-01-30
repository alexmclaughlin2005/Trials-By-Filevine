'use client';

import { useCaseVoirDireQuestions, type CaseVoirDireQuestion } from '@/hooks/use-case-voir-dire-questions';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';

interface CaseVoirDireQuestionListProps {
  caseId: string;
  jurorId: string;
  onSelectQuestion: (question: CaseVoirDireQuestion) => void;
}

export function CaseVoirDireQuestionList({
  caseId,
  jurorId,
  onSelectQuestion,
}: CaseVoirDireQuestionListProps) {
  const { data, isLoading } = useCaseVoirDireQuestions(caseId, {
    jurorId,
  });

  const questions = data?.questions || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-filevine-blue" />
        <span className="ml-2 text-sm text-filevine-gray-600">Loading questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-6 text-center">
        <HelpCircle className="mx-auto h-8 w-8 text-filevine-gray-400" />
        <p className="mt-2 text-sm font-medium text-filevine-gray-900">No case-level questions</p>
        <p className="mt-1 text-xs text-filevine-gray-600">
          Create questions at the case level to ask all jurors
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-filevine-gray-900 mb-3">Case-Level Questions</h4>
      {questions.map((question) => (
        <button
          key={question.id}
          onClick={() => onSelectQuestion(question)}
          className="w-full rounded-lg border border-filevine-gray-200 bg-white p-3 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4 text-filevine-blue flex-shrink-0" />
                <p className="text-sm font-medium text-filevine-gray-900">{question.questionText}</p>
              </div>
              {question.questionCategory && (
                <p className="text-xs text-filevine-gray-500 ml-6">{question.questionCategory}</p>
              )}
            </div>
            {question.hasAnswer && (
              <CheckCircle2 className="h-4 w-4 text-filevine-green flex-shrink-0 ml-2" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
