'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  Scale,
} from 'lucide-react';

interface StrikeRecommendation {
  jurorId: string;
  jurorNumber: string;
  jurorName: string;
  action: 'MUST STRIKE' | 'STRIKE IF POSSIBLE' | 'NEUTRAL' | 'CONSIDER KEEPING' | 'KEEP';
  priority: number;
  reasoning: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  archetypeMatch?: string;
  keyFactors: string[];
}

interface PanelComposition {
  totalJurors: number;
  favorableCount: number;
  unfavorableCount: number;
  neutralCount: number;
  archetypeBreakdown: Record<string, number>;
  verdictLeanSummary: {
    strongPlaintiff: number;
    leanPlaintiff: number;
    neutral: number;
    leanDefense: number;
    strongDefense: number;
  };
}

interface CaseStrategyRecommendation {
  overallAssessment: string;
  panelComposition: PanelComposition;
  strikeRecommendations: StrikeRecommendation[];
  keepRecommendations: StrikeRecommendation[];
  deliberationForecast: {
    predictedOutcome: string;
    confidenceLevel: number;
    keyInfluencers: string[];
    potentialLeaders: string[];
    riskFactors: string[];
  };
  strategicPriorities: string[];
}

interface CaseStrategyV2Props {
  strategy: CaseStrategyRecommendation;
  attorneySide?: string;
  availableStrikes?: number;
}

export function CaseStrategyV2({
  strategy,
  attorneySide,
  availableStrikes,
}: CaseStrategyV2Props) {
  const getDangerLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('MUST STRIKE')) return 'bg-red-600 text-white';
    if (action.includes('STRIKE IF POSSIBLE')) return 'bg-orange-600 text-white';
    if (action.includes('KEEP')) return 'bg-green-600 text-white';
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-filevine-gray-900">
            Case Strategy (V2)
          </h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Strategic recommendations based on V2 persona danger levels and
            strike/keep guidance
          </p>
          {attorneySide && (
            <Badge variant="outline" className="mt-2 capitalize">
              {attorneySide} Attorney
            </Badge>
          )}
        </div>
      </div>

      {/* Overall Assessment */}
      <Alert>
        <Scale className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <span className="font-semibold">Overall Assessment:</span>{' '}
          {strategy.overallAssessment}
        </AlertDescription>
      </Alert>

      {/* Panel Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Panel Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-filevine-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-filevine-gray-900">
                {strategy.panelComposition.totalJurors}
              </p>
              <p className="text-xs text-filevine-gray-600 mt-1">Total Jurors</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {strategy.panelComposition.favorableCount}
              </p>
              <p className="text-xs text-green-600 mt-1">Favorable</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">
                {strategy.panelComposition.unfavorableCount}
              </p>
              <p className="text-xs text-red-600 mt-1">Unfavorable</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">
                {strategy.panelComposition.neutralCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">Neutral</p>
            </div>
          </div>

          {/* Archetype Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
              Archetype Distribution
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(strategy.panelComposition.archetypeBreakdown).map(
                ([archetype, count]) => (
                  <div
                    key={archetype}
                    className="flex items-center justify-between p-2 bg-filevine-gray-50 rounded"
                  >
                    <span className="text-sm text-filevine-gray-700 capitalize">
                      {archetype}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Verdict Lean Summary */}
          <div>
            <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
              Verdict Lean Distribution
            </h4>
            <div className="space-y-2">
              {[
                {
                  label: 'Strong Plaintiff',
                  count: strategy.panelComposition.verdictLeanSummary.strongPlaintiff,
                  color: 'bg-green-500',
                },
                {
                  label: 'Lean Plaintiff',
                  count: strategy.panelComposition.verdictLeanSummary.leanPlaintiff,
                  color: 'bg-green-300',
                },
                {
                  label: 'Neutral',
                  count: strategy.panelComposition.verdictLeanSummary.neutral,
                  color: 'bg-gray-400',
                },
                {
                  label: 'Lean Defense',
                  count: strategy.panelComposition.verdictLeanSummary.leanDefense,
                  color: 'bg-red-300',
                },
                {
                  label: 'Strong Defense',
                  count: strategy.panelComposition.verdictLeanSummary.strongDefense,
                  color: 'bg-red-500',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className={`h-3 ${item.color} rounded-sm`}
                      style={{
                        width: `${(item.count / strategy.panelComposition.totalJurors) * 100}%`,
                        minWidth: item.count > 0 ? '20px' : '0',
                      }}
                    />
                    <span className="text-xs text-filevine-gray-600">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-filevine-gray-900 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strike Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Strike Recommendations
            </CardTitle>
            {availableStrikes && (
              <Badge variant="outline">
                {availableStrikes} strikes available
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {strategy.strikeRecommendations.length === 0 ? (
            <p className="text-sm text-filevine-gray-500 text-center py-4">
              No specific strike recommendations
            </p>
          ) : (
            <div className="space-y-3">
              {strategy.strikeRecommendations
                .sort((a, b) => b.priority - a.priority)
                .map((rec) => (
                  <div
                    key={rec.jurorId}
                    className="border border-filevine-gray-200 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono shrink-0"
                        >
                          #{rec.jurorNumber}
                        </Badge>
                        <span className="font-medium text-filevine-gray-900">
                          {rec.jurorName}
                        </span>
                        {rec.archetypeMatch && (
                          <Badge className="text-xs bg-purple-100 text-purple-700">
                            {rec.archetypeMatch}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className={`text-xs ${getDangerLevelColor(rec.dangerLevel)}`}
                        >
                          {rec.dangerLevel}
                        </Badge>
                        <Badge className={`text-xs ${getActionBadgeColor(rec.action)}`}>
                          {rec.action}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-filevine-gray-700">
                      {rec.reasoning}
                    </p>
                    {rec.keyFactors.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-filevine-gray-600 mb-1">
                          Key Factors:
                        </p>
                        <ul className="space-y-1">
                          {rec.keyFactors.map((factor, i) => (
                            <li
                              key={i}
                              className="text-xs text-filevine-gray-600 flex items-start"
                            >
                              <span className="mr-1">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keep Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Keep Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategy.keepRecommendations.length === 0 ? (
            <p className="text-sm text-filevine-gray-500 text-center py-4">
              No specific keep recommendations
            </p>
          ) : (
            <div className="space-y-3">
              {strategy.keepRecommendations.map((rec) => (
                <div
                  key={rec.jurorId}
                  className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono shrink-0"
                      >
                        #{rec.jurorNumber}
                      </Badge>
                      <span className="font-medium text-filevine-gray-900">
                        {rec.jurorName}
                      </span>
                      {rec.archetypeMatch && (
                        <Badge className="text-xs bg-purple-100 text-purple-700">
                          {rec.archetypeMatch}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-filevine-gray-700">
                    {rec.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deliberation Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deliberation Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predicted Outcome */}
          <div>
            <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
              Predicted Outcome
            </h4>
            <p className="text-sm text-filevine-gray-700">
              {strategy.deliberationForecast.predictedOutcome}
            </p>
            <div className="mt-2">
              <span className="text-xs text-filevine-gray-600">
                Confidence Level:{' '}
              </span>
              <span className="text-sm font-medium text-filevine-gray-900">
                {(strategy.deliberationForecast.confidenceLevel * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Key Influencers & Leaders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                Key Influencers
              </h4>
              <div className="space-y-1">
                {strategy.deliberationForecast.keyInfluencers.map((juror, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {juror}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                Potential Leaders
              </h4>
              <div className="space-y-1">
                {strategy.deliberationForecast.potentialLeaders.map((juror, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {juror}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {strategy.deliberationForecast.riskFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                Risk Factors
              </h4>
              <ul className="space-y-2">
                {strategy.deliberationForecast.riskFactors.map((risk, i) => (
                  <li
                    key={i}
                    className="text-sm text-filevine-gray-700 flex items-start"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategic Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {strategy.strategicPriorities.map((priority, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-filevine-blue-100 text-filevine-blue-700 text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm text-filevine-gray-700 pt-0.5">
                  {priority}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
