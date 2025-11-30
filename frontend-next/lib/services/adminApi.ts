'use client';

export const adminService = {
  getConfig: async () => {
    const res = await fetch('/api/admin/config');
    if (!res.ok) throw new Error('Failed to fetch admin config');
    return await res.json();
  },

  setConfig: async (targetRtp: number, maxWinMultiplier: number) => {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRtp, maxWinMultiplier })
    });
    if (!res.ok) throw new Error('Failed to update admin config');
    return await res.json();
  }
};

