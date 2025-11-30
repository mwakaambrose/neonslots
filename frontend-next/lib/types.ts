export enum SymbolType {
  MATOOKE = 'MATOOKE',
  COFFEE = 'COFFEE',
  ROLEX = 'ROLEX',
  DRUM = 'DRUM',
  BODA = 'BODA',
  CRANE = 'CRANE',
  GORILLA = 'GORILLA',
  SHIELD = 'SHIELD'
}

export interface MachineSymbol {
  id: SymbolType;
  label: string;
  value: number; // Base multiplier
  color: string;
  icon: string;
}

export interface User {
  id: string;
  phone: string;
  isVerified: boolean;
  walletId: string;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string; // e.g., 'UGX', 'KES', 'Credits'
}

export interface SpinResult {
  reels: SymbolType[]; // Array of 3 symbols
  payout: number;
  isWin: boolean;
  isBigWin: boolean;
  isLdw: boolean; // Loss Disguised as Win
  isNearMiss: boolean;
  matchLines: number[]; // Indices of matching lines (0 for MVP single line)
  transactionId: string;
  serverSignature: string; // HMAC simulation
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  WIN_ANIMATION = 'WIN_ANIMATION',
  ERROR = 'ERROR'
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN';
  amount: number;
  timestamp: Date;
}

