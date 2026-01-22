'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { CollaborationProvider } from '@/contexts/collaboration-context';

function CollaborationWrapper({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();

  return (
    <CollaborationProvider
      token={token}
      userId={user?.id}
      organizationId={user?.organization?.id}
    >
      {children}
    </CollaborationProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollaborationWrapper>{children}</CollaborationWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}
