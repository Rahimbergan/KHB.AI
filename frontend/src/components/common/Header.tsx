import React, { useState, useEffect } from 'react';
import { Search, Calendar, Zap, CheckCircle2, AlertCircle, Bell, RefreshCw } from 'lucide-react';
import { checkBackendHealth } from '../../api/dashboard';

interface Props {
  dateRange: string;
  setDateRange: (range: string) => void;
  onOpenCommand: () => void;
}

export const Header: React.FC<Props> = ({ dateRange, setDateRange, onOpenCommand }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await checkBackendHealth();
      setBackendOnline(res.status === 'ok' || res.status === 'healthy');
    } catch {
      setBackendOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input trigger */}
      <div
        onClick={onOpenCommand}
        className="flex items-center gap-3 w-80 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-400 hover:text-slate-300 transition cursor-pointer shadow-inner"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 truncate">Qidirish yoki ⌘K buyruqlar...</span>
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] font-mono text-slate-400">
          ⌘K
        </kbd>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="today" className="bg-slate-900 text-slate-200">Bugungi kun</option>
            <option value="7d" className="bg-slate-900 text-slate-200">Oxirgi 7 kun</option>
            <option value="30d" className="bg-slate-900 text-slate-200">Oxirgi 30 kun</option>
            <option value="this_month" className="bg-slate-900 text-slate-200">Joriy oy</option>
          </select>
        </div>

        {/* Live Backend Connection Indicator */}
        <div
          onClick={checkHealth}
          title="Backend ulanishini tekshirish uchun bosing"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition ${
            backendOnline === true
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
              : backendOnline === false
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
        >
          {checking ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : backendOnline ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span className="font-mono text-[11px]">
            {backendOnline === true ? 'Backend: Jonli' : backendOnline === false ? 'Backend: O‘chiq' : 'Tekshirilmoqda'}
          </span>
        </div>

        {/* AI Mode Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-300 border border-purple-500/30">
          <Zap className="w-3 h-3 text-purple-400" />
          <span>Claude AI</span>
        </div>

        {/* Notification Bell */}
        <button
          title="Bildirishnomalar"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.06] text-slate-400 hover:text-white transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            KB
          </div>
        </div>
      </div>
    </header>
  );
};
