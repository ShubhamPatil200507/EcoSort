import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 sm:px-6 rounded-2xl bg-white border border-[#E1E7E0] max-w-lg mx-auto space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#EAF4EC] text-[#287A54] flex items-center justify-center mx-auto shadow-xs">
        {icon || <PackageOpen className="w-6 h-6 text-[#287A54]" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-[#17231D]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#66736B] leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {primaryActionLabel && onPrimaryAction && (
            <Button variant="primary" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
