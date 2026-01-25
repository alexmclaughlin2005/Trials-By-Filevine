'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, Plus, Trash2, History } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      loadConversations();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
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
          data.conversations.map((c: any) => ({
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
          data.messages.map((msg: any) => ({
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-filevine-blue text-white'
                    : 'bg-filevine-gray-100 text-filevine-black'
                )}
              >
                <div
                  className={cn(
                    'text-sm markdown-content',
                    message.role === 'user'
                      ? 'markdown-content-user'
                      : 'markdown-content-assistant'
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p
                  className={cn(
                    'text-xs mt-1',
                    message.role === 'user'
                      ? 'text-filevine-blue/70'
                      : 'text-filevine-gray-500'
                  )}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-filevine-gray-100 rounded-lg px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-filevine-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-filevine-gray-200">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to perform an action..."
              className={cn(
                'flex-1 resize-none rounded-lg border border-filevine-gray-300',
                'px-4 py-2 text-sm focus:outline-none focus:ring-2',
                'focus:ring-filevine-blue focus:border-transparent',
                'max-h-32 min-h-[44px]'
              )}
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[44px] w-[44px] p-0 bg-filevine-blue hover:bg-filevine-blue/90"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-filevine-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
        </div>
      </div>
    </>
  );
}
