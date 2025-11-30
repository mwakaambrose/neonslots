'use client';

import { User, Wallet } from '../types';

const USER_KEY = 'neonslots_user';

export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

export const authApi = {
  sendOtp: async (phone: string): Promise<boolean> => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    return true;
  },

  verifyOtp: async (phone: string, otp: string): Promise<{ user: User; wallet: Wallet }> => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    const data = await res.json();
    saveUser(data.player);
    return {
      user: data.player,
      wallet: data.wallet,
    };
  },

  logout: async (): Promise<void> => {
    const res = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    clearAuth();
    if (!res.ok) throw new Error('Logout failed');
  }
};

