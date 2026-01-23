'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { JurorResearchPanel } from '@/components/juror-research-panel';
import { DeepResearch } from '@/components/deep-research';
import { ArchetypeClassifier } from '@/components/archetype-classifier';
import { ResearchSummarizer } from '@/components/research-summarizer';
import { JuryBoxView } from './jury-box-view';
import { JuryBoxConfig } from './jury-box-config';

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
  boxRow?: number | null;
  boxSeat?: number | null;
  boxOrder?: number | null;
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

interface JuryPanel {
  id: string;
  panelDate: string;
  source: string;
  version: number;
  totalJurors: number;
  juryBoxSize?: number;
  juryBoxRows?: number;
  jurors: Juror[];
  case: {
    id: string;
    name: string;
    caseNumber: string;
    caseType: string | null;
    jurisdiction: string | null;
    ourSide: string | null;
  };
}

interface JurorsTabProps {
  caseId: string;
}

export function JurorsTab({ caseId }: JurorsTabProps) {
  const queryClient = useQueryClient();
  const [showJurorDialog, setShowJurorDialog] = useState(false);
  const [expandedJurors, setExpandedJurors] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'jury-box'>('list');

  // Fetch jury panels with full juror data including research
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['case', caseId, 'panels'],
    queryFn: async () => {
      const response = await apiClient.get<{ panels: JuryPanel[] }>(`/cases/${caseId}/panels`);
      return response.panels;
    },
  });

  // Get the first (and typically only) panel
  const panel = data?.[0];

  // Create juror mutation
  const [jurorForm, setJurorForm] = useState({
    jurorNumber: '',
    firstName: '',
    lastName: '',
    age: '',
    occupation: '',
    city: '',
    zipCode: '',
  });

  const createJurorMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/jurors', {
        panelId: panel?.id,
        jurorNumber: jurorForm.jurorNumber,
        firstName: jurorForm.firstName,
        lastName: jurorForm.lastName,
        age: jurorForm.age ? parseInt(jurorForm.age) : undefined,
        occupation: jurorForm.occupation || undefined,
        city: jurorForm.city || undefined,
        zipCode: jurorForm.zipCode || undefined,
      });
    },
    onSuccess: async () => {
      // Invalidate and refetch all related queries to refresh the UI immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case', caseId, 'panels'] }),
        queryClient.invalidateQueries({ queryKey: ['case', caseId] }),
      ]);
      
      // Invalidate jury-box query if panel exists
      if (panel?.id) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['panel', panel.id, 'jury-box'] }),
          queryClient.invalidateQueries({ queryKey: ['panel', panel.id] }),
        ]);
      }
      
      // Explicitly refetch the panels query to ensure immediate update
      await refetch();
      
      setShowJurorDialog(false);
      setJurorForm({
        jurorNumber: '',
        firstName: '',
        lastName: '',
        age: '',
        occupation: '',
        city: '',
        zipCode: '',
      });
    },
  });

  const toggleJuror = (jurorId: string) => {
    const newExpanded = new Set(expandedJurors);
    if (newExpanded.has(jurorId)) {
      newExpanded.delete(jurorId);
    } else {
      newExpanded.add(jurorId);
    }
    setExpandedJurors(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
        Failed to load jury panels. Please try again.
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="mb-4">No jury panel found for this case.</p>
      </div>
    );
  }

  const jurors = panel.jurors || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jurors</h2>
          <p className="text-sm text-muted-foreground">
            Manage jurors and conduct research for this case
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors
                ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('jury-box')}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors
                ${
                  viewMode === 'jury-box'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <LayoutGrid className="h-4 w-4" />
              Jury Box
            </button>
          </div>
          <Button onClick={() => setShowJurorDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Juror
          </Button>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'jury-box' ? (
        <div className="space-y-6">
          {/* Jury Box Configuration */}
          <JuryBoxConfig
            panelId={panel.id}
            currentSize={panel.juryBoxSize ?? 12}
            currentRows={panel.juryBoxRows ?? 1}
          />

          {/* Jury Box View (includes pool inside DndContext) */}
          <JuryBoxView
            panelId={panel.id}
            onJurorClick={(jurorId) => {
              const newExpanded = new Set(expandedJurors);
              if (newExpanded.has(jurorId)) {
                newExpanded.delete(jurorId);
              } else {
                newExpanded.add(jurorId);
              }
              setExpandedJurors(newExpanded);
            }}
          />
        </div>
      ) : (
        <>
          {/* Jurors List */}
          {jurors.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="mb-4">No jurors yet. Add your first juror to get started.</p>
              <Button onClick={() => setShowJurorDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Juror
              </Button>
            </div>
          ) : (
        <div className="space-y-3">
          {jurors.map((juror) => (
            <div key={juror.id} className="border rounded-lg bg-background">
                          {/* Juror Summary Header */}
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleJuror(juror.id)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 px-3 py-1">
                                  <span className="text-sm font-semibold text-primary">
                                    #{juror.jurorNumber}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-base">
                                    {juror.firstName} {juror.lastName}
                                  </h4>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    {juror.age && <span>Age {juror.age}</span>}
                                    {juror.occupation && (
                                      <>
                                        <span>•</span>
                                        <span>{juror.occupation}</span>
                                      </>
                                    )}
                                    {juror.city && (
                                      <>
                                        <span>•</span>
                                        <span>{juror.city}{juror.zipCode ? `, ${juror.zipCode}` : ''}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                                juror.status === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : juror.status === 'selected'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}>
                                {juror.status}
                              </span>
                            </div>
                            <div className="ml-4">
                              {expandedJurors.has(juror.id) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Research Section */}
                          {expandedJurors.has(juror.id) && (
                            <div className="border-t p-6 space-y-6 bg-muted/20">
                              {/* Juror Basic Info */}
                              <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                  Juror Information
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Age:</span>{' '}
                                    <span className="font-medium">{juror.age || 'Not provided'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Occupation:</span>{' '}
                                    <span className="font-medium">{juror.occupation || 'Not provided'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Employer:</span>{' '}
                                    <span className="font-medium">{juror.employer || 'Not provided'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Research Summarizer */}
                              {juror.researchArtifacts && juror.researchArtifacts.length > 0 && (
                                <div className="rounded-lg border border-gray-200 bg-white p-4">
                                  <ResearchSummarizer
                                    jurorId={juror.id}
                                    artifacts={juror.researchArtifacts}
                                  />
                                </div>
                              )}

                              {/* Identity Research Panel */}
                              <JurorResearchPanel
                                jurorId={juror.id}
                                jurorName={`${juror.firstName} ${juror.lastName}`}
                                jurorInfo={{
                                  firstName: juror.firstName,
                                  lastName: juror.lastName,
                                  age: juror.age || undefined,
                                  city: juror.city || undefined,
                                  zipCode: juror.zipCode || undefined,
                                  occupation: juror.occupation || undefined,
                                }}
                                initialCandidates={juror.candidates || []}
                                onCandidateConfirmed={refetch}
                              />

                              {/* Deep Research */}
                              <DeepResearch
                                candidateId={juror.candidates?.find((c) => c.isConfirmed)?.id}
                                candidateName={juror.candidates?.find((c) => c.isConfirmed)?.fullName}
                                caseType={panel.case?.caseType || 'general civil'}
                                caseIssues={[]}
                                clientPosition={(panel.case?.ourSide as 'plaintiff' | 'defense') || 'plaintiff'}
                              />

                              {/* Archetype Classifier */}
                              <div className="rounded-lg border border-gray-200 bg-white p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                  Archetype Classification
                                </h3>
                                <ArchetypeClassifier
                                  jurorId={juror.id}
                                  caseType={panel.case?.caseType || undefined}
                                  jurisdiction={panel.case?.jurisdiction || undefined}
                                  ourSide={panel.case?.ourSide as 'plaintiff' | 'defense' | undefined}
                                />
                              </div>
                            </div>
                          )}
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {/* Create Juror Dialog */}
      {showJurorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Juror</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="jurorNumber" className="mb-2 block text-sm font-medium">
                    Juror Number *
                  </label>
                  <input
                    id="jurorNumber"
                    type="text"
                    required
                    value={jurorForm.jurorNumber}
                    onChange={(e) => setJurorForm({ ...jurorForm, jurorNumber: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="e.g., J001"
                  />
                </div>
                <div>
                  <label htmlFor="age" className="mb-2 block text-sm font-medium">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={jurorForm.age}
                    onChange={(e) => setJurorForm({ ...jurorForm, age: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={jurorForm.firstName}
                    onChange={(e) => setJurorForm({ ...jurorForm, firstName: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={jurorForm.lastName}
                    onChange={(e) => setJurorForm({ ...jurorForm, lastName: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="occupation" className="mb-2 block text-sm font-medium">
                  Occupation
                </label>
                <input
                  id="occupation"
                  type="text"
                  value={jurorForm.occupation}
                  onChange={(e) => setJurorForm({ ...jurorForm, occupation: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-2 block text-sm font-medium">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={jurorForm.city}
                    onChange={(e) => setJurorForm({ ...jurorForm, city: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="mb-2 block text-sm font-medium">
                    Zip Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={jurorForm.zipCode}
                    onChange={(e) => setJurorForm({ ...jurorForm, zipCode: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowJurorDialog(false);
                    setJurorForm({
                      jurorNumber: '',
                      firstName: '',
                      lastName: '',
                      age: '',
                      occupation: '',
                      city: '',
                      zipCode: '',
                    });
                  }}
                  disabled={createJurorMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createJurorMutation.mutate()}
                  disabled={
                    createJurorMutation.isPending ||
                    !jurorForm.jurorNumber ||
                    !jurorForm.firstName ||
                    !jurorForm.lastName
                  }
                >
                  {createJurorMutation.isPending ? 'Adding...' : 'Add Juror'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
