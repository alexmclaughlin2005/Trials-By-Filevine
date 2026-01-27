'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface WizardProgressFooterProps {
  currentStep: number;
  isPanelConfigured: boolean;
  argumentsCount: number;
  questionsCount: number;
}

export function WizardProgressFooter({
  currentStep,
  isPanelConfigured,
  argumentsCount,
  questionsCount,
}: WizardProgressFooterProps) {
  const steps = [
    { label: 'Panel', completed: isPanelConfigured },
    { label: 'Arguments', completed: argumentsCount > 0 },
    { label: 'Questions', completed: true }, // Questions are optional
    { label: 'Review', completed: false },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between transition-all duration-300">
          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`flex items-center gap-1.5 transition-all duration-300 ${
                  index === currentStep
                    ? 'text-blue-600 font-semibold'
                    : step.completed
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 animate-in zoom-in duration-300" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="text-sm">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-medium">Panel:</span>
              <span className={isPanelConfigured ? 'text-green-600' : 'text-gray-400'}>
                {isPanelConfigured ? 'Configured' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Arguments:</span>
              <span className={argumentsCount > 0 ? 'text-green-600' : 'text-gray-400'}>
                {argumentsCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Questions:</span>
              <span className="text-gray-700">{questionsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Progress:</span>
              <span className="text-blue-600 font-semibold">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
