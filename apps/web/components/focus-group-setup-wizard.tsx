'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import {
  FocusGroupSession,
  FocusGroupConfigUpdate,
  PersonaOption,
  SelectedPersona,
  SelectedArgument,
  CustomQuestion,
  SuggestedQuestion,
  ConfigurationStep,
} from '@/types/focus-group';
import { Users, FileText, MessageSquare, CheckCircle, Shuffle, Settings, Sparkles, X } from 'lucide-react';
import { ArgumentCheckboxList } from './focus-group-setup-wizard/ArgumentCheckboxList';

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
  const router = useRouter();
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

  // Load available personas
  const { data: personasData, isLoading: personasLoading, error: personasError } = useQuery<{
    personas: PersonaOption[];
    source: string;
  }>({
    queryKey: ['personas', caseId],
    queryFn: async () => {
      console.log('[useQuery personas] Fetching personas for caseId:', caseId);
      const result = await apiClient.get(`/focus-groups/personas?caseId=${caseId}`) as {
        personas: PersonaOption[];
        source: string;
      };
      console.log('[useQuery personas] Response:', result);
      return result;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const personas = personasData?.personas || [];

  console.log('Personas data:', {
    personasData,
    personas,
    count: personas.length,
    isLoading: personasLoading,
    error: personasError
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
      console.log('updateConfigMutation - Sending PATCH request with:', updates);
      return apiClient.patch(`/focus-groups/sessions/${sessionId}/config`, updates);
    },
    onSuccess: (data) => {
      console.log('updateConfigMutation - PATCH response:', data);
      queryClient.invalidateQueries({ queryKey: ['focus-group-session', sessionId] });
    },
  });

  // Start simulation and run first roundtable
  const startSimulationMutation = useMutation({
    mutationFn: async () => {
      // First, mark the session as started
      await apiClient.post(`/focus-groups/sessions/${sessionId}/start`, {});

      // Then, automatically start a roundtable for the first selected argument
      if (session?.session?.selectedArguments && session.session.selectedArguments.length > 0) {
        const firstArgument = session.session.selectedArguments[0];
        const result = await apiClient.post<{ conversationId: string }>(
          `/focus-groups/sessions/${sessionId}/roundtable`,
          { argumentId: firstArgument.argumentId }
        );
        return result;
      }
      return null;
    },
    onSuccess: (result) => {
      if (result && result.conversationId) {
        // Navigate directly to the conversation
        router.push(`/focus-groups/conversations/${result.conversationId}`);
      } else if (onComplete && sessionId) {
        // Fallback if no arguments selected (shouldn't happen)
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
            personas={personas}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'arguments' && (
          <ArgumentsSelectionStep
            caseId={caseId}
            session={session.session}
            arguments={caseArguments}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'questions' && (
          <QuestionsStep
            session={session.session}
            sessionId={sessionId}
            onUpdate={(updates) => updateConfigMutation.mutate(updates)}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            session={session.session}
            arguments={caseArguments}
            personas={personas}
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
  personas,
  onUpdate,
}: {
  session: FocusGroupSession;
  personas: PersonaOption[];
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const [selectionMode, setSelectionMode] = useState(session.panelSelectionMode);
  const [selectedPersonas, setSelectedPersonas] = useState<SelectedPersona[]>(
    session.selectedPersonas || []
  );
  const [panelSize, setPanelSize] = useState(session.panelSize);

  // Generate random selection on mount if mode is random and no personas selected
  // This only runs ONCE on component mount
  useEffect(() => {
    if (selectionMode === 'random' && (!session.selectedPersonas || session.selectedPersonas.length === 0) && personas.length > 0) {
      console.log('useEffect - Generating initial random selection for', panelSize, 'personas');
      const shuffled = [...personas].sort(() => 0.5 - Math.random());
      const randomSelection: SelectedPersona[] = shuffled.slice(0, panelSize).map(persona => ({
        id: persona.id,
        name: persona.name,
        nickname: persona.nickname,
        description: persona.description,
        tagline: persona.tagline,
        archetype: persona.archetype,
        archetypeStrength: persona.archetypeStrength,
        demographics: persona.demographics,
        plaintiffDangerLevel: persona.plaintiffDangerLevel,
        defenseDangerLevel: persona.defenseDangerLevel,
        source: persona.source,
      }));
      setSelectedPersonas(randomSelection);
      onUpdate({
        panelSelectionMode: 'random',
        selectedPersonas: randomSelection,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run only once on mount

  const handleModeChange = (mode: 'random' | 'configured' | 'case_matched') => {
    setSelectionMode(mode);

    // If switching to random mode, generate and store the random selection
    if (mode === 'random') {
      const shuffled = [...personas].sort(() => 0.5 - Math.random());
      const randomSelection: SelectedPersona[] = shuffled.slice(0, panelSize).map(persona => ({
        id: persona.id,
        name: persona.name,
        nickname: persona.nickname,
        description: persona.description,
        tagline: persona.tagline,
        archetype: persona.archetype,
        archetypeStrength: persona.archetypeStrength,
        demographics: persona.demographics,
        plaintiffDangerLevel: persona.plaintiffDangerLevel,
        defenseDangerLevel: persona.defenseDangerLevel,
        source: persona.source,
      }));
      setSelectedPersonas(randomSelection);

      console.log('handleModeChange - Sending to API:', {
        panelSelectionMode: mode,
        selectedPersonas: randomSelection,
        count: randomSelection.length,
      });

      onUpdate({
        panelSelectionMode: mode,
        selectedPersonas: randomSelection,
      });
    } else {
      onUpdate({
        panelSelectionMode: mode,
        selectedPersonas: selectedPersonas,
      });
    }
  };

  const handlePersonaToggle = (persona: PersonaOption) => {
    const existing = selectedPersonas.find((p) => p.id === persona.id);

    let updated: SelectedPersona[];
    if (existing) {
      updated = selectedPersonas.filter((p) => p.id !== persona.id);
    } else {
      updated = [
        ...selectedPersonas,
        {
          id: persona.id,
          name: persona.name,
          nickname: persona.nickname,
          description: persona.description,
          tagline: persona.tagline,
          archetype: persona.archetype,
          archetypeStrength: persona.archetypeStrength,
          demographics: persona.demographics,
          plaintiffDangerLevel: persona.plaintiffDangerLevel,
          defenseDangerLevel: persona.defenseDangerLevel,
          source: persona.source,
          jurorName: persona.jurorName,
          confidence: persona.confidence,
        },
      ];
    }

    setSelectedPersonas(updated);
    onUpdate({ selectedPersonas: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">Configure Focus Group Panel</h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Select how to compose your focus group panel with juror personas
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
            System selects {panelSize} diverse personas
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
            Select specific personas for your panel
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
            Use personas from classified jurors
          </p>
        </button>
      </div>

      {/* Panel Size for Random Mode */}
      {selectionMode === 'random' && (
        <div>
          <label className="block text-sm font-medium text-filevine-gray-700">Panel Size</label>
          <input
            type="number"
            min={3}
            max={12}
            value={panelSize}
            onChange={(e) => {
              const count = parseInt(e.target.value);
              setPanelSize(count);

              // Regenerate random selection with new count
              const shuffled = [...personas].sort(() => 0.5 - Math.random());
              const randomSelection: SelectedPersona[] = shuffled.slice(0, count).map(persona => ({
                id: persona.id,
                name: persona.name,
                nickname: persona.nickname,
                description: persona.description,
                tagline: persona.tagline,
                archetype: persona.archetype,
                archetypeStrength: persona.archetypeStrength,
                demographics: persona.demographics,
                plaintiffDangerLevel: persona.plaintiffDangerLevel,
                defenseDangerLevel: persona.defenseDangerLevel,
                source: persona.source,
              }));
              setSelectedPersonas(randomSelection);

              onUpdate({
                panelSize: count,
                selectedPersonas: randomSelection,
              });
            }}
            className="mt-2 block w-32 rounded-md border border-filevine-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-filevine-gray-500">Number of personas (3-12)</p>
        </div>
      )}

      {/* Persona Selection for Configured/Case-Matched Modes */}
      {(selectionMode === 'configured' || selectionMode === 'case_matched') && (
        <div>
          <label className="block text-sm font-medium text-filevine-gray-700 mb-3">
            Select Personas ({selectedPersonas.length} selected)
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
            {personas.map((persona) => {
              const isSelected = selectedPersonas.some((p) => p.id === persona.id);

              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaToggle(persona)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-filevine-blue bg-blue-50'
                      : 'border-filevine-gray-200 hover:border-filevine-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-filevine-gray-900">{persona.name}</p>
                      {persona.tagline && (
                        <p className="mt-1 text-xs font-medium text-filevine-blue">{persona.tagline}</p>
                      )}
                      <p className="mt-1 text-xs text-filevine-gray-600">{persona.description}</p>
                      {persona.jurorName && (
                        <p className="mt-2 text-xs text-filevine-gray-500">
                          From Juror: {persona.jurorName}
                        </p>
                      )}
                      {persona.plaintiffDangerLevel && persona.defenseDangerLevel && (
                        <div className="mt-2 flex gap-2 text-xs">
                          <span className="text-red-600">P: {persona.plaintiffDangerLevel}/5</span>
                          <span className="text-blue-600">D: {persona.defenseDangerLevel}/5</span>
                        </div>
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
  caseId,
  session,
  arguments: caseArguments,
  onUpdate,
}: {
  caseId: string;
  session: FocusGroupSession;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
  }>;
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const handleUpdateArguments = (updated: SelectedArgument[]) => {
    onUpdate({ selectedArguments: updated });
  };

  return (
    <ArgumentCheckboxList
      caseId={caseId}
      arguments={caseArguments}
      selectedArguments={session.selectedArguments || []}
      onUpdate={handleUpdateArguments}
    />
  );
}

// Questions Step Component
function QuestionsStep({
  session,
  sessionId,
  onUpdate,
}: {
  session: FocusGroupSession;
  sessionId: string | null;
  onUpdate: (updates: FocusGroupConfigUpdate) => void;
}) {
  const [questions, setQuestions] = useState<CustomQuestion[]>(session.customQuestions || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);

  // Generate AI suggestions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      return apiClient.post<{ suggestedQuestions: SuggestedQuestion[] }>(
        `/focus-groups/sessions/${sessionId}/generate-questions`,
        {}
      );
    },
    onSuccess: (data) => {
      setSuggestedQuestions(data.suggestedQuestions);
    },
  });

  // Auto-generate suggestions on mount if arguments are selected and no suggestions yet
  useEffect(() => {
    if (
      sessionId &&
      session.selectedArguments &&
      session.selectedArguments.length > 0 &&
      suggestedQuestions.length === 0 &&
      !generateQuestionsMutation.isPending
    ) {
      generateQuestionsMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, session.selectedArguments]);

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;

    const updated = [
      ...questions,
      {
        id: `q-${Date.now()}`,
        question: newQuestion,
        order: questions.length + 1,
        targetPersonas: [],
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

  const handleAcceptSuggestion = (suggestion: SuggestedQuestion) => {
    const updated = [
      ...questions,
      {
        id: `accepted-${suggestion.id}`,
        question: suggestion.question,
        order: questions.length + 1,
        targetPersonas: suggestion.targetArchetypes,
      },
    ];

    setQuestions(updated);
    onUpdate({ customQuestions: updated });

    // Remove from suggestions
    setSuggestedQuestions(suggestedQuestions.filter((s) => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestedQuestions(suggestedQuestions.filter((s) => s.id !== suggestionId));
  };

  const handleRegenerateQuestions = () => {
    generateQuestionsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Configure Focus Group Questions
        </h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Review AI-suggested questions or add your own custom questions
        </p>
      </div>

      {/* AI Suggested Questions */}
      {suggestedQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-filevine-gray-700">
              <Sparkles className="h-4 w-4 text-filevine-blue" />
              AI Suggested Questions ({suggestedQuestions.length})
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateQuestions}
              disabled={generateQuestionsMutation.isPending}
            >
              {generateQuestionsMutation.isPending ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>

          <div className="space-y-2">
            {suggestedQuestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-blue-200 bg-blue-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 flex-shrink-0 text-filevine-blue mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-filevine-gray-900">
                      {suggestion.question}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-filevine-gray-600">
                      <span className="rounded bg-white px-2 py-1">
                        {suggestion.argumentTitle}
                      </span>
                      <span>•</span>
                      <span className="italic">{suggestion.purpose}</span>
                    </div>
                    {suggestion.targetArchetypes.length > 0 &&
                      suggestion.targetArchetypes[0] !== 'all' && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.targetArchetypes.map((archetype) => (
                            <span
                              key={archetype}
                              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                            >
                              {archetype}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptSuggestion(suggestion)}
                    >
                      Accept
                    </Button>
                    <button
                      onClick={() => handleDismissSuggestion(suggestion.id)}
                      className="rounded p-1 text-filevine-gray-400 hover:bg-white hover:text-filevine-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Questions Button */}
      {suggestedQuestions.length === 0 &&
        !generateQuestionsMutation.isPending &&
        session.selectedArguments &&
        session.selectedArguments.length > 0 && (
          <div className="rounded-md border border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-6 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-filevine-blue" />
            <p className="mt-3 text-sm text-filevine-gray-600">
              Generate AI-suggested questions for your selected arguments
            </p>
            <Button
              variant="primary"
              onClick={handleRegenerateQuestions}
              className="mt-4"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Questions
            </Button>
          </div>
        )}

      {/* Loading State */}
      {generateQuestionsMutation.isPending && (
        <div className="rounded-md border border-filevine-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-sm text-filevine-gray-600">Generating questions...</p>
        </div>
      )}

      {/* Add Custom Question Form */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-filevine-gray-700">
          Add Custom Question
        </label>
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

      {/* Accepted Questions List */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-filevine-gray-700">
            Questions to Ask ({questions.length})
          </label>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex items-start gap-3 rounded-lg border border-filevine-gray-200 bg-white p-4"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-filevine-blue text-xs font-semibold text-white">
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

      {questions.length === 0 && suggestedQuestions.length === 0 && !generateQuestionsMutation.isPending && (
        <div className="rounded-md border border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-filevine-gray-400" />
          <p className="mt-3 text-sm text-filevine-gray-600">
            No questions added yet. Generate AI suggestions or add custom questions above.
          </p>
          <p className="mt-2 text-xs text-filevine-gray-500">
            You can also skip this step if you don&apos;t want to ask specific questions.
          </p>
        </div>
      )}
    </div>
  );
}

// Review Step Component
function ReviewStep({
  session,
}: {
  session: FocusGroupSession;
  arguments: Array<{ id: string; title: string; content: string; argumentType: string }>;
  personas: PersonaOption[];
  onStart?: () => void;
  isStarting?: boolean;
}) {
  const selectedArgs = session.selectedArguments || [];
  const questions = session.customQuestions || [];

  // Debug: Log session data to see what we have
  console.log('ReviewStep - session data:', {
    panelSelectionMode: session.panelSelectionMode,
    selectedPersonas: session.selectedPersonas,
    selectedPersonasLength: session.selectedPersonas?.length,
  });

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
        <div className="mt-2 space-y-3 text-sm text-filevine-gray-700">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-filevine-gray-500" />
            <div>
              <span className="font-medium">Selection Mode:</span>{' '}
              {session.panelSelectionMode === 'random' && 'Random Panel'}
              {session.panelSelectionMode === 'configured' && 'Configured Panel'}
              {session.panelSelectionMode === 'case_matched' && 'Case-Matched Panel'}
            </div>
          </div>

          {session.selectedPersonas && session.selectedPersonas.length > 0 && (
            <div>
              <p className="font-medium mb-2">
                {session.selectedPersonas.length} {session.selectedPersonas.length === 1 ? 'Persona' : 'Personas'} Selected:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {session.selectedPersonas.map((persona, index) => (
                  <div key={persona.id} className="flex items-center gap-2 rounded-md bg-white border border-filevine-gray-200 px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-filevine-blue text-xs font-semibold text-white flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-filevine-gray-900 truncate">{persona.name}</p>
                      {persona.tagline && (
                        <p className="text-xs text-filevine-blue truncate">{persona.tagline}</p>
                      )}
                      {persona.jurorName && (
                        <p className="text-xs text-filevine-gray-500 truncate">From: {persona.jurorName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
