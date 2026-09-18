import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LegalNotice } from './LegalNotice';
import { CommandPalette } from './CommandPalette';

interface Props {
  children: React.ReactNode;
}

export const Shell: React.FC<Props> = ({ children }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-indigo-500/30">
      <Sidebar onOpenCommand={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          dateRange={dateRange}
          setDateRange={setDateRange}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
        <LegalNotice />
      </div>
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
};
