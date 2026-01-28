'use client';

import { useState } from 'react';
import { PersonaSummary } from '@/types/focus-group';
import { PersonaDetailModal } from './PersonaDetailModal';
import { PersonaInsight } from './PersonaInsightsCard';
import { TrendingUp, TrendingDown, Minus, ArrowRight, MessageSquare, Brain, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonaSummaryCardProps {
  summary: PersonaSummary;
  insight?: PersonaInsight | null;
}

type TabType = 'insights' | 'conversation';

export function PersonaSummaryCard({ summary, insight }: PersonaSummaryCardProps) {
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('insights');

  // Position badge colors
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'favorable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unfavorable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Influence badge colors
  const getInfluenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Position shift icon
  const getPositionShiftIcon = () => {
    if (!summary.positionShifted) return <Minus className="h-4 w-4" />;

    const favorableOrder = ['unfavorable', 'mixed', 'neutral', 'favorable'];
    const initialIndex = favorableOrder.indexOf(summary.initialPosition);
    const finalIndex = favorableOrder.indexOf(summary.finalPosition);

    if (finalIndex > initialIndex) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (finalIndex < initialIndex) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  return (
    <>
      {/* Persona Detail Modal */}
      {showPersonaModal && summary.persona && (
        <PersonaDetailModal
          personaName={summary.personaName}
          persona={summary.persona}
          onClose={() => setShowPersonaModal(false)}
        />
      )}

      <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">
                {summary.personaName}
              </h3>
              {summary.persona?.tagline && (
                <span className="text-sm text-gray-500 italic">
                  &ldquo;{summary.persona.tagline}&rdquo;
                </span>
              )}
              {summary.persona?.archetype && (
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="px-2 py-1 text-xs font-medium border rounded bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  {summary.persona.archetype.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              )}
              <span className={`px-2 py-1 text-xs font-medium border rounded ${getInfluenceColor(summary.influenceLevel)}`}>
                {summary.influenceLevel.charAt(0).toUpperCase() + summary.influenceLevel.slice(1)} Influence
              </span>
            </div>

            {/* Position Change */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={`px-2 py-1 text-xs font-medium border rounded ${getPositionColor(summary.initialPosition)}`}>
                {summary.initialPosition.charAt(0).toUpperCase() + summary.initialPosition.slice(1)}
              </span>
              {summary.positionShifted ? (
                <>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className={`px-2 py-1 text-xs font-medium border rounded ${getPositionColor(summary.finalPosition)}`}>
                    {summary.finalPosition.charAt(0).toUpperCase() + summary.finalPosition.slice(1)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600 ml-2">
                    {getPositionShiftIcon()}
                    <span className="font-medium">Position Shifted</span>
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500 ml-2">(Consistent)</span>
              )}
            </div>

            {/* Stats */}
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>{summary.totalStatements} statement{summary.totalStatements !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{Math.round(summary.averageEmotionalIntensity * 100)}% emotional intensity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (only show if insights are available) */}
      {insight && (
        <div className="border-b bg-gray-50">
          <div className="flex items-center justify-between px-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('insights')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'insights'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Brain className="h-4 w-4" />
                Case Insights
              </button>
              <button
                onClick={() => setActiveTab('conversation')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'conversation'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Content */}
      <div className="p-6">{activeTab === 'conversation' && (
        <>
        {/* Position Shift Description */}
        {summary.positionShifted && summary.shiftDescription && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Why they shifted:</span> {summary.shiftDescription}
            </p>
          </div>
        )}

        {/* Key Points */}
        {summary.mainPoints.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Points Made</h4>
            <ul className="list-disc list-inside space-y-1">
              {summary.mainPoints.map((point, idx) => (
                <li key={idx} className="text-sm text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns Raised */}
        {summary.concernsRaised.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Concerns Raised</h4>
            <ul className="list-disc list-inside space-y-1">
              {summary.concernsRaised.map((concern, idx) => (
                <li key={idx} className="text-sm text-gray-700">{concern}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions Asked */}
        {summary.questionsAsked.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Questions Asked</h4>
            <ul className="list-disc list-inside space-y-1">
              {summary.questionsAsked.map((question, idx) => (
                <li key={idx} className="text-sm text-gray-700">{question}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Dynamics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {summary.agreedWithMost.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Agreed With</h4>
              <div className="flex flex-wrap gap-1">
                {summary.agreedWithMost.map((name, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.disagreedWithMost.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Disagreed With</h4>
              <div className="flex flex-wrap gap-1">
                {summary.disagreedWithMost.map((name, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.influencedBy.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Influenced By</h4>
              <div className="flex flex-wrap gap-1">
                {summary.influencedBy.map((name, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* All Statements - No longer collapsible */}
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            All {summary.totalStatements} Statement{summary.totalStatements !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-3">
            {summary.statements.map((statement) => (
              <div key={statement.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500">
                    Statement {statement.sequenceNumber} (Round {statement.speakCount})
                  </span>
                  {statement.sentiment && (
                    <span className={`px-2 py-0.5 text-xs border rounded ${
                      statement.sentiment === 'plaintiff_leaning' ? 'bg-green-50 text-green-700 border-green-200' :
                      statement.sentiment === 'defense_leaning' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {statement.sentiment.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{statement.content}</p>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && insight && (
        <div className="space-y-6">
          {/* Case Interpretation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              How They See the Case
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-md border border-purple-100">
              {insight.caseInterpretation}
            </p>
          </div>

          {/* Key Biases */}
          {insight.keyBiases.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Key Biases & Lenses
              </h4>
              <ul className="space-y-1.5">
                {insight.keyBiases.map((bias, idx) => (
                  <li key={idx} className="text-sm text-gray-700 pl-3 border-l-2 border-amber-400 bg-amber-50 p-2 rounded-r-md">
                    {bias}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision Drivers */}
          {insight.decisionDrivers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                What Drives Their Decision
              </h4>
              <ul className="space-y-1.5">
                {insight.decisionDrivers.map((driver, idx) => (
                  <li key={idx} className="text-sm text-gray-700 pl-3 border-l-2 border-blue-400 bg-blue-50 p-2 rounded-r-md">
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Persuasion Strategy */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              Persuasion Strategy
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-green-50 p-3 rounded-md border border-green-200">
              {insight.persuasionStrategy}
            </p>
          </div>

          {/* Vulnerabilities & Strengths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insight.vulnerabilities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Vulnerabilities to Address
                </h4>
                <ul className="space-y-1">
                  {insight.vulnerabilities.map((vuln, idx) => (
                    <li key={idx} className="text-xs text-gray-700 pl-2 border-l-2 border-red-300 bg-red-50 p-1.5 rounded-r">
                      {vuln}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Strengths to Leverage
                </h4>
                <ul className="space-y-1">
                  {insight.strengths.map((strength, idx) => (
                    <li key={idx} className="text-xs text-gray-700 pl-2 border-l-2 border-green-300 bg-green-50 p-1.5 rounded-r">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
