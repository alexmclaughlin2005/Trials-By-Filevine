'use client';

import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { JurorCard } from './juror-card';
import { JurorPool } from './juror-pool';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface JuryBoxViewProps {
  panelId: string;
  onJurorClick?: (jurorId: string) => void;
}

interface SeatProps {
  row: number;
  seat: number;
  juror?: {
    id: string;
    jurorNumber?: string | null;
    firstName: string;
    lastName: string;
    age?: number | null;
    occupation?: string | null;
    status: string;
    classifiedArchetype?: string | null;
    boxRow?: number | null;
    boxSeat?: number | null;
    imageUrl?: string | null;
  } | null;
  nextJuror?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  isDragging?: boolean;
  onJurorClick?: (jurorId: string) => void;
  className?: string;
}

function Seat({ row, seat, juror, nextJuror, isDragging, onJurorClick, className }: SeatProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${row}-${seat}`,
    data: {
      type: 'seat',
      row,
      seat,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[120px] rounded-lg border-2 border-dashed p-2
        transition-all
        ${isOver ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'}
        ${juror ? 'border-solid border-gray-400 bg-white' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${className || ''}
      `}
    >
      {juror ? (
        <JurorCard
          juror={juror}
          onClick={() => onJurorClick?.(juror.id)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-2">
          <div className="text-xs font-medium text-gray-500 mb-1">
            Row {row}, Seat {seat}
          </div>
          {nextJuror && (
            <div className="text-xs text-blue-600 font-medium">
              Next: {nextJuror.firstName} {nextJuror.lastName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type JuryBoxData = {
  panel: { id: string; juryBoxSize: number; juryBoxRows: number; juryBoxLayout?: Record<string, unknown> };
  jurorsInBox: Array<{
    id: string;
    jurorNumber?: string | null;
    firstName: string;
    lastName: string;
    age?: number | null;
    occupation?: string | null;
    status: string;
    classifiedArchetype?: string | null;
    boxRow?: number | null;
    boxSeat?: number | null;
    imageUrl?: string | null;
  }>;
  jurorsInPool: Array<{
    id: string;
    jurorNumber?: string | null;
    firstName: string;
    lastName: string;
    age?: number | null;
    occupation?: string | null;
    status: string;
    classifiedArchetype?: string | null;
    boxRow?: number | null;
    boxSeat?: number | null;
    imageUrl?: string | null;
  }>;
};

export function JuryBoxView({ panelId, onJurorClick }: JuryBoxViewProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use provided callback or default to no-op
  const handleJurorClick = (jurorId: string) => {
    onJurorClick?.(jurorId);
  };

  // Fetch jury box state
  const { data, isLoading } = useQuery<JuryBoxData>({
    queryKey: ['panel', panelId, 'jury-box'],
    queryFn: async () => {
      const response = await apiClient.get<JuryBoxData>(`/jurors/panel/${panelId}/jury-box`);
      return response;
    },
  });

  const { jurorsInBox = [], jurorsInPool = [], panel } = data || {
    jurorsInBox: [],
    jurorsInPool: [],
    panel: { id: panelId, juryBoxSize: 12, juryBoxRows: 1 },
  };

  const juryBoxSize = panel?.juryBoxSize ?? 12;
  const juryBoxRows = panel?.juryBoxRows ?? 1;

  const updatePositionMutation = useMutation({
    mutationFn: async ({
      jurorId,
      boxRow,
      boxSeat,
      boxOrder,
    }: {
      jurorId: string;
      boxRow?: number | null;
      boxSeat?: number | null;
      boxOrder?: number | null;
    }) => {
      return await apiClient.put(`/jurors/${jurorId}/position`, {
        boxRow,
        boxSeat,
        boxOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', panelId, 'jury-box'] });
      queryClient.invalidateQueries({ queryKey: ['case', panelId, 'panels'] });
    },
  });

  const autoFillMutation = useMutation({
    mutationFn: async () => {
      try {
        return await apiClient.put(`/jurors/panel/${panelId}/jury-box/auto-fill`, {});
      } catch (error: unknown) {
        const err = error as { response?: unknown; data?: unknown; message?: string };
        console.error('[Auto-fill] Request error:', error);
        console.error('[Auto-fill] Error response:', err?.response || err?.data || error);
        console.error('[Auto-fill] Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', panelId, 'jury-box'] });
      queryClient.invalidateQueries({ queryKey: ['case', panelId, 'panels'] });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; status?: number; data?: unknown; response?: { data?: unknown } };
      console.error('[Auto-fill] Frontend error:', error);
      console.error('[Auto-fill] Error message:', err?.message);
      console.error('[Auto-fill] Error status:', err?.status);
      console.error('[Auto-fill] Error data:', err?.data || err?.response?.data);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'juror' && overData?.type === 'seat') {
      const juror = activeData.juror;
      const { row, seat } = overData;

      // Calculate box order
      // For 2 rows with even split: when even, both rows get exactly half
      let boxOrder: number;
      if (juryBoxRows === 2) {
        const row1Seats = Math.floor(juryBoxSize / 2);
        if (row === 1) {
          boxOrder = seat; // Row 1: seats 1 to row1Seats
        } else {
          boxOrder = row1Seats + seat; // Row 2: continues from row 1
        }
      } else {
        // Single row: sequential order
        const seatsPerRow = Math.ceil(juryBoxSize / juryBoxRows);
        boxOrder = (row - 1) * seatsPerRow + seat;
      }

      updatePositionMutation.mutate({
        jurorId: juror.id,
        boxRow: row,
        boxSeat: seat,
        boxOrder,
      });
    } else if (activeData?.type === 'juror' && overData?.type === 'pool') {
      // Remove from box
      const juror = activeData.juror;
      updatePositionMutation.mutate({
        jurorId: juror.id,
        boxRow: null,
        boxSeat: null,
        boxOrder: null,
      });
    }
  };

  // Create seat grid
  // For 2 rows, split evenly: when even, both get half; when odd, split as evenly as possible
  type JurorType = typeof jurorsInBox[0];
  const seatGrid = useMemo(() => {
    const getSeatsPerRow = (row: number): number => {
      if (juryBoxRows === 2) {
        // Even split: when total is even, both rows get exactly half
        // When odd, first row gets floor(half), second row gets ceil(half)
        const half = juryBoxSize / 2;
        if (row === 1) {
          return Math.floor(half);
        } else {
          // Row 2 gets the remainder to ensure total equals juryBoxSize
          return juryBoxSize - Math.floor(half);
        }
      }
      // For single row, use all seats
      return Math.ceil(juryBoxSize / juryBoxRows);
    };
    
    const grid: Array<Array<{ row: number; seat: number; juror: JurorType | null }>> = [];
    
    for (let row = 1; row <= juryBoxRows; row++) {
      const rowSeats: Array<{ row: number; seat: number; juror: JurorType | null }> = [];
      const seatsPerRow = getSeatsPerRow(row);
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const juror = jurorsInBox.find(
          (j) => j.boxRow === row && j.boxSeat === seat
        );
        rowSeats.push({ row, seat, juror: juror || null });
      }
      grid.push(rowSeats);
    }
    
    return grid;
  }, [juryBoxRows, juryBoxSize, jurorsInBox]);

  const nextJuror = jurorsInPool?.[0] || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading jury box...</div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Jury Box</h3>
            <p className="text-sm text-muted-foreground">
              {juryBoxSize} seats, {juryBoxRows === 1 ? 'Single' : 'Double'} row layout
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => autoFillMutation.mutate()}
            disabled={autoFillMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoFillMutation.isPending ? 'animate-spin' : ''}`} />
            Auto-Fill
          </Button>
        </div>

        {/* Jury Box Grid */}
        <div className="space-y-4">
          {seatGrid.map((rowSeats, rowIndex) => {
            // Count filled seats (jurors) in this row
            const filledSeats = rowSeats.filter(s => s.juror !== null).length;
            const totalSeats = rowSeats.length;
            const hasEmptySeats = filledSeats < totalSeats;
            
            return (
              <div key={rowIndex}>
                {rowIndex === 0 && juryBoxRows === 2 && (
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Front Row
                  </div>
                )}
                {rowIndex === 1 && juryBoxRows === 2 && (
                  <div className="text-xs font-medium text-gray-600 mb-2 mt-4">
                    Back Row
                  </div>
                )}
                {/* Use flexbox with even distribution for consistent spacing, always fill horizontal space */}
                <div className="flex flex-wrap justify-evenly items-start gap-3 w-full">
                  {rowSeats.map(({ row, seat, juror }) => {
                    // Ensure all seats have the same width for consistent spacing
                    const baseWidth = 'min-w-[200px] max-w-[200px] flex-shrink-0';
                    return (
                      <Seat
                        key={`${row}-${seat}`}
                        row={row}
                        seat={seat}
                        juror={juror}
                        nextJuror={nextJuror}
                        isDragging={!!activeId}
                        onJurorClick={handleJurorClick}
                        className={baseWidth}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Juror Pool */}
        <div className="mt-8">
          <JurorPool
            jurors={jurorsInPool}
            onJurorClick={handleJurorClick}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            (() => {
              const juror = [...jurorsInBox, ...jurorsInPool].find(
                (j) => j.id === activeId
              );
              return juror ? <JurorCard juror={juror} isDragging /> : null;
            })()
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
