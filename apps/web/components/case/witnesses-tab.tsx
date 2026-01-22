'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Plus, Edit2, Trash2, UserCircle, GripVertical } from 'lucide-react';

interface CaseWitness {
  id: string;
  name: string;
  role: string; // fact | expert | character
  affiliation: string; // plaintiff | defendant | neutral
  summary?: string;
  directOutline?: string;
  crossOutline?: string;
  sortOrder: number;
}

interface WitnessesTabProps {
  caseId: string;
  witnesses: CaseWitness[];
}

export function WitnessesTab({ caseId, witnesses: initialWitnesses }: WitnessesTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWitness, setEditingWitness] = useState<CaseWitness | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'fact',
    affiliation: 'plaintiff',
    summary: '',
    directOutline: '',
    crossOutline: '',
  });

  // Create witness mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post(`/cases/${caseId}/witnesses`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update witness mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiClient.put(`/cases/${caseId}/witnesses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      setEditingWitness(null);
      resetForm();
    },
  });

  // Delete witness mutation
  const deleteMutation = useMutation({
    mutationFn: async (witnessId: string) => {
      return await apiClient.delete(`/cases/${caseId}/witnesses/${witnessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'fact',
      affiliation: 'plaintiff',
      summary: '',
      directOutline: '',
      crossOutline: '',
    });
  };

  const handleOpenDialog = (witness?: CaseWitness) => {
    if (witness) {
      setEditingWitness(witness);
      setFormData({
        name: witness.name,
        role: witness.role,
        affiliation: witness.affiliation,
        summary: witness.summary || '',
        directOutline: witness.directOutline || '',
        crossOutline: witness.crossOutline || '',
      });
    } else {
      setEditingWitness(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWitness) {
      updateMutation.mutate({ id: editingWitness.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (witnessId: string) => {
    if (window.confirm('Are you sure you want to delete this witness?')) {
      deleteMutation.mutate(witnessId);
    }
  };

  const sortedWitnesses = [...initialWitnesses].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const groupedByAffiliation = sortedWitnesses.reduce((acc, witness) => {
    if (!acc[witness.affiliation]) {
      acc[witness.affiliation] = [];
    }
    acc[witness.affiliation].push(witness);
    return acc;
  }, {} as Record<string, CaseWitness[]>);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'expert':
        return 'bg-purple-100 text-purple-700';
      case 'fact':
        return 'bg-blue-100 text-blue-700';
      case 'character':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-filevine-gray-100 text-filevine-gray-700';
    }
  };

  const getAffiliationColor = (affiliation: string) => {
    switch (affiliation) {
      case 'plaintiff':
        return 'border-blue-500';
      case 'defendant':
        return 'border-red-500';
      case 'neutral':
        return 'border-filevine-gray-400';
      default:
        return 'border-filevine-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-filevine-gray-900">Witnesses</h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Manage witness list with examination outlines and strategies
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>

      {sortedWitnesses.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-filevine-gray-300 p-12 text-center">
          <UserCircle className="h-12 w-12 mx-auto text-filevine-gray-400" />
          <p className="text-filevine-gray-500 mt-4">No witnesses added yet</p>
          <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Witness
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByAffiliation).map(([affiliation, witnesses]) => (
            <div key={affiliation}>
              <h3 className="text-lg font-semibold text-filevine-gray-900 mb-3 capitalize">
                {affiliation} Witnesses ({witnesses.length})
              </h3>
              <div className="space-y-3">
                {witnesses.map((witness) => (
                  <div
                    key={witness.id}
                    className={`group relative rounded-lg border-l-4 ${getAffiliationColor(
                      witness.affiliation
                    )} border border-filevine-gray-200 bg-white p-5 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="cursor-move text-filevine-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-filevine-gray-900">
                                {witness.name}
                              </h4>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getRoleBadgeColor(
                                  witness.role
                                )}`}
                              >
                                {witness.role}
                              </span>
                            </div>
                            {witness.summary && (
                              <p className="text-sm text-filevine-gray-700 mb-3">
                                {witness.summary}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {witness.directOutline && (
                                <div>
                                  <p className="text-xs font-semibold text-filevine-gray-600 mb-1">
                                    Direct Examination:
                                  </p>
                                  <p className="text-xs text-filevine-gray-600 line-clamp-3">
                                    {witness.directOutline}
                                  </p>
                                </div>
                              )}
                              {witness.crossOutline && (
                                <div>
                                  <p className="text-xs font-semibold text-filevine-gray-600 mb-1">
                                    Cross Examination:
                                  </p>
                                  <p className="text-xs text-filevine-gray-600 line-clamp-3">
                                    {witness.crossOutline}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(witness)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(witness.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWitness ? 'Edit Witness' : 'Add New Witness'}
            </DialogTitle>
            <DialogDescription>
              {editingWitness
                ? 'Update witness information and examination outlines'
                : 'Add a new witness to your case'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dr. Sarah Johnson"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                  Role
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="fact">Fact Witness</option>
                  <option value="expert">Expert Witness</option>
                  <option value="character">Character Witness</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                  Affiliation
                </label>
                <Select
                  value={formData.affiliation}
                  onChange={(e) =>
                    setFormData({ ...formData, affiliation: e.target.value })
                  }
                >
                  <option value="plaintiff">Plaintiff</option>
                  <option value="defendant">Defendant</option>
                  <option value="neutral">Neutral</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Summary
              </label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief description of witness background and relevance..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Direct Examination Outline
              </label>
              <Textarea
                value={formData.directOutline}
                onChange={(e) =>
                  setFormData({ ...formData, directOutline: e.target.value })
                }
                placeholder="Key points and questions for direct examination..."
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Cross Examination Outline
              </label>
              <Textarea
                value={formData.crossOutline}
                onChange={(e) =>
                  setFormData({ ...formData, crossOutline: e.target.value })
                }
                placeholder="Key points and questions for cross examination..."
                rows={6}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingWitness
                  ? 'Update Witness'
                  : 'Add Witness'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
