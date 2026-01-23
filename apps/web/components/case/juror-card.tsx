'use client';

import { GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface JurorCardProps {
  juror: {
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
  };
  isDragging?: boolean;
  onClick?: () => void;
}

export function JurorCard({ juror, isDragging, onClick }: JurorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingState,
  } = useDraggable({
    id: juror.id,
    data: {
      type: 'juror',
      juror,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDraggingState ? 0.5 : 1,
      }
    : undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'seated':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'questioned':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'struck_for_cause':
      case 'peremptory_strike':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'available':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative rounded-lg border-2 p-3 bg-white shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all select-none
        ${getStatusColor(juror.status)}
        ${isDraggingState ? 'opacity-50' : ''}
      `}
      onClick={(e) => {
        // Only trigger onClick if not dragging
        if (!isDraggingState && onClick) {
          onClick();
        }
      }}
    >
      {/* Drag Handle Indicator */}
      <div className="absolute top-1 right-1 text-gray-400">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Juror Number */}
      {juror.jurorNumber && (
        <div className="mb-1">
          <span className="text-xs font-semibold text-gray-600">
            #{juror.jurorNumber}
          </span>
        </div>
      )}

      {/* Name */}
      <div className="font-semibold text-sm mb-1">
        {juror.firstName} {juror.lastName}
      </div>

      {/* Details */}
      <div className="text-xs text-gray-600 space-y-0.5">
        {juror.age && <div>Age {juror.age}</div>}
        {juror.occupation && <div>{juror.occupation}</div>}
      </div>

      {/* Archetype Badge */}
      {juror.classifiedArchetype && (
        <div className="mt-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
            {juror.classifiedArchetype.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Position Indicator */}
      {juror.boxRow !== null && juror.boxRow !== undefined && juror.boxSeat !== null && juror.boxSeat !== undefined && (
        <div className="mt-1 text-xs text-gray-500">
          Row {juror.boxRow}, Seat {juror.boxSeat}
        </div>
      )}
    </div>
  );
}
