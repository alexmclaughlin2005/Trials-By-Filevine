'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';

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
  status: string;
  message: string;
}

export function RoundtableConversationTrigger({
  sessionId,
  arguments: caseArguments
}: RoundtableConversationTriggerProps) {
  const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const runConversationMutation = useMutation({
    mutationFn: async (argumentId: string) => {
      const result = await apiClient.post<ConversationResult>(
        `/focus-groups/sessions/${sessionId}/roundtable`,
        { argumentId }
      );
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
      // Navigate to the conversation detail page
      router.push(`/focus-groups/conversations/${result.conversationId}`);
    }
  });

  const handleRunConversation = (argumentId: string) => {
    setSelectedArgumentId(argumentId);
    runConversationMutation.mutate(argumentId);
  };

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
