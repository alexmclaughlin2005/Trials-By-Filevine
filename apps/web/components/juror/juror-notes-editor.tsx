'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface JurorNotesEditorProps {
  jurorId: string;
  initialNotes?: string | null;
}

export function JurorNotesEditor({ jurorId, initialNotes }: JurorNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when initialNotes changes
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const updateMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      await apiClient.patch(`/jurors/${jurorId}`, { notes: newNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juror', jurorId] });
    },
  });

  const handleChange = (value: string) => {
    setNotes(value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (value !== (initialNotes || '')) {
        try {
          await updateMutation.mutateAsync(value);
        } catch (error) {
          console.error('Failed to save notes:', error);
        }
      }
      setIsSaving(false);
    }, 1000); // 1 second delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        {isSaving && (
          <div className="flex items-center gap-1 text-xs text-filevine-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>
      <Textarea
        id="juror-notes"
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add general notes about this juror..."
        rows={4}
        className="resize-none"
      />
      <p className="text-xs text-filevine-gray-500">
        Notes are saved automatically. Separate from voir dire responses.
      </p>
    </div>
  );
}
