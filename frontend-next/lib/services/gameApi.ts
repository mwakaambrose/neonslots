'use client';

import { SpinResult, SymbolType } from '../types';
import { SYMBOLS, REEL_SEQUENCE, DEFAULT_TARGET_RTP, DEFAULT_MAX_WIN_MULTIPLIER } from '../constants';

// Admin Configuration State
let adminConfig = {
  targetRtp: DEFAULT_TARGET_RTP,
  maxWinMultiplier: DEFAULT_MAX_WIN_MULTIPLIER
};

// Helper: Pick random item from array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const gameService = {
  setAdminConfig: (config: { targetRtp: number; maxWinMultiplier: number }) => {
    adminConfig = config;
  },

  spin: async (betAmount: number, machineId: number): Promise<SpinResult> => {
    // --- Frontend RNG Logic ---
    // 1. Filter symbols allowed by Max Multiplier Config
    const validSymbols = Object.values(SYMBOLS).filter(s => s.value <= adminConfig.maxWinMultiplier);
    
    // 2. Generate Weighted Pool (Inverse of value)
    const weightedPool: SymbolType[] = [];
    let totalWeight = 0;
    let weightedValueSum = 0;
    validSymbols.forEach(s => {
      const weight = Math.floor(400 / s.value);
      for(let i = 0; i < weight; i++) weightedPool.push(s.id);
      totalWeight += weight;
      weightedValueSum += (weight * s.value);
    });
    
    const averageWinMultiplier = weightedValueSum / totalWeight;
    const calculatedHitFrequency = adminConfig.targetRtp / averageWinMultiplier;
    const rng = Math.random();
    const isTargetWin = rng < calculatedHitFrequency;
    
    let reel1: SymbolType, reel2: SymbolType, reel3: SymbolType;
    let payout = 0;
    let isWin = false;
    let isBigWin = false;
    const isLdw = false;
    let matchLines: number[] = [];
    
    if (isTargetWin) {
      isWin = true;
      const chosenSymbol = pickRandom(weightedPool);
      reel1 = chosenSymbol;
      reel2 = chosenSymbol;
      reel3 = chosenSymbol;
      let multiplier = SYMBOLS[chosenSymbol].value;
      if (multiplier > adminConfig.maxWinMultiplier) multiplier = adminConfig.maxWinMultiplier;
      payout = betAmount * multiplier;
      matchLines = [0];
    } else {
      isWin = false;
      do {
        reel1 = pickRandom(REEL_SEQUENCE);
        reel2 = pickRandom(REEL_SEQUENCE);
        reel3 = pickRandom(REEL_SEQUENCE);
      } while (reel1 === reel2 && reel2 === reel3);
      payout = 0;
    }
    
    const isNearMiss = !isWin && (reel1 === reel2 || reel2 === reel3 || reel1 === reel3);
    if (payout > betAmount * 10) isBigWin = true;
    
    const spinResult: SpinResult = {
      reels: [reel1, reel2, reel3],
      payout,
      isWin,
      isBigWin,
      isLdw,
      isNearMiss,
      matchLines,
      transactionId: 'tx-spin-' + Date.now(),
      serverSignature: 'SIG-' + Math.random().toString(36).substring(7).toUpperCase()
    };
    
    // --- Send to backend for record keeping via Next.js API route ---
    await fetch('/api/game/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machineId,
        bet: betAmount,
        ...spinResult
      })
    });
    
    return spinResult;
  }
};

