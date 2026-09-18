import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, FileText, MessageSquare, Store, Sparkles } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sales', label: 'Sales & Analytics', icon: ShoppingCart },
    { to: '/documents', label: 'Documents & Legal', icon: FileText },
    { to: '/chat', label: 'AI Operations Chat', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand & Store context */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight">KHB Assistant</h1>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              KHB Smart Retail (UZS)
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Status */}
      <div className="p-4 border-t border-slate-800 m-3 rounded-xl bg-slate-800/40 border">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Local AI Engine</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Deterministic local models & Bito replica active. Claude Sonnet ready if key provided.
        </p>
      </div>
    </aside>
  );
};

