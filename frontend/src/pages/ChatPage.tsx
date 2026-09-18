import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Paperclip,
  Sparkles,
  AlertCircle,
  Trash2,
  Bot,
  Zap,
  RefreshCw,
  Plus,
  MessageSquare
} from 'lucide-react';
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  deleteConversation
} from '../api/chat';
import { ConversationList } from '../components/chat/ConversationList';
import { MessageBubble } from '../components/chat/MessageBubble';
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts';
import { ChatMessage } from '../types/chat';

export const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputContent, setInputContent] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: convsData,
    isLoading: convsLoading,
    isError: convsError,
    error: convsErrObj,
    refetch: refetchConvs
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const conversations = convsData?.data || [];

  // Automatically select first conversation if available
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const {
    data: currentConv,
    isLoading: convDetailLoading
  } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: () => (activeConvId ? getConversation(activeConvId) : null),
    enabled: !!activeConvId,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (currentConv?.messages) {
      setMessages(currentConv.messages);
    } else if (!activeConvId) {
      setMessages([]);
    }
  }, [currentConv, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      let targetConvId = activeConvId;
      if (!targetConvId) {
        const newConv = await createConversation(text.slice(0, 30));
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
      }
      return sendMessage(targetConvId, {
        content: text,
        attachment_ids: [],
        context: { date: new Date().toISOString().split('T')[0] }
      });
    },
    onSuccess: (resp) => {
      setChatError(null);
      const assistantMsg: ChatMessage = {
        id: resp.message.id,
        conversation_id: activeConvId || '',
        role: 'assistant',
        content: resp.message.content,
        sources: resp.sources,
        artifacts: resp.artifacts,
        created_at: resp.message.created_at
      };
      setMessages(prev => [...prev, assistantMsg]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConvId] });
    },
    onError: (err: any) => {
      setChatError(err.message || 'Serverdan javob olishda xatolik yuz berdi');
    }
  });

  const handleSend = (text?: string) => {
    const msgToSend = (text || inputContent).trim();
    if (!msgToSend || sendMutation.isPending) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      conversation_id: activeConvId || '',
      role: 'user',
      content: msgToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputContent('');
    sendMutation.mutate(msgToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    try {
      const newC = await createConversation('Yangi muloqot');
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConvId(newC.id);
      setMessages([]);
    } catch (e: any) {
      setChatError(e.message || "Yangi muloqot yaratib bo'lmadi");
    }
  };

  const handleDeleteChat = async () => {
    if (!activeConvId) return;
    try {
      await deleteConversation(activeConvId);
      setActiveConvId(null);
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (e: any) {
      setChatError(e.message || "Muloqotni o'chirib bo'lmadi");
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] rounded-3xl border border-white/[0.08] bg-slate-900/70 overflow-hidden shadow-2xl backdrop-blur-xl glass-panel">
      {/* Left Conversations Sidebar */}
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => { setActiveConvId(id); setChatError(null); }}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/50 relative">
        {/* Chat Top Bar */}
        <div className="h-14 px-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {currentConv?.title || 'Muloqot tanlanmagan'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Claude Artifact Engine faol
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConvId && (
              <button
                onClick={handleDeleteChat}
                title="Ushbu suhbatni o'chirish"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {chatError && (
          <div className="m-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{chatError}</span>
            </div>
            <button onClick={() => setChatError(null)} className="text-rose-400 font-bold px-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {convsLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Muloqotlar yuklanmoqda...</span>
            </div>
          ) : convsError ? (
            <div className="p-8 text-center text-xs text-rose-400 space-y-3">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <div>Backend serverga ulanish imkoni bo'lmadi: {(convsErrObj as any)?.message}</div>
              <button
                onClick={() => refetchConvs()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
              >
                Qayta urinish
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-3xl mx-auto my-6 space-y-6">
              <div className="text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  KHB.AI Biznes Operatsiyalar Yordamchisi
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Do'koningiz savdosi, xarajatlari va shartnomalari bo'yicha tabiiy tilda savol bering. Tizim real vaqt rejimida grafiklar va jadvallar hosil qiladi.
                </p>
              </div>

              <SuggestedPrompts onSelectPrompt={(p) => handleSend(p)} />
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-3 my-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-indigo-600/20">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-900 border border-white/[0.08] px-4 py-3 rounded-2xl text-xs text-slate-300 flex items-center gap-2.5 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    Backend hisob-kitob bajarmoqda va interaktiv artefakt tayyorlamoqda...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts quick pills above composer */}
        {messages.length > 0 && (
          <div className="px-6 py-2 border-t border-white/[0.04] bg-slate-950/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Tezkor so'rovlar:</span>
            {[
              "Give me today's sales report.",
              "Why did sales fall compared with yesterday?",
              "Show my top five products this month.",
              "Summarize this contract and list important deadlines."
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/[0.06] hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white shrink-0 transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Composer */}
        <div className="p-4 md:p-5 border-t border-white/[0.06] bg-slate-900/80 backdrop-blur-xl">
          <div className="relative rounded-2xl border border-white/[0.08] bg-slate-950/90 focus-within:border-indigo-500/60 transition p-2.5 shadow-xl">
            <textarea
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Savolingizni yozing... (masalan: 'Bugungi savdo hisobotini ber', 'Qaysi tovarlar ko‘p sotilmoqda?')"
              rows={2}
              className="w-full bg-transparent resize-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none px-2 py-1 leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] px-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Fayl biriktirish"
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  Enter: Yuborish • Shift+Enter: Yangi qator
                </span>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputContent.trim() || sendMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Yuborish</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
