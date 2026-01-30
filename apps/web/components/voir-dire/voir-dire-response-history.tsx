'use client';

import { useState } from 'react';
import { useVoirDireResponses, useDeleteVoirDireResponse, type VoirDireResponse } from '@/hooks/use-voir-dire-responses';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, ChevronDown, ChevronUp, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface VoirDireResponseHistoryProps {
  jurorId: string;
}

export function VoirDireResponseHistory({ jurorId }: VoirDireResponseHistoryProps) {
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const { data, isLoading, error } = useVoirDireResponses(jurorId, {
    orderBy: 'timestamp',
    order: 'desc',
  });
  const deleteMutation = useDeleteVoirDireResponse();

  const handleDelete = async (responseId: string) => {
    if (confirm('Are you sure you want to delete this voir dire response?')) {
      try {
        await deleteMutation.mutateAsync({ jurorId, responseId });
      } catch (error) {
        console.error('Failed to delete response:', error);
      }
    }
  };

  const toggleExpand = (responseId: string) => {
    setExpandedResponseId(expandedResponseId === responseId ? null : responseId);
  };

  const getEntryMethodColor = (method: string) => {
    switch (method) {
      case 'VOICE_TO_TEXT':
        return 'bg-purple-100 text-purple-700';
      case 'QUICK_SELECT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatEntryMethod = (method: string) => {
    switch (method) {
      case 'VOICE_TO_TEXT':
        return 'Voice-to-Text';
      case 'QUICK_SELECT':
        return 'Quick Select';
      default:
        return 'Typed';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-filevine-blue" />
        <span className="ml-2 text-filevine-gray-600">Loading responses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">Failed to load voir dire responses</p>
        </div>
      </div>
    );
  }

  const responses = data?.responses || [];

  if (responses.length === 0) {
    return (
      <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-8 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-filevine-gray-400" />
        <p className="mt-4 text-sm font-medium text-filevine-gray-900">No voir dire responses yet</p>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Record questions and responses to track voir dire interactions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response) => (
        <div
          key={response.id}
          className="rounded-lg border border-filevine-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div
            className="cursor-pointer p-4"
            onClick={() => toggleExpand(response.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-filevine-gray-900">{response.questionText}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getEntryMethodColor(
                      response.entryMethod
                    )}`}
                  >
                    {formatEntryMethod(response.entryMethod)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-filevine-gray-600 line-clamp-2">
                  {response.responseSummary}
                </p>
                <p className="mt-2 text-xs text-filevine-gray-500">
                  {format(new Date(response.responseTimestamp), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {expandedResponseId === response.id ? (
                  <ChevronUp className="h-5 w-5 text-filevine-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-filevine-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedResponseId === response.id && (
            <div className="border-t border-filevine-gray-200 p-4 space-y-4">
              <div>
                <h5 className="text-sm font-medium text-filevine-gray-700 mb-1">Full Response</h5>
                <p className="text-sm text-filevine-gray-900 whitespace-pre-wrap">{response.responseSummary}</p>
              </div>

              {response.extractedSignals.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-filevine-gray-700 mb-2">
                    Extracted Signals ({response.extractedSignals.length})
                  </h5>
                  <div className="space-y-1">
                    {response.extractedSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="rounded bg-filevine-gray-50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-filevine-gray-900">{signal.signalName}</span>
                          <span className="text-filevine-gray-600">
                            {typeof signal.value === 'object'
                              ? JSON.stringify(signal.value)
                              : String(signal.value)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-filevine-gray-500">
                          Confidence: {Math.round(signal.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.personaImpacts.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-filevine-gray-700 mb-2">
                    Persona Match Updates ({response.personaImpacts.length})
                  </h5>
                  <div className="space-y-1">
                    {response.personaImpacts.map((impact) => (
                      <div
                        key={impact.id}
                        className="rounded bg-filevine-gray-50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-filevine-gray-900">{impact.personaName}</span>
                          <span
                            className={`font-medium ${
                              impact.probabilityDelta > 0
                                ? 'text-filevine-green'
                                : impact.probabilityDelta < 0
                                ? 'text-filevine-red'
                                : 'text-filevine-gray-600'
                            }`}
                          >
                            {impact.probabilityDelta > 0 ? '+' : ''}
                            {Math.round(impact.probabilityDelta * 100)}%
                          </span>
                        </div>
                        {impact.previousProbability !== null && (
                          <div className="mt-1 text-xs text-filevine-gray-500">
                            {Math.round(impact.previousProbability * 100)}% →{' '}
                            {Math.round(impact.newProbability * 100)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-filevine-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(response.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
