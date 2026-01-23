'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';
import { RoundtableConversationViewer } from './roundtable-conversation-viewer';

interface Argument {
  id: string;
  title: string;
  content: string;
}

interface RoundtableConversationTriggerProps {
  sessionId: string;
  arguments: Argument[];
}

interface ConversationResult {
  conversationId: string;
  statements: any[];
  consensusAreas: string[];
  fracturePoints: string[];
  keyDebatePoints: string[];
}

export function RoundtableConversationTrigger({
  sessionId,
  arguments: caseArguments
}: RoundtableConversationTriggerProps) {
  const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const runConversationMutation = useMutation({
    mutationFn: async (argumentId: string) => {
      return apiClient.post<ConversationResult>(
        `/focus-groups/sessions/${sessionId}/roundtable`,
        { argumentId }
      );
    },
    onSuccess: (result) => {
      setActiveConversationId(result.conversationId);
      queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
    }
  });

  const handleRunConversation = (argumentId: string) => {
    setSelectedArgumentId(argumentId);
    runConversationMutation.mutate(argumentId);
  };

  if (activeConversationId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-filevine-gray-900">
            Roundtable Conversation Results
          </h3>
          <Button
            variant="outline"
            onClick={() => {
              setActiveConversationId(null);
              setSelectedArgumentId(null);
            }}
          >
            Back to Arguments
          </Button>
        </div>

        <RoundtableConversationViewer conversationId={activeConversationId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Start Roundtable Conversation
        </h3>
        <p className="text-sm text-filevine-gray-600 mt-1">
          Select an argument to simulate a roundtable discussion between your focus group personas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {caseArguments.map((argument) => (
          <Card key={argument.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {argument.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {argument.content}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleRunConversation(argument.id)}
                disabled={runConversationMutation.isPending && selectedArgumentId === argument.id}
                className="w-full"
              >
                {runConversationMutation.isPending && selectedArgumentId === argument.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Conversation...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Roundtable Discussion
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {runConversationMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">
              Error: {runConversationMutation.error instanceof Error
                ? runConversationMutation.error.message
                : 'Failed to run conversation'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
