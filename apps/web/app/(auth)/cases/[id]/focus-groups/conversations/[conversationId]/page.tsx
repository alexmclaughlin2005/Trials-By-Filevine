'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ConversationDetail } from '@/types/focus-group';
import { ConversationTabs } from '@/components/focus-groups/ConversationTabs';
import { Loader2 } from 'lucide-react';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    async function fetchData() {
      try {
        // Fetch conversation data
        const conversationData = await apiClient.get<ConversationDetail>(
          `/focus-groups/conversations/${conversationId}`
        );

        if (!mounted) return;

        setConversation(conversationData);
        setLoading(false);

        // If conversation is not completed, start polling
        if (!conversationData.completedAt) {
          pollInterval = setInterval(async () => {
            try {
              const updatedData = await apiClient.get<ConversationDetail>(
                `/focus-groups/conversations/${conversationId}`
              );

              if (!mounted) return;

              setConversation(updatedData);

              // Stop polling when conversation is complete
              if (updatedData.completedAt && pollInterval) {
                clearInterval(pollInterval);
              }
            } catch (err) {
              console.error('Error polling conversation:', err);
            }
          }, 5000); // Poll every 5 seconds
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    if (conversationId) {
      fetchData();
    }

    // Cleanup polling on unmount
    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [conversationId]);

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-filevine-blue animate-spin mb-4" />
            <p className="text-filevine-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-full p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-filevine-gray-900 mb-2">
              Failed to Load Conversation
            </h3>
            <p className="text-filevine-gray-600 mb-4">{error || 'Conversation not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-filevine-blue text-white rounded-md hover:bg-filevine-blue/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      {/* Conversation Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-filevine-gray-900 mb-2">
          {conversation.argumentTitle}
        </h1>
        <div className="flex items-center gap-4 text-sm text-filevine-gray-600">
          <span>Started: {new Date(conversation.startedAt).toLocaleString()}</span>
          {conversation.completedAt ? (
            <>
              <span>•</span>
              <span>Completed: {new Date(conversation.completedAt).toLocaleString()}</span>
            </>
          ) : (
            <>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-filevine-blue" />
                <span className="text-filevine-blue font-medium">In Progress</span>
              </span>
            </>
          )}
          {conversation.converged && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Converged
              </span>
            </>
          )}
        </div>
        {conversation.convergenceReason && (
          <p className="mt-2 text-sm text-filevine-gray-600 italic">
            {conversation.convergenceReason}
          </p>
        )}
        {!conversation.completedAt && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              The roundtable discussion is currently running. New statements will appear
              automatically as personas respond. This usually takes 2-3 minutes to complete.
            </p>
          </div>
        )}
      </div>

      {/* Conversation Tabs */}
      <ConversationTabs
        personaSummaries={conversation.personaSummaries}
        allStatements={conversation.allStatements}
        overallAnalysis={conversation.overallAnalysis}
        customQuestions={conversation.customQuestions}
      />
    </div>
  );
}
