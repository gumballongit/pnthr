import React from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Upgrade to Premium</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-[#00D632]/10 border border-[#00D632]/30 rounded-2xl p-6 text-center shadow-inner">
            <p className="text-[#00D632] font-medium leading-relaxed text-lg">
              Sorry, CashApp is all we take! Pay using our cashtag @ <strong className="text-white font-bold">$negativesaturn</strong>, Make sure to make the note your username! It may take 3-7 days depending on schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
