'use client';

import { PenLine, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ViewState = 'log' | 'dashboard';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export function BottomNav({ currentView, onChangeView }: BottomNavProps) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 glass-nav z-50 h-20 sm:rounded-b-[1.7rem] overflow-hidden flex items-center px-4 pb-2">
      <div className="flex w-full space-x-2">
        <button
          onClick={() => onChangeView('log')}
          className={twMerge(
            "flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300",
            currentView === 'log'
              ? "bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <PenLine size={24} className={clsx("mb-1", currentView === 'log' && "animate-pulse")} />
          <span className="text-xs font-semibold">Log Entry</span>
        </button>

        <button
          onClick={() => onChangeView('dashboard')}
          className={twMerge(
            "flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300",
            currentView === 'dashboard'
              ? "bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <BarChart3 size={24} className={clsx("mb-1", currentView === 'dashboard' && "animate-pulse")} />
          <span className="text-xs font-semibold">Dashboard</span>
        </button>
      </div>
    </nav>
  );
}
