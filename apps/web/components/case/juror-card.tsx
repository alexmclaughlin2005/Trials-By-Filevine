'use client';

import { GripVertical, Loader2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

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
    imageUrl?: string | null;
  };
  isDragging?: boolean;
  onClick?: () => void;
  isGeneratingImage?: boolean;
}

export function JurorCard({ juror, onClick, isGeneratingImage = false }: JurorCardProps) {
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

  // Use Vercel Blob URL directly if available, otherwise proxy through API Gateway
  const imageSrc = juror.imageUrl 
    ? (juror.imageUrl.startsWith('https://') 
        ? juror.imageUrl // Vercel Blob URL - use directly
        : `/api/jurors/images/${juror.id}?v=${encodeURIComponent(juror.imageUrl.split('/').pop() || '')}`) // Legacy proxy
    : '';

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleCardClick = () => {
    onClick?.();
  };

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
      className={`
        relative rounded-lg border-2 p-4 bg-white shadow-sm
        hover:shadow-md transition-all select-none
        ${isDraggingState ? 'opacity-50 cursor-grabbing' : 'cursor-pointer'}
        ${getStatusColor(juror.status)}
      `}
      onClick={(e) => {
        // Only navigate if not dragging and click wasn't on drag handle
        if (!isDraggingState && !(e.target as HTMLElement).closest('[data-drag-handle]')) {
          handleCardClick();
        }
      }}
    >
      {/* Drag Handle - Only this area is draggable */}
      <div 
        {...listeners}
        data-drag-handle
        className="absolute top-1 right-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 z-10 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Juror Image - Clickable */}
      {juror.imageUrl ? (
        <div className="mb-3 flex justify-center">
          <div
            className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleImageClick(e);
            }}
          >
            <Image
              src={imageSrc}
              alt={`${juror.firstName} ${juror.lastName}`}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
            {isGeneratingImage && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-3 flex justify-center">
          <div
            className="relative w-36 h-36 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleImageClick(e);
            }}
          >
            {isGeneratingImage ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <span className="text-base font-semibold text-gray-400">
                {juror.firstName?.[0]}{juror.lastName?.[0]}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Juror Number */}
      {juror.jurorNumber && (
        <div className="mb-2">
          <span className="text-sm font-semibold text-gray-600">
            #{juror.jurorNumber}
          </span>
        </div>
      )}

      {/* Name - Clickable */}
      <div
        className="font-semibold text-base mb-2 cursor-pointer hover:text-primary transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleNameClick(e);
        }}
      >
        {juror.firstName} {juror.lastName}
      </div>

      {/* Details */}
      <div className="text-sm text-gray-600 space-y-1">
        {juror.age && <div>Age {juror.age}</div>}
        {juror.occupation && <div>{juror.occupation}</div>}
      </div>

      {/* Archetype Badge */}
      {juror.classifiedArchetype && (
        <div className="mt-2">
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
            {juror.classifiedArchetype.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Position Indicator */}
      {juror.boxRow !== null && juror.boxRow !== undefined && juror.boxSeat !== null && juror.boxSeat !== undefined && (
        <div className="mt-2 text-xs text-gray-500">
          Row {juror.boxRow}, Seat {juror.boxSeat}
        </div>
      )}
    </div>
  );
}
