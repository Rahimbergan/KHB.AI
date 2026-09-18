import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Plus,
  Sparkles,
  Paperclip,
  Trash2,
  Bot,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { ArtifactRenderer } from '../components/ArtifactRenderer';
import { Artifact } from '../types';

interface ChatPageProps {
  currentDate: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  artifacts?: Artifact[];
  sources?: string[];
  usage?: { used_claude: boolean };
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentDate }) => {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string>('demo');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Give me today's sales report.",
    'Why did sales fall compared with yesterday?',
    'Show my top five products this month.',
    'Find unusual expenses in the selected period.',
    'Summarize this contract and list important deadlines.',
    'What should the owner do next week?',
  ];

  // Conversations list
  const { data: convList } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  });

  // Conversation detail
  const { data: convDetail, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: () => api.getConversation(activeConvId),
    enabled: !!activeConvId,
  });

  useEffect(() => {
    if (convDetail && convDetail.messages) {
      setMessages(convDetail.messages);
    }
  }, [convDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.sendMessage(activeConvId, text, [], { date: currentDate }),
    onSuccess: (data) => {
      // Append assistant message
      const asstMsg: ChatMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        created_at: data.message.created_at,
        artifacts: data.artifacts,
        sources: data.sources,
        usage: data.usage,
      };
      setMessages((prev) => [...prev, asstMsg]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Create conversation mutation
  const createConvMutation = useMutation({
    mutationFn: () => api.createConversation('New Chat'),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConvId(newConv.id);
      setMessages([]);
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sendMutation.isPending) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    sendMutation.mutate(text);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden pb-4">
      {/* Sidebar: Conversation Sessions */}
      <div className="w-64 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shrink-0 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Chats</span>
          <button
            onClick={() => createConvMutation.mutate()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convList?.map((c) => {
            const isActive = c.id === activeConvId;
            return (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all truncate flex items-center justify-between ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{c.title || 'Untitled Chat'}</span>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-500 text-center">
          Persisted in SQLite database
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Operations Advisor</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask financial questions, inspect trends, or analyze legal documents.
                </p>
              </div>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="p-3 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl text-xs text-slate-300 transition-all cursor-pointer shadow-sm"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-sm shadow-md'
                          : 'bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Render Inline Artifacts */}
                    {msg.artifacts && msg.artifacts.length > 0 && (
                      <div className="space-y-3 w-full">
                        {msg.artifacts.map((art) => (
                          <ArtifactRenderer key={art.id} artifact={art} />
                        ))}
                      </div>
                    )}

                    {/* Sources / Metadata */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 pl-1">
                        <span>Sources: {msg.sources.join(', ')}</span>
                        {msg.usage && (
                          <span className="text-emerald-400">
                            · {msg.usage.used_claude ? 'Claude Sonnet' : 'Deterministic Intelligence'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sendMutation.isPending && (
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl rounded-bl-sm text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                Analyzing business data & synthesizing response...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl p-1.5 focus-within:border-emerald-500 transition-all"
          >
            <input
              type="text"
              placeholder="Ask a question or request action (e.g. 'Show top products this month')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sendMutation.isPending}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMutation.isPending}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

