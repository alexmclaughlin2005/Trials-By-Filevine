'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import type { ArgumentDocument } from '@/lib/arguments-client';

interface ArgumentListItemProps {
  argument: {
    id: string;
    title: string;
    content: string;
    argumentType: string;
    version: number;
    isCurrent: boolean;
    parentId?: string;
  };
  attachedDocuments?: ArgumentDocument[];
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
  attachedDocuments = [],
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
    <div
      className="py-3 px-4 border-b border-gray-200 last:border-b-0 transition-colors duration-150 hover:bg-gray-50"
      role="listitem"
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all duration-150"
          aria-label={`Select ${argument.title}`}
        />

        {/* Order Badge (only if selected) */}
        {isSelected && order && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white flex-shrink-0 mt-0.5 animate-in fade-in zoom-in duration-200">
            {order}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{argument.title}</p>
            {argument.version > 1 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                v{argument.version}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-gray-600">
              {argument.argumentType} • {argument.content.length} characters
            </p>
            {attachedDocuments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                <span>{attachedDocuments.length} document{attachedDocuments.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {/* Show document list - compact when collapsed, full when expanded */}
          {attachedDocuments.length > 0 && (
            <div className={`mt-2 ${isExpanded ? 'pl-4 border-l-2 border-gray-200' : ''}`}>
              {isExpanded ? (
                <>
                  <p className="text-xs font-medium text-gray-700 mb-2">Attached Documents:</p>
                  <ul className="space-y-1">
                    {attachedDocuments.map((attachment) => (
                      <li key={attachment.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{attachment.document.filename}</span>
                        {attachment.document.textExtractionStatus === 'completed' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            Extracted
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {attachedDocuments.slice(0, 3).map((attachment) => (
                    <span
                      key={attachment.id}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      title={attachment.document.filename}
                    >
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[120px]">{attachment.document.filename}</span>
                    </span>
                  ))}
                  {attachedDocuments.length > 3 && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      +{attachedDocuments.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expandable content */}
          {isExpanded && (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap animate-in slide-in-from-top-2 fade-in duration-200">
              {argument.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-150"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${argument.title}` : `Show full content for ${argument.title}`}
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
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-150"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                    Move Up
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={onMoveDown}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-150"
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
