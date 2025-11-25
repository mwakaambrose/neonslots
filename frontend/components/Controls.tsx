import React from 'react';
import { GameState } from '../types';
import { Minus, Plus, RefreshCw, Play } from 'lucide-react';

interface ControlsProps {
  bet: number;
  onIncreaseBet: () => void;
  onDecreaseBet: () => void;
  onSpin: () => void;
  gameState: GameState;
  autoSpin: boolean;
  toggleAutoSpin: () => void;
  balance: number;
}

export const Controls: React.FC<ControlsProps> = ({
  bet,
  onIncreaseBet,
  onDecreaseBet,
  onSpin,
  gameState,
  autoSpin,
  toggleAutoSpin,
  balance
}) => {
  const isSpinning = gameState === GameState.SPINNING;
  const canSpin = gameState === GameState.IDLE || gameState === GameState.WIN_ANIMATION || gameState === GameState.ERROR;
  const insufficientFunds = balance < bet;

  return (
    <div className="w-full bg-slate-900 p-4 pb-8 rounded-t-3xl border-t border-amber-500/30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center">
      
      {/* Utility Toggles - Top Row Centered */}
      <div className="flex justify-center mb-6 text-xs font-bold tracking-wider text-slate-400 w-full">
        <button 
          onClick={toggleAutoSpin}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-full border transition-all ${autoSpin ? 'bg-green-600 border-green-400 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'border-slate-700 hover:bg-slate-800'}`}
        >
          <RefreshCw size={14} className={autoSpin ? 'animate-spin' : ''} /> AUTO
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        
        {/* Spin Button - Center Main */}
        <div className="flex justify-center relative">
           {/* Glow behind button */}
           <div className={`absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 ${canSpin && !insufficientFunds ? 'animate-pulse' : ''}`}></div>
           
           <button
            onClick={onSpin}
            disabled={!canSpin || insufficientFunds}
            className={`
              relative w-28 h-28 rounded-full flex items-center justify-center
              bg-gradient-to-b from-amber-400 to-amber-600
              border-4 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]
              transform transition-all active:scale-95 disabled:grayscale disabled:shadow-none z-10
              ${autoSpin ? 'animate-pulse' : ''}
            `}
          >
            <span className="absolute inset-0 rounded-full bg-white opacity-20 hover:opacity-0 transition-opacity"></span>
            {isSpinning ? (
               <span className="font-black text-amber-950 text-xl uppercase tracking-widest">Stop</span>
            ) : (
               <Play size={48} className="fill-amber-950 text-amber-950 ml-2" />
            )}
          </button>
        </div>

        {/* Bet Control - Below Spin */}
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Bet</span>
          <div className="flex items-center justify-between bg-slate-950 rounded-2xl p-1 border border-slate-800 w-full max-w-[240px]">
            <button 
              onClick={onDecreaseBet}
              disabled={isSpinning}
              className="p-3 hover:bg-slate-800 rounded-xl disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
            >
              <Minus size={20} />
            </button>
            <div className="flex flex-col items-center">
               <span className="font-mono font-bold text-amber-500 text-2xl leading-none">{bet}</span>
               <span className="text-[9px] text-slate-600 font-bold uppercase">Credits</span>
            </div>
            <button 
              onClick={onIncreaseBet}
              disabled={isSpinning}
              className="p-3 hover:bg-slate-800 rounded-xl disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

      </div>
      
      {insufficientFunds && (
        <div className="text-center text-red-500 text-xs mt-4 font-bold animate-pulse bg-red-900/20 px-4 py-1 rounded-full border border-red-900/50">
          INSUFFICIENT FUNDS
        </div>
      )}
    </div>
  );
};