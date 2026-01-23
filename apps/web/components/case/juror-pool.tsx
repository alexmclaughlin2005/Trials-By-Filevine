'use client';

import { useDroppable } from '@dnd-kit/core';
import { JurorCard } from './juror-card';

interface JurorPoolProps {
  jurors: Array<{
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
  onJurorClick?: (jurorId: string) => void;
}

export function JurorPool({ jurors, onJurorClick }: JurorPoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'juror-pool',
    data: {
      type: 'pool',
    },
  });

  return (
    <div ref={setNodeRef} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Available Jurors ({jurors.length})
        </h3>
        <p className="text-xs text-muted-foreground">
          Drag jurors here to remove from box
        </p>
      </div>

      {jurors.length === 0 ? (
        <div
          className={`
            rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${isOver ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'}
          `}
        >
          <p className="text-sm text-muted-foreground">
            {isOver ? 'Drop here to remove from box' : 'No available jurors in pool'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {jurors.map((juror, index) => (
            <div key={juror.id} className="relative">
              {index === 0 && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
                  Next
                </div>
              )}
              <JurorCard
                juror={juror}
                onClick={() => onJurorClick?.(juror.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
