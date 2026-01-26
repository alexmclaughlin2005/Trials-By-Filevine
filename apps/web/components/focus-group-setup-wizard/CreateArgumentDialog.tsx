'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tantml:react-query';
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
import { Plus } from 'lucide-react';

interface CreateArgumentDialogProps {
  caseId: string;
  onSuccess?: () => void;
}

export function CreateArgumentDialog({ caseId, onSuccess }: CreateArgumentDialogProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    argumentType: 'opening',
  });

  const argumentTypes = [
    { value: 'opening', label: 'Opening Statement' },
    { value: 'closing', label: 'Closing Argument' },
    { value: 'theme', label: 'Case Theme' },
    { value: 'rebuttal', label: 'Rebuttal' },
  ];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post(`/cases/${caseId}/arguments`, data);
    },
    onSuccess: () => {
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
