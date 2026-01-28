'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Shield, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PersonaV2 {
  id: string;
  name: string;
  nickname?: string;
  tagline?: string;
  archetype: string;
  secondaryArchetype?: string;

  // V2 Fields
  instantRead?: string;
  archetypeVerdictLean?: string;
  phrasesYoullHear?: string[];
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strikeOrKeep?: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };

  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  demographics?: any;
}

interface PersonaCardV2Props {
  persona: PersonaV2;
  expanded?: boolean;
  onSelect?: (personaId: string) => void;
  showStrategy?: boolean; // Whether to show strike/keep guidance
  side?: 'plaintiff' | 'defense' | 'both'; // Which side's strategy to show
}

export function PersonaCardV2({
  persona,
  expanded: defaultExpanded = false,
  onSelect,
  showStrategy = true,
  side = 'both'
}: PersonaCardV2Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getVerdictLeanColor = (lean?: string) => {
    if (!lean) return 'bg-gray-100 text-gray-700';
    if (lean.includes('STRONG DEFENSE')) return 'bg-red-100 text-red-700';
    if (lean.includes('STRONG PLAINTIFF')) return 'bg-green-100 text-green-700';
    if (lean.includes('SLIGHT DEFENSE')) return 'bg-orange-100 text-orange-700';
    if (lean.includes('SLIGHT PLAINTIFF')) return 'bg-teal-100 text-teal-700';
    if (lean.includes('NEUTRAL')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatArchetypeName = (archetype: string) => {
    return archetype
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{persona.name}</CardTitle>
              {persona.nickname && persona.nickname !== persona.name && (
                <span className="text-sm text-filevine-gray-600">
                  ({persona.nickname})
                </span>
              )}
            </div>

            {/* Archetype Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {formatArchetypeName(persona.archetype)}
              </Badge>
              {persona.secondaryArchetype && (
                <Badge variant="outline" className="text-xs bg-gray-50">
                  + {formatArchetypeName(persona.secondaryArchetype)}
                </Badge>
              )}
              {persona.archetypeVerdictLean && (
                <Badge className={`text-xs ${getVerdictLeanColor(persona.archetypeVerdictLean)}`}>
                  {persona.archetypeVerdictLean}
                </Badge>
              )}
            </div>

            {/* Instant Read */}
            {persona.instantRead && (
              <p className="text-sm text-filevine-gray-700 italic mt-2">
                "{persona.instantRead}"
              </p>
            )}

            {/* Tagline */}
            {persona.tagline && (
              <p className="text-sm text-filevine-gray-600 mt-1">
                {persona.tagline}
              </p>
            )}
          </div>

          {onSelect && (
            <Button
              size="sm"
              onClick={() => onSelect(persona.id)}
              variant="outline"
            >
              Select
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Danger Levels */}
        {(persona.plaintiffDangerLevel || persona.defenseDangerLevel) && (
          <div className="grid grid-cols-2 gap-4">
            <DangerMeter
              label="Plaintiff Danger"
              level={persona.plaintiffDangerLevel}
              icon={<AlertCircle className="h-4 w-4" />}
            />
            <DangerMeter
              label="Defense Danger"
              level={persona.defenseDangerLevel}
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Verdict Prediction */}
        {persona.verdictPrediction && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                Verdict Prediction
              </span>
            </div>
            <div className="space-y-1 text-sm">
              {typeof persona.verdictPrediction.liability_finding_probability === 'number' && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Liability Probability:</span>
                  <span className="font-medium text-blue-900">
                    {(persona.verdictPrediction.liability_finding_probability * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {persona.verdictPrediction.role_in_deliberation && (
                <div className="text-blue-700">
                  <span className="font-medium">Role:</span>{' '}
                  {persona.verdictPrediction.role_in_deliberation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expandable Section */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Show More
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Phrases You'll Hear */}
            {persona.phrasesYoullHear && persona.phrasesYoullHear.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-filevine-gray-900 mb-2">
                  💬 Phrases You'll Hear
                </h4>
                <ul className="space-y-1">
                  {persona.phrasesYoullHear.map((phrase, index) => (
                    <li
                      key={index}
                      className="text-sm text-filevine-gray-700 pl-4 border-l-2 border-filevine-blue-200"
                    >
                      "{phrase}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Damages Prediction */}
            {persona.verdictPrediction?.damages_if_liability && (
              <div>
                <h4 className="text-sm font-semibold text-filevine-gray-900 mb-1">
                  💰 Damages if Liable
                </h4>
                <p className="text-sm text-filevine-gray-700">
                  {persona.verdictPrediction.damages_if_liability}
                </p>
              </div>
            )}

            {/* Strike/Keep Strategy */}
            {showStrategy && persona.strikeOrKeep && (
              <div className="space-y-3">
                {(side === 'plaintiff' || side === 'both') && persona.strikeOrKeep.plaintiff_strategy && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-900 mb-1">
                      ⚖️ Plaintiff Strategy
                    </h4>
                    <p className="text-sm text-green-800">
                      {persona.strikeOrKeep.plaintiff_strategy}
                    </p>
                  </div>
                )}

                {(side === 'defense' || side === 'both') && persona.strikeOrKeep.defense_strategy && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-900 mb-1">
                      🛡️ Defense Strategy
                    </h4>
                    <p className="text-sm text-purple-800">
                      {persona.strikeOrKeep.defense_strategy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Demographics */}
            {persona.demographics && (
              <div>
                <h4 className="text-sm font-semibold text-filevine-gray-900 mb-2">
                  👤 Demographics
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {persona.demographics.age && (
                    <div>
                      <span className="text-filevine-gray-600">Age:</span>{' '}
                      <span className="text-filevine-gray-900">{persona.demographics.age}</span>
                    </div>
                  )}
                  {persona.demographics.occupation && (
                    <div>
                      <span className="text-filevine-gray-600">Occupation:</span>{' '}
                      <span className="text-filevine-gray-900">{persona.demographics.occupation}</span>
                    </div>
                  )}
                  {persona.demographics.education && (
                    <div>
                      <span className="text-filevine-gray-600">Education:</span>{' '}
                      <span className="text-filevine-gray-900">{persona.demographics.education}</span>
                    </div>
                  )}
                  {persona.demographics.politics && (
                    <div>
                      <span className="text-filevine-gray-600">Politics:</span>{' '}
                      <span className="text-filevine-gray-900">{persona.demographics.politics}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Danger Meter Component
function DangerMeter({
  label,
  level,
  icon,
  max = 5
}: {
  label: string;
  level?: number;
  icon?: React.ReactNode;
  max?: number;
}) {
  if (!level) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-xs text-gray-500">N/A</div>
      </div>
    );
  }

  const getColor = (level: number) => {
    if (level >= 4) return 'bg-red-500';
    if (level >= 3) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getLabelColor = (level: number) => {
    if (level >= 4) return 'text-red-700';
    if (level >= 3) return 'text-orange-700';
    return 'text-yellow-700';
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-filevine-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i < level ? getColor(level) : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-sm font-bold ${getLabelColor(level)}`}>
          {level}/{max}
        </span>
      </div>
    </div>
  );
}
