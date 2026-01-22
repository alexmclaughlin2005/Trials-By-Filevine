'use client';

import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
        isConnected
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="font-medium">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">Offline</span>
        </>
      )}
    </div>
  );
}
