'use client';

import { useState } from 'react';
import { PersonaSummary, ConversationStatement, OverallAnalysis, InfluentialPersona, PersonaDetails, CustomQuestion } from '@/types/focus-group';
import { PersonaSummaryCard } from './PersonaSummaryCard';
import { PersonaDetailModal } from './PersonaDetailModal';
import { Users, BarChart3, HelpCircle, Download } from 'lucide-react';

interface ConversationTabsProps {
  conversationId: string;
  personaSummaries: PersonaSummary[];
  allStatements: ConversationStatement[];
  overallAnalysis: OverallAnalysis;
  customQuestions?: CustomQuestion[];
}

type TabType = 'personas' | 'questions' | 'analysis';

export function ConversationTabs({ conversationId, personaSummaries, allStatements, overallAnalysis, customQuestions }: ConversationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [selectedPersona, setSelectedPersona] = useState<{ name: string; details: PersonaDetails } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export all persona insights
  const handleExportAllPersonas = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth_token');

      for (const summary of personaSummaries) {
        const response = await fetch(
          `/api/focus-groups/conversations/${conversationId}/personas/${summary.personaId}/export/insights`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `persona-insights-${summary.personaName}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Small delay between downloads to avoid browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error exporting personas:', error);
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
    { id: 'analysis' as TabType, label: 'Overall Analysis', icon: BarChart3 }
  ];

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

      <div className="space-y-6">
        {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    ml-1 py-0.5 px-2 rounded-full text-xs font-medium
                    ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
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
                    // Filter statements by questionId to show only responses to this specific question
                    const questionStatements = allStatements.filter(
                      statement => statement.questionId === question.id
                    );

                    return (
                      <div key={question.id} className="bg-white border rounded-lg overflow-hidden">
                        {/* Question Header */}
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

                        {/* Responses */}
                        <div className="divide-y">
                          {questionStatements.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                              No responses yet
                            </div>
                          ) : (
                            questionStatements.map((statement) => {
                              const personaSummary = personaSummaries.find(ps => ps.personaId === statement.personaId);
                              const archetype = personaSummary?.persona?.archetype;

                              return (
                                <div key={statement.id} className="px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex-shrink-0 mt-0.5">
                                      {statement.sequenceNumber}
                                    </span>
                                    <div className="flex-1 min-w-0 w-full">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-medium text-gray-900 text-sm">{statement.personaName}</span>
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
                                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-visible">{statement.content}</p>

                                      {/* Key Points */}
                                      {statement.keyPoints && Array.isArray(statement.keyPoints) && statement.keyPoints.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          <ul className="list-disc list-inside space-y-0.5">
                                            {statement.keyPoints.map((point: string, pidx: number) => (
                                              <li key={pidx} className="text-xs text-gray-600">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
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

        {activeTab === 'personas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Persona Journeys
                </h2>
                <p className="text-sm text-gray-500">
                  {personaSummaries.length} participant{personaSummaries.length !== 1 ? 's' : ''}
                </p>
              </div>
              {personaSummaries.length > 0 && (
                <button
                  onClick={handleExportAllPersonas}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export All Personas'}
                </button>
              )}
            </div>

            {personaSummaries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No persona summaries available yet.</p>
                <p className="text-sm text-gray-500 mt-1">Summaries will appear after the conversation completes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {personaSummaries.map((summary) => (
                  <PersonaSummaryCard
                    key={summary.personaId}
                    summary={summary}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Overall Analysis
            </h2>

            {/* Consensus Areas */}
            {overallAnalysis.consensusAreas && Array.isArray(overallAnalysis.consensusAreas) && overallAnalysis.consensusAreas.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  Consensus Areas
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.consensusAreas.map((area: string, idx: number) => (
                    <li key={idx} className="text-sm text-green-900 pl-4 border-l-2 border-green-400">
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fracture Points */}
            {overallAnalysis.fracturePoints && Array.isArray(overallAnalysis.fracturePoints) && overallAnalysis.fracturePoints.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600" />
                  Fracture Points
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.fracturePoints.map((point: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-900 pl-4 border-l-2 border-red-400">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Debate Points */}
            {overallAnalysis.keyDebatePoints && Array.isArray(overallAnalysis.keyDebatePoints) && overallAnalysis.keyDebatePoints.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  Key Debate Points
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.keyDebatePoints.map((point: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-900 pl-4 border-l-2 border-blue-400">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Influential Personas */}
            {overallAnalysis.influentialPersonas && Array.isArray(overallAnalysis.influentialPersonas) && overallAnalysis.influentialPersonas.length > 0 && (
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

            {/* Empty State */}
            {(!overallAnalysis.consensusAreas || overallAnalysis.consensusAreas.length === 0) &&
             (!overallAnalysis.fracturePoints || overallAnalysis.fracturePoints.length === 0) &&
             (!overallAnalysis.keyDebatePoints || overallAnalysis.keyDebatePoints.length === 0) &&
             (!overallAnalysis.influentialPersonas || overallAnalysis.influentialPersonas.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No analysis available yet.</p>
                <p className="text-sm text-gray-500 mt-1">Analysis will appear after the conversation completes.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
