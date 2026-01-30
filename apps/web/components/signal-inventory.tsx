'use client';

import { useState } from 'react';
import { useJurorSignals } from '@/hooks/use-juror-signals';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface SignalInventoryProps {
  jurorId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  DEMOGRAPHIC: 'bg-blue-100 text-blue-800',
  BEHAVIORAL: 'bg-green-100 text-green-800',
  ATTITUDINAL: 'bg-purple-100 text-purple-800',
  LINGUISTIC: 'bg-yellow-100 text-yellow-800',
  SOCIAL: 'bg-pink-100 text-pink-800',
};

const SOURCE_COLORS: Record<string, string> = {
  QUESTIONNAIRE: 'bg-gray-100 text-gray-700',
  RESEARCH: 'bg-indigo-100 text-indigo-700',
  VOIR_DIRE: 'bg-orange-100 text-orange-700',
  MANUAL: 'bg-teal-100 text-teal-700',
};

export function SignalInventory({ jurorId }: SignalInventoryProps) {
  const { data: signals, isLoading, error } = useJurorSignals(jurorId);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          {error instanceof Error ? error.message : 'Failed to load signals'}
        </p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          No signals extracted yet. Signals will appear here once extracted from questionnaire data, research artifacts, or voir dire responses.
        </p>
      </div>
    );
  }

  // Group signals by category
  const signalsByCategory = signals.reduce((acc, signal) => {
    const category = signal.signal.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(signal);
    return acc;
  }, {} as Record<string, typeof signals>);

  const categories = Object.keys(signalsByCategory).sort();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Signal Inventory
          </h3>
          <p className="text-sm text-filevine-gray-600">
            {signals.length} signal{signals.length !== 1 ? 's' : ''} extracted from various sources
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const categorySignals = signalsByCategory[category];
          const isExpanded = expandedCategories.has(category);

          return (
            <div
              key={category}
              className="rounded-lg border border-filevine-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-filevine-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {category}
                  </span>
                  <span className="text-sm font-medium text-filevine-gray-700">
                    {categorySignals.length} signal{categorySignals.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-filevine-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-filevine-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-filevine-gray-200 p-4 space-y-3">
                  {categorySignals.map((signal) => (
                    <div
                      key={signal.id}
                      className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-filevine-gray-900">
                            {signal.signal.name}
                          </h4>
                          {signal.signal.description && (
                            <p className="mt-1 text-xs text-filevine-gray-600">
                              {signal.signal.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${SOURCE_COLORS[signal.source] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {signal.source}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-filevine-gray-600">Value:</span>
                          <span className="ml-2 font-medium text-filevine-gray-900">
                            {typeof signal.value === 'object'
                              ? JSON.stringify(signal.value)
                              : String(signal.value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-filevine-gray-600">Confidence:</span>
                          <span className="ml-2 font-medium text-filevine-gray-900">
                            {(Number(signal.confidence) * 100).toFixed(0)}%
                          </span>
                        </div>
                        {signal.voirDireResponse && (
                          <div className="col-span-2 mt-2 rounded-md border border-filevine-blue-200 bg-blue-50 p-2">
                            <div className="font-medium text-filevine-gray-900 mb-1">Citation:</div>
                            <div className="text-filevine-gray-700 mb-1">
                              <span className="font-semibold">Q:</span> {signal.voirDireResponse.questionText}
                            </div>
                            <div className="text-filevine-gray-700">
                              <span className="font-semibold">A:</span> {signal.voirDireResponse.responseSummary}
                            </div>
                            <div className="text-filevine-gray-500 text-xs mt-1">
                              {new Date(signal.voirDireResponse.responseTimestamp).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {signal.sourceReference && !signal.voirDireResponse && (
                          <div className="col-span-2">
                            <span className="text-filevine-gray-600">Source Reference:</span>
                            <span className="ml-2 text-filevine-gray-900">
                              {signal.sourceReference}
                            </span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-filevine-gray-600">Extracted:</span>
                          <span className="ml-2 text-filevine-gray-900">
                            {new Date(signal.extractedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
