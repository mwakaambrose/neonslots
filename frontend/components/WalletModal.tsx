import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { walletService } from '../services/walletApi';
import { EXCHANGE_RATE, getProvider, UG_PREFIX } from '../constants';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (newBalance: number) => void;
  phone: string; // Formatted +2567...
  balance?: number; // Needed for withdraw check
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onDepositSuccess, phone, balance = 0 }) => {
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [amount, setAmount] = useState<number>(200); // Default to ~5000 UGX
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'SELECT' | 'PENDING' | 'SUCCESS'>('SELECT');
  const [error, setError] = useState<string>('');
  const [pendingDeposit, setPendingDeposit] = useState<{ message?: string; external_ref?: string } | null>(null);
  const [initialBalance, setInitialBalance] = useState<number>(balance);

  // Packages: 40 (1k), 200 (5k), 1000 (25k), 2000 (50k)
  const depositPackages = [40, 200, 1000, 2000];

  // Poll for balance changes when deposit is pending
  useEffect(() => {
    if (step === 'PENDING' && mode === 'DEPOSIT' && pendingDeposit) {
      const interval = setInterval(async () => {
        try {
          const updatedWallet = await walletService.getBalance();
          if (updatedWallet && typeof updatedWallet.balance === 'number') {
            // Check if balance increased (deposit completed)
            if (updatedWallet.balance > initialBalance) {
              setStep('SUCCESS');
              onDepositSuccess(updatedWallet.balance);
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error('Failed to poll balance', e);
        }
      }, 3000); // Poll every 3 seconds
      
      // Stop polling after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [step, mode, pendingDeposit, initialBalance, onDepositSuccess]);

  // Update initial balance when modal opens
  useEffect(() => {
    if (isOpen) {
      setInitialBalance(balance);
    }
  }, [isOpen, balance]);


  if (!isOpen) return null;

  // Extract body from +256...
  const phoneBody = phone.replace(UG_PREFIX, '');
  const provider = getProvider(phoneBody);

  const resetState = () => {
    setStep('SELECT');
    setLoading(false);
    setError('');
  };

  const handleTabChange = (newMode: 'DEPOSIT' | 'WITHDRAW') => {
    setMode(newMode);
    resetState();
    setAmount(200);
    setCustomAmount('');
  };

  const handleAction = async () => {
    setError('');
    // Don't reset pendingDeposit here, so instructions persist
    // Validate
    let finalAmount = amount;
    if (mode === 'WITHDRAW' && customAmount) {
        finalAmount = parseInt(customAmount, 10);
    }

    if (mode === 'WITHDRAW') {
        if (isNaN(finalAmount) || finalAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (finalAmount > balance) {
            setError('Insufficient credits.');
            return;
        }
    }

    setLoading(true);
    setStep('PENDING');

    try {
      let result;
      if (mode === 'DEPOSIT') {
          result = await walletService.deposit(finalAmount);
          if (result.status === 'pending') {
            setLoading(false);
            setStep('PENDING');
            setPendingDeposit({ message: result.message, external_ref: result.external_ref });
            setInitialBalance(balance); // Set initial balance for polling comparison
            // Do NOT close modal or reset wallet - polling will handle balance update
            return;
          } else {
            setLoading(false);
            setStep('SUCCESS');
            setPendingDeposit(null);
            if (result.wallet && typeof result.wallet.balance === 'number') {
              onDepositSuccess(result.wallet.balance);
            }
          }
      } else {
          result = await walletService.withdraw(finalAmount);
          // If server responded that processing/pending, show instructions
          if (result.status === 'pending' || result.status === 'processing') {
            setLoading(false);
            setStep('PENDING');
            setPendingDeposit({
              message: `UGX ${(finalAmount * EXCHANGE_RATE).toLocaleString()} will be sent to your phone (${phone}). Please wait for a confirmation SMS.`,
              external_ref: result.transactionId || result.external_ref || ''
            });
            return;
          }

          setLoading(false);
          setStep('SUCCESS');
          setPendingDeposit(null);
          // backend may return newBalance or balance
          const newBal = (result && typeof result.balance === 'number') ? result.balance : result?.newBalance;
          if (typeof newBal === 'number') {
            onDepositSuccess(newBal);
          }
      }
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      setStep('SELECT');
      setError(e.message || 'Transaction failed. Please try again.');
    }
  };

  const localCurrencyAmount = ((mode === 'WITHDRAW' && customAmount ? parseInt(customAmount) : amount) * EXCHANGE_RATE).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Wallet size={20} className="text-amber-500" />
            Wallet
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
            <button 
                onClick={() => handleTabChange('DEPOSIT')}
                className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${mode === 'DEPOSIT' ? 'bg-slate-800 text-amber-500 border-b-2 border-amber-500' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
            >
                Top Up
            </button>
            <button 
                onClick={() => handleTabChange('WITHDRAW')}
                className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${mode === 'WITHDRAW' ? 'bg-slate-800 text-green-500 border-b-2 border-green-500' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
            >
                Cashout
            </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {step === 'SELECT' && (
            <>
              {mode === 'DEPOSIT' ? (
                  <>
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${provider === 'MTN' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
                            {provider === 'MTN' ? 'MoMo' : 'Airtel'}
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-400 text-xs uppercase">Pay with Mobile Money</p>
                            <p className="text-white font-mono">{phone}</p>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm mb-4">Select credit package:</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {depositPackages.map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${amount === val ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}
                        >
                            <span className="font-bold text-lg">{val}</span>
                            <span className="text-xs opacity-70">≈ UGX {(val * EXCHANGE_RATE).toLocaleString()}</span>
                        </button>
                        ))}
                    </div>
                  </>
              ) : (
                  <>
                    <div className="bg-slate-800 p-4 rounded-xl mb-6">
                        <p className="text-slate-400 text-xs uppercase mb-1">Available to Withdraw</p>
                        <p className="text-2xl font-mono text-white font-bold">{balance.toLocaleString()} Credits</p>
                        <p className="text-xs text-green-500">≈ UGX {(balance * EXCHANGE_RATE).toLocaleString()}</p>
                    </div>

                    <div className="mb-6 space-y-2">
                         <label className="text-sm font-bold text-slate-300">Amount to Withdraw (Credits)</label>
                         <div className="relative">
                            <input 
                                type="number" 
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-green-500 focus:outline-none"
                            />
                            <button 
                                onClick={() => setCustomAmount(balance.toString())}
                                className="absolute right-2 top-2 text-xs bg-slate-800 hover:bg-slate-700 text-green-400 px-2 py-1.5 rounded"
                            >
                                MAX
                            </button>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${provider === 'MTN' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
                            {provider === 'MTN' ? 'MoMo' : 'Airtel'}
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-400 text-xs uppercase">Withdraw to</p>
                            <p className="text-white font-mono">{phone}</p>
                        </div>
                    </div>
                  </>
              )}

              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm mb-4 font-bold text-center">{error}</div>}

              <button
                onClick={handleAction}
                className={`w-full font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-white transition-all active:scale-95 ${mode === 'DEPOSIT' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/50' : 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/50'}`}
              >
                {mode === 'DEPOSIT' ? <Smartphone size={20} /> : <CreditCard size={20} />}
                {mode === 'DEPOSIT' ? 'Confirm Pay' : 'Withdraw'} UGX {localCurrencyAmount}
              </button>
            </>
          )}

          {step === 'PENDING' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white font-bold text-lg mb-2">Processing...</h3>
              {pendingDeposit ? (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                  <p className="text-amber-500 font-bold mb-2">{pendingDeposit.message}</p>
                  <p className="text-xs text-slate-300">Reference: <span className="font-mono text-amber-400">{pendingDeposit.external_ref}</span></p>
                  <p className="text-xs text-slate-400 mt-2">After payment, your credits will be updated automatically.</p>
                  <button
                    onClick={onClose}
                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  {mode === 'DEPOSIT' 
                    ? `Check your phone (${phone}). Enter PIN to approve payment to Neon Slots.`
                    : `Sending funds to your ${provider} Mobile Money account.`}
                </p>
              )}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-6 animate-zoom-in">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{mode === 'DEPOSIT' ? 'Deposit Successful' : 'Cashout Successful'}</h3>
              <p className={`${mode === 'DEPOSIT' ? 'text-green-400' : 'text-slate-300'} font-mono text-xl mb-6`}>
                {mode === 'DEPOSIT' ? '+' : '-'}{mode === 'WITHDRAW' && customAmount ? customAmount : amount} Credits
              </p>
              <button
                onClick={onClose}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
              >
                Return to Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};