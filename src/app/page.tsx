'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { LogEntryView } from '@/components/LogEntryView';
import { DashboardView } from '@/components/DashboardView';
import { MCASLog } from '@/lib/supabase';

type ViewState = 'log' | 'dashboard';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>('log');
  const [editingLog, setEditingLog] = useState<MCASLog | null>(null);

  const handleEditLog = (log: MCASLog) => {
    setEditingLog(log);
    setCurrentView('log');
  };

  const handleClearEdit = () => {
    setEditingLog(null);
  };

  return (
    <>
      <div className="w-full pb-[140px]">
        {currentView === 'log' && <LogEntryView editingLog={editingLog} onClearEdit={handleClearEdit} />}
        {currentView === 'dashboard' && <DashboardView onEditLog={handleEditLog} />}
      </div>
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />
    </>
  );
}
