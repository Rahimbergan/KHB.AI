import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Bot,
  Sparkles,
  Building2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface Props {
  onOpenCommand: () => void;
}

export const Sidebar: React.FC<Props> = ({ onOpenCommand }) => {
  const navItems = [
    { to: '/', label: 'Boshqaruv paneli', icon: LayoutDashboard, exact: true, shortcut: '⌘1' },
    { to: '/sales', label: 'Savdo va Tahlil', icon: ShoppingBag, shortcut: '⌘2' },
    { to: '/documents', label: 'Hujjatlar markazi', icon: FolderOpen, shortcut: '⌘3' },
    { to: '/chat', label: 'AI Yordamchi (Chat)', icon: Bot, badge: 'PRO', shortcut: '⌘4' },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                KHB.AI
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  OPS
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Biznes Yordamchisi</span>
            </div>
          </div>
        </div>

        {/* Business Selector Pill */}
        <div className="p-3 mx-3 my-3.5 rounded-xl bg-slate-900/90 border border-white/[0.06] hover:border-indigo-500/30 transition shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              KHB Smart Retail
            </div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Toshkent, Asosiy filial</span>
            <span className="text-[10px] font-mono text-emerald-400">Bito 2.0</span>
          </div>
        </div>

        {/* Quick Search trigger */}
        <div className="px-3 mb-3">
          <button
            onClick={onOpenCommand}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 transition group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
              Tezkor buyruqlar...
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">
              ⌘K
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                    {item.badge}
                  </span>
                )}
                <span className="text-[10px] opacity-40 font-mono hidden group-hover:inline">
                  {item.shortcut}
                </span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-white/[0.06] bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Operatsion rejim:
          </span>
          <span className="font-mono text-[11px] font-semibold text-emerald-400">Jonli Bito</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
          <span>Hisob valyutasi:</span>
          <span className="text-slate-300 font-semibold">UZS (So'm)</span>
        </div>
      </div>
    </aside>
  );
};
