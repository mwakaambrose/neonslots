'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface RealityCheckProps {
  isOpen: boolean;
  onContinue: () => void;
  onExit: () => void;
  sessionDurationMinutes: number;
  netWinLoss: number;
}

export const RealityCheck: React.FC<RealityCheckProps> = ({ isOpen, onContinue, onExit, sessionDurationMinutes, netWinLoss }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-6">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border-2 border-amber-600 shadow-2xl overflow-hidden animate-shake">
        <div className="bg-amber-600 p-4 flex items-center justify-center gap-2">
          <Clock className="text-white" />
          <h2 className="text-white font-bold text-xl uppercase">Reality Check</h2>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-slate-300 mb-6 text-lg">
            You have been playing for <span className="text-white font-bold">{sessionDurationMinutes} minutes</span>.
          </p>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-8">
            <p className="text-xs text-slate-400 uppercase mb-1">Session Result</p>
            <p className={`text-2xl font-mono font-bold ${netWinLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netWinLoss >= 0 ? '+' : ''}{netWinLoss} Credits
            </p>
          </div>

          <div className="space-y-3">
             <button
                onClick={onContinue}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue Playing
              </button>
              <button
                onClick={onExit}
                className="w-full bg-transparent border border-slate-600 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-colors"
              >
                Exit Game
              </button>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
             <AlertTriangle size={14} />
             <span>Gambling can be addictive. Know your limits.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

