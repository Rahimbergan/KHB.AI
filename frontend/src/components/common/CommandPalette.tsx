import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Bot,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileUp,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'nav-dash',
      title: 'Boshqaruv paneli',
      subtitle: 'Asosiy KPIlar va savdo dinamikasi',
      icon: LayoutDashboard,
      shortcut: 'G D',
      perform: () => { navigate('/'); onClose(); }
    },
    {
      id: 'nav-sales',
      title: 'Savdo va Tahlil',
      subtitle: 'Barcha cheklar va davriy tahlil vositasi',
      icon: ShoppingBag,
      shortcut: 'G S',
      perform: () => { navigate('/sales'); onClose(); }
    },
    {
      id: 'nav-docs',
      title: 'Hujjatlar markazi',
      subtitle: 'Shartnomalar va hisob-fakturalar tahlili',
      icon: FolderOpen,
      shortcut: 'G H',
      perform: () => { navigate('/documents'); onClose(); }
    },
    {
      id: 'nav-chat',
      title: 'AI Operatsion Yordamchi',
      subtitle: 'Sun\'iy intellektdan hisobot va xulosa so\'rash',
      icon: Bot,
      shortcut: 'G C',
      perform: () => { navigate('/chat'); onClose(); }
    },
    {
      id: 'act-new-chat',
      title: 'Yangi AI muloqot boshlash',
      subtitle: 'Do\'kon holati bo\'yicha yangi suhbat',
      icon: PlusCircle,
      shortcut: '⌘ N',
      perform: () => { navigate('/chat'); onClose(); }
    },
    {
      id: 'act-upload-doc',
      title: 'Yangi hujjat yuklash',
      subtitle: 'PDF, Word yoki Excel shartnomani tahlilga yuborish',
      icon: FileUp,
      shortcut: '⌘ U',
      perform: () => { navigate('/documents'); onClose(); }
    },
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden glass-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-indigo-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Buyruq yoki sahifani qidiring... (Esc - yopish)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Hech qanday buyruq topilmadi</div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={item.perform}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
                    {item.shortcut}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>KHB.AI Tezkor navigatsiya</span>
          <span className="font-mono">Enter - Tanlash • Esc - Chiqish</span>
        </div>
      </div>
    </div>
  );
};
