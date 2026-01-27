'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { QuestionListItem } from './QuestionListItem';
import { Sparkles, Plus } from 'lucide-react';
import type { CustomQuestion, SuggestedQuestion } from '@/types/focus-group';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface UnifiedQuestionListProps {
  selectedQuestions: CustomQuestion[];
  suggestedQuestions: SuggestedQuestion[];
  onUpdateSelected: (questions: CustomQuestion[]) => void;
  onUpdateSuggested: (questions: SuggestedQuestion[]) => void;
  onAddCustom: (question: string) => void;
  isGenerating?: boolean;
  onRegenerate?: () => void;
}

export function UnifiedQuestionList({
  selectedQuestions,
  suggestedQuestions,
  onUpdateSelected,
  onUpdateSuggested,
  onAddCustom,
  isGenerating = false,
  onRegenerate,
}: UnifiedQuestionListProps) {
  const [newCustomQuestion, setNewCustomQuestion] = useState('');

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Accept all AI suggestions
  const handleAcceptAll = () => {
    const newQuestions = suggestedQuestions.map((suggestion, index) => ({
      id: `accepted-${suggestion.id}`,
      question: suggestion.question,
      order: selectedQuestions.length + index + 1,
      targetPersonas: suggestion.targetArchetypes,
      metadata: {
        source: 'ai' as const,
        argumentTitle: suggestion.argumentTitle,
        purpose: suggestion.purpose,
        argumentId: suggestion.argumentId,
      },
    }));

    const updated = [...selectedQuestions, ...newQuestions];
    onUpdateSelected(updated);
    onUpdateSuggested([]); // Clear suggestions
  };

  // Accept individual suggestion
  const handleAcceptSuggestion = (suggestion: SuggestedQuestion) => {
    const newQuestion: CustomQuestion = {
      id: `accepted-${suggestion.id}`,
      question: suggestion.question,
      order: selectedQuestions.length + 1,
      targetPersonas: suggestion.targetArchetypes,
      metadata: {
        source: 'ai',
        argumentTitle: suggestion.argumentTitle,
        purpose: suggestion.purpose,
        argumentId: suggestion.argumentId,
      },
    };

    const updated = [...selectedQuestions, newQuestion];
    onUpdateSelected(updated);
    onUpdateSuggested(suggestedQuestions.filter((s) => s.id !== suggestion.id));
  };

  // Edit and accept suggestion
  const handleEditAndAccept = (suggestion: SuggestedQuestion, newText: string) => {
    const newQuestion: CustomQuestion = {
      id: `accepted-${suggestion.id}`,
      question: newText,
      order: selectedQuestions.length + 1,
      targetPersonas: suggestion.targetArchetypes,
      metadata: {
        source: 'ai',
        argumentTitle: suggestion.argumentTitle,
        purpose: suggestion.purpose,
        argumentId: suggestion.argumentId,
      },
    };

    const updated = [...selectedQuestions, newQuestion];
    onUpdateSelected(updated);
    onUpdateSuggested(suggestedQuestions.filter((s) => s.id !== suggestion.id));
  };

  // Dismiss suggestion
  const handleDismissSuggestion = (suggestionId: string) => {
    onUpdateSuggested(suggestedQuestions.filter((s) => s.id !== suggestionId));
  };

  // Edit accepted question
  const handleEditQuestion = (questionId: string, newText: string) => {
    const updated = selectedQuestions.map((q) =>
      q.id === questionId ? { ...q, question: newText } : q
    );
    onUpdateSelected(updated);
  };

  // Remove accepted question
  const handleRemoveQuestion = (questionId: string) => {
    const updated = selectedQuestions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index + 1 }));
    onUpdateSelected(updated);
  };

  // Move question up
  const handleMoveUp = (questionId: string) => {
    const index = selectedQuestions.findIndex((q) => q.id === questionId);
    if (index <= 0) return;

    const updated = [...selectedQuestions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    // Re-index orders
    const reindexed = updated.map((q, i) => ({ ...q, order: i + 1 }));
    onUpdateSelected(reindexed);
  };

  // Move question down
  const handleMoveDown = (questionId: string) => {
    const index = selectedQuestions.findIndex((q) => q.id === questionId);
    if (index < 0 || index >= selectedQuestions.length - 1) return;

    const updated = [...selectedQuestions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];

    // Re-index orders
    const reindexed = updated.map((q, i) => ({ ...q, order: i + 1 }));
    onUpdateSelected(reindexed);
  };

  // Add custom question
  const handleAddCustomQuestion = () => {
    if (!newCustomQuestion.trim()) return;
    onAddCustom(newCustomQuestion);
    setNewCustomQuestion('');
  };

  // Clear all selected questions
  const handleClearAll = () => {
    onUpdateSelected([]);
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = selectedQuestions.findIndex((q) => q.id === active.id);
    const newIndex = selectedQuestions.findIndex((q) => q.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(selectedQuestions, oldIndex, newIndex);
    // Re-index orders
    const reindexed = reordered.map((q, i) => ({ ...q, order: i + 1 }));
    onUpdateSelected(reindexed);
  };

  return (
    <div className="space-y-6">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Focus Group Questions</h3>
          <p className="mt-1 text-sm text-gray-600">
            {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
            {suggestedQuestions.length > 0 &&
              ` • ${suggestedQuestions.length} AI suggestion${suggestedQuestions.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Top-level actions */}
        <div className="flex gap-2">
          {suggestedQuestions.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleAcceptAll}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Accept All Suggestions
            </Button>
          )}
          {selectedQuestions.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
          {onRegenerate && suggestedQuestions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      {/* SELECTED QUESTIONS SECTION */}
      {selectedQuestions.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Selected Questions ({selectedQuestions.length})
              </h4>
              <p className="mt-1 text-xs text-gray-600">
                Drag to reorder, or use the arrow buttons
              </p>
            </div>
            <SortableContext
              items={selectedQuestions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {selectedQuestions.map((question, index) => (
                <QuestionListItem
                  key={question.id}
                  question={question}
                  type="selected"
                  order={question.order}
                  isFirst={index === 0}
                  isLast={index === selectedQuestions.length - 1}
                  onEdit={(newText) => handleEditQuestion(question.id, newText)}
                  onRemove={() => handleRemoveQuestion(question.id)}
                  onMoveUp={() => handleMoveUp(question.id)}
                  onMoveDown={() => handleMoveDown(question.id)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* AI SUGGESTIONS SECTION */}
      {suggestedQuestions.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-white">
          <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                <Sparkles className="h-4 w-4 text-filevine-blue" />
                AI Suggestions ({suggestedQuestions.length})
              </h4>
              <p className="text-xs text-gray-600">Review and accept or dismiss</p>
            </div>
          </div>
          {suggestedQuestions.map((suggestion) => (
            <QuestionListItem
              key={suggestion.id}
              question={suggestion}
              type="suggested"
              onAccept={() => handleAcceptSuggestion(suggestion)}
              onEditAndAccept={(newText) => handleEditAndAccept(suggestion, newText)}
              onDismiss={() => handleDismissSuggestion(suggestion.id)}
            />
          ))}
        </div>
      )}

      {/* ADD CUSTOM QUESTION SECTION */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Add Custom Question
          </h4>
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newCustomQuestion}
              onChange={(e) => setNewCustomQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCustomQuestion.trim()) {
                  handleAddCustomQuestion();
                }
              }}
              placeholder="Type your custom question here..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
            />
            <Button
              onClick={handleAddCustomQuestion}
              disabled={!newCustomQuestion.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {selectedQuestions.length === 0 &&
        suggestedQuestions.length === 0 &&
        !isGenerating && (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-sm text-gray-600">
              No questions added yet. Add custom questions above or generate AI suggestions.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Questions are optional - you can skip this step if you prefer.
            </p>
          </div>
        )}
    </div>
  );
}
