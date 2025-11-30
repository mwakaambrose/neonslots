import React, { useState } from 'react';
import { authApi as authService } from '../services/authApi';
import { User, Wallet } from '../types';
import { ArrowRight } from 'lucide-react';
import { getProvider, UG_PREFIX } from '../constants';

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
    // Strip non-digits
    let val = e.target.value.replace(/\D/g, '');
    
    // If user pastes 077..., strip the leading 0
    if (val.startsWith('0') && val.length > 1) {
        val = val.substring(1);
    }
    
    // Limit to 9 digits (standard UG mobile length without 0)
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
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS.');
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
    } catch (err) {
      setError('Invalid OTP. Try 1234.');
    } finally {
      setLoading(false);
    }
  };

  const provider = getProvider(phoneBody);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating slot symbols */}
        {['🍌', '☕', '🌯', '🥁', '🛵', '🦩', '🦍', '🛡️'].map((symbol, i) => (
          <div
            key={i}
            className="absolute text-5xl opacity-20 animate-bounce"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '2s',
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Hero with animated slot machine */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            {/* Animated slot machine display */}
            <div className="inline-block bg-black border-4 border-amber-600 rounded-xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <div className="grid grid-cols-3 gap-2">
                {['🦍', '🦍', '🦍'].map((symbol, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border-2 border-amber-500 rounded-lg p-3 text-3xl flex items-center justify-center h-16 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-black mb-2">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
              NEON
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              SLOTS
            </span>
          </h1>
          <p className="text-slate-300 mt-2 tracking-widest text-sm uppercase font-bold">🎰 Uganda's #1 Mobile Casino 🎰</p>
          
          {/* Win animation preview */}
          <div className="mt-4 text-center">
            <div className="inline-block bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-2">
              <span className="text-green-400 font-black text-lg animate-pulse">💰 BIG WIN! +10,000 Credits 💰</span>
            </div>
          </div>
        </div>

      <div className="w-full bg-slate-900/80 backdrop-blur-md border-4 border-amber-600 p-8 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.3)]">
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
                {/* Fixed Country Code */}
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
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-5 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-lg transform hover:scale-105"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🎰</span>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>🎰</span>
                  <span>PLAY NOW</span>
                  <ArrowRight size={20} />
                </>
              )}
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-5 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] transition-all active:scale-95 text-lg transform hover:scale-105"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🎰</span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>🎰</span>
                  <span>START PLAYING</span>
                </>
              )}
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