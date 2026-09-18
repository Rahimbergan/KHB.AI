import React from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '../../types/chat';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export const ConversationList: React.FC<Props> = ({
  conversations,
  activeId,
  onSelect,
  onNewChat
}) => {
  return (
    <div className="w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Yangi muloqot
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">Muloqotlar yo'q</div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition group ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700/80'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{conv.title || 'Muloqot'}</span>
                </div>
                {conv.message_count !== undefined && conv.message_count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 group-hover:bg-slate-700">
                    {conv.message_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
