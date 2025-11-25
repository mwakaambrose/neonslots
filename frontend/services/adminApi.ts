import { getAuthToken } from './authApi';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const adminService = {
  getConfig: async () => {
    const res = await fetch(`${BASE_URL}/api/admin/config`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch admin config');
    return await res.json();
  },
  setConfig: async (targetRtp: number, maxWinMultiplier: number) => {
    const res = await fetch(`${BASE_URL}/api/admin/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ targetRtp, maxWinMultiplier })
    });
    if (!res.ok) throw new Error('Failed to update admin config');
    return await res.json();
  }
};
