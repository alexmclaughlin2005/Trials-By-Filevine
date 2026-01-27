'use client';

import { CheckSquare, XSquare } from 'lucide-react';
import { Button } from '../ui/button';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearAll,
}: BulkActionToolbarProps) {
  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === totalCount;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm text-gray-700">
        <span className="font-semibold">{selectedCount}</span> of{' '}
        <span className="font-semibold">{totalCount}</span> selected
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={allSelected}
          className="flex items-center gap-2 group relative"
          title="Select all arguments (⌘A or Ctrl+A)"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
          <span className="hidden group-hover:inline-block ml-1 text-xs text-gray-500">
            ⌘A
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={!hasSelection}
          className="flex items-center gap-2 group relative"
          title="Clear all selections (⌘D or Ctrl+D)"
        >
          <XSquare className="h-4 w-4" />
          Clear All
          <span className="hidden group-hover:inline-block ml-1 text-xs text-gray-500">
            ⌘D
          </span>
        </Button>
      </div>
    </div>
  );
}
