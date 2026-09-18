import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

export const LegalNotice: React.FC = () => {
  return (
    <footer className="bg-slate-950/90 border-t border-white/[0.06] px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 select-none">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="leading-tight">
          <strong className="text-slate-300">Muhim eslatma:</strong> Barcha moliyaviy hisobotlar va shartnoma xulosalari axborot xarakteridagi hisob-kitoblar bo'lib, rasmiy soliq, buxgalteriya yoki sertifikatlangan yuridik maslahat hisoblanmaydi.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] text-slate-500">
        <span>Bito 2.0 Integration</span>
        <span>•</span>
        <span className="text-indigo-400 font-semibold">KHB.AI v1.0 PRO</span>
      </div>
    </footer>
  );
};
