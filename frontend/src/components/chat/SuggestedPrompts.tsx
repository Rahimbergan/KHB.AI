import React from 'react';
import { Sparkles, TrendingUp, HelpCircle, Package, AlertOctagon, FileText } from 'lucide-react';

interface Props {
  onSelectPrompt: (prompt: string) => void;
}

export const SuggestedPrompts: React.FC<Props> = ({ onSelectPrompt }) => {
  const suggestions = [
    { text: "Give me today's sales report.", icon: TrendingUp, label: "Kunlik savdo hisoboti" },
    { text: "Why did sales fall compared with yesterday?", icon: HelpCircle, label: "Kechagi savdo bilan solishtirish" },
    { text: "Show my top five products this month.", icon: Package, label: "Top 5 mahsulot" },
    { text: "Find unusual expenses in the selected period.", icon: AlertOctagon, label: "G'ayritabiiy xarajatlar" },
    { text: "Summarize this contract and list important deadlines.", icon: FileText, label: "Shartnomani tahlil qilish" },
    { text: "What should the owner do next week?", icon: Sparkles, label: "Keyingi hafta rejalari" },
  ];

  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        Tavsiya etilgan operatsion so'rovlar
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.text)}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/40 text-left transition group"
          >
            <item.icon className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0 group-hover:text-indigo-300" />
            <div>
              <div className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                "{item.text}"
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
