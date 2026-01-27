'use client';

import { useEffect, useRef } from 'react';
import { ArgumentListItem } from './ArgumentListItem';
import { BulkActionToolbar } from './BulkActionToolbar';
import { ValidationBanner } from './ValidationBanner';
import { CreateArgumentDialog } from './CreateArgumentDialog';

interface SelectedArgument {
  argumentId: string;
  order: number;
  title: string;
  content: string;
  argumentType: string;
}

interface ArgumentCheckboxListProps {
  caseId: string;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
  }>;
  selectedArguments: SelectedArgument[];
  onUpdate: (selected: SelectedArgument[]) => void;
}

export function ArgumentCheckboxList({
  caseId,
  arguments: caseArguments,
  selectedArguments,
  onUpdate,
}: ArgumentCheckboxListProps) {
  const hasInitialized = useRef(false);

  // Keyboard shortcuts: Cmd+A (Select All), Cmd+D (Clear All)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isModifierKey = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + A: Select All
      if (isModifierKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }

      // Cmd/Ctrl + D: Clear All (Deselect)
      if (isModifierKey && e.key === 'd') {
        e.preventDefault();
        handleClearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [caseArguments, selectedArguments]);

  // Smart Defaults: Auto-select opening and closing arguments on initial load
  useEffect(() => {
    // Only run once on mount, and only if no arguments are selected yet
    if (!hasInitialized.current && selectedArguments.length === 0 && caseArguments.length > 0) {
      hasInitialized.current = true;

      // Find opening and closing arguments
      const defaultArgs = caseArguments.filter(
        (arg) => arg.argumentType === 'opening' || arg.argumentType === 'closing'
      );

      if (defaultArgs.length > 0) {
        // Auto-select them with proper ordering
        const autoSelected: SelectedArgument[] = defaultArgs.map((arg, index) => ({
          argumentId: arg.id,
          order: index + 1,
          title: arg.title,
          content: arg.content,
          argumentType: arg.argumentType,
        }));

        onUpdate(autoSelected);
      }
    }
  }, [caseArguments, selectedArguments.length, onUpdate]);

  const handleToggle = (argId: string) => {
    const isSelected = selectedArguments.some((a) => a.argumentId === argId);

    let updated: SelectedArgument[];
    if (isSelected) {
      // Remove and re-index
      updated = selectedArguments
        .filter((a) => a.argumentId !== argId)
        .map((a, index) => ({ ...a, order: index + 1 }));
    } else {
      // Add to end
      const arg = caseArguments.find((a) => a.id === argId);
      if (!arg) return;

      updated = [
        ...selectedArguments,
        {
          argumentId: arg.id,
          order: selectedArguments.length + 1,
          title: arg.title,
          content: arg.content,
          argumentType: arg.argumentType,
        },
      ];
    }

    onUpdate(updated);
  };

  const handleMoveUp = (argId: string) => {
    const index = selectedArguments.findIndex((a) => a.argumentId === argId);
    if (index <= 0) return;

    const updated = [...selectedArguments];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    // Re-index orders
    const reindexed = updated.map((a, i) => ({ ...a, order: i + 1 }));
    onUpdate(reindexed);
  };

  const handleMoveDown = (argId: string) => {
    const index = selectedArguments.findIndex((a) => a.argumentId === argId);
    if (index < 0 || index >= selectedArguments.length - 1) return;

    const updated = [...selectedArguments];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];

    // Re-index orders
    const reindexed = updated.map((a, i) => ({ ...a, order: i + 1 }));
    onUpdate(reindexed);
  };

  const handleSelectAll = () => {
    const allSelected = caseArguments.map((arg, index) => ({
      argumentId: arg.id,
      order: index + 1,
      title: arg.title,
      content: arg.content,
      argumentType: arg.argumentType,
    }));
    onUpdate(allSelected);
  };

  const handleClearAll = () => {
    onUpdate([]);
  };

  return (
    <div className="space-y-4" role="region" aria-label="Argument selection">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900" id="argument-selection-heading">
            Select Arguments to Test
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Choose which arguments to present to the focus group
          </p>
        </div>
        <CreateArgumentDialog caseId={caseId} />
      </div>

      {/* Bulk Actions */}
      <BulkActionToolbar
        selectedCount={selectedArguments.length}
        totalCount={caseArguments.length}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      {/* Arguments List */}
      <div
        className="rounded-lg border border-gray-200 bg-white"
        role="list"
        aria-labelledby="argument-selection-heading"
      >
        {caseArguments.map((arg) => {
          const isSelected = selectedArguments.some((a) => a.argumentId === arg.id);
          const selectedArg = selectedArguments.find((a) => a.argumentId === arg.id);
          const selectedIndex = selectedArguments.findIndex((a) => a.argumentId === arg.id);

          return (
            <ArgumentListItem
              key={arg.id}
              argument={arg}
              isSelected={isSelected}
              order={selectedArg?.order}
              isFirst={selectedIndex === 0}
              isLast={selectedIndex === selectedArguments.length - 1}
              onToggle={() => handleToggle(arg.id)}
              onMoveUp={() => handleMoveUp(arg.id)}
              onMoveDown={() => handleMoveDown(arg.id)}
            />
          );
        })}
      </div>

      {/* Validation Banner */}
      <ValidationBanner selectedCount={selectedArguments.length} type="arguments" />

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {selectedArguments.length === 0
          ? 'No arguments selected'
          : `${selectedArguments.length} ${
              selectedArguments.length === 1 ? 'argument' : 'arguments'
            } selected`}
      </div>
    </div>
  );
}
