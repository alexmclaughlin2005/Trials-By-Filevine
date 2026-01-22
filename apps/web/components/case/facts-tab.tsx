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
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

interface CaseFact {
  id: string;
  content: string;
  factType: string;
  source?: string;
  sortOrder: number;
}

interface FactsTabProps {
  caseId: string;
  facts: CaseFact[];
}

export function FactsTab({ caseId, facts: initialFacts }: FactsTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<CaseFact | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    factType: 'background',
    source: '',
  });

  // Create fact mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post(`/cases/${caseId}/facts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update fact mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiClient.put(`/cases/${caseId}/facts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      setEditingFact(null);
      resetForm();
    },
  });

  // Delete fact mutation
  const deleteMutation = useMutation({
    mutationFn: async (factId: string) => {
      return await apiClient.delete(`/cases/${caseId}/facts/${factId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  const resetForm = () => {
    setFormData({
      content: '',
      factType: 'background',
      source: '',
    });
  };

  const handleOpenDialog = (fact?: CaseFact) => {
    if (fact) {
      setEditingFact(fact);
      setFormData({
        content: fact.content,
        factType: fact.factType,
        source: fact.source || '',
      });
    } else {
      setEditingFact(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFact) {
      updateMutation.mutate({ id: editingFact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (factId: string) => {
    if (window.confirm('Are you sure you want to delete this fact?')) {
      deleteMutation.mutate(factId);
    }
  };

  const sortedFacts = [...initialFacts].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-filevine-gray-900">Case Facts</h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Document key facts, evidence, and background information for this case
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fact
        </Button>
      </div>

      {sortedFacts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-filevine-gray-300 p-12 text-center">
          <p className="text-filevine-gray-500">No facts added yet</p>
          <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Fact
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFacts.map((fact) => (
            <div
              key={fact.id}
              className="group relative rounded-lg border border-filevine-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="cursor-move text-filevine-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            fact.factType === 'disputed'
                              ? 'bg-red-100 text-red-700'
                              : fact.factType === 'undisputed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-filevine-gray-100 text-filevine-gray-700'
                          }`}
                        >
                          {fact.factType}
                        </span>
                        {fact.source && (
                          <span className="text-xs text-filevine-gray-500">
                            Source: {fact.source}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-filevine-gray-900 leading-relaxed">
                        {fact.content}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(fact)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fact.id)}
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
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFact ? 'Edit Fact' : 'Add New Fact'}</DialogTitle>
            <DialogDescription>
              {editingFact
                ? 'Update the details of this case fact'
                : 'Add a new fact to your case'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Fact Type
              </label>
              <Select
                value={formData.factType}
                onChange={(e) =>
                  setFormData({ ...formData, factType: e.target.value })
                }
              >
                <option value="background">Background</option>
                <option value="disputed">Disputed</option>
                <option value="undisputed">Undisputed</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Content *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Describe the fact..."
                rows={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Source (Optional)
              </label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="e.g., Police Report, Witness Statement"
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
                  : editingFact
                  ? 'Update Fact'
                  : 'Add Fact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
