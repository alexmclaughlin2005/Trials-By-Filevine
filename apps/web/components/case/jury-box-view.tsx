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
  } | null;
  nextJuror?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  isDragging?: boolean;
}

function Seat({ row, seat, juror, nextJuror, isDragging }: SeatProps) {
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
      `}
    >
      {juror ? (
        <JurorCard
          juror={juror}
          onClick={() => {}}
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

export function JuryBoxView({ panelId, onJurorClick }: JuryBoxViewProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch jury box state
  const { data, isLoading } = useQuery<{
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
    }>;
  }>({
    queryKey: ['panel', panelId, 'jury-box'],
    queryFn: async () => {
      const response = await apiClient.get(`/jurors/panel/${panelId}/jury-box`);
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
      return await apiClient.put(`/jurors/panel/${panelId}/jury-box/auto-fill`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', panelId, 'jury-box'] });
      queryClient.invalidateQueries({ queryKey: ['case', panelId, 'panels'] });
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
      const seatsPerRow = Math.ceil(juryBoxSize / juryBoxRows);
      const boxOrder = (row - 1) * seatsPerRow + seat;

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
  const seatsPerRow = Math.ceil(juryBoxSize / juryBoxRows);
  const seatGrid = useMemo(() => {
    const grid: Array<Array<{ row: number; seat: number; juror: any }>> = [];
    
    for (let row = 1; row <= juryBoxRows; row++) {
      const rowSeats: Array<{ row: number; seat: number; juror: any }> = [];
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const juror = jurorsInBox.find(
          (j: any) => j.boxRow === row && j.boxSeat === seat
        );
        rowSeats.push({ row, seat, juror: juror || null });
      }
      grid.push(rowSeats);
    }
    
    return grid;
  }, [juryBoxRows, seatsPerRow, jurorsInBox]);

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
          {seatGrid.map((rowSeats, rowIndex) => (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {rowSeats.map(({ row, seat, juror }) => (
                  <Seat
                    key={`${row}-${seat}`}
                    row={row}
                    seat={seat}
                    juror={juror}
                    nextJuror={nextJuror}
                    isDragging={!!activeId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Juror Pool */}
        <div className="mt-8">
          <JurorPool
            jurors={jurorsInPool}
            onJurorClick={onJurorClick}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            (() => {
              const juror = [...jurorsInBox, ...jurorsInPool].find(
                (j: any) => j.id === activeId
              );
              return juror ? <JurorCard juror={juror} isDragging /> : null;
            })()
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
