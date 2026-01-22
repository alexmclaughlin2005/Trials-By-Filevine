'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Juror {
  id: string;
  jurorNumber: string;
  firstName: string;
  lastName: string;
  age: number | null;
  occupation: string | null;
  city: string | null;
  zipCode: string | null;
  status: string;
}

interface JuryPanel {
  id: string;
  panelDate: string;
  source: string;
  version: number;
  totalJurors: number;
  jurors: Juror[];
}

interface JurorsTabProps {
  caseId: string;
}

export function JurorsTab({ caseId }: JurorsTabProps) {
  const queryClient = useQueryClient();
  const [showPanelDialog, setShowPanelDialog] = useState(false);
  const [showJurorDialog, setShowJurorDialog] = useState(false);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  // Fetch jury panels
  const { data, isLoading, error } = useQuery({
    queryKey: ['case', caseId, 'panels'],
    queryFn: async () => {
      const response = await apiClient.get<{ panels: JuryPanel[] }>(`/cases/${caseId}/panels`);
      return response.panels;
    },
  });

  // Create panel mutation
  const [panelDate, setPanelDate] = useState('');
  const createPanelMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post(`/cases/${caseId}/panels`, {
        panelDate: panelDate || new Date().toISOString(),
        source: 'manual',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId, 'panels'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setShowPanelDialog(false);
      setPanelDate('');
    },
  });

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
        panelId: selectedPanelId,
        jurorNumber: jurorForm.jurorNumber,
        firstName: jurorForm.firstName,
        lastName: jurorForm.lastName,
        age: jurorForm.age ? parseInt(jurorForm.age) : undefined,
        occupation: jurorForm.occupation || undefined,
        city: jurorForm.city || undefined,
        zipCode: jurorForm.zipCode || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId, 'panels'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setShowJurorDialog(false);
      setSelectedPanelId(null);
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

  const togglePanel = (panelId: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedPanels(newExpanded);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jury Panels</h2>
          <p className="text-sm text-muted-foreground">
            Manage jury panels and jurors for this case
          </p>
        </div>
        <Button onClick={() => setShowPanelDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Panel
        </Button>
      </div>

      {/* Panels List */}
      {!data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="mb-4">No jury panels yet. Create your first panel to get started.</p>
          <Button onClick={() => setShowPanelDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Panel
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((panel) => (
            <div key={panel.id} className="rounded-lg border bg-card">
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-accent/50"
                onClick={() => togglePanel(panel.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Panel {format(new Date(panel.panelDate), 'MMM dd, yyyy')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{panel.jurors?.length || 0} jurors</span>
                      <span>•</span>
                      <span className="capitalize">{panel.source}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPanelId(panel.id);
                      setShowJurorDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Juror
                  </Button>
                </div>
              </div>

              {/* Jurors List */}
              {expandedPanels.has(panel.id) && (
                <div className="border-t p-6">
                  {!panel.jurors || panel.jurors.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No jurors in this panel yet. Click &quot;Add Juror&quot; to add one.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Juror #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Age
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Occupation
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Location
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                          {panel.jurors.map((juror) => (
                            <tr key={juror.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-sm font-medium">
                                {juror.jurorNumber}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {juror.firstName} {juror.lastName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {juror.age || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {juror.occupation || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {juror.city ? `${juror.city}${juror.zipCode ? `, ${juror.zipCode}` : ''}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="capitalize">{juror.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Panel Dialog */}
      {showPanelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Jury Panel</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="panelDate" className="mb-2 block text-sm font-medium">
                  Panel Date
                </label>
                <input
                  id="panelDate"
                  type="date"
                  value={panelDate}
                  onChange={(e) => setPanelDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to use today&apos;s date
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPanelDialog(false);
                    setPanelDate('');
                  }}
                  disabled={createPanelMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createPanelMutation.mutate()}
                  disabled={createPanelMutation.isPending}
                >
                  {createPanelMutation.isPending ? 'Creating...' : 'Create Panel'}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
                    setSelectedPanelId(null);
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
