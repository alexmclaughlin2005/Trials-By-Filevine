'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationBannerProps {
  selectedCount: number;
  type: 'arguments' | 'questions';
}

export function ValidationBanner({ selectedCount, type }: ValidationBannerProps) {
  if (selectedCount === 0) {
    const message = type === 'arguments'
      ? 'No arguments selected'
      : 'No questions added';

    const description = type === 'arguments'
      ? 'Select at least one argument to test with the focus group.'
      : 'Questions are optional. The focus group will discuss the arguments naturally without specific prompts.';

    const bgColor = type === 'arguments' ? 'bg-yellow-50' : 'bg-blue-50';
    const borderColor = type === 'arguments' ? 'border-yellow-200' : 'border-blue-200';
    const textColor = type === 'arguments' ? 'text-yellow-800' : 'text-blue-800';
    const iconColor = type === 'arguments' ? 'text-yellow-600' : 'text-blue-600';

    return (
      <div className={`rounded-md ${bgColor} border ${borderColor} p-3 flex items-start gap-2 animate-in slide-in-from-top-2 fade-in duration-300`}>
        <AlertCircle className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5 animate-in zoom-in duration-300`} />
        <div>
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
          <p className={`text-xs ${textColor} mt-1 opacity-90`}>
            {description}
          </p>
        </div>
      </div>
    );
  }

  const itemName = type === 'arguments' ? 'argument' : 'question';
  const message = `${selectedCount} ${itemName}${selectedCount !== 1 ? 's' : ''} ${
    type === 'arguments' ? 'ready to test' : 'configured'
  }`;

  return (
    <div className="rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 animate-in zoom-in duration-300" />
      <p className="text-sm text-green-800">
        {message}
      </p>
    </div>
  );
}
