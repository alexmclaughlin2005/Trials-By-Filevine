'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, User, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { CustomQuestion, SuggestedQuestion } from '@/types/focus-group';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestionListItemProps {
  question: CustomQuestion | SuggestedQuestion;
  type: 'selected' | 'suggested';
  order?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onEdit?: (newText: string) => void;
  onAccept?: () => void;
  onEditAndAccept?: (newText: string) => void;
  onDismiss?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function QuestionListItem({
  question,
  type,
  order,
  isFirst,
  isLast,
  onEdit,
  onAccept,
  onEditAndAccept,
  onDismiss,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(
    'question' in question ? question.question : ''
  );
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const isSuggestion = type === 'suggested';

  // Determine if this is an AI-generated question
  const isAiGenerated = isSuggestion ||
    ('metadata' in question && question.metadata?.source?.startsWith('ai'));

  // Get metadata from either SuggestedQuestion or CustomQuestion
  const metadata = isSuggestion
    ? {
        purpose: (question as SuggestedQuestion).purpose,
        argumentTitle: (question as SuggestedQuestion).argumentTitle,
        targetArchetypes: (question as SuggestedQuestion).targetArchetypes,
      }
    : ('metadata' in question && question.metadata)
      ? {
          purpose: question.metadata.purpose,
          argumentTitle: question.metadata.argumentTitle,
          targetArchetypes: question.targetPersonas || [],
        }
      : null;

  const handleSaveEdit = () => {
    if (isSuggestion && onEditAndAccept) {
      onEditAndAccept(editText);
    } else if (onEdit) {
      onEdit(editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText('question' in question ? question.question : '');
    setIsEditing(false);
  };

  // Get sortable props for drag-and-drop (only for selected questions)
  const questionId = 'id' in question ? question.id : '';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: questionId,
    disabled: isSuggestion, // Only enable dragging for selected questions
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 py-4 ${
        isSuggestion ? 'bg-blue-50' : 'bg-white'
      } ${isDragging ? 'z-10' : ''}`}
    >
      <div className="flex items-start gap-3 px-4">
        {/* Drag handle (only for selected questions) */}
        {!isSuggestion && order !== undefined && (
          <button
            className="flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center rounded hover:bg-gray-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
        )}

        {/* Order indicator */}
        {!isSuggestion && order !== undefined && (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-filevine-blue text-xs font-semibold text-white">
            {order}
          </span>
        )}
        {isSuggestion && (
          <div className="mt-1 h-4 w-4 flex-shrink-0 rounded border-2 border-gray-300" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Question text or editor */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                {'question' in question ? question.question : ''}
              </p>

              {/* Metadata */}
              {!isEditing && metadata && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  {/* Source icon */}
                  {isAiGenerated ? (
                    <span className="flex items-center gap-1 text-filevine-blue">
                      <Sparkles className="h-3 w-3" />
                      AI-Generated
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Custom Question
                    </span>
                  )}

                  {/* Argument title */}
                  {metadata.argumentTitle && (
                    <>
                      <span>•</span>
                      <span>From: {metadata.argumentTitle}</span>
                    </>
                  )}

                  {/* Purpose */}
                  {metadata.purpose && (
                    <>
                      <span>•</span>
                      <span className="italic">Purpose: {metadata.purpose}</span>
                    </>
                  )}

                  {/* Target archetypes */}
                  {metadata.targetArchetypes && metadata.targetArchetypes.length > 0 && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                        className="flex items-center gap-1 text-filevine-blue hover:underline"
                      >
                        Targets: {metadata.targetArchetypes.length}{' '}
                        {metadata.targetArchetypes.length === 1 ? 'archetype' : 'archetypes'}
                        {isMetadataExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Expanded archetype list */}
              {isMetadataExpanded && metadata?.targetArchetypes && metadata.targetArchetypes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {metadata.targetArchetypes.map((archetype) => (
                    <span
                      key={archetype}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {archetype}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="mt-3 flex gap-2">
              {isSuggestion ? (
                <>
                  <Button size="sm" variant="primary" onClick={onAccept}>
                    ✓ Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Edit & Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDismiss}>
                    ✕ Dismiss
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Edit
                  </Button>
                  {!isFirst && onMoveUp && (
                    <Button size="sm" variant="ghost" onClick={onMoveUp}>
                      ↑
                    </Button>
                  )}
                  {!isLast && onMoveDown && (
                    <Button size="sm" variant="ghost" onClick={onMoveDown}>
                      ↓
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={onRemove}>
                    ✕ Remove
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
