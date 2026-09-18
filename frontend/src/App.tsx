import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ChatPage } from './pages/ChatPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  // Default to the target date matching peak seeded operations
  const [currentDate, setCurrentDate] = useState('2026-01-31');

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header currentDate={currentDate} onDateChange={setCurrentDate} />
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
              <Routes>
                <Route path="/" element={<DashboardPage currentDate={currentDate} />} />
                <Route path="/sales" element={<SalesPage currentDate={currentDate} />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/chat" element={<ChatPage currentDate={currentDate} />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

