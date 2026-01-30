'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { ResearchSummarizer } from '@/components/research-summarizer';
import { ArchetypeClassifier } from '@/components/archetype-classifier';
import { JurorResearchPanel } from '@/components/juror-research-panel';
import { DeepResearch } from '@/components/deep-research';
import { PersonaMatchDashboard } from '@/components/persona-match-dashboard';
import { SignalInventory } from '@/components/signal-inventory';
import { DiscriminativeQuestions } from '@/components/discriminative-questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

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
  imageUrl: string | null;
  // Physical Description
  hairColor: string | null;
  height: string | null;
  weight: string | null;
  gender: string | null;
  skinTone: string | null;
  race: string | null;
  physicalDescription: string | null;
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

interface JurorResponse {
  juror: Juror;
}

export default function JurorDetailPage() {
  const params = useParams();
  const jurorId = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Juror>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['juror', jurorId],
    queryFn: async () => {
      const response = await apiClient.get<JurorResponse>(`/jurors/${jurorId}`);
      return response.juror;
    },
  });

  // Initialize form data when data loads or editing starts
  const initializeFormData = () => {
    if (data) {
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        age: data.age || null,
        occupation: data.occupation || '',
        employer: data.employer || '',
        city: data.city || '',
        zipCode: data.zipCode || '',
        notes: data.notes || '',
        hairColor: data.hairColor || '',
        height: data.height || '',
        weight: data.weight || '',
        gender: data.gender || '',
        skinTone: data.skinTone || '',
        race: data.race || '',
        physicalDescription: data.physicalDescription || '',
      });
    }
  };

  const updateJurorMutation = useMutation({
    mutationFn: async (updates: Partial<Juror>) => {
      return await apiClient.patch(`/jurors/${jurorId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juror', jurorId] });
      setIsEditing(false);
      refetch();
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (regenerate: boolean) => {
      return await apiClient.post(`/jurors/${jurorId}/generate-image`, {
        regenerate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juror', jurorId] });
      refetch();
    },
  });

  const handleEdit = () => {
    initializeFormData();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = () => {
    updateJurorMutation.mutate(formData);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

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
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateJurorMutation.isPending}
                  size="sm"
                >
                  {updateJurorMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Juror Photo Section */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold text-filevine-gray-900">Juror Photo</h2>
            <Button
              onClick={() => generateImageMutation.mutate(!!data.imageUrl)}
              disabled={generateImageMutation.isPending}
              variant="outline"
              size="sm"
            >
              {generateImageMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {data.imageUrl ? 'Regenerate Image' : 'Generate Image'}
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-6">
            {data.imageUrl ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-filevine-gray-200">
                <Image
                  src={`/api/jurors/images/${data.id}?t=${Date.now()}`}
                  alt={`${data.firstName} ${data.lastName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-filevine-gray-200 bg-filevine-gray-100 text-2xl font-semibold text-filevine-gray-600">
                {getInitials(data.firstName, data.lastName)}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-filevine-gray-600">
                {data.imageUrl
                  ? 'Click "Regenerate Image" to create a new image based on updated physical description fields.'
                  : 'Generate an AI headshot based on the juror\'s physical description fields. Fill in age, gender, hair color, height, weight, skin tone, race, and other identifying details, then click "Generate Image".'}
              </p>
            </div>
          </div>
        </div>

        {/* Juror Information */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-filevine-gray-900">
            Juror Information
          </h2>
          {!isEditing ? (
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">First Name</p>
                <p className="mt-1 text-filevine-gray-900">{data.firstName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Last Name</p>
                <p className="mt-1 text-filevine-gray-900">{data.lastName || 'Not provided'}</p>
              </div>
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
                <p className="text-sm font-medium text-filevine-gray-700">City</p>
                <p className="mt-1 text-filevine-gray-900">{data.city || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Zip Code</p>
                <p className="mt-1 text-filevine-gray-900">{data.zipCode || 'Not provided'}</p>
              </div>
              {data.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-filevine-gray-700">Notes</p>
                  <p className="mt-1 text-filevine-gray-900">{data.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Job Title</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation || ''}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="employer">Employer</Label>
                  <Input
                    id="employer"
                    value={formData.employer || ''}
                    onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

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
        </div>

        {/* Physical Description */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-filevine-gray-900">Physical Description</h2>
          {!isEditing ? (
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Hair Color</p>
                <p className="mt-1 text-filevine-gray-900">{data.hairColor || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Height</p>
                <p className="mt-1 text-filevine-gray-900">{data.height || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Weight</p>
                <p className="mt-1 text-filevine-gray-900">{data.weight || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Gender</p>
                <p className="mt-1 text-filevine-gray-900">{data.gender || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Skin Tone</p>
                <p className="mt-1 text-filevine-gray-900">{data.skinTone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-filevine-gray-700">Race</p>
                <p className="mt-1 text-filevine-gray-900">{data.race || 'Not provided'}</p>
              </div>
              {data.physicalDescription && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-filevine-gray-700">
                    Other Identifying Details
                  </p>
                  <p className="mt-1 text-filevine-gray-900">{data.physicalDescription}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hairColor">Hair Color</Label>
                  <Input
                    id="hairColor"
                    value={formData.hairColor || ''}
                    onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Brown, Blonde, Black"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 5 feet 10 inches or 178cm"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 180 lbs or 82 kg"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Male, Female, Non-binary"
                  />
                </div>
                <div>
                  <Label htmlFor="skinTone">Skin Tone</Label>
                  <Input
                    id="skinTone"
                    value={formData.skinTone || ''}
                    onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Light, Medium, Dark"
                  />
                </div>
                <div>
                  <Label htmlFor="race">Race</Label>
                  <Input
                    id="race"
                    value={formData.race || ''}
                    onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., White, Black, Hispanic, Asian"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="physicalDescription">Other Identifying Details or Description</Label>
                <Textarea
                  id="physicalDescription"
                  value={formData.physicalDescription || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, physicalDescription: e.target.value })
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="Any additional physical characteristics or identifying features"
                />
              </div>
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

        {/* Signal Inventory */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
          <SignalInventory jurorId={jurorId} />
        </div>

        {/* Persona Matching Dashboard */}
        {user?.organization?.id && (
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <PersonaMatchDashboard
              jurorId={jurorId}
              organizationId={user.organization.id}
              caseId={data.panel.case.id}
            />
          </div>
        )}

        {/* Discriminative Questions */}
        {user?.organization?.id && (
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
            <DiscriminativeQuestions
              jurorId={jurorId}
              organizationId={user.organization.id}
              caseId={data.panel.case.id}
            />
          </div>
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
