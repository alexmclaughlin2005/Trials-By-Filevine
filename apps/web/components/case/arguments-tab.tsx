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
import { Plus, Edit2, Trash2, History, FileText } from 'lucide-react';

interface CaseArgument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
  version: number;
  isCurrent: boolean;
  parentId?: string;
  changeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ArgumentsTabProps {
  caseId: string;
  arguments: CaseArgument[];
}

export function ArgumentsTab({ caseId, arguments: initialArguments }: ArgumentsTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArgument, setEditingArgument] = useState<CaseArgument | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    argumentType: 'opening',
    changeNotes: '',
  });

  // Create argument mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post(`/cases/${caseId}/arguments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update argument mutation (creates new version)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiClient.put(`/cases/${caseId}/arguments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsDialogOpen(false);
      setEditingArgument(null);
      resetForm();
    },
  });

  // Delete argument mutation
  const deleteMutation = useMutation({
    mutationFn: async (argumentId: string) => {
      return await apiClient.delete(`/cases/${caseId}/arguments/${argumentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      argumentType: 'opening',
      changeNotes: '',
    });
  };

  const handleOpenDialog = (argument?: CaseArgument) => {
    if (argument) {
      setEditingArgument(argument);
      setFormData({
        title: argument.title,
        content: argument.content,
        argumentType: argument.argumentType,
        changeNotes: '',
      });
    } else {
      setEditingArgument(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArgument) {
      updateMutation.mutate({ id: editingArgument.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (argumentId: string) => {
    if (window.confirm('Are you sure you want to delete this argument?')) {
      deleteMutation.mutate(argumentId);
    }
  };

  const currentArguments = initialArguments.filter((arg) => arg.isCurrent);
  const groupedByType = currentArguments.reduce((acc, arg) => {
    if (!acc[arg.argumentType]) {
      acc[arg.argumentType] = [];
    }
    acc[arg.argumentType].push(arg);
    return acc;
  }, {} as Record<string, CaseArgument[]>);

  const argumentTypes = [
    { value: 'opening', label: 'Opening Statement', color: 'bg-blue-100 text-blue-700' },
    { value: 'closing', label: 'Closing Argument', color: 'bg-purple-100 text-purple-700' },
    { value: 'theme', label: 'Case Theme', color: 'bg-green-100 text-green-700' },
    { value: 'rebuttal', label: 'Rebuttal', color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-filevine-gray-900">Arguments</h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Develop and refine your legal arguments with version control
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Argument
        </Button>
      </div>

      {currentArguments.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-filevine-gray-300 p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-filevine-gray-400" />
          <p className="text-filevine-gray-500 mt-4">No arguments created yet</p>
          <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Argument
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {argumentTypes.map((type) => {
            const args = groupedByType[type.value] || [];
            if (args.length === 0) return null;

            return (
              <div key={type.value}>
                <h3 className="text-lg font-semibold text-filevine-gray-900 mb-3">
                  {type.label}
                </h3>
                <div className="space-y-3">
                  {args.map((argument) => (
                    <div
                      key={argument.id}
                      className="rounded-lg border border-filevine-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-filevine-gray-900">
                              {argument.title}
                            </h4>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${type.color}`}
                            >
                              {type.label}
                            </span>
                            {argument.version > 1 && (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-filevine-gray-100 text-filevine-gray-700">
                                v{argument.version}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-filevine-gray-700 leading-relaxed whitespace-pre-wrap">
                            {argument.content}
                          </p>
                          {argument.changeNotes && (
                            <div className="mt-3 rounded-md bg-amber-50 p-3 border border-amber-200">
                              <p className="text-xs font-medium text-amber-800">Latest Changes:</p>
                              <p className="text-xs text-amber-700 mt-1">
                                {argument.changeNotes}
                              </p>
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-xs text-filevine-gray-500">
                            <span>
                              Updated {new Date(argument.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(argument)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {argument.version > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowVersionHistory(
                                  showVersionHistory === argument.id ? null : argument.id
                                )
                              }
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(argument.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArgument ? 'Edit Argument' : 'Create New Argument'}
            </DialogTitle>
            <DialogDescription>
              {editingArgument
                ? 'Editing will create a new version of this argument'
                : 'Create a new argument for your case'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Argument Type
              </label>
              <Select
                value={formData.argumentType}
                onChange={(e) =>
                  setFormData({ ...formData, argumentType: e.target.value })
                }
              >
                {argumentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Negligence Was Clear and Undeniable"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                Content *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your argument..."
                rows={12}
                required
              />
              <p className="text-xs text-filevine-gray-500 mt-1">
                Tip: Use clear, persuasive language that resonates with your case theme
              </p>
            </div>

            {editingArgument && (
              <div>
                <label className="block text-sm font-medium text-filevine-gray-700 mb-2">
                  Change Notes
                </label>
                <Textarea
                  value={formData.changeNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, changeNotes: e.target.value })
                  }
                  placeholder="Describe what changed in this version..."
                  rows={3}
                />
                <p className="text-xs text-filevine-gray-500 mt-1">
                  This will create version {editingArgument.version + 1}
                </p>
              </div>
            )}

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
                  : editingArgument
                  ? `Save as v${editingArgument.version + 1}`
                  : 'Create Argument'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
