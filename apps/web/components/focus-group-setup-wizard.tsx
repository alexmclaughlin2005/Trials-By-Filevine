'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  FocusGroupSession,
  FocusGroupConfigUpdate,
  ArchetypeOption,
  SelectedArchetype,
  SelectedArgument,
  CustomQuestion,
  ConfigurationStep,
} from '@/types/focus-group';
import { Users, FileText, MessageSquare, CheckCircle, Shuffle, Settings } from 'lucide-react';

interface FocusGroupSetupWizardProps {
  caseId: string;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
  }>;
  onComplete?: (sessionId: string) => void;
  onCancel?: () => void;
}

export function FocusGroupSetupWizard({
  caseId,
  arguments: caseArguments,
  onComplete,
  onCancel,
}: FocusGroupSetupWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<ConfigurationStep>('panel');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load session if exists
  const { data: session, isLoading: sessionLoading } = useQuery<{ session: FocusGroupSession }>({
    queryKey: ['focus-group-session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      return apiClient.get(`/focus-groups/${sessionId}`);
    },
    enabled: !!sessionId,
  });

  // Load available archetypes
  const { data: archetypesData } = useQuery<{
    archetypes: ArchetypeOption[];
    source: string;
  }>({
    queryKey: ['archetypes', caseId],
    queryFn: () => apiClient.get(`/focus-groups/archetypes?caseId=${caseId}`),
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ session: FocusGroupSession }>('/focus-groups/sessions', {
        caseId,
        name: `Focus Group - ${new Date().toLocaleDateString()}`,
      });
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
    },
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: FocusGroupConfigUpdate) => {
      return apiClient.patch(`/focus-groups/sessions/${sessionId}/config`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-group-session', sessionId] });
    },
  });

  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/focus-groups/sessions/${sessionId}/start`, {});
    },
    onSuccess: () => {
      if (onComplete && sessionId) {
        onComplete(sessionId);
      }
    },
  });

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [sessionId, createSessionMutation]);

  if (createSessionMutation.isPending || sessionLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-sm text-filevine-gray-600">Setting up focus group...</p>
        </div>
      </div>
    );
  }

  if (!session?.session) {
    return null;
  }

  const steps: { key: ConfigurationStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'panel', label: 'Select Panel', icon: Users },
    { key: 'arguments', label: 'Choose Arguments', icon: FileText },
    { key: 'questions', label: 'Add Questions', icon: MessageSquare },
    { key: 'review', label: 'Review & Launch', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1].key;
      await updateConfigMutation.mutateAsync({ configurationStep: nextStep });
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleStartSimulation = async () => {
    await startSimulationMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive
                      ? 'bg-filevine-blue text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-filevine-gray-200 text-filevine-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-filevine-gray-900' : 'text-filevine-gray-600'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 flex-1 ${
                    isCompleted ? 'bg-green-500' : 'bg-filevine-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        {currentStep === 'panel' && (
          <PanelConfigurationStep
            session={session.session}
            archetypes={archetypesData?.archetypes || []}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'arguments' && (
          <ArgumentsSelectionStep
            session={session.session}
            arguments={caseArguments}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'questions' && (
          <QuestionsStep
            session={session.session}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            session={session.session}
            arguments={caseArguments}
            onStart={handleStartSimulation}
            isStarting={startSimulationMutation.isPending}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel} disabled={updateConfigMutation.isPending}>
          Cancel
        </Button>

        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={updateConfigMutation.isPending}
            >
              Back
            </Button>
          )}

          {currentStepIndex < steps.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? 'Saving...' : 'Next'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleStartSimulation}
              disabled={startSimulationMutation.isPending}
            >
              {startSimulationMutation.isPending ? 'Starting...' : 'Start Focus Group'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Panel Configuration Step Component
function PanelConfigurationStep({
  session,
  archetypes,
  onUpdate,
}: {
  session: FocusGroupSession;
  archetypes: ArchetypeOption[];
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const [selectionMode, setSelectionMode] = useState(session.archetypeSelectionMode);
  const [selectedArchetypes, setSelectedArchetypes] = useState<SelectedArchetype[]>(
    session.selectedArchetypes || []
  );
  const [archetypeCount, setArchetypeCount] = useState(session.archetypeCount);

  const handleModeChange = (mode: 'random' | 'configured' | 'case_matched') => {
    setSelectionMode(mode);
    onUpdate({
      archetypeSelectionMode: mode,
      selectedArchetypes: mode === 'random' ? null : selectedArchetypes,
    });
  };

  const handleArchetypeToggle = (archetype: ArchetypeOption) => {
    const existing = selectedArchetypes.find((a) => a.name === archetype.name);

    let updated: SelectedArchetype[];
    if (existing) {
      updated = selectedArchetypes.filter((a) => a.name !== archetype.name);
    } else {
      updated = [
        ...selectedArchetypes,
        {
          name: archetype.name,
          description: archetype.description,
          source: archetype.source,
          jurorName: archetype.jurorName,
          confidence: archetype.confidence,
        },
      ];
    }

    setSelectedArchetypes(updated);
    onUpdate({ selectedArchetypes: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">Configure Focus Group Panel</h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Select how to compose your focus group panel
        </p>
      </div>

      {/* Selection Mode */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleModeChange('random')}
          className={`rounded-lg border-2 p-4 text-left transition-colors ${
            selectionMode === 'random'
              ? 'border-filevine-blue bg-blue-50'
              : 'border-filevine-gray-200 hover:border-filevine-gray-300'
          }`}
        >
          <Shuffle className="h-6 w-6 text-filevine-blue" />
          <p className="mt-2 font-medium text-filevine-gray-900">Random Panel</p>
          <p className="mt-1 text-xs text-filevine-gray-600">
            System selects {archetypeCount} diverse archetypes
          </p>
        </button>

        <button
          onClick={() => handleModeChange('configured')}
          className={`rounded-lg border-2 p-4 text-left transition-colors ${
            selectionMode === 'configured'
              ? 'border-filevine-blue bg-blue-50'
              : 'border-filevine-gray-200 hover:border-filevine-gray-300'
          }`}
        >
          <Settings className="h-6 w-6 text-filevine-blue" />
          <p className="mt-2 font-medium text-filevine-gray-900">Configure Panel</p>
          <p className="mt-1 text-xs text-filevine-gray-600">
            Select specific archetypes for your panel
          </p>
        </button>

        <button
          onClick={() => handleModeChange('case_matched')}
          className={`rounded-lg border-2 p-4 text-left transition-colors ${
            selectionMode === 'case_matched'
              ? 'border-filevine-blue bg-blue-50'
              : 'border-filevine-gray-200 hover:border-filevine-gray-300'
          }`}
        >
          <Users className="h-6 w-6 text-filevine-blue" />
          <p className="mt-2 font-medium text-filevine-gray-900">Match Case Jurors</p>
          <p className="mt-1 text-xs text-filevine-gray-600">
            Use archetypes from classified jurors
          </p>
        </button>
      </div>

      {/* Archetype Count for Random Mode */}
      {selectionMode === 'random' && (
        <div>
          <label className="block text-sm font-medium text-filevine-gray-700">Panel Size</label>
          <input
            type="number"
            min={3}
            max={12}
            value={archetypeCount}
            onChange={(e) => {
              const count = parseInt(e.target.value);
              setArchetypeCount(count);
              onUpdate({ archetypeCount: count });
            }}
            className="mt-2 block w-32 rounded-md border border-filevine-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-filevine-gray-500">Number of archetypes (3-12)</p>
        </div>
      )}

      {/* Archetype Selection for Configured/Case-Matched Modes */}
      {(selectionMode === 'configured' || selectionMode === 'case_matched') && (
        <div>
          <label className="block text-sm font-medium text-filevine-gray-700 mb-3">
            Select Archetypes ({selectedArchetypes.length} selected)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {archetypes.map((archetype) => {
              const isSelected = selectedArchetypes.some((a) => a.name === archetype.name);

              return (
                <button
                  key={archetype.name}
                  onClick={() => handleArchetypeToggle(archetype)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-filevine-blue bg-blue-50'
                      : 'border-filevine-gray-200 hover:border-filevine-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-filevine-gray-900">{archetype.name}</p>
                      <p className="mt-1 text-xs text-filevine-gray-600">{archetype.description}</p>
                      {archetype.jurorName && (
                        <p className="mt-2 text-xs text-filevine-gray-500">
                          From: {archetype.jurorName}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-filevine-blue flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Arguments Selection Step Component
function ArgumentsSelectionStep({
  session,
  arguments: caseArguments,
  onUpdate,
}: {
  session: FocusGroupSession;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
  }>;
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const [selectedArguments, setSelectedArguments] = useState<SelectedArgument[]>(
    session.selectedArguments || []
  );

  const handleToggleArgument = (arg: (typeof caseArguments)[0]) => {
    const existing = selectedArguments.find((a) => a.argumentId === arg.id);

    let updated: SelectedArgument[];
    if (existing) {
      updated = selectedArguments.filter((a) => a.argumentId !== arg.id);
    } else {
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

    // Re-index orders
    updated = updated.map((a, index) => ({ ...a, order: index + 1 }));

    setSelectedArguments(updated);
    onUpdate({ selectedArguments: updated });
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">Select Arguments to Test</h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Choose which arguments to present to the focus group
        </p>
      </div>

      {/* Available Arguments */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-filevine-gray-700">
          Available Arguments ({selectedArguments.length} selected)
        </label>

        {caseArguments.map((arg) => {
          const isSelected = selectedArguments.some((a) => a.argumentId === arg.id);
          const selectedArg = selectedArguments.find((a) => a.argumentId === arg.id);

          return (
            <div
              key={arg.id}
              className={`rounded-lg border-2 p-4 transition-colors ${
                isSelected
                  ? 'border-filevine-blue bg-blue-50'
                  : 'border-filevine-gray-200 hover:border-filevine-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-filevine-blue text-xs font-semibold text-white">
                        {selectedArg?.order}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-filevine-gray-900">{arg.title}</p>
                      <p className="text-xs text-filevine-gray-600 mt-1">
                        {arg.argumentType} • {arg.content.length} characters
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-filevine-gray-700 line-clamp-2">{arg.content}</p>
                </div>
                <Button
                  variant={isSelected ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleArgument(arg)}
                  className="ml-4 flex-shrink-0"
                >
                  {isSelected ? 'Remove' : 'Add'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedArguments.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Please select at least one argument to test with the focus group.
          </p>
        </div>
      )}
    </div>
  );
}

// Questions Step Component
function QuestionsStep({
  session,
  onUpdate,
}: {
  session: FocusGroupSession;
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const [questions, setQuestions] = useState<CustomQuestion[]>(session.customQuestions || []);
  const [newQuestion, setNewQuestion] = useState('');

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;

    const updated = [
      ...questions,
      {
        id: `q-${Date.now()}`,
        question: newQuestion,
        order: questions.length + 1,
        targetArchetypes: [],
      },
    ];

    setQuestions(updated);
    onUpdate({ customQuestions: updated });
    setNewQuestion('');
  };

  const handleRemoveQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id).map((q, index) => ({
      ...q,
      order: index + 1,
    }));

    setQuestions(updated);
    onUpdate({ customQuestions: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Add Custom Questions (Optional)
        </h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Ask the focus group members specific questions about the arguments
        </p>
      </div>

      {/* Add Question Form */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-filevine-gray-700">New Question</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddQuestion();
              }
            }}
            placeholder="e.g., What concerns do you have about the evidence presented?"
            className="flex-1 rounded-md border border-filevine-gray-300 px-3 py-2 text-sm"
          />
          <Button onClick={handleAddQuestion} disabled={!newQuestion.trim()}>
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-filevine-gray-700">
            Questions ({questions.length})
          </label>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex items-start gap-3 rounded-lg border border-filevine-gray-200 bg-white p-4"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-filevine-gray-100 text-xs font-semibold text-filevine-gray-700">
                {index + 1}
              </span>
              <p className="flex-1 text-sm text-filevine-gray-900">{question.question}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveQuestion(question.id)}
                className="flex-shrink-0"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && (
        <div className="rounded-md border border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-filevine-gray-400" />
          <p className="mt-3 text-sm text-filevine-gray-600">
            No questions added yet. Add custom questions above or skip this step.
          </p>
        </div>
      )}
    </div>
  );
}

// Review Step Component
function ReviewStep({
  session,
  arguments: _caseArguments,
  onStart: _onStart,
  isStarting: _isStarting,
}: {
  session: FocusGroupSession;
  arguments: Array<{ id: string; title: string; content: string; argumentType: string }>;
  onStart: () => void;
  isStarting: boolean;
}) {
  const selectedArgs = session.selectedArguments || [];
  const questions = session.customQuestions || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">Review Configuration</h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Review your focus group setup before launching
        </p>
      </div>

      {/* Panel Configuration */}
      <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-4">
        <h4 className="font-medium text-filevine-gray-900">Panel Configuration</h4>
        <div className="mt-2 space-y-2 text-sm text-filevine-gray-700">
          <p>
            <span className="font-medium">Selection Mode:</span>{' '}
            {session.archetypeSelectionMode === 'random' && 'Random Panel'}
            {session.archetypeSelectionMode === 'configured' && 'Configured Panel'}
            {session.archetypeSelectionMode === 'case_matched' && 'Case-Matched Panel'}
          </p>
          {session.archetypeSelectionMode === 'random' && (
            <p>
              <span className="font-medium">Panel Size:</span> {session.archetypeCount} archetypes
            </p>
          )}
          {session.selectedArchetypes && session.selectedArchetypes.length > 0 && (
            <div>
              <p className="font-medium">Selected Archetypes:</p>
              <ul className="mt-1 ml-4 list-disc">
                {session.selectedArchetypes.map((arch) => (
                  <li key={arch.name}>{arch.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Arguments */}
      <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-4">
        <h4 className="font-medium text-filevine-gray-900">
          Arguments to Test ({selectedArgs.length})
        </h4>
        <div className="mt-2 space-y-2">
          {selectedArgs.map((arg) => (
            <div key={arg.argumentId} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-filevine-blue text-xs font-semibold text-white">
                {arg.order}
              </span>
              <span className="text-filevine-gray-900">{arg.title}</span>
              <span className="text-filevine-gray-500">({arg.argumentType})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-4">
          <h4 className="font-medium text-filevine-gray-900">Custom Questions ({questions.length})</h4>
          <ul className="mt-2 space-y-1">
            {questions.map((q, index) => (
              <li key={q.id} className="text-sm text-filevine-gray-700">
                {index + 1}. {q.question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ready to Start */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800">Ready to Launch</p>
            <p className="mt-1 text-sm text-blue-700">
              Your focus group is configured and ready to start. Click &quot;Start Focus Group&quot; to begin
              the simulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
