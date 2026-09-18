import React from 'react';
import { Bot, User, ExternalLink } from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { ArtifactRenderer } from '../artifacts/ArtifactRenderer';

interface Props {
  message: ChatMessage;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string) => {
    // Basic Markdown formatting for headers, quotes, bold, bullets
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('> [!NOTE]') || line.startsWith('> [!WARNING]')) {
        return (
          <div key={i} className="my-2 p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30 text-indigo-300 text-xs">
            {line.replace(/^>\s*\[!.*?\]\s*/, '')}
          </div>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="pl-3 border-l-2 border-slate-700 text-slate-400 italic my-1 text-xs">
            {line.replace(/^>\s*/, '')}
          </blockquote>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-300 text-xs my-0.5">
            {line.substring(2)}
          </li>
        );
      }
      // Bold replace
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <p
          key={i}
          className="text-xs leading-relaxed text-slate-200 min-h-[1em]"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 text-white">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/10'
              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm shadow-sm'
          }`}
        >
          <div className="space-y-1">{renderContent(message.content)}</div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-400">Manbalar:</span>
              {message.sources.map((src, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-indigo-300 text-[10px]"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {src.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Render Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="w-full mt-2">
            {message.artifacts.map((artifact, aIdx) => (
              <ArtifactRenderer key={artifact.id || aIdx} artifact={artifact} />
            ))}
          </div>
        )}

        <span className="text-[10px] text-slate-500 mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
