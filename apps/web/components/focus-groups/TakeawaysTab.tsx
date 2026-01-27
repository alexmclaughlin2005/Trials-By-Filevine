'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, XCircle, HelpCircle, FileEdit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TakeawaysData {
  whatLanded: Array<{
    point: string;
    personaSupport: string[];
    evidence: string[];
  }>;
  whatConfused: Array<{
    point: string;
    personasConfused: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  whatBackfired: Array<{
    point: string;
    personasCritical: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  topQuestions: Array<{
    question: string;
    askedByCount: number;
    personaNames: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendedEdits: Array<{
    editNumber: number;
    section: string;
    type: 'CLARIFY' | 'ADD' | 'REMOVE' | 'SOFTEN' | 'STRENGTHEN';
    originalText?: string;
    suggestedText: string;
    reason: string;
    affectedPersonas: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

interface TakeawaysResponse {
  conversationId: string;
  takeaways: TakeawaysData;
  generatedAt: string;
  promptVersion: string;
}

interface TakeawaysTabProps {
  conversationId: string;
  argumentId: string;
  caseId: string;
}

const severityColors = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const priorityColors = {
  LOW: 'bg-gray-50 text-gray-700 border-gray-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-filevine-blue text-white border-filevine-blue',
};

export function TakeawaysTab({ conversationId, argumentId, caseId }: TakeawaysTabProps) {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<TakeawaysResponse>({
    queryKey: ['conversation-takeaways', conversationId],
    queryFn: () => apiClient.post<TakeawaysResponse>(`/focus-groups/conversations/${conversationId}/generate-takeaways`, {}),
    retry: (failureCount, error: any) => {
      // Don't retry if conversation is incomplete (400 error)
      if (error?.message?.includes('incomplete') || error?.response?.status === 400) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-filevine-blue mb-4" />
        <p className="text-lg font-medium text-filevine-gray-900">Analyzing conversation...</p>
        <p className="text-sm text-filevine-gray-600 mt-2">
          Generating strategic insights and recommendations
        </p>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isIncomplete = errorMessage.includes('incomplete');

    return (
      <div className="p-8 text-center">
        <AlertCircle className={`h-10 w-10 mx-auto mb-3 ${isIncomplete ? 'text-blue-500' : 'text-red-500'}`} />
        <p className="text-base font-medium text-filevine-gray-900">
          {isIncomplete ? 'Conversation in Progress' : 'Failed to generate takeaways'}
        </p>
        <p className="text-sm text-filevine-gray-600 mt-1.5">
          {isIncomplete
            ? 'Key takeaways will be available once the roundtable discussion is complete.'
            : errorMessage
          }
        </p>
      </div>
    );
  }

  const { takeaways } = data;

  const handleApplyRecommendations = () => {
    // Navigate to argument editor with recommendations
    router.push(`/cases/${caseId}/arguments/${argumentId}/edit?applyRecommendations=${conversationId}`);
  };

  return (
    <div className="space-y-6">
      {/* Strategic Summary - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* What Landed */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 text-base">
              <CheckCircle className="h-5 w-5" />
              What Landed
            </CardTitle>
            <CardDescription className="text-green-700">
              Arguments that resonated with the panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {takeaways.whatLanded.length === 0 ? (
              <p className="text-sm text-green-700 italic">No strong positive reactions identified</p>
            ) : (
              <ul className="space-y-3">
                {takeaways.whatLanded.map((item, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-medium text-green-900">{item.point}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.personaSupport.map((persona, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* What Confused */}
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 text-base">
              <HelpCircle className="h-5 w-5" />
              What Confused
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Points that raised questions or concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {takeaways.whatConfused.length === 0 ? (
              <p className="text-sm text-yellow-700 italic">No significant confusion identified</p>
            ) : (
              <ul className="space-y-3">
                {takeaways.whatConfused.map((item, index) => (
                  <li key={index} className="text-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-yellow-900 flex-1">{item.point}</p>
                      <Badge variant="outline" className={`text-xs ${severityColors[item.severity]}`}>
                        {item.severity}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.personasConfused.map((persona, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* What Backfired */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 text-base">
              <XCircle className="h-5 w-5" />
              What Backfired
            </CardTitle>
            <CardDescription className="text-red-700">
              Arguments that had negative effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {takeaways.whatBackfired.length === 0 ? (
              <p className="text-sm text-red-700 italic">No significant negative reactions identified</p>
            ) : (
              <ul className="space-y-3">
                {takeaways.whatBackfired.map((item, index) => (
                  <li key={index} className="text-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-red-900 flex-1">{item.point}</p>
                      <Badge variant="outline" className={`text-xs ${severityColors[item.severity]}`}>
                        {item.severity}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.personasCritical.map((persona, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Questions to Prepare For */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Top Questions to Prepare For
          </CardTitle>
          <CardDescription>
            Questions jurors will likely ask during deliberation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {takeaways.topQuestions.length === 0 ? (
            <p className="text-sm text-filevine-gray-600 italic">No specific questions identified</p>
          ) : (
            <div className="space-y-4">
              {takeaways.topQuestions
                .sort((a, b) => {
                  // Sort by priority then by count
                  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                  const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
                  return diff !== 0 ? diff : b.askedByCount - a.askedByCount;
                })
                .map((item, index) => (
                  <div key={index} className="border-l-4 border-filevine-blue pl-4 py-2">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="font-medium text-filevine-gray-900 flex-1">
                        {index + 1}. {item.question}
                      </p>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.askedByCount} persona{item.askedByCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.personaNames.map((persona, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Edits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Recommended Edits to Your Argument
          </CardTitle>
          <CardDescription>
            Concrete suggestions based on panel reactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {takeaways.recommendedEdits.length === 0 ? (
            <p className="text-sm text-filevine-gray-600 italic">No specific edits recommended</p>
          ) : (
            <div className="space-y-6">
              {takeaways.recommendedEdits
                .sort((a, b) => {
                  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((edit) => (
                  <div key={edit.editNumber} className="border-l-4 border-filevine-blue pl-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-filevine-gray-900">
                            Edit {edit.editNumber}: {edit.section}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {edit.type}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${priorityColors[edit.priority]}`}>
                            {edit.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Before/After */}
                    <div className="bg-filevine-gray-50 rounded-md p-3 space-y-3 mb-3">
                      {edit.originalText && (
                        <div>
                          <p className="text-xs font-medium text-filevine-gray-600 mb-1">Current:</p>
                          <p className="text-sm text-red-700 line-through">{edit.originalText}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-filevine-gray-600 mb-1">
                          {edit.originalText ? 'Suggested:' : 'Add:'}
                        </p>
                        <p className="text-sm text-green-700 font-medium">{edit.suggestedText}</p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="text-xs text-filevine-gray-700 mb-2">
                      <span className="font-medium">Why:</span> {edit.reason}
                    </div>

                    {/* Affected Personas */}
                    <div className="flex flex-wrap gap-1">
                      {edit.affectedPersonas.map((persona, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Recommendations CTA */}
      {takeaways.recommendedEdits.length > 0 && (
        <Card className="bg-filevine-blue text-white border-filevine-blue">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Apply Recommendations to Create v2 Draft</h3>
              <p className="text-sm text-blue-100 mt-1">
                Create a new argument draft with the recommended edits applied.
                You can review and modify before saving.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleApplyRecommendations}
              className="ml-4 flex-shrink-0"
            >
              Apply Now →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
