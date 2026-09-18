import React from 'react';
import { Calendar, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (d: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, onDateChange }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Context Date:</span>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          Seeded period: Dec 2025 – Jan 2026
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Bito Replica</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};

