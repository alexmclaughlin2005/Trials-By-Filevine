'use client';

import { Dialog, DialogContent } from './ui/dialog';
import { type MatchBreakdown } from '@/hooks/use-juror-matching';
import { X } from 'lucide-react';

interface MatchBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: MatchBreakdown;
}

export function MatchBreakdownModal({ isOpen, onClose, breakdown }: MatchBreakdownModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-filevine-gray-200 bg-white pb-4 mb-6">
          <h2 className="text-xl font-semibold text-filevine-gray-900">
            Match Breakdown: {breakdown.personaName}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-filevine-gray-400 hover:text-filevine-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

          <div className="p-6 space-y-6">
            {/* Overall Score */}
            <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-filevine-gray-600">Overall Match Score</div>
                  <div className="mt-1 text-3xl font-bold text-filevine-gray-900">
                    {(breakdown.overallScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-filevine-gray-600">Confidence</div>
                  <div className="mt-1 text-xl font-semibold text-filevine-gray-900">
                    {(breakdown.overallConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Method Scores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-filevine-gray-900">Method Scores</h3>

              {/* Signal-Based */}
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-4">
                <h4 className="font-semibold text-filevine-gray-900 mb-3">Signal-Based Scoring</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-filevine-gray-600">Score</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {(breakdown.methodScores.signalBased * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-filevine-gray-600">Confidence</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {breakdown.methodConfidences ? (breakdown.methodConfidences.signalBased * 100).toFixed(0) : 'N/A'}%
                    </div>
                  </div>
                </div>
                {breakdown.supportingSignals && breakdown.supportingSignals.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-green-700 mb-2">Supporting Signals</div>
                    <div className="space-y-1">
                      {breakdown.supportingSignals.map((signal, idx) => (
                        <div key={idx} className="text-sm text-filevine-gray-700">
                          • {signal.signalName}: {JSON.stringify(signal.value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {breakdown.contradictingSignals && breakdown.contradictingSignals.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-2">Contradicting Signals</div>
                    <div className="space-y-1">
                      {breakdown.contradictingSignals.map((signal, idx) => (
                        <div key={idx} className="text-sm text-filevine-gray-700">
                          • {signal.signalName}: {JSON.stringify(signal.value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Embedding */}
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-4">
                <h4 className="font-semibold text-filevine-gray-900 mb-3">Embedding Similarity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-filevine-gray-600">Similarity Score</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {(breakdown.methodScores.embedding * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-filevine-gray-600">Confidence</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {breakdown.methodConfidences ? (breakdown.methodConfidences.embedding * 100).toFixed(0) : 'N/A'}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Bayesian */}
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-4">
                <h4 className="font-semibold text-filevine-gray-900 mb-3">Bayesian Updating</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-filevine-gray-600">Posterior Probability</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {(breakdown.methodScores.bayesian * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-filevine-gray-600">Confidence</div>
                    <div className="text-xl font-semibold text-filevine-gray-900">
                      {breakdown.methodConfidences ? (breakdown.methodConfidences.bayesian * 100).toFixed(0) : 'N/A'}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div>
              <h3 className="text-lg font-semibold text-filevine-gray-900 mb-3">Rationale</h3>
              <div className="rounded-md bg-filevine-gray-50 p-4">
                <p className="text-sm text-filevine-gray-700 whitespace-pre-wrap">
                  {breakdown.rationale}
                </p>
              </div>
            </div>

            {/* Counterfactual */}
            {breakdown.counterfactual && (
              <div>
                <h3 className="text-lg font-semibold text-filevine-gray-900 mb-3">Counterfactual Analysis</h3>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {breakdown.counterfactual}
                  </p>
                </div>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
