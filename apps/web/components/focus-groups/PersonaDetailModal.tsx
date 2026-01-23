'use client';

import { PersonaDetails } from '@/types/focus-group';
import { X, User, Target, TrendingUp, MessageCircle } from 'lucide-react';

interface PersonaDetailModalProps {
  personaName: string;
  persona: PersonaDetails;
  onClose: () => void;
}

export function PersonaDetailModal({ personaName, persona, onClose }: PersonaDetailModalProps) {
  const formatArchetype = (archetype: string) => {
    return archetype.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{personaName}</h2>
              {persona.tagline && (
                <p className="text-sm text-gray-600 italic">"{persona.tagline}"</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Archetype */}
          {persona.archetype && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Archetype</h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 text-sm font-medium border rounded-lg bg-indigo-50 text-indigo-700 border-indigo-200">
                  {formatArchetype(persona.archetype)}
                </span>
                {persona.archetypeStrength && (
                  <span className="text-sm text-gray-600">
                    Strength: {Math.round(persona.archetypeStrength * 100)}%
                  </span>
                )}
              </div>
              {persona.secondaryArchetype && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 mr-2">Secondary:</span>
                  <span className="px-2 py-1 text-xs font-medium border rounded bg-gray-50 text-gray-700 border-gray-200">
                    {formatArchetype(persona.secondaryArchetype)}
                  </span>
                </div>
              )}
              {persona.variant && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 mr-2">Variant:</span>
                  <span className="px-2 py-1 text-xs font-medium border rounded bg-blue-50 text-blue-700 border-blue-200">
                    {formatArchetype(persona.variant)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Description</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{persona.description}</p>
          </div>

          {/* Leadership & Communication */}
          {(persona.leadershipLevel || persona.communicationStyle) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Leadership & Communication</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {persona.leadershipLevel && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Leadership Level</p>
                    <p className="text-sm font-medium text-gray-900">{formatArchetype(persona.leadershipLevel)}</p>
                  </div>
                )}
                {persona.communicationStyle && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Communication Style</p>
                    <p className="text-sm font-medium text-gray-900">{formatArchetype(persona.communicationStyle)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Demographics */}
          {persona.demographics && Object.keys(persona.demographics).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Demographics</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(persona.demographics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">{key.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                    <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          {persona.attributes && Object.keys(persona.attributes).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Key Attributes</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(persona.attributes).map(([key, value]) => (
                  <span key={key} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {key.replace(/_/g, ' ')}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
