import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { PromptClient } from '@juries/prompt-client';
import { chatTools, executeTool } from './chat-tools';

const chatMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().nullable().optional(),
});

const conversationListSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export async function chatRoutes(server: FastifyInstance) {
  // Initialize prompt client
  const promptClient = new PromptClient({
    serviceUrl: process.env.PROMPT_SERVICE_URL || 'http://localhost:3002',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Get conversation history
  server.get(
    '/conversations',
    {
      onRequest: [server.authenticate],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const query = conversationListSchema.parse(request.query);
          const user = request.user as any;

          const conversations = await server.prisma.chatConversation.findMany({
            where: {
              userId: user.userId,
              organizationId: user.organizationId,
            },
            orderBy: { lastMessageAt: 'desc' },
            take: query.limit,
            skip: query.offset,
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
                take: 1,
              },
            },
          });

          return {
            conversations: conversations.map((conv) => ({
              id: conv.id,
              title: conv.title,
              lastMessageAt: conv.lastMessageAt,
              createdAt: conv.createdAt,
              preview: conv.messages[0]?.content.substring(0, 100),
            })),
            total: await server.prisma.chatConversation.count({
              where: {
                userId: user.userId,
                organizationId: user.organizationId,
              },
            }),
          };
        } catch (error) {
          server.log.error('Error fetching conversations:', error);
          reply.code(500);
          return {
            error: 'Failed to fetch conversations',
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    }
  );

  // Get conversation messages
  server.get(
    '/conversations/:conversationId',
    {
      onRequest: [server.authenticate],
      handler: async (request: FastifyRequest<{
        Params: { conversationId: string };
      }>, reply: FastifyReply) => {
        try {
          const { conversationId } = request.params;
          const user = request.user as any;

          const conversation = await server.prisma.chatConversation.findFirst({
            where: {
              id: conversationId,
              userId: user.userId,
              organizationId: user.organizationId,
            },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          if (!conversation) {
            reply.code(404);
            return { error: 'Conversation not found' };
          }

          return {
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              toolsUsed: msg.toolsUsed,
              toolCalls: msg.toolCalls,
              createdAt: msg.createdAt,
            })),
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.lastMessageAt,
          };
        } catch (error) {
          server.log.error('Error fetching conversation:', error);
          reply.code(500);
          return {
            error: 'Failed to fetch conversation',
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    }
  );

  // Delete conversation
  server.delete(
    '/conversations/:conversationId',
    {
      onRequest: [server.authenticate],
      handler: async (request: FastifyRequest<{
        Params: { conversationId: string };
      }>, reply: FastifyReply) => {
        try {
          const { conversationId } = request.params;
          const user = request.user as any;

          const conversation = await server.prisma.chatConversation.findFirst({
            where: {
              id: conversationId,
              userId: user.userId,
              organizationId: user.organizationId,
            },
          });

          if (!conversation) {
            reply.code(404);
            return { error: 'Conversation not found' };
          }

          await server.prisma.chatConversation.delete({
            where: { id: conversationId },
          });

          return { success: true };
        } catch (error) {
          server.log.error('Error deleting conversation:', error);
          reply.code(500);
          return {
            error: 'Failed to delete conversation',
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    }
  );

  server.post(
    '/',
    {
      onRequest: [server.authenticate],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const body = chatMessageSchema.parse(request.body);
          const { message, conversationId } = body;
          const user = request.user as any;

          // Get or create conversation
          let conversation;
          let conversationHistory: Array<{ role: string; content: string }> = [];

          if (conversationId) {
            // Load existing conversation
            conversation = await server.prisma.chatConversation.findFirst({
              where: {
                id: conversationId,
                userId: user.userId,
                organizationId: user.organizationId,
              },
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            });

            if (!conversation) {
              reply.code(404);
              return { error: 'Conversation not found' };
            }

            conversationHistory = conversation.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            }));
          } else {
            // Create new conversation
            conversation = await server.prisma.chatConversation.create({
              data: {
                userId: user.userId,
                organizationId: user.organizationId,
                title: message.substring(0, 100), // Use first message as title
              },
            });
          }

          // Save user message
          await server.prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'user',
              content: message,
            },
          });

          // Get prompt from prompt service
          const prompt = await promptClient.getPrompt('api-chat-assistant', {
            variables: { message },
            version: 'latest',
            abTestEnabled: false,
          });

          // Enhanced system prompt with tool usage instructions
          const enhancedSystemPrompt = `${prompt.systemPrompt || ''}

You have access to tools that allow you to actually perform API operations for the user. When a user asks you to do something:

1. Use the appropriate tool to perform the action
2. Confirm what was done and show the result
3. Ask if they need anything else

Available tools:
- create_case: Create a new case
- list_cases: List all cases
- get_case: Get case details
- add_juror: Add a juror to a case
- classify_juror_archetype: Classify a juror's psychological archetype

IMPORTANT: Actually use these tools to help users - don't just tell them how to use the API!`;

          // Build initial messages array
          const messages: Anthropic.MessageParam[] = [
            ...conversationHistory.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
            {
              role: 'user' as const,
              content: message,
            },
          ];

          const startTime = Date.now();
          let totalTokensUsed = 0;
          let finalResponse: string = '';
          const toolCallsMade: Array<{ tool: string; input: any }> = [];

          // Agentic loop: keep calling Claude until it stops using tools
          let continueLoop = true;
          let iterationCount = 0;
          const maxIterations = 5; // Prevent infinite loops

          while (continueLoop && iterationCount < maxIterations) {
            iterationCount++;

            // Call Claude API with tools
            const response = await anthropic.messages.create({
              model: prompt.config.model,
              max_tokens: prompt.config.maxTokens,
              temperature: prompt.config.temperature,
              system: enhancedSystemPrompt,
              messages,
              tools: chatTools,
            });

            totalTokensUsed += response.usage.input_tokens + response.usage.output_tokens;

            // Check if Claude wants to use a tool
            const toolUseBlock = response.content.find(
              (block) => block.type === 'tool_use'
            );

            if (toolUseBlock && toolUseBlock.type === 'tool_use') {
              // Claude wants to use a tool
              server.log.info(
                `Tool call: ${toolUseBlock.name}`,
                toolUseBlock.input
              );

              // Track tool call
              toolCallsMade.push({
                tool: toolUseBlock.name,
                input: toolUseBlock.input,
              });

              // Execute the tool
              const toolResult = await executeTool(
                server,
                toolUseBlock.name,
                toolUseBlock.input as Record<string, any>,
                user
              );

              // Add assistant's response and tool result to messages
              messages.push({
                role: 'assistant',
                content: response.content,
              });

              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify(toolResult.result || { error: toolResult.error }),
                  },
                ],
              });

              // Continue the loop to get Claude's response to the tool result
              continue;
            } else {
              // No tool use, extract final response
              const textContent = response.content.find(
                (block) => block.type === 'text'
              );

              if (textContent && textContent.type === 'text') {
                finalResponse = textContent.text;
              }

              continueLoop = false;
            }
          }

          // Track result
          await promptClient.trackResult('api-chat-assistant', {
            versionId: prompt.versionId,
            success: true,
            tokensUsed: totalTokensUsed,
            latencyMs: Date.now() - startTime,
            metadata: {
              iterationCount,
              hadToolUse: iterationCount > 1,
            },
          });

          if (!finalResponse) {
            throw new Error('No final response from Claude');
          }

          // Save assistant message
          await server.prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: finalResponse,
              toolsUsed: toolCallsMade.length > 0,
              toolCalls: toolCallsMade.length > 0 ? toolCallsMade : null,
              tokensUsed: totalTokensUsed,
            },
          });

          // Update conversation lastMessageAt
          await server.prisma.chatConversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
          });

          return {
            response: finalResponse,
            conversationId: conversation.id,
            promptVersion: prompt.version,
            toolsUsed: toolCallsMade.length > 0,
          };
        } catch (error) {
          server.log.error('Chat error:', error);

          // Log more details for debugging
          if (error instanceof Error) {
            server.log.error({
              name: error.name,
              message: error.message,
              stack: error.stack,
            }, 'Error details');
          }

          if (error instanceof z.ZodError) {
            server.log.error({ errors: error.errors }, 'Validation error details');
            reply.code(400);
            return {
              error: 'Invalid request',
              details: error.errors,
            };
          }

          reply.code(500);
          return {
            error: 'Failed to process chat message',
            message:
              error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    }
  );
}
