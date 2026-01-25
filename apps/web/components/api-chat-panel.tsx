'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, Plus, Trash2, History } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { SimpleMarkdown } from './simple-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  lastMessageAt: Date;
  preview?: string;
}

interface ApiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiChatPanel({ isOpen, onClose }: ApiChatPanelProps) {
  const { token } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your API assistant powered by Claude Sonnet 4.5. I can help you interact with the Trials by Filevine API. Try asking me to:\n\n• Create a new case\n• Add jurors\n• Classify juror archetypes\n• Run focus group simulations\n• Search for cases or jurors\n\nWhat would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen) {
      void loadConversations();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(
          data.conversations.map((c: { id: string; title: string | null; lastMessageAt: string; preview?: string }) => ({
            ...c,
            lastMessageAt: new Date(c.lastMessageAt),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.messages.map((msg: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
        );
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your API assistant powered by Claude Sonnet 4.5. I can help you interact with the Trials by Filevine API. Try asking me to:\n\n• Create a new case\n• Add jurors\n• Classify juror archetypes\n• Run focus group simulations\n• Search for cases or jurors\n\nWhat would you like to do?',
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the API chat endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation ID if this was a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 transition-opacity z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Chat Panel Container */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-[800px] bg-white shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          'flex',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Left Sidebar - Conversation History */}
        <div
          className={cn(
            'h-full bg-filevine-gray-50 border-r border-filevine-gray-200',
            'transform transition-all duration-300 ease-in-out flex-shrink-0',
            'flex flex-col',
            showHistory ? 'w-64' : 'w-0 overflow-hidden'
          )}
        >
          <div className="p-4 border-b border-filevine-gray-200 bg-white flex items-center justify-between">
            <h3 className="font-semibold text-sm text-filevine-black">
              Chat History
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewConversation}
              className="h-8 px-2"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-filevine-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-xs text-filevine-gray-500 text-center py-8 px-4">
                No conversations yet. Start chatting to create your first conversation.
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative p-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-white',
                      currentConversationId === conv.id
                        ? 'bg-white shadow-sm'
                        : 'bg-transparent'
                    )}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-filevine-black truncate mb-1">
                          {conv.title || 'Untitled conversation'}
                        </div>
                        <div className="text-xs text-filevine-gray-500 line-clamp-2">
                          {conv.preview}
                        </div>
                        <div className="text-xs text-filevine-gray-400 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="h-7 w-7 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-filevine-gray-200">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-8 w-8 p-0"
                title={showHistory ? "Hide history" : "Show history"}
              >
                <History className="w-4 h-4" />
              </Button>
              <div className="p-2 bg-filevine-blue/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-filevine-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-filevine-black">
                  API Assistant
                </h2>
                <p className="text-xs text-filevine-gray-600">
                  Powered by Claude Sonnet 4.5
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  AI
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                  message.role === 'user'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-white border border-gray-200 text-gray-900'
                )}
              >
                <SimpleMarkdown content={message.content} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                AI
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className={cn(
                'flex-1 resize-none rounded-xl border border-gray-300 bg-white',
                'px-4 py-3 text-sm focus:outline-none focus:ring-2',
                'focus:ring-blue-500 focus:border-transparent',
                'max-h-32 min-h-[48px] shadow-sm'
              )}
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                'h-[48px] w-[48px] p-0 rounded-xl shadow-sm',
                'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300',
                'transition-colors duration-200'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
