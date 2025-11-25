import { SymbolType, MachineSymbol } from './types';

export const SYMBOLS: Record<SymbolType, MachineSymbol> = {
  [SymbolType.MATOOKE]: { id: SymbolType.MATOOKE, label: 'Matooke', value: 2, color: 'text-green-500', icon: '🍌' },
  [SymbolType.COFFEE]: { id: SymbolType.COFFEE, label: 'Coffee', value: 3, color: 'text-amber-800', icon: '☕' },
  [SymbolType.ROLEX]: { id: SymbolType.ROLEX, label: 'Rolex', value: 5, color: 'text-yellow-500', icon: '🌯' },
  [SymbolType.DRUM]: { id: SymbolType.DRUM, label: 'Engalabi', value: 10, color: 'text-amber-600', icon: '🥁' },
  [SymbolType.BODA]: { id: SymbolType.BODA, label: 'Boda Boda', value: 20, color: 'text-blue-500', icon: '🛵' },
  [SymbolType.CRANE]: { id: SymbolType.CRANE, label: 'Crested Crane', value: 50, color: 'text-red-500', icon: '🦩' },
  [SymbolType.GORILLA]: { id: SymbolType.GORILLA, label: 'Silverback', value: 100, color: 'text-slate-300', icon: '🦍' },
  [SymbolType.SHIELD]: { id: SymbolType.SHIELD, label: 'Wild', value: 200, color: 'text-yellow-400', icon: '🛡️' },
};

export const REEL_SEQUENCE = [
  SymbolType.MATOOKE, SymbolType.COFFEE, SymbolType.ROLEX, SymbolType.MATOOKE, 
  SymbolType.DRUM, SymbolType.BODA, SymbolType.COFFEE, SymbolType.CRANE, 
  SymbolType.GORILLA, SymbolType.ROLEX, SymbolType.SHIELD, SymbolType.DRUM
];

export const BET_LEVELS = [5, 10, 20, 50, 100, 200, 500];
export const INITIAL_CREDITS = 0;
export const REALITY_CHECK_INTERVAL_MS = 60000 * 30; // 30 minutes
export const EXCHANGE_RATE = 25; // 1 Credit = 25 Local Currency Units
export const RECENT_WINS_COUNT = 3; // Limit win history display

export const DISPLAY_RTP = "96.0%"; // Specific RTP to display

// Admin Config Defaults
export const DEFAULT_TARGET_RTP = 0.96; // 96% RTP (4% House Edge)
export const DEFAULT_MAX_WIN_MULTIPLIER = 10; // Cap single wins at 10x bet to reduce variance

// Uganda Specific Constants
export const UG_PREFIX = '+256';
export const MTN_PREFIXES = ['77', '78', '76', '68']; 
export const AIRTEL_PREFIXES = ['70', '75', '74'];

export const getProvider = (phoneBody: string): 'MTN' | 'AIRTEL' | null => {
  if (phoneBody.length !== 9) return null;
  const prefix = phoneBody.substring(0, 2);
  if (MTN_PREFIXES.includes(prefix)) return 'MTN';
  if (AIRTEL_PREFIXES.includes(prefix)) return 'AIRTEL';
  return null;
};