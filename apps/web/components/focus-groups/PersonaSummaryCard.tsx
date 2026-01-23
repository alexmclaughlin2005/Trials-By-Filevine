'use client';

import { useState } from 'react';
import { PersonaSummary, PersonaDetails } from '@/types/focus-group';
import { PersonaDetailModal } from './PersonaDetailModal';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface PersonaSummaryCardProps {
  summary: PersonaSummary;
}

export function PersonaSummaryCard({ summary }: PersonaSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

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
                  "{summary.persona.tagline}"
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

      {/* Summary Content */}
      <div className="p-6">
        {/* Position Shift Description */}
        {summary.positionShifted && summary.shiftDescription && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Why they shifted:</span> {summary.shiftDescription}
            </p>
          </div>
        )}

        {/* Narrative Summary */}
        <div className="prose prose-sm max-w-none mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Journey Summary</h4>
          <p className="text-gray-700 whitespace-pre-line">{summary.summary}</p>
        </div>

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

        {/* Expandable Statements */}
        <div className="mt-4 border-t pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span>View All {summary.totalStatements} Statement{summary.totalStatements !== 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="mt-4 space-y-3">
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
          )}
        </div>
      </div>
    </div>
    </>
  );
}
