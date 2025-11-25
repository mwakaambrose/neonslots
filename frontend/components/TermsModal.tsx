import React from 'react';
import { X, ShieldCheck, Scale, AlertTriangle, ScrollText, Ban } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-zoom-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700 rounded-t-2xl">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ScrollText size={20} className="text-amber-500" />
            Terms & Conditions
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-slate-300 text-sm leading-relaxed space-y-6 no-scrollbar">
          
          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-500" />
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing and using Neon Slots Mobile ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
              <Ban size={18} className="text-red-500" />
              2. Age Restriction (18+)
            </h3>
            <p>
              You must be at least 18 years of age to use this Service. It is an offense for anyone under the age of 18 to participate in gambling activities. We reserve the right to request proof of age and suspend accounts until satisfactory documentation is provided.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
              <Scale size={18} className="text-blue-400" />
              3. Virtual Currency & Payments
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>"Credits" are a virtual currency used solely within the Service.</li>
              <li>Exchange Rate: 1 Credit ≈ 25 UGX. Rates are subject to change.</li>
              <li>Deposits are processed via Mobile Money. You authorize us to initiate requests to your provided phone number.</li>
              <li>Withdrawals are subject to verification (KYC) and Mobile Money network availability.</li>
              <li>Malfunctions void all pays and plays. In the event of a system error, any erroneous winnings will be voided.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              4. Responsible Gaming
            </h3>
            <p>
              We are committed to responsible gaming. You acknowledge that gambling involves risk of losing money. You can set deposit limits or self-exclude by contacting support. The "Reality Check" feature is enabled by default to help you monitor your session time.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">5. Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials (OTP/Phone). We are not liable for any loss or damage arising from your failure to protect your account information.
            </p>
          </section>

           <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
             Last Updated: October 2023
           </div>
        </div>
        
        <div className="p-4 bg-slate-800 border-t border-slate-700 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};