'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MessageSquare, Sparkles, FileText, Users, BarChart3, TrendingUp, TrendingDown, Minus, AlertCircle, HelpCircle, Loader2, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TakeawaysTab } from './TakeawaysTab';
import { PersonaSummaryCard } from './PersonaSummaryCard';
import { PersonaDetailModal } from './PersonaDetailModal';
import { PersonaInsight } from './PersonaInsightsCard';
import { apiClient } from '@/lib/api-client';
import { PersonaSummary, ConversationStatement, OverallAnalysis, InfluentialPersona, PersonaDetails, CustomQuestion } from '@/types/focus-group';

interface UnifiedConversationViewProps {
  conversationId: string;
  caseId: string;
  argumentId: string;
  argumentTitle: string;
  personaSummaries: PersonaSummary[];
  allStatements: ConversationStatement[];
  overallAnalysis?: OverallAnalysis;
  customQuestions?: CustomQuestion[];
  isComplete: boolean;
}

type TabType = 'questions' | 'personas' | 'analysis' | 'takeaways' | 'transcript';

const sentimentColors = {
  plaintiff_leaning: 'border-l-4 border-green-500 bg-green-50',
  defense_leaning: 'border-l-4 border-red-500 bg-red-50',
  neutral: 'border-l-4 border-gray-300 bg-gray-50',
  conflicted: 'border-l-4 border-yellow-500 bg-yellow-50'
};

const sentimentIcons = {
  plaintiff_leaning: TrendingUp,
  defense_leaning: TrendingDown,
  neutral: Minus,
  conflicted: AlertCircle
};

const sentimentLabels = {
  plaintiff_leaning: 'Plaintiff Leaning',
  defense_leaning: 'Defense Leaning',
  neutral: 'Neutral',
  conflicted: 'Conflicted'
};

export function UnifiedConversationView({
  conversationId,
  caseId,
  argumentId,
  argumentTitle,
  personaSummaries,
  allStatements,
  overallAnalysis,
  customQuestions,
  isComplete
}: UnifiedConversationViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [selectedPersona, setSelectedPersona] = useState<{ name: string; details: PersonaDetails } | null>(null);
  const [personaInsights, setPersonaInsights] = useState<PersonaInsight[] | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const hasAutoSwitchedRef = useRef(false);
  const hasFetchedInsightsRef = useRef(false);

  // Auto-switch to takeaways when conversation completes (only once)
  useEffect(() => {
    if (isComplete && !hasAutoSwitchedRef.current) {
      hasAutoSwitchedRef.current = true;
      setActiveTab('takeaways');
    }
  }, [isComplete]);

  // Fetch persona insights when component loads and conversation is complete
  // This only fetches existing insights - they should already be generated on backend
  useEffect(() => {
    const fetchInsights = async () => {
      if (!isComplete || personaInsights !== null || hasFetchedInsightsRef.current) return;

      hasFetchedInsightsRef.current = true;
      setIsLoadingInsights(true);
      setInsightsError(null);

      try {
        const response = await apiClient.get<{ insights: PersonaInsight[] }>(
          `/focus-groups/conversations/${conversationId}/persona-insights`
        );
        setPersonaInsights(response.insights);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setInsightsError(error instanceof Error ? error.message : 'Failed to fetch insights');
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [isComplete, conversationId, personaInsights]);

  // Handler for manually regenerating persona insights
  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      const response = await apiClient.post<{ insights: PersonaInsight[] }>(
        `/focus-groups/conversations/${conversationId}/generate-persona-insights`,
        {}
      );
      setPersonaInsights(response.insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Export all persona insights
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAllPersonas = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `/api/focus-groups/conversations/${conversationId}/export/all-personas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-personas-insights-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting all personas PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };


  const tabs = [
    ...(customQuestions && customQuestions.length > 0
      ? [{ id: 'questions' as TabType, label: 'By Question', icon: HelpCircle, count: customQuestions.length }]
      : []
    ),
    { id: 'personas' as TabType, label: 'By Persona', icon: Users, count: personaSummaries.length },
    { id: 'analysis' as TabType, label: 'Overall Analysis', icon: BarChart3 },
    ...(isComplete ? [
      { id: 'takeaways' as TabType, label: 'Key Takeaways', icon: Sparkles },
      { id: 'transcript' as TabType, label: 'Full Transcript', icon: FileText },
    ] : [])
  ];

  // Use props directly - parent component handles data fetching
  const statements = allStatements || [];
  const consensusAreas = overallAnalysis?.consensusAreas || [];
  const fracturePoints = overallAnalysis?.fracturePoints || [];
  const keyDebatePoints = overallAnalysis?.keyDebatePoints || [];

  return (
    <>
      {/* Persona Detail Modal */}
      {selectedPersona && (
        <PersonaDetailModal
          personaName={selectedPersona.name}
          persona={selectedPersona.details}
          onClose={() => setSelectedPersona(null)}
        />
      )}

      <div className="space-y-4">
        {/* Compact Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-4 w-4" />
                  Roundtable Discussion
                </CardTitle>
                <CardDescription className="mt-1">
                  {argumentTitle}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="text-filevine-gray-600">Statements</div>
                  <div className="font-semibold text-filevine-gray-900">{statements.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-filevine-gray-600">Status</div>
                  <div className="mt-0.5">
                    {isComplete ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Unified Tabs */}
        <div className="border-b border-filevine-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500')} />
                  {tab.label}
                  {'count' in tab && tab.count !== undefined && (
                    <span className={cn(
                      'ml-1 py-0.5 px-2 rounded-full text-xs font-medium',
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* By Question Tab */}
          {activeTab === 'questions' && customQuestions && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Responses by Question
                </h2>
                <p className="text-sm text-gray-500">
                  {customQuestions.length} question{customQuestions.length !== 1 ? 's' : ''}
                </p>
              </div>

              {customQuestions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No custom questions configured.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {customQuestions
                    .sort((a, b) => a.order - b.order)
                    .map((question, idx) => {
                      // Get all statements that have this questionId OR are part of the discussion
                      // Find statements with explicit questionId match
                      const explicitResponses = statements.filter(
                        statement => statement.questionId === question.id
                      );

                      // Determine which statements belong to this question
                      const questionStatements = (() => {
                        if (explicitResponses.length > 0) {
                          // Use explicit responses to determine range
                          const minSeq = Math.min(...explicitResponses.map(s => s.sequenceNumber));

                          // Get the next question's first response (if exists)
                          const nextQuestion = customQuestions.find(q => q.order === question.order + 1);
                          const nextQuestionFirstResponse = nextQuestion
                            ? statements.find(s => s.questionId === nextQuestion.id)
                            : null;
                          const endSeq = nextQuestionFirstResponse
                            ? nextQuestionFirstResponse.sequenceNumber - 1
                            : statements.length > 0
                              ? Math.max(...statements.map(s => s.sequenceNumber))
                              : minSeq;

                          // Include all statements in this range
                          return statements.filter(
                            s => s.sequenceNumber >= minSeq && s.sequenceNumber <= endSeq
                          );
                        } else {
                          // No explicit responses - try to find range based on previous question
                          const sortedQuestions = [...customQuestions].sort((a, b) => a.order - b.order);
                          const questionIndex = sortedQuestions.findIndex(q => q.id === question.id);

                          // Find where previous question ended
                          let startSeq = 1;
                          if (questionIndex > 0) {
                            const prevQuestion = sortedQuestions[questionIndex - 1];
                            const prevExplicitResponses = statements.filter(s => s.questionId === prevQuestion.id);
                            if (prevExplicitResponses.length > 0) {
                              const prevMaxSeq = Math.max(...prevExplicitResponses.map(s => s.sequenceNumber));
                              // Start from where we left off searching forward
                              startSeq = prevMaxSeq + 1;
                            }
                          }

                          // Find where next question starts
                          let endSeq = statements.length > 0 ? Math.max(...statements.map(s => s.sequenceNumber)) : startSeq;
                          if (questionIndex < sortedQuestions.length - 1) {
                            const nextQuestion = sortedQuestions[questionIndex + 1];
                            const nextExplicitResponses = statements.filter(s => s.questionId === nextQuestion.id);
                            if (nextExplicitResponses.length > 0) {
                              const nextMinSeq = Math.min(...nextExplicitResponses.map(s => s.sequenceNumber));
                              endSeq = nextMinSeq - 1;
                            }
                          }

                          // Return statements in this range
                          return statements.filter(
                            s => s.sequenceNumber >= startSeq && s.sequenceNumber <= endSeq
                          );
                        }
                      })();

                      return (
                        <div key={question.id} className="bg-white border rounded-lg overflow-hidden">
                          <div className="bg-blue-50 border-b px-4 py-3">
                            <div className="flex items-start gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{question.question}</p>
                                {question.targetPersonas && question.targetPersonas.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Targeted to: {question.targetPersonas.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="divide-y">
                            {questionStatements.length === 0 ? (
                              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No responses yet
                              </div>
                            ) : (
                              questionStatements.map((statement) => {
                                const personaSummary = personaSummaries.find(ps => ps.personaId === statement.personaId);
                                const archetype = personaSummary?.persona?.archetype;
                                const isExplicitResponse = statement.questionId === question.id;

                                return (
                                  <div key={statement.id} className={cn("px-4 py-3", !isExplicitResponse && "bg-gray-50")}>
                                    <div className="flex items-start gap-3">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex-shrink-0 mt-0.5">
                                        {statement.sequenceNumber}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="font-medium text-gray-900 text-sm">{statement.personaName}</span>
                                          {!isExplicitResponse && (
                                            <span className="px-1.5 py-0.5 text-xs font-medium border rounded bg-gray-100 text-gray-600 border-gray-300">
                                              Follow-up
                                            </span>
                                          )}
                                          {archetype && personaSummary?.persona && (
                                            <button
                                              onClick={() => setSelectedPersona({ name: statement.personaName, details: personaSummary.persona! })}
                                              className="px-1.5 py-0.5 text-xs font-medium border rounded bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                                            >
                                              {archetype.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </button>
                                          )}
                                          {statement.sentiment && (
                                            <span className={`px-1.5 py-0.5 text-xs font-medium border rounded ${
                                              statement.sentiment === 'plaintiff_leaning' ? 'bg-green-50 text-green-700 border-green-200' :
                                              statement.sentiment === 'defense_leaning' ? 'bg-red-50 text-red-700 border-red-200' :
                                              statement.sentiment === 'conflicted' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                              'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                              {statement.sentiment.replace('_', ' ')}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{statement.content}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* By Persona Tab */}
          {activeTab === 'personas' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Persona Journeys
                  </h2>
                  <p className="text-sm text-gray-500">
                    {personaSummaries.length} participant{personaSummaries.length !== 1 ? 's' : ''}
                  </p>
                  {isComplete && isLoadingInsights && (
                    <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading case insights...
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && !isLoadingInsights && personaInsights && personaSummaries.length > 0 && (
                    <Button
                      onClick={handleExportAllPersonas}
                      variant="outline"
                      size="sm"
                      disabled={isExporting}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'Export All Personas'}
                    </Button>
                  )}
                  {isComplete && !isLoadingInsights && personaInsights && (
                    <Button
                      onClick={handleGenerateInsights}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Insights
                    </Button>
                  )}
                </div>
              </div>

              {/* Error state */}
              {insightsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Failed to load insights</p>
                    <p className="text-sm text-red-700 mt-1">{insightsError}</p>
                  </div>
                  <Button
                    onClick={handleGenerateInsights}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Regenerate
                  </Button>
                </div>
              )}

              {/* Loading state */}
              {isLoadingInsights && (
                <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                  <p className="text-lg font-semibold text-indigo-900">Loading Persona Insights...</p>
                  <p className="text-sm text-indigo-700 mt-2">
                    Fetching psychological analysis for each persona
                  </p>
                </div>
              )}

              {personaSummaries.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No persona summaries available yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Summaries will appear after the conversation completes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show persona summaries with insights */}
                  {personaSummaries.map((summary) => {
                    const insight = personaInsights?.find(i => i.personaId === summary.personaId);
                    return (
                      <PersonaSummaryCard
                        key={summary.personaId}
                        summary={summary}
                        insight={insight}
                        conversationId={conversationId}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Overall Analysis Tab */}
          {activeTab === 'analysis' && overallAnalysis && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Overall Analysis
              </h2>

              {consensusAreas && consensusAreas.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    Consensus Areas
                  </h3>
                  <ul className="space-y-2">
                    {consensusAreas.map((area: string, idx: number) => (
                      <li key={idx} className="text-sm text-green-900 pl-4 border-l-2 border-green-400">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fracturePoints && fracturePoints.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    Fracture Points
                  </h3>
                  <ul className="space-y-2">
                    {fracturePoints.map((point: string, idx: number) => (
                      <li key={idx} className="text-sm text-red-900 pl-4 border-l-2 border-red-400">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {keyDebatePoints && keyDebatePoints.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    Key Debate Points
                  </h3>
                  <ul className="space-y-2">
                    {keyDebatePoints.map((point: string, idx: number) => (
                      <li key={idx} className="text-sm text-blue-900 pl-4 border-l-2 border-blue-400">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {overallAnalysis.influentialPersonas && overallAnalysis.influentialPersonas.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                    Most Influential Personas
                  </h3>
                  <div className="space-y-3">
                    {overallAnalysis.influentialPersonas.map((persona: InfluentialPersona, idx: number) => (
                      <div key={idx} className="pl-4 border-l-2 border-purple-400">
                        <p className="text-sm font-semibold text-purple-900">{persona.personaName}</p>
                        <p className="text-xs text-purple-700 mt-1">
                          <span className="font-medium">{persona.influenceType}:</span> {persona.influenceReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!consensusAreas || consensusAreas.length === 0) &&
               (!fracturePoints || fracturePoints.length === 0) &&
               (!keyDebatePoints || keyDebatePoints.length === 0) &&
               (!overallAnalysis.influentialPersonas || overallAnalysis.influentialPersonas.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No analysis available yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Analysis will appear after the conversation completes.</p>
                </div>
              )}
            </div>
          )}

          {/* Key Takeaways Tab */}
          {activeTab === 'takeaways' && isComplete && (
            <TakeawaysTab
              conversationId={conversationId}
              argumentId={argumentId}
              caseId={caseId}
            />
          )}

          {/* Full Transcript Tab */}
          {activeTab === 'transcript' && isComplete && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Conversation Transcript</CardTitle>
                      <CardDescription>
                        Full roundtable discussion in chronological order
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statements.map((statement) => (
                      <div
                        key={statement.id}
                        className={cn(
                          'border rounded-lg p-4 transition-all',
                          statement.sentiment && sentimentColors[statement.sentiment as keyof typeof sentimentColors]
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-filevine-gray-900">
                              {statement.personaName}
                            </span>
                            <span className="text-xs text-filevine-gray-500">
                              #{statement.sequenceNumber}
                            </span>
                          </div>
                          {statement.sentiment && (
                            <div className="flex items-center gap-1 text-xs text-filevine-gray-600">
                              {(() => {
                                const Icon = sentimentIcons[statement.sentiment as keyof typeof sentimentIcons];
                                return Icon ? <Icon className="h-3 w-3" /> : null;
                              })()}
                              <span>{sentimentLabels[statement.sentiment as keyof typeof sentimentLabels]}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-filevine-gray-700 leading-relaxed">
                          {statement.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
