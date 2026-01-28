'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Plus, FileText } from 'lucide-react';
import { getImportedDocuments, type ImportedDocument } from '@/lib/filevine-client';
import { attachDocumentToArgument } from '@/lib/arguments-client';

interface CreateArgumentDialogProps {
  caseId: string;
  onSuccess?: () => void;
}

interface CreateArgumentResponse {
  argument: {
    id: string;
    title: string;
    content: string;
    argumentType: string;
    caseId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function CreateArgumentDialog({ caseId, onSuccess }: CreateArgumentDialogProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    argumentType: 'opening',
  });
  const [availableDocuments, setAvailableDocuments] = useState<ImportedDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const argumentTypes = [
    { value: 'opening', label: 'Opening Statement' },
    { value: 'closing', label: 'Closing Argument' },
    { value: 'theme', label: 'Case Theme' },
    { value: 'rebuttal', label: 'Rebuttal' },
  ];

  const loadAvailableDocuments = useCallback(async () => {
    try {
      const result = await getImportedDocuments(caseId);
      setAvailableDocuments(result.documents.filter((doc) => doc.status === 'completed'));
    } catch (error) {
      console.error('Failed to load available documents:', error);
    }
  }, [caseId]);

  // Load available documents when dialog opens
  useEffect(() => {
    if (isOpen && availableDocuments.length === 0) {
      loadAvailableDocuments();
    }
  }, [isOpen, availableDocuments.length, loadAvailableDocuments]);

  const createMutation = useMutation<CreateArgumentResponse, Error, typeof formData>({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post(`/cases/${caseId}/arguments`, data);
    },
    onSuccess: async (response) => {
      // Attach selected documents
      if (selectedDocumentIds.length > 0) {
        for (const docId of selectedDocumentIds) {
          try {
            await attachDocumentToArgument(caseId, response.argument.id, docId);
          } catch (error) {
            console.error('Failed to attach document:', error);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setIsOpen(false);
      resetForm();
      onSuccess?.();
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      argumentType: 'opening',
    });
    setSelectedDocumentIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Create New Argument
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Argument</DialogTitle>
            <DialogDescription>
              Add a new argument to your case that can be tested with the focus group.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Argument Type
                </label>
                <Select
                  value={formData.argumentType}
                  onChange={(e) =>
                    setFormData({ ...formData, argumentType: e.target.value })
                  }
                  className="w-full"
                >
                  {argumentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your argument..."
                  rows={10}
                  required
                />
              </div>

              {/* Supporting Documents Section */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supporting Documents (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select documents that support this argument. Text will be automatically extracted for AI analysis.
                </p>

                {availableDocuments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No documents available</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Import documents from Filevine in the Documents tab
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                    {availableDocuments.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-start gap-3 p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocumentIds([...selectedDocumentIds, doc.id]);
                            } else {
                              setSelectedDocumentIds(
                                selectedDocumentIds.filter((id) => id !== doc.id)
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {doc.filename}
                            </span>
                          </div>
                          {doc.folderName && (
                            <p className="text-xs text-gray-500 mt-0.5 ml-6 truncate">
                              {doc.folderName}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedDocumentIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.title || !formData.content}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Argument'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
