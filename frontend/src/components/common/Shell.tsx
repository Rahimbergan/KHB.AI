import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';

interface Props {
  children: React.ReactNode;
}

export const Shell: React.FC<Props> = ({ children }) => {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen font-sans transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onOpenCommand={() => setCommandOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
};
