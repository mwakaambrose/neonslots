'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SymbolType, User, Wallet, SpinResult, GameState } from '@/lib/types';
import { BET_LEVELS, REALITY_CHECK_INTERVAL_MS, DISPLAY_RTP, RECENT_WINS_COUNT } from '@/lib/constants';
import { gameService } from '@/lib/services/gameApi';
import { walletService } from '@/lib/services/walletApi';
import { adminService } from '@/lib/services/adminApi';

import { Reel } from './Reel';
import { Controls } from './Controls';
import { AuthScreen } from './AuthScreen';
import { WalletModal } from './WalletModal';
import { TermsModal } from './TermsModal';
import { RealityCheck } from './ResponsibleGaming';
import { Wallet as WalletIcon, User as UserIcon, LogOut, Info, RefreshCw } from 'lucide-react';

export default function SlotGame() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [betIndex, setBetIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [reels, setReels] = useState<SymbolType[]>([SymbolType.MATOOKE, SymbolType.MATOOKE, SymbolType.MATOOKE]);
  const [winData, setWinData] = useState<SpinResult | null>(null);
  const [recentWins, setRecentWins] = useState<{id: string; amount: number}[]>([]);
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Game Settings
  const [autoSpin, setAutoSpin] = useState(false);
  
  // Modals
  const [showWallet, setShowWallet] = useState(false);
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Hints
  const [showDepositHint, setShowDepositHint] = useState(false);
  
  // Stats for Reality Check
  const [sessionStart, setSessionStart] = useState<number>(Date.now());
  const [startBalance, setStartBalance] = useState<number>(0);

  // Refs for intervals/timeouts
  const autoSpinRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realityCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const betAmount = BET_LEVELS[betIndex];

  // --- Effects ---

  // Hydration: Load user from localStorage after mount
  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem('neonslots_user');
      if (raw) {
        const savedUser = JSON.parse(raw);
        setUser(savedUser);
        // Fetch wallet using token
        walletService.getBalance().then(setWallet).catch(() => setWallet(null));
      }
    } catch {
      // ignore
    }
  }, []);

  // Expose Admin to Window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).admin = adminService;
      console.log("%c Admin Mode Active ", "background: #222; color: #bada55");
      console.log("Use window.admin.setConfig(targetRtp, maxMultiplier) to adjust House Edge.");
    }
  }, []);

  // Initialize Session on Login
  useEffect(() => {
    if (user && wallet) {
      setSessionStart(Date.now());
      setStartBalance(wallet.balance);
      
      realityCheckRef.current = setInterval(() => {
        if (autoSpin) setAutoSpin(false);
        setShowRealityCheck(true);
      }, REALITY_CHECK_INTERVAL_MS);
    }
    return () => {
      if (realityCheckRef.current) clearInterval(realityCheckRef.current);
    };
  }, [user, wallet, autoSpin]);

  // Deposit Hint Logic
  useEffect(() => {
    if (wallet && wallet.balance < 50 && !showWallet) {
        setShowDepositHint(true);
    } else {
        setShowDepositHint(false);
    }
  }, [wallet, showWallet]);

  // Auto Spin Logic
  useEffect(() => {
    if (autoSpin && gameState === GameState.IDLE && wallet && wallet.balance >= betAmount) {
       const delay = 1500;
       autoSpinRef.current = setTimeout(() => {
         handleSpin();
       }, delay);
    } else if (autoSpin && (wallet?.balance || 0) < betAmount) {
        setAutoSpin(false);
    }

    return () => {
      if (autoSpinRef.current) clearTimeout(autoSpinRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin, gameState, wallet, betAmount]);


  // --- Handlers ---

  const handleLogin = async (u: User, w: Wallet) => {
    setUser(u);
    setWallet(w);
    try {
      const config = await adminService.getConfig();
      if (config && typeof config.target_rtp === 'number' && typeof config.max_win_multiplier === 'number') {
        gameService.setAdminConfig({
          targetRtp: config.target_rtp,
          maxWinMultiplier: config.max_win_multiplier
        });
      }
    } catch (e) {
      console.error('Failed to fetch admin config', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('neonslots_user');
    setUser(null);
    setWallet(null);
    setAutoSpin(false);
    setGameState(GameState.IDLE);
    setRecentWins([]);
  };

  const handleRefreshWallet = async () => {
    if (!wallet || isRefreshingWallet) return;
    setIsRefreshingWallet(true);
    try {
        const updatedWallet = await walletService.getBalance();
        setWallet(updatedWallet);
    } catch (e) {
        console.error("Failed to refresh wallet", e);
    } finally {
        setTimeout(() => setIsRefreshingWallet(false), 500);
    }
  };

  const handleDepositSuccess = (newBalance: number) => {
    if (wallet) {
      setWallet({ ...wallet, balance: newBalance });
    }
  };

  const handleSpin = useCallback(async () => {
    if (!wallet || wallet.balance < betAmount || gameState === GameState.SPINNING) return;

    setGameState(GameState.SPINNING);
    setWinData(null);
    
    setWallet(prev => prev ? { ...prev, balance: prev.balance - betAmount } : null);

    try {
      const machineId = 1;
      const result = await gameService.spin(betAmount, machineId);
      
      const visualDelay = 1000;
      
      setTimeout(() => {
        setReels(result.reels);
        setWinData(result);
        
        if (result.payout > 0) {
           setGameState(GameState.WIN_ANIMATION);
           setWallet(prev => prev ? { ...prev, balance: prev.balance + result.payout } : null);
           
           setRecentWins(prev => [{ id: result.transactionId, amount: result.payout }, ...prev].slice(0, RECENT_WINS_COUNT));

           setTimeout(() => {
             setGameState(GameState.IDLE);
           }, 2500);
        } else {
           setGameState(GameState.IDLE);
        }
      }, visualDelay);

    } catch (e) {
      console.error(e);
      setGameState(GameState.ERROR);
      setAutoSpin(false);
    }
  }, [wallet, betAmount, gameState]);

  // --- Render ---

  // Show loading during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !wallet) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} onOpenTerms={() => setShowTerms(true)} />
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </>
    );
  }

  const netWinLoss = wallet.balance - startBalance;
  const sessionMinutes = Math.floor((Date.now() - sessionStart) / 60000);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-2xl flex justify-between items-center p-4 z-20 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-2">
            <div className="bg-amber-500 rounded-full p-1"><UserIcon size={16} className="text-black" /></div>
            <span className="text-sm font-bold text-slate-300 hidden sm:block">{user.phone}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
                
                <button 
                    onClick={handleRefreshWallet}
                    className="bg-slate-800 p-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Refresh Balance"
                >
                    <RefreshCw size={14} className={isRefreshingWallet ? 'animate-spin text-green-500' : ''} />
                </button>

                <div 
                    className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer hover:bg-slate-700 transition-all relative z-20 ring-1 ring-amber-500/50"
                    onClick={() => setShowWallet(true)}
                >
                    <WalletIcon size={16} className="text-amber-500" />
                    <span className="text-amber-400 font-mono font-bold tracking-wide">{wallet && typeof wallet.balance === 'number' ? wallet.balance.toLocaleString() : '0'}</span>
                </div>

                {showDepositHint && (
                    <div className="absolute top-full right-0 mt-3 z-30 animate-bounce flex flex-col items-end pointer-events-none w-32">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-500 mr-6"></div>
                        <div className="bg-amber-500 text-black text-xs font-bold px-3 py-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.6)] text-center w-full">
                            Tap to Buy Credit
                        </div>
                    </div>
                )}
            </div>
            
            <div className="w-px h-6 bg-slate-800 mx-1"></div>

            <button onClick={() => setShowTerms(true)} className="text-slate-500 hover:text-white">
                <Info size={20} />
            </button>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 w-full max-w-2xl flex flex-col z-10 relative">

        {/* Slot Machine Container */}
        <div className="flex-1 flex flex-col justify-center p-4">
          
          {/* Win/Message Banner */}
          <div className="h-32 mb-2 flex items-center justify-center relative pointer-events-none z-30">
             {gameState === GameState.WIN_ANIMATION && winData && (
                <div className={`text-center relative ${winData.isBigWin ? 'scale-125' : 'scale-100'} transition-transform duration-300`}>
                   <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full animate-pulse"></div>
                   
                   <div className="font-black text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 via-amber-400 to-yellow-100 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] animate-bounce relative z-10">
                     {winData.isBigWin ? 'BIG WIN!' : 'WINNER!'}
                   </div>
                   
                   <div className="text-green-400 font-mono text-5xl md:text-6xl font-black mt-2 drop-shadow-md animate-float-up relative z-10" style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.5)' }}>
                     +{winData.payout}
                   </div>
                   
                   {winData.isLdw && (
                       <div className="text-xs text-slate-400 mt-2 uppercase tracking-widest bg-black/50 px-2 py-1 rounded inline-block">Payout {winData.payout} credits</div>
                   )}
                </div>
             )}
             
             {winData?.isNearMiss && gameState === GameState.IDLE && (
                 <div className="text-center animate-zoom-in">
                    <div className="text-amber-500 font-black uppercase tracking-tighter text-6xl md:text-8xl drop-shadow-[0_4px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px #78350f' }}>
                        SO CLOSE!
                    </div>
                    <div className="text-amber-200 text-lg font-bold uppercase tracking-widest mt-2">Try Again</div>
                 </div>
             )}
             
             {gameState === GameState.IDLE && !winData?.isWin && !winData?.isNearMiss && (
                 <div className="text-slate-700 text-sm uppercase tracking-[0.3em] font-bold border border-slate-800 px-6 py-2 rounded-full">
                    Good Luck
                 </div>
             )}
          </div>

          {/* The Reels */}
          <div className="bg-black border-4 border-amber-600 rounded-lg p-2 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative z-20">
            <div className="absolute top-1/2 w-full h-0.5 bg-red-500/50 z-20 pointer-events-none transform -translate-y-1/2 shadow-[0_0_8px_red]"></div>
            
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              <Reel 
                symbol={reels[0]} 
                isSpinning={gameState === GameState.SPINNING} 
                stopDelay={100} 
                onStop={() => {}}
                highlight={!!winData?.isWin && winData.matchLines.includes(0)}
              />
              <Reel 
                symbol={reels[1]} 
                isSpinning={gameState === GameState.SPINNING} 
                stopDelay={300} 
                onStop={() => {}}
                highlight={!!winData?.isWin && winData.matchLines.includes(0)}
              />
              <Reel 
                symbol={reels[2]} 
                isSpinning={gameState === GameState.SPINNING} 
                stopDelay={600} 
                onStop={() => {}}
                highlight={!!winData?.isWin && winData.matchLines.includes(0)}
              />
            </div>
          </div>
          
          {/* Machine Info */}
          <div className="flex justify-between text-[10px] text-slate-600 mt-3 px-2 uppercase font-bold tracking-wider">
            <span>Lines: 1</span>
            <span>RTP: {DISPLAY_RTP}</span>
            <span>ID: {user.phone.slice(-4)}</span>
          </div>

        </div>

        {/* Controls Area */}
        <Controls 
          bet={betAmount}
          onIncreaseBet={() => setBetIndex(prev => Math.min(prev + 1, BET_LEVELS.length - 1))}
          onDecreaseBet={() => setBetIndex(prev => Math.max(prev - 1, 0))}
          onSpin={handleSpin}
          gameState={gameState}
          autoSpin={autoSpin}
          toggleAutoSpin={() => setAutoSpin(!autoSpin)}
          balance={wallet.balance}
        />
      </main>

      {/* Overlays */}
      <WalletModal 
        isOpen={showWallet} 
        onClose={() => setShowWallet(false)}
        onDepositSuccess={handleDepositSuccess}
        phone={user.phone}
        balance={wallet.balance}
      />
      
      <RealityCheck 
        isOpen={showRealityCheck}
        sessionDurationMinutes={sessionMinutes}
        netWinLoss={netWinLoss}
        onContinue={() => setShowRealityCheck(false)}
        onExit={handleLogout}
      />

      <TermsModal 
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      
    </div>
  );
}

