'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { SessionCard } from './SessionCard';
import { Button } from '@/components/ui/button';
import { History, Filter } from 'lucide-react';
import { FocusGroupSession } from '@/types/focus-group';

interface SessionWithCase extends FocusGroupSession {
  _count?: {
    personas?: number;
    results?: number;
    recommendations?: number;
  };
  case: {
    id: string;
    name: string;
    caseNumber: string;
    caseType: string;
    status: string;
  };
}

interface GlobalSessionsListProps {
  // Optional filters that can be pre-set
  initialCaseId?: string;
  initialStatus?: string;
}

export function GlobalSessionsList({
  initialCaseId,
  initialStatus,
}: GlobalSessionsListProps) {
  const router = useRouter();
  const [caseFilter, setCaseFilter] = useState(initialCaseId || '');
  const [statusFilter, setStatusFilter] = useState(initialStatus || '');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch sessions
  const { data, isLoading, error } = useQuery<{ sessions: SessionWithCase[] }>({
    queryKey: ['focus-group-sessions', 'recent', caseFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (caseFilter) params.append('caseId', caseFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      return apiClient.get<{ sessions: SessionWithCase[] }>(
        `/focus-groups/recent?${params.toString()}`
      );
    },
  });

  // Fetch cases for filter dropdown
  const { data: casesData } = useQuery<{ cases: Array<{ id: string; name: string }> }>({
    queryKey: ['cases', 'list'],
    queryFn: () => apiClient.get<{ cases: Array<{ id: string; name: string }> }>('/cases'),
  });

  const sessions = data?.sessions || [];
  const cases = casesData?.cases || [];

  const handleViewResults = async (sessionId: string) => {
    try {
      // Fetch conversations for this session
      const conversationsResponse = await apiClient.get<{ conversations: Array<{ id: string }> }>(
        `/focus-groups/sessions/${sessionId}/conversations`
      );

      if (conversationsResponse.conversations && conversationsResponse.conversations.length > 0) {
        // Navigate to the first conversation within the case context
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          router.push(`/cases/${session.caseId}/focus-groups/conversations/${conversationsResponse.conversations[0].id}`);
        }
      } else {
        // No conversations yet, navigate to the case focus groups page
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          router.push(`/cases/${session.caseId}/focus-groups`);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback: navigate to case focus groups
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        router.push(`/cases/${session.caseId}/focus-groups`);
      }
    }
  };

  const handleGoToCase = (caseId: string) => {
    router.push(`/cases/${caseId}/focus-groups`);
  };

  const handleClearFilters = () => {
    setCaseFilter('');
    setStatusFilter('');
  };

  const activeFilterCount =
    (caseFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-sm text-filevine-gray-600">Loading focus groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">
          Failed to load focus groups. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-filevine-blue px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-filevine-gray-600"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border border-filevine-gray-200 bg-filevine-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Case Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-filevine-gray-700">
                Case
              </label>
              <select
                value={caseFilter}
                onChange={(e) => setCaseFilter(e.target.value)}
                className="w-full rounded-md border border-filevine-gray-300 bg-white px-3 py-2 text-sm focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
              >
                <option value="">All Cases</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-filevine-gray-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-filevine-gray-300 bg-white px-3 py-2 text-sm focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-12 text-center">
          <History className="mx-auto h-12 w-12 text-filevine-gray-400" />
          <p className="mt-3 text-lg font-medium text-filevine-gray-900">
            No Focus Groups Yet
          </p>
          <p className="mt-1 text-sm text-filevine-gray-600">
            Focus groups are created within cases. Go to a case to get started.
          </p>
          <Button
            onClick={() => router.push('/cases')}
            className="mt-6"
          >
            Go to Cases
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              showCaseInfo={true}
              onViewResults={handleViewResults}
              onGoToCase={handleGoToCase}
            />
          ))}

          {/* Pagination hint (for future) */}
          {sessions.length === 50 && (
            <div className="text-center">
              <p className="text-sm text-filevine-gray-600">
                Showing first 50 results. Use filters to narrow down.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
