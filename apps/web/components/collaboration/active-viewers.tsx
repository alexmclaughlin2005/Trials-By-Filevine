'use client';

import { Users } from 'lucide-react';

interface ActiveViewersProps {
  count: number;
  isConnected: boolean;
}

export function ActiveViewers({ count, isConnected }: ActiveViewersProps) {
  if (!isConnected) {
    return null;
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-filevine-gray-100 px-3 py-1.5 text-sm">
      <div className="relative">
        <Users className="h-4 w-4 text-filevine-gray-600" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>
      <span className="text-filevine-gray-700 font-medium">
        {count} {count === 1 ? 'person' : 'people'} viewing
      </span>
    </div>
  );
}
