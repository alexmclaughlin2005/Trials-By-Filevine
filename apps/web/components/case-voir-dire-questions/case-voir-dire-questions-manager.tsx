'use client';

import { useState } from 'react';
import {
  useCaseVoirDireQuestions,
  useCreateCaseVoirDireQuestion,
  useUpdateCaseVoirDireQuestion,
  useDeleteCaseVoirDireQuestion,
  useGenerateAICaseVoirDireQuestions,
  type CaseVoirDireQuestion,
} from '@/hooks/use-case-voir-dire-questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  GripVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface CaseVoirDireQuestionsManagerProps {
  caseId: string;
}

export function CaseVoirDireQuestionsManager({ caseId }: CaseVoirDireQuestionsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CaseVoirDireQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');

  const { data, isLoading, refetch } = useCaseVoirDireQuestions(caseId, {
    includeInactive: true,
  });
  const createMutation = useCreateCaseVoirDireQuestion();
  const updateMutation = useUpdateCaseVoirDireQuestion();
  const deleteMutation = useDeleteCaseVoirDireQuestion();
  const generateAIMutation = useGenerateAICaseVoirDireQuestions();

  const questions = data?.questions || [];

  const handleCreate = async () => {
    if (!questionText.trim()) return;

    try {
      await createMutation.mutateAsync({
        caseId,
        input: {
          questionText: questionText.trim(),
          questionType: 'USER_CREATED',
          questionCategory: questionCategory.trim() || undefined,
        },
      });
      setQuestionText('');
      setQuestionCategory('');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  const handleEdit = (question: CaseVoirDireQuestion) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setQuestionCategory(question.questionCategory || '');
  };

  const handleUpdate = async () => {
    if (!editingQuestion || !questionText.trim()) return;

    try {
      await updateMutation.mutateAsync({
        caseId,
        questionId: editingQuestion.id,
        input: {
          questionText: questionText.trim(),
          questionCategory: questionCategory.trim() || undefined,
        },
      });
      setEditingQuestion(null);
      setQuestionText('');
      setQuestionCategory('');
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteMutation.mutateAsync({ caseId, questionId });
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const handleToggleActive = async (question: CaseVoirDireQuestion) => {
    try {
      await updateMutation.mutateAsync({
        caseId,
        questionId: question.id,
        input: {
          isActive: !question.isActive,
        },
      });
    } catch (error) {
      console.error('Failed to toggle question:', error);
    }
  };

  const handleGenerateAI = async () => {
    try {
      await generateAIMutation.mutateAsync(caseId);
    } catch (error) {
      console.error('Failed to generate AI questions:', error);
    }
  };

  const getQuestionTypeColor = (type: string) => {
    return type === 'AI_GENERATED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
        <span className="ml-2 text-filevine-gray-600">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">Case-Level Voir Dire Questions</h3>
          <p className="text-sm text-filevine-gray-600">
            Questions that can be asked to all jurors in this case
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateAI}
            disabled={generateAIMutation.isPending}
            variant="outline"
            size="sm"
          >
            {generateAIMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Questions
              </>
            )}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} variant="primary" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-8 text-center">
          <p className="text-sm font-medium text-filevine-gray-900">No questions yet</p>
          <p className="mt-1 text-sm text-filevine-gray-600">
            Create questions manually or generate AI questions based on your case
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question) => (
            <div
              key={question.id}
              className={`rounded-lg border p-4 ${
                question.isActive
                  ? 'border-filevine-gray-200 bg-white'
                  : 'border-filevine-gray-100 bg-filevine-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getQuestionTypeColor(
                        question.questionType
                      )}`}
                    >
                      {question.questionType === 'AI_GENERATED' ? 'AI Generated' : 'User Created'}
                    </span>
                    {question.questionCategory && (
                      <span className="rounded-full bg-filevine-gray-100 px-2 py-0.5 text-xs font-medium text-filevine-gray-700">
                        {question.questionCategory}
                      </span>
                    )}
                    {!question.isActive && (
                      <span className="rounded-full bg-filevine-gray-200 px-2 py-0.5 text-xs font-medium text-filevine-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-filevine-gray-900">{question.questionText}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleToggleActive(question)}
                    variant="ghost"
                    size="sm"
                    title={question.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {question.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-filevine-green" />
                    ) : (
                      <XCircle className="h-4 w-4 text-filevine-gray-400" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleEdit(question)}
                    variant="ghost"
                    size="sm"
                    disabled={question.questionType === 'AI_GENERATED'}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(question.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 text-filevine-red" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Case-Level Question</DialogTitle>
            <DialogDescription>
              Add a question that can be asked to all jurors in this case
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the question..."
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionCategory">Category (Optional)</Label>
              <Input
                id="questionCategory"
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
                placeholder="e.g., Opening, Case-Specific, Challenge for Cause"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !questionText.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Question'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update the question text and category</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-questionText">Question</Label>
              <Textarea
                id="edit-questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-questionCategory">Category (Optional)</Label>
              <Input
                id="edit-questionCategory"
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !questionText.trim()}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Question'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
