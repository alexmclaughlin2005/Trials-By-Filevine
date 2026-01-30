'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ResearchSummarizer } from '@/components/research-summarizer';
import { ArchetypeClassifier } from '@/components/archetype-classifier';
import { JurorResearchPanel } from '@/components/juror-research-panel';
import { DeepResearch } from '@/components/deep-research';
import { SignalInventory } from '@/components/signal-inventory';
import { PersonaMatchDashboard } from '@/components/persona-match-dashboard';
import { DiscriminativeQuestions } from '@/components/discriminative-questions';
import { VoirDireResponseEntry } from '@/components/voir-dire/voir-dire-response-entry';
import { VoirDireManager } from '@/components/voir-dire/voir-dire-manager';
import { JurorNotesEditor } from '@/components/juror/juror-notes-editor';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Loader2, Edit2, Save, X, Image as ImageIcon, Search } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CollapsibleSection } from '@/components/ui/collapsible-section';

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
  shirtColor: string | null;
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

interface JurorEditSidebarProps {
  jurorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JurorEditSidebar({ jurorId, isOpen, onClose }: JurorEditSidebarProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Juror>>({});
  const [imageStyle, setImageStyle] = useState<'realistic' | 'avatar'>('realistic');
  const [isVoirDireEntryOpen, setIsVoirDireEntryOpen] = useState(false);
  const [suggestedQuestionId, setSuggestedQuestionId] = useState<string | undefined>();
  const [suggestedQuestionText, setSuggestedQuestionText] = useState<string | undefined>();
  const [caseQuestionId, setCaseQuestionId] = useState<string | undefined>();
  const [caseQuestionText, setCaseQuestionText] = useState<string | undefined>();
  const [isSearchingIdentity, setIsSearchingIdentity] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['juror', jurorId],
    queryFn: async () => {
      if (!jurorId) return null;
      const response = await apiClient.get<JurorResponse>(`/jurors/${jurorId}`);
      return response.juror;
    },
    enabled: !!jurorId && isOpen,
  });

  // Initialize form data when data loads or editing starts
  useEffect(() => {
    if (data && isEditing) {
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
        shirtColor: data.shirtColor || '',
      });
    }
  }, [data, isEditing]);

  // Reset editing state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFormData({});
    }
  }, [isOpen]);

  const updateJurorMutation = useMutation({
    mutationFn: async (updates: Partial<Juror>) => {
      if (!jurorId) throw new Error('No juror ID');
      return await apiClient.patch(`/jurors/${jurorId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juror', jurorId] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
      queryClient.invalidateQueries({ queryKey: ['panel'] });
      setIsEditing(false);
      refetch();
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (regenerate: boolean) => {
      if (!jurorId) throw new Error('No juror ID');
      return await apiClient.post(`/jurors/${jurorId}/generate-image`, {
        regenerate,
        imageStyle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juror', jurorId] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
      queryClient.invalidateQueries({ queryKey: ['panel'] });
      refetch();
    },
  });

  const handleEdit = () => {
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
        shirtColor: data.shirtColor || '',
      });
      setIsEditing(true);
    }
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

  if (!isOpen || !jurorId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-[800px] lg:w-[900px] bg-white shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-filevine-gray-200 px-6 py-4 bg-white flex-shrink-0">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-filevine-gray-400" />
                <span className="text-filevine-gray-600">Loading juror...</span>
              </div>
            ) : data ? (
              <>
                <h2 className="text-xl font-semibold text-filevine-gray-900">
                  Juror #{data.jurorNumber}
                </h2>
                <p className="text-sm text-filevine-gray-600 mt-1">
                  {data.firstName} {data.lastName}
                </p>
              </>
            ) : error ? (
              <div className="text-red-600">
                {error instanceof Error ? error.message : 'Failed to load juror'}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {data && !isEditing && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {data && isEditing && (
              <>
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
              </>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-[10px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-filevine-blue" />
                <p className="mt-4 text-filevine-gray-600">Loading juror details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {error instanceof Error ? error.message : 'Failed to load juror'}
              </p>
            </div>
          ) : data ? (
            <div className="space-y-3 max-w-4xl">
              {/* Juror Photo Section */}
              <CollapsibleSection
                title="Juror Photo"
                defaultOpen={true}
                headerActions={
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Label htmlFor="imageStyle" className="text-sm text-filevine-gray-700">
                      Style:
                    </Label>
                    <Select
                      id="imageStyle"
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value as 'realistic' | 'avatar')}
                      className="w-32"
                    >
                      <option value="realistic">Realistic</option>
                      <option value="avatar">Avatar</option>
                    </Select>
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
                      {data.imageUrl ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                }
              >
                <div className="flex items-center gap-4">
                  {data.imageUrl ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-filevine-gray-200 flex-shrink-0">
                      <Image
                        src={data.imageUrl.startsWith('https://') ? data.imageUrl : `/api/jurors/images/${data.id}?v=${encodeURIComponent(data.imageUrl.split('/').pop() || '')}`}
                        alt={`${data.firstName} ${data.lastName}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-filevine-gray-200 bg-filevine-gray-100 text-xl font-semibold text-filevine-gray-600 flex-shrink-0">
                      {getInitials(data.firstName, data.lastName)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-filevine-gray-600">
                      {data.imageUrl
                        ? 'Click "Regenerate" to create a new image based on updated physical description fields.'
                        : 'Generate an AI headshot based on the juror\'s physical description fields. Fill in age, gender, hair color, height, weight, skin tone, race, and other identifying details, then click "Generate".'}
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Juror Information */}
              <CollapsibleSection title="Juror Information" defaultOpen={true}>
                {!isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">First Name</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.firstName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Last Name</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.lastName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Age</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.age || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Occupation</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.occupation || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Employer</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.employer || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">City</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Zip Code</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.zipCode || 'Not provided'}</p>
                    </div>
                    {data.notes && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-filevine-gray-700">Notes</p>
                        <p className="mt-0.5 text-sm text-filevine-gray-900">{data.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
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
              </CollapsibleSection>

              {/* Physical Description */}
              <CollapsibleSection title="Physical Description" defaultOpen={false}>
                {!isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Hair Color</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.hairColor || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Height</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.height || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Weight</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.weight || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Gender</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Skin Tone</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.skinTone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Race</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.race || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-filevine-gray-700">Shirt Color / Clothing</p>
                      <p className="mt-0.5 text-sm text-filevine-gray-900">{data.shirtColor || 'Not provided'}</p>
                    </div>
                    {data.physicalDescription && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-filevine-gray-700">
                          Other Identifying Details
                        </p>
                        <p className="mt-0.5 text-sm text-filevine-gray-900">{data.physicalDescription}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
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
                      <div>
                        <Label htmlFor="shirtColor">Shirt Color / Clothing</Label>
                        <Input
                          id="shirtColor"
                          value={formData.shirtColor || ''}
                          onChange={(e) => setFormData({ ...formData, shirtColor: e.target.value })}
                          className="mt-1"
                          placeholder="e.g., Blue, White, Red, Navy, Striped"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="physicalDescription">
                        Other Identifying Details or Description
                      </Label>
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
              </CollapsibleSection>

              {/* Research Artifacts */}
              {data.researchArtifacts && data.researchArtifacts.length > 0 && (
                <CollapsibleSection title="Research Artifacts" defaultOpen={false}>
                  <div className="space-y-4">
                    {data.researchArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="rounded-md border border-filevine-gray-200 bg-filevine-gray-50 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-filevine-blue px-2 py-1 text-xs font-semibold text-white">
                            {artifact.sourceType}
                          </span>
                          <span className="text-sm text-filevine-gray-600">
                            {artifact.sourceName || 'Unknown'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-filevine-gray-900">
                          {artifact.rawContent || 'No content'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Research Summarizer */}
              {data.researchArtifacts && data.researchArtifacts.length > 0 && (
                <CollapsibleSection title="Research Summary" defaultOpen={false}>
                  <ResearchSummarizer jurorId={jurorId} artifacts={data.researchArtifacts} />
                </CollapsibleSection>
              )}

              {/* Juror Research Panel */}
              <CollapsibleSection
                title="Identity Research"
                defaultOpen={false}
                headerActions={
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsSearchingIdentity(true);
                      try {
                        await apiClient.post(`/jurors/${jurorId}/search`, {});
                        refetch();
                      } catch (error) {
                        console.error('Search error:', error);
                      } finally {
                        setIsSearchingIdentity(false);
                      }
                    }}
                    disabled={isSearchingIdentity}
                    variant="default"
                    size="sm"
                  >
                    {isSearchingIdentity ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Public Records
                      </>
                    )}
                  </Button>
                }
              >
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
                  hideHeader={true}
                />
              </CollapsibleSection>

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
              <CollapsibleSection title="Archetype Classification" defaultOpen={false}>
                <ArchetypeClassifier
                  jurorId={jurorId}
                  caseType={data.panel.case.caseType || undefined}
                  jurisdiction={data.panel.case.jurisdiction || undefined}
                  ourSide={data.panel.case.ourSide as 'plaintiff' | 'defense' | undefined}
                />
              </CollapsibleSection>

              {/* Signal Inventory */}
              <CollapsibleSection title="Signal Inventory" defaultOpen={false}>
                <SignalInventory jurorId={jurorId} />
              </CollapsibleSection>

              {/* Persona Matching Dashboard */}
              {user?.organization?.id && (
                <CollapsibleSection title="Persona Matching" defaultOpen={false}>
                  <PersonaMatchDashboard
                    jurorId={jurorId}
                    organizationId={user.organization.id}
                    caseId={data.panel.case.id}
                  />
                </CollapsibleSection>
              )}

              {/* Discriminative Questions */}
              {user?.organization?.id && (
                <CollapsibleSection title="Discriminative Questions" defaultOpen={false}>
                  <DiscriminativeQuestions
                    jurorId={jurorId}
                    organizationId={user.organization.id}
                    caseId={data.panel.case.id}
                    onAskQuestion={(questionId, questionText) => {
                      setSuggestedQuestionId(questionId);
                      setSuggestedQuestionText(questionText);
                      setIsVoirDireEntryOpen(true);
                    }}
                  />
                </CollapsibleSection>
              )}

              {/* General Notes */}
              <CollapsibleSection title="General Notes" defaultOpen={false}>
                <JurorNotesEditor jurorId={jurorId} initialNotes={data.notes} />
              </CollapsibleSection>

              {/* Voir Dire - Combined Questions & Responses */}
              {user?.organization?.id && (
                <CollapsibleSection title="Voir Dire" defaultOpen={false}>
                  <VoirDireManager
                    caseId={data.panel.case.id}
                    jurorId={jurorId}
                    onAddResponse={(questionId, questionText) => {
                      if (questionId && questionText) {
                        // Answering a case-level question
                        setCaseQuestionId(questionId);
                        setCaseQuestionText(questionText);
                        setSuggestedQuestionId(undefined);
                        setSuggestedQuestionText(undefined);
                      } else {
                        // Adding a custom response
                        setCaseQuestionId(undefined);
                        setCaseQuestionText(undefined);
                        setSuggestedQuestionId(undefined);
                        setSuggestedQuestionText(undefined);
                      }
                      setIsVoirDireEntryOpen(true);
                    }}
                  />
                </CollapsibleSection>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Voir Dire Entry Modal */}
      <VoirDireResponseEntry
        jurorId={jurorId}
        isOpen={isVoirDireEntryOpen}
        onClose={() => {
          setIsVoirDireEntryOpen(false);
          setSuggestedQuestionId(undefined);
          setSuggestedQuestionText(undefined);
          setCaseQuestionId(undefined);
          setCaseQuestionText(undefined);
        }}
        onSuccess={() => {
          refetch();
        }}
        suggestedQuestionId={suggestedQuestionId}
        suggestedQuestionText={suggestedQuestionText}
        caseQuestionId={caseQuestionId}
        caseQuestionText={caseQuestionText}
      />
    </>
  );
}
