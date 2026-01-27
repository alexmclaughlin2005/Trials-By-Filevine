'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

export interface PersonaInsight {
  personaId: string;
  personaName: string;
  archetype: string;
  caseInterpretation: string;
  keyBiases: string[];
  decisionDrivers: string[];
  persuasionStrategy: string;
  vulnerabilities: string[];
  strengths: string[];
}

interface PersonaInsightsCardProps {
  insight: PersonaInsight;
}

export function PersonaInsightsCard({ insight }: PersonaInsightsCardProps) {
  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              {insight.personaName}
            </CardTitle>
            <p className="text-sm text-indigo-600 font-medium mt-1">
              {insight.archetype.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  );
}
