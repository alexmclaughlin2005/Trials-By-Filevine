'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CaseSidebar } from '@/components/case/case-sidebar';
import { useCaseCollaboration } from '@/hooks/use-case-collaboration';
import { ConnectionStatus } from '@/components/collaboration/connection-status';
import { ActiveViewers } from '@/components/collaboration/active-viewers';
import {
  FileText,
  Scale,
  Calendar,
  MapPin,
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
  facts: Array<{ id: string }>;
  arguments: Array<{ id: string }>;
  witnesses: Array<{ id: string }>;
  juryPanels: Array<{
    id: string;
    jurors?: Array<{ id: string }>;
  }>;
}

interface CaseResponse {
  case: Case;
}

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const caseId = params.id as string;

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

  const jurorCount =
    data.juryPanels?.reduce((sum, panel) => sum + (panel.jurors?.length || 0), 0) || 0;
  const factsCount = data.facts?.length || 0;
  const argumentsCount = data.arguments?.length || 0;
  const witnessesCount = data.witnesses?.length || 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Case Sidebar */}
      <CaseSidebar
        caseId={caseId}
        jurorCount={jurorCount}
        factsCount={factsCount}
        argumentsCount={argumentsCount}
        witnessesCount={witnessesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="border-b border-filevine-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-filevine-gray-900">{data.name}</h1>
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
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-filevine-gray-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Case #{data.caseNumber}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    <span className="capitalize">{data.caseType}</span>
                  </div>
                  {data.trialDate && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(data.trialDate).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                  {data.venue && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{data.venue}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Case Information - Compact */}
                <div className="mt-3 flex items-center gap-6 text-xs text-filevine-gray-600">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-medium">Plaintiff:</span> {data.plaintiffName}
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-medium">Defendant:</span> {data.defendantName}
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-medium">Our Side:</span>{' '}
                      <span className="capitalize">{data.ourSide}</span>
                    </div>
                    {data.jurisdiction && (
                      <>
                        <span>•</span>
                        <div>
                          <span className="font-medium">Jurisdiction:</span> {data.jurisdiction}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Collaboration Status */}
              <div className="ml-6 flex items-center gap-3">
                <ConnectionStatus isConnected={isConnected} />
                <ActiveViewers count={viewerCount} isConnected={isConnected} />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-6 py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
