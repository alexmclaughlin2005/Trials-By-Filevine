'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerActions?: ReactNode;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  headerActions,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-lg border border-filevine-gray-200 bg-white shadow-sm', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        className="flex w-full items-center justify-between p-3 hover:bg-filevine-gray-50 transition-colors cursor-pointer"
      >
        <h3 className="text-sm font-semibold text-filevine-gray-900">{title}</h3>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {headerActions}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-filevine-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-filevine-gray-400" />
          )}
        </div>
      </div>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
