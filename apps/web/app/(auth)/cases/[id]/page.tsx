'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QuestionGenerator } from '@/components/question-generator';
import { FocusGroupSimulator } from '@/components/focus-group-simulator';
import { FactsTab } from '@/components/case/facts-tab';
import { ArgumentsTab } from '@/components/case/arguments-tab';
import { WitnessesTab } from '@/components/case/witnesses-tab';
import { JurorsTab } from '@/components/case/jurors-tab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCaseCollaboration } from '@/hooks/use-case-collaboration';
import { ConnectionStatus } from '@/components/collaboration/connection-status';
import { ActiveViewers } from '@/components/collaboration/active-viewers';
import { useState } from 'react';
import {
  FileText,
  Scale,
  Users,
  MessageSquare,
  Target,
  Calendar,
  MapPin
} from 'lucide-react';

interface Case {
  id: string;
  name: string;
  caseNumber: string;
  caseType: string;
  plaintiffName: string;
  defendantName: string;
  ourSide: string;
  trialDate: string | null;
  status: string;
  jurisdiction: string | null;
  venue: string | null;
  facts: Array<{
    id: string;
    content: string;
    factType: string;
    source?: string;
    sortOrder: number;
  }>;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
    version: number;
    isCurrent: boolean;
    parentId?: string;
    changeNotes?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  witnesses: Array<{
    id: string;
    name: string;
    role: string;
    affiliation: string;
    summary?: string;
    directOutline?: string;
    crossOutline?: string;
    sortOrder: number;
  }>;
  juryPanels: Array<{
    id: string;
    panelDate: string;
    status: string;
    totalJurors: number;
  }>;
}

interface CaseResponse {
  case: Case;
}

export default function CaseDetailPageEnhanced() {
  const params = useParams();
  const caseId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time collaboration
  const { isConnected, viewerCount } = useCaseCollaboration(caseId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await apiClient.get<CaseResponse>(`/cases/${caseId}`);
      return response.case;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-filevine-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to load case'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header Section */}
      <div className="border-b border-filevine-gray-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-filevine-gray-900">{data.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-filevine-gray-600">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Case #{data.caseNumber}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4" />
                <span className="capitalize">{data.caseType}</span>
              </div>
              {data.trialDate && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(data.trialDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              {data.venue && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{data.venue}</span>
                  </div>
                </>
              )}
              <span>•</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  data.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {data.status}
              </span>
            </div>
          </div>
          {/* Collaboration Status */}
          <div className="ml-6 flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} />
            <ActiveViewers count={viewerCount} isConnected={isConnected} />
          </div>
        </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-filevine-gray-50 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-filevine-blue" />
                <div>
                  <p className="text-2xl font-bold text-filevine-gray-900">
                    {data.facts?.length || 0}
                  </p>
                  <p className="text-xs text-filevine-gray-600">Facts</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-filevine-gray-50 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-filevine-green" />
                <div>
                  <p className="text-2xl font-bold text-filevine-gray-900">
                    {data.arguments?.length || 0}
                  </p>
                  <p className="text-xs text-filevine-gray-600">Arguments</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-filevine-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-filevine-blue" />
                <div>
                  <p className="text-2xl font-bold text-filevine-gray-900">
                    {data.witnesses?.length || 0}
                  </p>
                  <p className="text-xs text-filevine-gray-600">Witnesses</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-filevine-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-filevine-gray-900">
                    {data.juryPanels?.[0]?.totalJurors || 0}
                  </p>
                  <p className="text-xs text-filevine-gray-600">Jurors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="facts">
                Facts ({data.facts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="arguments">
                Arguments ({data.arguments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="witnesses">
                Witnesses ({data.witnesses?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="jurors">
                Jurors ({data.juryPanels?.[0]?.totalJurors || 0})
              </TabsTrigger>
              <TabsTrigger value="questions">Voir Dire Questions</TabsTrigger>
              <TabsTrigger value="focus-groups">Focus Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Case Information Card */}
                <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-filevine-gray-900 mb-4">
                    Case Information
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-filevine-gray-700">
                        Plaintiff
                      </p>
                      <p className="mt-1 text-filevine-gray-900">{data.plaintiffName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-filevine-gray-700">
                        Defendant
                      </p>
                      <p className="mt-1 text-filevine-gray-900">{data.defendantName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-filevine-gray-700">
                        Our Side
                      </p>
                      <p className="mt-1 capitalize text-filevine-gray-900">
                        {data.ourSide}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-filevine-gray-700">
                        Trial Date
                      </p>
                      <p className="mt-1 text-filevine-gray-900">
                        {data.trialDate
                          ? new Date(data.trialDate).toLocaleDateString()
                          : 'Not scheduled'}
                      </p>
                    </div>
                    {data.jurisdiction && (
                      <div>
                        <p className="text-sm font-medium text-filevine-gray-700">
                          Jurisdiction
                        </p>
                        <p className="mt-1 text-filevine-gray-900">
                          {data.jurisdiction}
                        </p>
                      </div>
                    )}
                    {data.venue && (
                      <div>
                        <p className="text-sm font-medium text-filevine-gray-700">
                          Venue
                        </p>
                        <p className="mt-1 text-filevine-gray-900">{data.venue}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity / Next Steps */}
                <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-filevine-gray-900 mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('facts')}
                      className="rounded-lg border border-filevine-gray-200 p-4 text-left hover:border-filevine-blue hover:bg-filevine-blue/5 transition-colors"
                    >
                      <FileText className="h-6 w-6 text-filevine-blue mb-2" />
                      <p className="font-medium text-filevine-gray-900">
                        Manage Facts
                      </p>
                      <p className="text-xs text-filevine-gray-600 mt-1">
                        Add and organize case facts
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('arguments')}
                      className="rounded-lg border border-filevine-gray-200 p-4 text-left hover:border-filevine-blue hover:bg-filevine-blue/5 transition-colors"
                    >
                      <MessageSquare className="h-6 w-6 text-filevine-green mb-2" />
                      <p className="font-medium text-filevine-gray-900">
                        Build Arguments
                      </p>
                      <p className="text-xs text-filevine-gray-600 mt-1">
                        Craft persuasive arguments
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('witnesses')}
                      className="rounded-lg border border-filevine-gray-200 p-4 text-left hover:border-filevine-blue hover:bg-filevine-blue/5 transition-colors"
                    >
                      <Users className="h-6 w-6 text-filevine-blue mb-2" />
                      <p className="font-medium text-filevine-gray-900">
                        Add Witnesses
                      </p>
                      <p className="text-xs text-filevine-gray-600 mt-1">
                        Document witness strategies
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="facts">
              <FactsTab caseId={caseId} facts={data.facts || []} />
            </TabsContent>

            <TabsContent value="arguments">
              <ArgumentsTab caseId={caseId} arguments={data.arguments || []} />
            </TabsContent>

            <TabsContent value="witnesses">
              <WitnessesTab caseId={caseId} witnesses={data.witnesses || []} />
            </TabsContent>

            <TabsContent value="jurors">
              <JurorsTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="questions">
              <QuestionGenerator caseId={caseId} />
            </TabsContent>

            <TabsContent value="focus-groups">
              <FocusGroupSimulator
                caseId={caseId}
                arguments={data.arguments || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
