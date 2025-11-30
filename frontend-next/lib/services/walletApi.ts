'use client';

import { Wallet, Transaction } from '../types';

export const walletService = {
  getBalance: async (): Promise<Wallet> => {
    const res = await fetch('/api/wallet/balance');
    if (!res.ok) throw new Error('Failed to fetch wallet balance');
    const data = await res.json();
    return data.wallet;
  },

  deposit: async (amount: number): Promise<{ 
    wallet: Wallet; 
    status: string; 
    message?: string; 
    external_ref?: string; 
    transactionId?: string 
  }> => {
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Deposit failed');
    const data = await res.json();
    return {
      wallet: data.wallet,
      status: data.status,
      message: data.message,
      external_ref: data.external_ref,
      transactionId: data.transactionId,
    };
  },

  withdraw: async (amount: number): Promise<Wallet & { status?: string; transactionId?: string; external_ref?: string }> => {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Withdraw failed');
    return await res.json();
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch('/api/wallet/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  }
};

