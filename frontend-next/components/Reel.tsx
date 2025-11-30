'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SymbolType } from '@/lib/types';
import { SYMBOLS, REEL_SEQUENCE } from '@/lib/constants';

interface ReelProps {
  symbol: SymbolType;
  isSpinning: boolean;
  stopDelay: number;
  onStop: () => void;
  highlight: boolean;
}

export const Reel: React.FC<ReelProps> = ({ symbol, isSpinning, stopDelay, onStop, highlight }) => {
  const [displaySymbol, setDisplaySymbol] = useState<SymbolType>(symbol);
  const [blur, setBlur] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSpinning) {
      setBlur(true);
      intervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * REEL_SEQUENCE.length);
        setDisplaySymbol(REEL_SEQUENCE[randomIndex]);
      }, 80);

      const timeoutId = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplaySymbol(symbol);
        setBlur(false);
        onStop();
      }, stopDelay);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearTimeout(timeoutId);
      };
    } else {
      setDisplaySymbol(symbol);
      setBlur(false);
    }
  }, [isSpinning, symbol, stopDelay, onStop]);

  const symbolData = SYMBOLS[displaySymbol];

  return (
    <div className={`relative h-24 w-full md:h-32 bg-slate-900 border-x-2 border-slate-800 flex items-center justify-center overflow-hidden transition-all duration-300 ${highlight ? 'bg-slate-800 shadow-[inset_0_0_20px_rgba(255,215,0,0.2)]' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10"></div>
      
      <div className={`text-5xl md:text-6xl transform transition-transform duration-100 ${blur ? 'slot-blur translate-y-4 opacity-70' : 'translate-y-0 opacity-100'} ${highlight ? 'scale-110 animate-bounce' : ''}`}>
        {symbolData.icon}
      </div>
    </div>
  );
};

