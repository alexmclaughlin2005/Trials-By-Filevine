'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface JuryBoxConfigProps {
  panelId: string;
  currentSize: number;
  currentRows: number;
  onConfigChange?: () => void;
}

export function JuryBoxConfig({
  panelId,
  currentSize,
  currentRows,
  onConfigChange,
}: JuryBoxConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [juryBoxSize, setJuryBoxSize] = useState(currentSize);
  const [juryBoxRows, setJuryBoxRows] = useState(currentRows);

  const queryClient = useQueryClient();

  const updateConfigMutation = useMutation({
    mutationFn: async (config: { juryBoxSize: number; juryBoxRows: number }) => {
      return await apiClient.put(`/jurors/panel/${panelId}/jury-box/config`, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', panelId, 'jury-box'] });
      queryClient.invalidateQueries({ queryKey: ['case', panelId, 'panels'] });
      setIsOpen(false);
      onConfigChange?.();
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate({
      juryBoxSize,
      juryBoxRows,
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Configure Jury Box
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Jury Box Configuration</h3>

      <div className="space-y-4">
        {/* Box Size */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Seats
          </label>
          <select
            value={juryBoxSize}
            onChange={(e) => setJuryBoxSize(parseInt(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            {[6, 8, 10, 12, 14, 16, 18, 20].map((size) => (
              <option key={size} value={size}>
                {size} seats
              </option>
            ))}
          </select>
        </div>

        {/* Row Layout */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Row Layout
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJuryBoxRows(1)}
              className={`
                flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors
                ${
                  juryBoxRows === 1
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                }
              `}
            >
              Single Row
            </button>
            <button
              type="button"
              onClick={() => setJuryBoxRows(2)}
              className={`
                flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors
                ${
                  juryBoxRows === 2
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                }
              `}
            >
              Double Row
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {juryBoxRows === 1
              ? 'All jurors in a single row'
              : 'Front row and back row layout'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setJuryBoxSize(currentSize);
              setJuryBoxRows(currentRows);
            }}
            disabled={updateConfigMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
