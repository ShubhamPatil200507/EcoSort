import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  type?: AlertType;
  title: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const styles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: {
      bg: 'bg-[#F0F5FD]',
      border: 'border-[#285DA8]/20',
      text: 'text-[#285DA8]',
      icon: <Info className="w-4 h-4 text-[#285DA8] shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[#EAF4EC]',
      border: 'border-[#287A54]/20',
      text: 'text-[#174D3A]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#287A54] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[#FEF7EC]',
      border: 'border-[#946200]/20',
      text: 'text-[#946200]',
      icon: <AlertTriangle className="w-4 h-4 text-[#946200] shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-[#FEF3F2]',
      border: 'border-[#B42318]/20',
      text: 'text-[#B42318]',
      icon: <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 ${current.bg} ${current.border} flex items-start gap-3 ${className}`}
    >
      {current.icon}
      <div className="flex-1 space-y-1">
        <h5 className={`text-xs sm:text-sm font-semibold ${current.text}`}>{title}</h5>
        {children && <div className="text-xs text-[#17231D]/80 leading-relaxed">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
