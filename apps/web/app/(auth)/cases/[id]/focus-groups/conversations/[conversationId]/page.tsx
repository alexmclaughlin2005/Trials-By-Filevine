'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ConversationDetail } from '@/types/focus-group';
import { RoundtableConversationViewer } from '@/components/roundtable-conversation-viewer';
import { Loader2 } from 'lucide-react';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const caseId = params.id as string;

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
      {/* In-Progress Notice */}
      {!conversation.completedAt && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-filevine-blue" />
            <p className="text-sm text-blue-900">
              The roundtable discussion is currently running. New statements will appear
              automatically as personas respond. This usually takes 2-3 minutes to complete.
            </p>
          </div>
        </div>
      )}

      {/* Roundtable Conversation Viewer with Takeaways */}
      <RoundtableConversationViewer
        conversationId={conversationId}
        caseId={caseId}
      />
    </div>
  );
}
