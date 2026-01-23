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
import { Plus, Edit2, Trash2, History, FileText, Paperclip, X, FileSearch, Loader2 } from 'lucide-react';
import {
  attachDocumentToArgument,
  getArgumentDocuments,
  detachDocumentFromArgument,
  type ArgumentDocument,
} from '@/lib/arguments-client';
import { getImportedDocuments, type ImportedDocument } from '@/lib/filevine-client';

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
  const [showDocuments, setShowDocuments] = useState<string | null>(null);
  const [showAttachDialog, setShowAttachDialog] = useState<string | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<ImportedDocument[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<Record<string, ArgumentDocument[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});
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

  // Load attached documents for an argument
  const loadAttachedDocuments = async (argumentId: string) => {
    setLoadingDocs((prev) => ({ ...prev, [argumentId]: true }));
    try {
      const result = await getArgumentDocuments(caseId, argumentId);
      setAttachedDocuments((prev) => ({ ...prev, [argumentId]: result.attachments }));
    } catch (error) {
      console.error('Failed to load attached documents:', error);
    } finally {
      setLoadingDocs((prev) => ({ ...prev, [argumentId]: false }));
    }
  };

  // Toggle document section visibility
  const toggleDocuments = async (argumentId: string) => {
    if (showDocuments === argumentId) {
      setShowDocuments(null);
    } else {
      setShowDocuments(argumentId);
      if (!attachedDocuments[argumentId]) {
        await loadAttachedDocuments(argumentId);
      }
    }
  };

  // Load available documents for attachment
  const loadAvailableDocuments = async () => {
    try {
      const result = await getImportedDocuments(caseId);
      setAvailableDocuments(result.documents.filter((doc) => doc.status === 'completed'));
    } catch (error) {
      console.error('Failed to load available documents:', error);
    }
  };

  // Open attach dialog
  const openAttachDialog = async (argumentId: string) => {
    setShowAttachDialog(argumentId);
    if (availableDocuments.length === 0) {
      await loadAvailableDocuments();
    }
  };

  // Attach a document
  const handleAttachDocument = async (argumentId: string, documentId: string) => {
    try {
      await attachDocumentToArgument(caseId, argumentId, documentId);
      await loadAttachedDocuments(argumentId);
      setShowAttachDialog(null);
    } catch (error) {
      console.error('Failed to attach document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to attach document';
      alert(errorMessage);
    }
  };

  // Detach a document
  const handleDetachDocument = async (argumentId: string, attachmentId: string) => {
    if (!confirm('Remove this document from the argument?')) return;

    try {
      await detachDocumentFromArgument(caseId, argumentId, attachmentId);
      await loadAttachedDocuments(argumentId);
    } catch (error) {
      console.error('Failed to detach document:', error);
      alert('Failed to remove document');
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
                            <button
                              onClick={() => toggleDocuments(argument.id)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              Documents
                              {attachedDocuments[argument.id] && ` (${attachedDocuments[argument.id].length})`}
                            </button>
                          </div>

                          {/* Attached Documents Section */}
                          {showDocuments === argument.id && (
                            <div className="mt-4 border-t border-filevine-gray-200 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-filevine-gray-900">Supporting Documents</h5>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAttachDialog(argument.id)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Attach
                                </Button>
                              </div>

                              {loadingDocs[argument.id] ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-filevine-gray-400" />
                                </div>
                              ) : attachedDocuments[argument.id]?.length > 0 ? (
                                <div className="space-y-2">
                                  {attachedDocuments[argument.id].map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center justify-between p-3 bg-filevine-gray-50 rounded-md"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-4 w-4 text-filevine-gray-500 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium text-filevine-gray-900 truncate">
                                            {attachment.document.filename}
                                          </p>
                                          {attachment.document.folderName && (
                                            <p className="text-xs text-filevine-gray-500 truncate">
                                              {attachment.document.folderName}
                                            </p>
                                          )}
                                          {attachment.document.textExtractionStatus === 'completed' && (
                                            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                              <FileSearch className="h-3 w-3" />
                                              Text extracted for AI
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {attachment.document.localFileUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(attachment.document.localFileUrl, '_blank')}
                                          >
                                            <FileText className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDetachDocument(argument.id, attachment.id)}
                                        >
                                          <X className="h-3.5 w-3.5 text-red-600" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-filevine-gray-500 italic py-3">
                                  No documents attached yet
                                </p>
                              )}
                            </div>
                          )}
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

      {/* Attach Document Dialog */}
      <Dialog open={showAttachDialog !== null} onOpenChange={() => setShowAttachDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Attach Supporting Document</DialogTitle>
            <DialogDescription>
              Select a document from your imported Filevine documents to attach to this argument.
              Text will be automatically extracted for AI analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            {availableDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-filevine-gray-400 mb-3" />
                <p className="text-filevine-gray-600">No documents available to attach</p>
                <p className="text-sm text-filevine-gray-500 mt-2">
                  Import documents from Filevine first in the Documents tab
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableDocuments.map((doc) => {
                  const alreadyAttached = showAttachDialog
                    ? attachedDocuments[showAttachDialog]?.some((att) => att.document.id === doc.id)
                    : false;

                  return (
                    <button
                      key={doc.id}
                      onClick={() => showAttachDialog && handleAttachDocument(showAttachDialog, doc.id)}
                      disabled={alreadyAttached}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        alreadyAttached
                          ? 'border-filevine-gray-200 bg-filevine-gray-50 cursor-not-allowed opacity-60'
                          : 'border-filevine-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-filevine-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-filevine-gray-900 truncate">
                            {doc.filename}
                          </p>
                          {doc.folderName && (
                            <p className="text-sm text-filevine-gray-600 truncate mt-0.5">
                              {doc.folderName}
                            </p>
                          )}
                          <p className="text-xs text-filevine-gray-500 mt-1">
                            Imported {new Date(doc.importedAt).toLocaleDateString()}
                          </p>
                          {alreadyAttached && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              Already attached
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAttachDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
