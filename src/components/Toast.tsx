import React from 'react';
import { Check, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#262a33] border border-[#31353e] px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs text-[#dfe2ee] transition-all animate-bounce">
      {type === 'success' ? (
        <span className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#4edea3]">
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className="w-5 h-5 rounded-full bg-[#4cd7f6]/20 flex items-center justify-center text-[#4cd7f6]">
          <Info className="w-3.5 h-3.5" />
        </span>
      )}
      <span>{message}</span>
    </div>
  );
};
