'use client';

import React, { useState } from 'react';
import { authApi as authService } from '@/lib/services/authApi';
import { User, Wallet } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { getProvider, UG_PREFIX } from '@/lib/constants';

interface AuthScreenProps {
  onLogin: (user: User, wallet: Wallet) => void;
  onOpenTerms: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onOpenTerms }) => {
  const [phoneBody, setPhoneBody] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    
    if (val.startsWith('0') && val.length > 1) {
        val = val.substring(1);
    }
    
    if (val.length > 9) {
        val = val.substring(0, 9);
    }
    
    setPhoneBody(val);
    setError('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneBody.length !== 9) {
        setError("Please enter a valid 9-digit mobile number.");
        return;
    }

    const provider = getProvider(phoneBody);
    if (!provider) {
        setError("Only MTN and Airtel Uganda numbers are supported.");
        return;
    }

    setLoading(true);
    setError('');
    
    const fullPhone = `${UG_PREFIX}${phoneBody}`;
    
    try {
      await authService.sendOtp(fullPhone);
      setStep('OTP');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send SMS.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fullPhone = `${UG_PREFIX}${phoneBody}`;
    
    try {
      const { user, wallet } = await authService.verifyOtp(fullPhone, otp);
      onLogin(user, wallet);
    } catch {
      setError('Invalid OTP. Try 1234.');
    } finally {
      setLoading(false);
    }
  };

  const provider = getProvider(phoneBody);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 tracking-tighter drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]">
          NEON SLOTS
        </h1>
        <p className="text-slate-400 mt-2 tracking-widest text-xs uppercase">Uganda&apos;s #1 Mobile Casino</p>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl">
        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 uppercase flex justify-between">
                <span>Phone Number</span>
                {provider && (
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${provider === 'MTN' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
                        {provider}
                    </span>
                )}
              </label>
              
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-slate-800 rounded-l-xl border border-r-0 border-slate-700 flex items-center justify-center gap-2">
                    <span className="text-xl">🇺🇬</span>
                    <span className="text-slate-300 font-bold font-mono">+256</span>
                </div>
                
                <input
                  type="tel"
                  value={phoneBody}
                  onChange={handlePhoneChange}
                  placeholder="7XX XXX XXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-28 pr-4 text-white text-lg font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-700"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 justify-center pt-1">
                 <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    MTN: 077/078/076
                 </div>
                 <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    Airtel: 070/075/074
                 </div>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center font-bold bg-red-900/20 p-2 rounded-lg border border-red-900/50">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Validating...' : 'Play Now'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 uppercase">Enter verification code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="XXXX"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] text-white focus:border-amber-500 focus:outline-none transition-all"
                maxLength={4}
                autoFocus
              />
              <p className="text-xs text-center text-slate-500">Sent to +256 {phoneBody}</p>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-transform active:scale-95"
            >
              {loading ? 'Verifying...' : 'Start Playing'}
            </button>
            <button 
                type="button" 
                onClick={() => setStep('PHONE')}
                className="w-full text-slate-500 text-sm hover:text-white"
            >
                Change Number
            </button>
          </form>
        )}
      </div>
      
      <div className="mt-8 text-center text-slate-600 text-xs max-w-xs">
        <p>By playing you agree to our</p>
        <button 
            onClick={onOpenTerms}
            className="text-amber-500 hover:underline font-bold mt-1"
        >
            Terms & Conditions
        </button>
        <p className="mt-2">18+ Only. Play Responsibly.</p>
      </div>
    </div>
  );
};

