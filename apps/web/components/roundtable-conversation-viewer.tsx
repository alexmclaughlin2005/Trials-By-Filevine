'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MessageSquare, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TakeawaysTab } from './focus-groups/TakeawaysTab';

interface Statement {
  id: string;
  personaId: string;
  personaName: string;
  sequenceNumber: number;
  content: string;
  sentiment?: string;
  emotionalIntensity?: number;
  keyPoints?: string[];
  addressedTo?: string[];
  agreementSignals?: string[];
  disagreementSignals?: string[];
  speakCount: number;
  createdAt: string;
}

interface Conversation {
  id: string;
  argumentId: string;
  argumentTitle: string;
  startedAt: string;
  completedAt?: string;
  converged: boolean;
  convergenceReason?: string;
  consensusAreas?: string[];
  fracturePoints?: string[];
  keyDebatePoints?: string[];
  influentialPersonas?: Array<{ personaId: string; personaName: string; influence: string }>;
  statements?: Statement[];
  allStatements?: Statement[];
  overallAnalysis?: {
    consensusAreas?: string[];
    fracturePoints?: string[];
    keyDebatePoints?: string[];
    influentialPersonas?: Array<{ personaId: string; personaName: string; influenceType: string }>;
  };
}

interface RoundtableConversationViewerProps {
  conversationId: string;
  caseId?: string;
}

const sentimentIcons = {
  plaintiff_leaning: <TrendingUp className="h-4 w-4 text-green-600" />,
  defense_leaning: <TrendingDown className="h-4 w-4 text-red-600" />,
  neutral: <Minus className="h-4 w-4 text-gray-600" />,
  conflicted: <AlertCircle className="h-4 w-4 text-yellow-600" />
};

const sentimentColors = {
  plaintiff_leaning: 'bg-green-50 border-green-200',
  defense_leaning: 'bg-red-50 border-red-200',
  neutral: 'bg-gray-50 border-gray-200',
  conflicted: 'bg-yellow-50 border-yellow-200'
};

const sentimentLabels = {
  plaintiff_leaning: 'Plaintiff Leaning',
  defense_leaning: 'Defense Leaning',
  neutral: 'Neutral',
  conflicted: 'Conflicted'
};

type TabType = 'takeaways' | 'transcript';

export function RoundtableConversationViewer({ conversationId, caseId }: RoundtableConversationViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('takeaways');
  const [expandedStatement, setExpandedStatement] = useState<string | null>(null);

  const { data: conversation, isLoading, error } = useQuery<Conversation>({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiClient.get<Conversation>(`/focus-groups/conversations/${conversationId}`)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filevine-blue mx-auto"></div>
          <p className="mt-4 text-sm text-filevine-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading conversation
      </div>
    );
  }

  const toggleStatement = (statementId: string) => {
    setExpandedStatement(expandedStatement === statementId ? null : statementId);
  };

  const tabs = [
    { id: 'takeaways' as TabType, label: 'Key Takeaways', icon: Sparkles },
    { id: 'transcript' as TabType, label: 'Full Transcript', icon: FileText },
  ];

  // Support both statements and allStatements (from different API responses)
  const statements = conversation.statements || conversation.allStatements || [];
  const consensusAreas = conversation.consensusAreas || conversation.overallAnalysis?.consensusAreas || [];
  const fracturePoints = conversation.fracturePoints || conversation.overallAnalysis?.fracturePoints || [];
  const keyDebatePoints = conversation.keyDebatePoints || conversation.overallAnalysis?.keyDebatePoints || [];

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-4 w-4" />
                Roundtable Discussion
              </CardTitle>
              <CardDescription className="mt-1">
                {conversation.argumentTitle}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <div className="text-filevine-gray-600">Statements</div>
                <div className="font-semibold text-filevine-gray-900">{statements.length}</div>
              </div>
              <div className="text-right">
                <div className="text-filevine-gray-600">Status</div>
                <div className="mt-0.5">
                  {conversation.converged ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Converged
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="border-b border-filevine-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 border-b-2 transition-colors text-sm',
                  activeTab === tab.id
                    ? 'border-filevine-blue text-filevine-blue font-medium'
                    : 'border-transparent text-filevine-gray-600 hover:text-filevine-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'takeaways' && (
        <TakeawaysTab
          conversationId={conversationId}
          argumentId={conversation.argumentId}
          caseId={caseId || ''}
        />
      )}

      {activeTab === 'transcript' && (
        <div className="space-y-6">
          {/* Consensus & Fracture Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consensusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consensus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {consensusAreas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                        <span className="text-sm text-filevine-gray-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {fracturePoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fracture Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {fracturePoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                        <span className="text-sm text-filevine-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Key Debate Points */}
          {keyDebatePoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Debate Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {keyDebatePoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-filevine-blue flex-shrink-0"></div>
                      <span className="text-sm text-filevine-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Conversation Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Transcript</CardTitle>
              <CardDescription>
                Full roundtable discussion in chronological order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statements.map((statement) => (
                  <div
                    key={statement.id}
                    className={cn(
                      'border rounded-lg p-4 transition-all',
                      statement.sentiment && sentimentColors[statement.sentiment as keyof typeof sentimentColors],
                      expandedStatement === statement.id && 'shadow-md'
                    )}
                  >
                    {/* Statement Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="font-semibold text-filevine-gray-900">
                          {statement.personaName}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{statement.sequenceNumber}
                        </Badge>
                        {statement.sentiment && (
                          <div className="flex items-center gap-1 text-xs text-filevine-gray-600">
                            {sentimentIcons[statement.sentiment as keyof typeof sentimentIcons]}
                            <span>{sentimentLabels[statement.sentiment as keyof typeof sentimentLabels]}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleStatement(statement.id)}
                        className="text-xs text-filevine-blue hover:underline"
                      >
                        {expandedStatement === statement.id ? 'Less' : 'More'}
                      </button>
                    </div>

                    {/* Statement Content */}
                    <div className="text-filevine-gray-700 italic mb-3">
                      &ldquo;{statement.content}&rdquo;
                    </div>

                    {/* Expanded Details */}
                    {expandedStatement === statement.id && (
                      <div className="mt-4 pt-4 border-t space-y-3 text-sm">
                        {statement.emotionalIntensity !== undefined && (
                          <div>
                            <span className="font-medium text-filevine-gray-600">Emotional Intensity:</span>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-filevine-blue"
                                  style={{ width: `${statement.emotionalIntensity * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-filevine-gray-600">
                                {Math.round(statement.emotionalIntensity * 100)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {statement.keyPoints && statement.keyPoints.length > 0 && (
                          <div>
                            <span className="font-medium text-filevine-gray-600">Key Points:</span>
                            <ul className="mt-1 space-y-1 ml-4">
                              {statement.keyPoints.map((point, index) => (
                                <li key={index} className="text-filevine-gray-700 list-disc">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {statement.addressedTo && statement.addressedTo.length > 0 && (
                          <div>
                            <span className="font-medium text-filevine-gray-600">Addressed To:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {statement.addressedTo.map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {statement.agreementSignals && statement.agreementSignals.length > 0 && (
                          <div>
                            <span className="font-medium text-filevine-gray-600">Agreed With:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {statement.agreementSignals.map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {statement.disagreementSignals && statement.disagreementSignals.length > 0 && (
                          <div>
                            <span className="font-medium text-filevine-gray-600">Disagreed With:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {statement.disagreementSignals.map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Convergence Reason */}
          {conversation.convergenceReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why Conversation Ended</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-filevine-gray-700">{conversation.convergenceReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
