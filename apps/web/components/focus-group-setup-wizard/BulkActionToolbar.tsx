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
          className="flex items-center gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={!hasSelection}
          className="flex items-center gap-2"
        >
          <XSquare className="h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}
