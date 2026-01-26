'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';

interface ArgumentListItemProps {
  argument: {
    id: string;
    title: string;
    content: string;
    argumentType: string;
  };
  isSelected: boolean;
  order?: number;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ArgumentListItem({
  argument,
  isSelected,
  order,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
}: ArgumentListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-3 px-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          aria-label={`Select ${argument.title}`}
        />

        {/* Order Badge (only if selected) */}
        {isSelected && order && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white flex-shrink-0 mt-0.5">
            {order}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{argument.title}</p>
          <p className="text-xs text-gray-600 mt-1">
            {argument.argumentType} • {argument.content.length} characters
          </p>

          {/* Expandable content */}
          {isExpanded && (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {argument.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show Full Content
                </>
              )}
            </button>

            {isSelected && (
              <>
                {!isFirst && (
                  <button
                    onClick={onMoveUp}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                    Move Up
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={onMoveDown}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3 w-3" />
                    Move Down
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
