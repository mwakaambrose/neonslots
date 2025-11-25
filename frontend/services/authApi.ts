import { User, Wallet } from '../types';

const USER_KEY = 'neonslots_user';
const TOKEN_KEY = 'neonslots_token';

export function saveAuth(user: User, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const authApi = {
  sendOtp: async (phone: string): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone })
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    return true;
  },
  verifyOtp: async (phone: string, otp: string): Promise<{ user: User; wallet: Wallet }> => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, otp })
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    const data = await res.json();
    saveAuth(data.player, data.token);
    return {
      user: data.player,
      wallet: data.wallet,
    };
  },
  logout: async (): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    clearAuth();
    if (!res.ok) throw new Error('Logout failed');
  }
};
