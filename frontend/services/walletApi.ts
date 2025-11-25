import { Wallet, Transaction } from '../types';
import { getAuthToken } from './authApi';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const walletService = {
  getBalance: async (): Promise<Wallet> => {
    const res = await fetch(`${BASE_URL}/api/wallet/balance`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch wallet balance');
    const data = await res.json();
    return data.wallet;
  },
  deposit: async (amount: number): Promise<{ wallet: Wallet; status: string; message?: string; external_ref?: string; transactionId?: string }> => {
    const res = await fetch(`${BASE_URL}/api/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
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
  withdraw: async (amount: number): Promise<Wallet> => {
    const res = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Withdraw failed');
    return await res.json();
  },
  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  }
};
