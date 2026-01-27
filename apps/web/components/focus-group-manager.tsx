'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FocusGroupSetupWizard } from './focus-group-setup-wizard';
import { FocusGroupSession } from '@/types/focus-group';
import { Plus, History, PlayCircle, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FocusGroupSessionWithCount = FocusGroupSession & {
  _count?: {
    personas?: number;
    results?: number;
    recommendations?: number;
  };
};

interface Argument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
}

interface FocusGroupManagerProps {
  caseId: string;
  arguments: Argument[];
}

type View = 'list' | 'setup' | 'results';

export function FocusGroupManager({ caseId, arguments: caseArguments }: FocusGroupManagerProps) {
  const [currentView, setCurrentView] = useState<View>('list');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Load focus group sessions for this case
  const { data: sessionsData, isLoading } = useQuery<{ sessions: FocusGroupSessionWithCount[] }>({
    queryKey: ['focus-group-sessions', caseId],
    queryFn: () => apiClient.get<{ sessions: FocusGroupSessionWithCount[] }>(`/focus-groups/case/${caseId}`),
  });

  const sessions = sessionsData?.sessions || [];

  // Delete focus group mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiClient.delete(`/focus-groups/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-group-sessions', caseId] });
      setDeleteConfirmId(null);
    },
  });

  const handleStartNew = () => {
    setCurrentView('setup');
  };

  const handleSetupComplete = () => {
    // Setup complete - wizard now navigates directly to conversation
    // Just return to list view in case user comes back
    setCurrentView('list');
    setActiveSessionId(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setActiveSessionId(null);
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      // Fetch conversations for this session
      const conversationsResponse = await apiClient.get<{ conversations: Array<{ id: string }> }>(
        `/focus-groups/sessions/${sessionId}/conversations`
      );

      if (conversationsResponse.conversations && conversationsResponse.conversations.length > 0) {
        // Navigate to the first conversation within the case context
        router.push(`/cases/${caseId}/focus-groups/conversations/${conversationsResponse.conversations[0].id}`);
      } else {
        // No conversations yet, just stay on this page
        console.warn('No conversations found for session:', sessionId);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  if (currentView === 'setup') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-filevine-gray-900">
              New Focus Group Session
            </h3>
            <p className="text-sm text-filevine-gray-600">
              Configure your focus group and select arguments to test
            </p>
          </div>
        </div>

        <FocusGroupSetupWizard
          caseId={caseId}
          arguments={caseArguments}
          onComplete={handleSetupComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // List view - show all sessions
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Focus Group Sessions
          </h3>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Test your arguments with AI-powered jury simulations. Results appear here after each session completes.
          </p>
          <Link
            href="/focus-groups"
            className="inline-flex items-center gap-1.5 text-xs text-filevine-blue hover:underline mt-2"
          >
            <ExternalLink className="h-3 w-3" />
            View all focus groups across cases
          </Link>
        </div>
        <Button onClick={handleStartNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Focus Group
        </Button>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
            <p className="mt-4 text-sm text-filevine-gray-600">Loading sessions...</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-12 text-center">
          <History className="mx-auto h-12 w-12 text-filevine-gray-400" />
          <p className="mt-3 text-lg font-medium text-filevine-gray-900">
            No Focus Groups Yet
          </p>
          <p className="mt-1 text-sm text-filevine-gray-600">
            Create your first focus group session to test arguments with diverse jury archetypes
          </p>
          <Button onClick={handleStartNew} className="mt-6">
            Create Focus Group
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: FocusGroupSessionWithCount) => (
            <div
              key={session.id}
              className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-filevine-gray-900">
                      {session.name}
                    </h4>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'running'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {session.description && (
                    <p className="mt-2 text-sm text-filevine-gray-600">{session.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-6 text-sm text-filevine-gray-600">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      <span>{session._count?.personas || 0} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(session._count?.results ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session._count?.results ?? 0} reactions</span>
                      </div>
                    )}
                    {(session._count?.recommendations ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session._count?.recommendations ?? 0} recommendations
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {session.status === 'completed' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewSession(session.id)}
                      >
                        View Results
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  {session.status === 'running' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewSession(session.id)}
                      >
                        View Progress
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  {session.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setCurrentView('setup');
                        }}
                      >
                        Continue Setup
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-filevine-gray-900 mb-2">
              Delete Focus Group Session?
            </h3>
            <p className="text-sm text-filevine-gray-600 mb-6">
              This will permanently delete this focus group session. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
