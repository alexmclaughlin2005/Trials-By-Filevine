'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Users, Loader2, ChevronDown, ChevronUp, LayoutGrid, List, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { JurorResearchPanel } from '@/components/juror-research-panel';
import { DeepResearch } from '@/components/deep-research';
import { ArchetypeClassifier } from '@/components/archetype-classifier';
import { ResearchSummarizer } from '@/components/research-summarizer';
import { JuryBoxView } from './jury-box-view';
import { JuryBoxConfig } from './jury-box-config';
import { JurorEditSidebar } from './juror-edit-sidebar';

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
  imageUrl?: string | null;
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

interface GenerateAllImagesButtonProps {
  panelId: string;
  imageStyle: 'realistic' | 'avatar';
  onStyleChange: (style: 'realistic' | 'avatar') => void;
}

function GenerateAllImagesButton({ panelId, imageStyle, onStyleChange }: GenerateAllImagesButtonProps) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAllMutation = useMutation({
    mutationFn: async (style: 'realistic' | 'avatar') => {
      return await apiClient.post(`/jurors/panel/${panelId}/generate-all-images`, {
        imageStyle: style,
        regenerate: false, // Only generate for jurors without images
      });
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh juror data
      queryClient.invalidateQueries({ queryKey: ['case'] });
      queryClient.invalidateQueries({ queryKey: ['panel', panelId] });
      queryClient.invalidateQueries({ queryKey: ['panel', panelId, 'jury-box'] });
      
      setIsGenerating(false);
      
      // Show success message
      if (data.processed > 0) {
        alert(`Successfully generated ${data.processed} image${data.processed !== 1 ? 's' : ''}.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`);
      } else {
        alert('No images were generated. All jurors may already have images, or they may be missing required fields (first name, last name).');
      }
    },
    onError: (error: any) => {
      setIsGenerating(false);
      alert(`Failed to generate images: ${error.message || 'Unknown error'}`);
    },
  });

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    generateAllMutation.mutate(imageStyle);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={imageStyle}
        onChange={(e) => onStyleChange(e.target.value as 'realistic' | 'avatar')}
        className="w-32"
        disabled={isGenerating}
      >
        <option value="realistic">Realistic</option>
        <option value="avatar">Avatar</option>
      </Select>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate All Images
          </>
        )}
      </Button>
    </div>
  );
}

export function JurorsTab({ caseId }: JurorsTabProps) {
  const queryClient = useQueryClient();
  const [showJurorDialog, setShowJurorDialog] = useState(false);
  const [expandedJurors, setExpandedJurors] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'jury-box'>('jury-box');
  const [selectedJurorId, setSelectedJurorId] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<'realistic' | 'avatar'>('realistic');

  // Fetch jury panels with full juror data including research
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['case', caseId, 'panels'],
    queryFn: async () => {
      const response = await apiClient.get<{ panels: JuryPanel[] }>(`/cases/${caseId}/panels`);
      return response.panels;
    },
  });

  // Auto-create panel if none exists
  const createPanelMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post(`/cases/${caseId}/panels`, {
        panelDate: new Date().toISOString(),
        source: 'manual',
        version: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId, 'panels'] });
      refetch();
    },
  });

  // Get the first (and typically only) panel
  const panel = data?.[0];

  // Auto-create panel if none exists
  useEffect(() => {
    if (!isLoading && !error && !panel && !createPanelMutation.isPending && data && data.length === 0) {
      createPanelMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, panel, data]);

  // Create juror mutation
  const [jurorForm, setJurorForm] = useState({
    jurorNumber: '',
    firstName: '',
    lastName: '',
    age: '',
    occupation: '',
    employer: '',
    city: '',
    zipCode: '',
    // Physical Description
    hairColor: '',
    height: '',
    weight: '',
    gender: '',
    skinTone: '',
    race: '',
    physicalDescription: '',
    shirtColor: '',
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
        employer: jurorForm.employer || undefined,
        city: jurorForm.city || undefined,
        zipCode: jurorForm.zipCode || undefined,
        // Physical Description
        hairColor: jurorForm.hairColor || undefined,
        height: jurorForm.height || undefined,
        weight: jurorForm.weight || undefined,
        gender: jurorForm.gender || undefined,
        skinTone: jurorForm.skinTone || undefined,
        race: jurorForm.race || undefined,
        physicalDescription: jurorForm.physicalDescription || undefined,
        shirtColor: jurorForm.shirtColor || undefined,
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
        employer: '',
        city: '',
        zipCode: '',
        hairColor: '',
        height: '',
        weight: '',
        gender: '',
        skinTone: '',
        race: '',
        physicalDescription: '',
        shirtColor: '',
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

  // Generate juror image mutation
  const generateImageMutation = useMutation({
    mutationFn: async (jurorId: string) => {
      return await apiClient.post(`/jurors/${jurorId}/generate-image`, {
        regenerate: false,
        imageStyle,
      });
    },
    onSuccess: async () => {
      // Invalidate queries to refresh juror data with new image
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case', caseId, 'panels'] }),
        queryClient.invalidateQueries({ queryKey: ['panel', panel?.id, 'jury-box'] }),
      ]);
      await refetch();
    },
  });

  if (isLoading || createPanelMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          {createPanelMutation.isPending ? 'Creating jury panel...' : 'Loading...'}
        </span>
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

  // If no panel exists after loading, show fallback (shouldn't happen due to auto-creation)
  if (!panel) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="mb-4">No jury panel found for this case.</p>
        <Button onClick={() => createPanelMutation.mutate()}>
          Create Jury Panel
        </Button>
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
        <div className="flex items-center gap-2">
          {/* Generate All Images Button */}
          {panel && (
            <GenerateAllImagesButton 
              panelId={panel.id}
              imageStyle={imageStyle}
              onStyleChange={setImageStyle}
            />
          )}
          <Button onClick={() => setShowJurorDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Juror
          </Button>
        </div>
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
            onJurorClick={(jurorId) => setSelectedJurorId(jurorId)}
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
                              {/* Juror Image - Clickable */}
                              {juror.imageUrl ? (
                                <div 
                                  className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0 cursor-pointer hover:border-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedJurorId(juror.id);
                                  }}
                                >
                                  <Image
                                    src={`/api/jurors/images/${juror.id}?t=${Date.now()}`}
                                    alt={`${juror.firstName} ${juror.lastName}`}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div 
                                  className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-300 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedJurorId(juror.id);
                                  }}
                                >
                                  <span className="text-xs font-semibold text-gray-500">
                                    {juror.firstName?.[0]}{juror.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 flex-1">
                                <div className="rounded-full bg-primary/10 px-3 py-1">
                                  <span className="text-sm font-semibold text-primary">
                                    #{juror.jurorNumber}
                                  </span>
                                </div>
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedJurorId(juror.id);
                                  }}
                                >
                                  <h4 className="font-semibold text-base hover:text-primary transition-colors">
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
                              {/* Juror Image Section */}
                              <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    Juror Photo
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`imageStyle-${juror.id}`} className="text-xs text-gray-700">
                                        Style:
                                      </Label>
                                      <Select
                                        id={`imageStyle-${juror.id}`}
                                        value={imageStyle}
                                        onChange={(e) => setImageStyle(e.target.value as 'realistic' | 'avatar')}
                                        className="w-28 h-8 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="realistic">Realistic</option>
                                        <option value="avatar">Avatar</option>
                                      </Select>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={juror.imageUrl ? "outline" : "default"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateImageMutation.mutate(juror.id);
                                      }}
                                      disabled={generateImageMutation.isPending}
                                    >
                                      <ImageIcon className={`h-4 w-4 ${juror.imageUrl ? 'mr-2' : 'mr-2'}`} />
                                      {generateImageMutation.isPending 
                                        ? 'Generating...' 
                                        : juror.imageUrl 
                                          ? 'Regenerate Image' 
                                          : 'Generate Image'}
                                    </Button>
                                  </div>
                                </div>
                                {juror.imageUrl ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div 
                                      className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 cursor-pointer hover:border-primary transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedJurorId(juror.id);
                                      }}
                                    >
                                      <Image
                                        src={`/api/jurors/images/${juror.id}?t=${Date.now()}`}
                                        alt={`${juror.firstName} ${juror.lastName}`}
                                        fill
                                        className="object-cover"
                                        sizes="128px"
                                        unoptimized
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      AI-generated based on physical description
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedJurorId(juror.id);
                                      }}
                                    >
                                      View Full Profile
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-medium mb-1">No image generated yet</p>
                                    <p className="text-xs text-gray-400">
                                      Fill in physical description fields above, then click "Generate Image" to create an AI portrait
                                    </p>
                                  </div>
                                )}
                              </div>

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
          <div className="w-full max-w-2xl rounded-lg bg-background shadow-lg max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">Add Juror</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-4">
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="occupation" className="mb-2 block text-sm font-medium">
                    Job Title
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    value={jurorForm.occupation}
                    onChange={(e) => setJurorForm({ ...jurorForm, occupation: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="e.g., VP of Product"
                  />
                </div>
                <div>
                  <label htmlFor="employer" className="mb-2 block text-sm font-medium">
                    Employer
                  </label>
                  <input
                    id="employer"
                    type="text"
                    value={jurorForm.employer}
                    onChange={(e) => setJurorForm({ ...jurorForm, employer: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="e.g., TechCorp Industries"
                  />
                </div>
              </div>

              {/* Physical Description Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-4">Physical Description</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="hairColor" className="mb-2 block text-sm font-medium">
                      Hair Color
                    </label>
                    <input
                      id="hairColor"
                      type="text"
                      value={jurorForm.hairColor}
                      onChange={(e) => setJurorForm({ ...jurorForm, hairColor: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., Brown, Black, Blonde"
                    />
                  </div>
                  <div>
                    <label htmlFor="height" className="mb-2 block text-sm font-medium">
                      Height
                    </label>
                    <input
                      id="height"
                      type="text"
                      value={jurorForm.height}
                      onChange={(e) => setJurorForm({ ...jurorForm, height: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., 5 feet 10 inches or 178cm"
                    />
                  </div>
                  <div>
                    <label htmlFor="weight" className="mb-2 block text-sm font-medium">
                      Weight
                    </label>
                    <input
                      id="weight"
                      type="text"
                      value={jurorForm.weight}
                      onChange={(e) => setJurorForm({ ...jurorForm, weight: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., 180 lbs or 82 kg"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="mb-2 block text-sm font-medium">
                      Gender
                    </label>
                    <input
                      id="gender"
                      type="text"
                      value={jurorForm.gender}
                      onChange={(e) => setJurorForm({ ...jurorForm, gender: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., Male, Female, Non-binary"
                    />
                  </div>
                  <div>
                    <label htmlFor="skinTone" className="mb-2 block text-sm font-medium">
                      Skin Tone
                    </label>
                    <input
                      id="skinTone"
                      type="text"
                      value={jurorForm.skinTone}
                      onChange={(e) => setJurorForm({ ...jurorForm, skinTone: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., Light, Medium, Dark"
                    />
                  </div>
                  <div>
                    <label htmlFor="race" className="mb-2 block text-sm font-medium">
                      Race
                    </label>
                    <input
                      id="race"
                      type="text"
                      value={jurorForm.race}
                      onChange={(e) => setJurorForm({ ...jurorForm, race: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., White, Black, Asian, Hispanic"
                    />
                  </div>
                  <div>
                    <label htmlFor="shirtColor" className="mb-2 block text-sm font-medium">
                      Shirt Color / Clothing
                    </label>
                    <input
                      id="shirtColor"
                      type="text"
                      value={jurorForm.shirtColor}
                      onChange={(e) => setJurorForm({ ...jurorForm, shirtColor: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="e.g., Blue, White, Red, Navy, Striped"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="physicalDescription" className="mb-2 block text-sm font-medium">
                    Other Identifying Details / Description
                  </label>
                  <textarea
                    id="physicalDescription"
                    value={jurorForm.physicalDescription}
                    onChange={(e) => setJurorForm({ ...jurorForm, physicalDescription: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
                    placeholder="Additional physical characteristics, distinguishing features, etc."
                  />
                </div>
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
              </div>
            </div>
            <div className="p-6 pt-4 border-t bg-background flex justify-end gap-2 sticky bottom-0">
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
                    employer: '',
                    city: '',
                    zipCode: '',
                    hairColor: '',
                    height: '',
                    weight: '',
                    gender: '',
                    skinTone: '',
                    race: '',
                    physicalDescription: '',
                    shirtColor: '',
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
      )}

      {/* Juror Edit Sidebar */}
      <JurorEditSidebar
        jurorId={selectedJurorId}
        isOpen={!!selectedJurorId}
        onClose={() => setSelectedJurorId(null)}
      />
    </div>
  );
}
