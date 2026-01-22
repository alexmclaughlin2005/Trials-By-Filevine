'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ResearchSummarizer } from '@/components/research-summarizer';
import { ArchetypeClassifier } from '@/components/archetype-classifier';
import { JurorResearchPanel } from '@/components/juror-research-panel';
import { DeepResearch } from '@/components/deep-research';

interface ScoreFactors {
  nameScore: number;
  nameReason: string;
  ageScore: number;
  ageReason: string;
  locationScore: number;
  locationReason: string;
  occupationScore: number;
  occupationReason: string;
  corroborationScore: number;
  corroborationReason: string;
  totalScore: number;
}

interface Juror {
  id: string;
  jurorNumber: string;
  firstName: string;
  lastName: string;
  age: number | null;
  occupation: string | null;
  employer: string | null;
  city: string | null;
  zipCode: string | null;
  status: string;
  questionnaireData: Record<string, unknown> | null;
  notes: string | null;
  panel: {
    id: string;
    case: {
      id: string;
      name: string;
      caseNumber: string;
      caseType: string | null;
      jurisdiction: string | null;
      ourSide: string | null;
    };
  };
  researchArtifacts?: Array<{
    id: string;
    sourceType: string;
    sourceName: string | null;
    sourceUrl: string | null;
    rawContent: string | null;
  }>;
  candidates?: Array<{
    id: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    occupation?: string;
    employer?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    confidenceScore: number;
    sourceType: string;
    isConfirmed: boolean;
    isRejected: boolean;
    scoreFactors: ScoreFactors;
  }>;
}

interface JurorResponse {
  juror: Juror;
}

export default function JurorDetailPage() {
  const params = useParams();
  const jurorId = params.id as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['juror', jurorId],
    queryFn: async () => {
      const response = await apiClient.get<JurorResponse>(`/jurors/${jurorId}`);
      return response.juror;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-filevine-gray-600">Loading juror details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to load juror'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-filevine-gray-900">
              Juror #{data.jurorNumber}
            </h1>
            <p className="mt-1 text-filevine-gray-600">
              {data.firstName} {data.lastName}
            </p>
            <p className="mt-1 text-sm text-filevine-gray-500">
              Case: {data.panel.case.name} ({data.panel.case.caseNumber})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                data.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : data.status === 'selected'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {data.status}
            </span>
          </div>
        </div>

        {/* Juror Information */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-filevine-gray-900">
            Juror Information
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-filevine-gray-700">Age</p>
              <p className="mt-1 text-filevine-gray-900">{data.age || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-filevine-gray-700">Occupation</p>
              <p className="mt-1 text-filevine-gray-900">{data.occupation || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-filevine-gray-700">Employer</p>
              <p className="mt-1 text-filevine-gray-900">{data.employer || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-filevine-gray-700">Location</p>
              <p className="mt-1 text-filevine-gray-900">
                {data.city && data.zipCode ? `${data.city}, ${data.zipCode}` : 'Not provided'}
              </p>
            </div>
          </div>

          {data.questionnaireData && Object.keys(data.questionnaireData).length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-filevine-gray-700">Questionnaire Data</p>
              <div className="mt-2 space-y-2">
                {Object.entries(data.questionnaireData).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="text-sm text-filevine-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="ml-2 text-sm font-medium text-filevine-gray-900">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.notes && (
            <div className="mt-6">
              <p className="text-sm font-medium text-filevine-gray-700">Notes</p>
              <p className="mt-2 text-sm text-filevine-gray-900">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Research Artifacts */}
        {data.researchArtifacts && data.researchArtifacts.length > 0 && (
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-filevine-gray-900">
              Research Artifacts
            </h2>
            <div className="mt-4 space-y-4">
              {data.researchArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-filevine-blue px-2 py-1 text-xs font-semibold text-white">
                      {artifact.sourceType}
                    </span>
                    <span className="text-sm text-filevine-gray-600">{artifact.sourceName || 'Unknown'}</span>
                  </div>
                  <p className="mt-2 text-sm text-filevine-gray-900">{artifact.rawContent || 'No content'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Summarizer */}
        {data.researchArtifacts && data.researchArtifacts.length > 0 && (
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <ResearchSummarizer
              jurorId={jurorId}
              artifacts={data.researchArtifacts}
            />
          </div>
        )}

        {/* Juror Research Panel */}
        <JurorResearchPanel
          jurorId={jurorId}
          jurorName={`${data.firstName} ${data.lastName}`}
          jurorInfo={{
            firstName: data.firstName,
            lastName: data.lastName,
            age: data.age || undefined,
            city: data.city || undefined,
            zipCode: data.zipCode || undefined,
            occupation: data.occupation || undefined,
          }}
          initialCandidates={data.candidates || []}
          onCandidateConfirmed={refetch}
        />

        {/* Deep Research - Only show if candidate is confirmed */}
        {data.candidates && data.candidates.some((c) => c.isConfirmed) && (
          <DeepResearch
            candidateId={data.candidates.find((c) => c.isConfirmed)!.id}
            candidateName={data.candidates.find((c) => c.isConfirmed)!.fullName}
            caseType={data.panel.case.caseType || 'general civil'}
            caseIssues={[]}
            clientPosition={(data.panel.case.ourSide as 'plaintiff' | 'defense') || 'plaintiff'}
          />
        )}

        {/* Archetype Classifier */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-filevine-gray-900">
            Archetype Classification
          </h2>
          <ArchetypeClassifier
            jurorId={jurorId}
            caseType={data.panel.case.caseType || undefined}
            jurisdiction={data.panel.case.jurisdiction || undefined}
            ourSide={data.panel.case.ourSide as 'plaintiff' | 'defense' | undefined}
          />
        </div>

        {/* Persona Suggester - Temporarily disabled, using ArchetypeClassifier instead */}
        {/* <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <PersonaSuggester
            jurorId={jurorId}
            caseId={data.panel.case.id}
            onPersonaSelected={handlePersonaSelected}
          />
        </div> */}
      </div>
    </div>
  );
}
