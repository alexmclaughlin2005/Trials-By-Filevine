'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FocusGroupSetupWizard } from './focus-group-setup-wizard';
import { FocusGroupSimulator } from './focus-group-simulator';
import { FocusGroupSession } from '@/types/focus-group';
import { Plus, History, PlayCircle } from 'lucide-react';

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

type View = 'list' | 'setup' | 'running' | 'results';

export function FocusGroupManager({ caseId, arguments: caseArguments }: FocusGroupManagerProps) {
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load focus group sessions for this case
  const { data: sessionsData, isLoading } = useQuery<{ sessions: FocusGroupSessionWithCount[] }>({
    queryKey: ['focus-group-sessions', caseId],
    queryFn: () => apiClient.get<{ sessions: FocusGroupSessionWithCount[] }>(`/focus-groups/case/${caseId}`),
  });

  const sessions = sessionsData?.sessions || [];

  const handleStartNew = () => {
    setCurrentView('setup');
  };

  const handleSetupComplete = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentView('running');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setActiveSessionId(null);
  };

  const handleViewSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentView('results');
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

  if (currentView === 'running' && activeSessionId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-filevine-gray-900">
              Focus Group Running
            </h3>
            <p className="text-sm text-filevine-gray-600">
              Session ID: {activeSessionId}
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Back to Sessions
          </Button>
        </div>

        {/* TODO: Replace with actual running simulation component */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-12 text-center">
          <PlayCircle className="mx-auto h-16 w-16 text-filevine-blue animate-pulse" />
          <p className="mt-4 text-lg font-medium text-filevine-gray-900">
            Focus Group Simulation Running
          </p>
          <p className="mt-2 text-sm text-filevine-gray-600">
            This will show live progress and results when integrated with the simulation engine
          </p>
        </div>
      </div>
    );
  }

  // List view - show all sessions
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Focus Group Sessions
          </h3>
          <p className="text-sm text-filevine-gray-600">
            Test your arguments with AI-powered jury simulations
          </p>
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
                    {session._count?.results > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session._count.results} reactions</span>
                      </div>
                    )}
                    {session._count?.recommendations > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session._count.recommendations} recommendations
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {session.status === 'completed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewSession(session.id)}
                    >
                      View Results
                    </Button>
                  )}
                  {session.status === 'draft' && (
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keep original simulator for now - will integrate later */}
      {sessions.length > 0 && (
        <div className="mt-12 border-t border-filevine-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-filevine-gray-900 mb-4">
            Quick Simulation (Legacy)
          </h4>
          <FocusGroupSimulator caseId={caseId} arguments={caseArguments} />
        </div>
      )}
    </div>
  );
}
