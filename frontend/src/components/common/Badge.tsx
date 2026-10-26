import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export type BadgeStatus =
  | 'validated'
  | 'eligible'
  | 'warning'
  | 'review'
  | 'prohibited'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'unknown';

export interface BadgeProps {
  status: BadgeStatus;
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  icon,
  size = 'md',
  className = '',
}) => {
  const defaultIcons: Record<BadgeStatus, React.ReactNode> = {
    validated: <CheckCircle2 className="w-3.5 h-3.5" />,
    eligible: <ShieldCheck className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    review: <Clock className="w-3.5 h-3.5" />,
    prohibited: <XCircle className="w-3.5 h-3.5" />,
    danger: <XCircle className="w-3.5 h-3.5" />,
    info: <Info className="w-3.5 h-3.5" />,
    neutral: <span className="w-1.5 h-1.5 rounded-full bg-current" />,
    unknown: <HelpCircle className="w-3.5 h-3.5" />,
  };

  const statusStyles: Record<BadgeStatus, string> = {
    validated: 'bg-[#EAF4EC] text-[#174D3A] border-[#287A54]/25',
    eligible: 'bg-[#EAF4EC] text-[#174D3A] border-[#287A54]/25',
    warning: 'bg-[#FEF7EC] text-[#946200] border-[#946200]/25',
    review: 'bg-[#FEF7EC] text-[#946200] border-[#946200]/25',
    prohibited: 'bg-[#FEF3F2] text-[#B42318] border-[#B42318]/25',
    danger: 'bg-[#FEF3F2] text-[#B42318] border-[#B42318]/25',
    info: 'bg-[#F0F5FD] text-[#285DA8] border-[#285DA8]/25',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    unknown: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${statusStyles[status]} ${sizeStyles} ${className}`}
    >
      <span className="shrink-0">{icon || defaultIcons[status]}</span>
      <span>{label}</span>
    </span>
  );
};
