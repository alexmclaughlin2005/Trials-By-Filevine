'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QuestionGenerator } from '@/components/question-generator';
import { FocusGroupSimulator } from '@/components/focus-group-simulator';
import { BatchImportModal } from '@/components/batch-import-modal';
import { DocumentCaptureModal } from '@/components/document-capture-modal';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Upload, Camera } from 'lucide-react';

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
    sortOrder: number;
  }>;
  arguments: Array<{
    id: string;
    title: string;
    content: string;
    argumentType: string;
  }>;
  juryPanels: Array<{
    id: string;
    panelDate: string;
    status: string;
    jurors: Array<{
      id: string;
      jurorNumber: string;
      firstName: string;
      lastName: string;
      age: number | null;
      occupation: string | null;
      status: string;
      classifiedArchetype: string | null;
    }>;
  }>;
  _count?: {
    juryPanels: number;
    facts: number;
    arguments: number;
  };
}

interface CaseResponse {
  case: Case;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'focus-group'>('overview');
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [showDocumentCapture, setShowDocumentCapture] = useState(false);

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

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'questions' as const, label: 'Voir Dire Questions' },
    { id: 'focus-group' as const, label: 'Focus Groups' },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-filevine-gray-900">{data.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-filevine-gray-600">
            <span>Case #{data.caseNumber}</span>
            <span>•</span>
            <span className="capitalize">{data.caseType}</span>
            <span>•</span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                data.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {data.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-filevine-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-filevine-blue text-filevine-blue'
                    : 'border-transparent text-filevine-gray-500 hover:border-filevine-gray-300 hover:text-filevine-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Case Information */}
            <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-filevine-gray-900">Case Information</h2>

              <div className="mt-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-filevine-gray-700">Plaintiff</p>
                  <p className="mt-1 text-filevine-gray-900">{data.plaintiffName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-filevine-gray-700">Defendant</p>
                  <p className="mt-1 text-filevine-gray-900">{data.defendantName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-filevine-gray-700">Our Side</p>
                  <p className="mt-1 capitalize text-filevine-gray-900">{data.ourSide}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-filevine-gray-700">Trial Date</p>
                  <p className="mt-1 text-filevine-gray-900">
                    {data.trialDate
                      ? new Date(data.trialDate).toLocaleDateString()
                      : 'Not scheduled'}
                  </p>
                </div>
                {data.jurisdiction && (
                  <div>
                    <p className="text-sm font-medium text-filevine-gray-700">Jurisdiction</p>
                    <p className="mt-1 text-filevine-gray-900">{data.jurisdiction}</p>
                  </div>
                )}
                {data.venue && (
                  <div>
                    <p className="text-sm font-medium text-filevine-gray-700">Venue</p>
                    <p className="mt-1 text-filevine-gray-900">{data.venue}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Case Facts */}
            {data.facts.length > 0 && (
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-filevine-gray-900">Case Facts</h2>
                <div className="mt-4 space-y-3">
                  {data.facts
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((fact) => (
                      <div
                        key={fact.id}
                        className="rounded-md border-l-4 border-filevine-blue bg-filevine-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <p className="flex-1 text-sm text-filevine-gray-900">{fact.content}</p>
                          <span className="ml-4 rounded-full bg-filevine-blue px-2 py-0.5 text-xs font-semibold text-white">
                            {fact.factType}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Arguments */}
            {data.arguments.length > 0 && (
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-filevine-gray-900">Arguments</h2>
                <div className="mt-4 space-y-4">
                  {data.arguments.map((arg) => (
                    <div
                      key={arg.id}
                      className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-filevine-gray-900">{arg.title}</h3>
                          <p className="mt-2 text-sm text-filevine-gray-700">{arg.content}</p>
                        </div>
                        <span className="ml-4 rounded-full bg-filevine-green px-2 py-0.5 text-xs font-semibold text-white">
                          {arg.argumentType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jury Panels */}
            {data.juryPanels && data.juryPanels.length > 0 && (
              <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-filevine-gray-400" />
                    <h2 className="text-xl font-semibold text-filevine-gray-900">Jury Panel</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowDocumentCapture(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Document
                    </Button>
                    <Button
                      onClick={() => setShowBatchImport(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>
                </div>

                {data.juryPanels.map((panel) => (
                  <div key={panel.id} className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-filevine-gray-600 mb-4">
                      <span>Panel Date: {new Date(panel.panelDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{panel.jurors.length} jurors</span>
                      <span>•</span>
                      <span className={`capitalize rounded-full px-2 py-1 text-xs font-semibold ${
                        panel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {panel.status}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {panel.jurors.map((juror) => (
                        <Link key={juror.id} href={`/jurors/${juror.id}`}>
                          <div className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-4 hover:bg-filevine-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-filevine-gray-900">
                                    #{juror.jurorNumber}
                                  </span>
                                  <span className="text-sm text-filevine-gray-700">
                                    {juror.firstName} {juror.lastName}
                                  </span>
                                </div>
                                {juror.occupation && (
                                  <p className="mt-1 text-xs text-filevine-gray-600">{juror.occupation}</p>
                                )}
                                {juror.age && (
                                  <p className="mt-1 text-xs text-filevine-gray-500">Age: {juror.age}</p>
                                )}
                                {juror.classifiedArchetype && (
                                  <div className="mt-2">
                                    <span className="rounded-full bg-filevine-blue px-2 py-0.5 text-xs font-semibold text-white capitalize">
                                      {juror.classifiedArchetype.replace('_', ' ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <QuestionGenerator caseId={caseId} />
          </div>
        )}

        {activeTab === 'focus-group' && (
          <div>
            <FocusGroupSimulator caseId={caseId} arguments={data.arguments || []} />
          </div>
        )}
      </div>

      {/* Batch Import Modal */}
      {data.juryPanels && data.juryPanels.length > 0 && (
        <BatchImportModal
          panelId={data.juryPanels[0].id}
          isOpen={showBatchImport}
          onClose={() => setShowBatchImport(false)}
          onSuccess={() => {
            // Refresh case data
            window.location.reload();
          }}
        />
      )}

      {/* Document Capture Modal */}
      {data.juryPanels && data.juryPanels.length > 0 && (
        <DocumentCaptureModal
          caseId={caseId}
          panelId={data.juryPanels[0].id}
          isOpen={showDocumentCapture}
          onClose={() => setShowDocumentCapture(false)}
          onSuccess={() => {
            // Refresh case data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
