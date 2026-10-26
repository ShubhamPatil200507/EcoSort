import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'forest';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#287A54] hover:bg-[#206646] text-white shadow-xs focus:ring-[#287A54]/40 active:translate-y-px',
    forest:
      'bg-[#174D3A] hover:bg-[#10382B] text-white shadow-xs focus:ring-[#174D3A]/40 active:translate-y-px',
    secondary:
      'bg-white hover:bg-[#F7F7F2] text-[#17231D] border border-[#E1E7E0] shadow-xs focus:ring-[#174D3A]/20 active:translate-y-px',
    outline:
      'bg-transparent hover:bg-[#EAF4EC] text-[#287A54] border border-[#287A54]/40 focus:ring-[#287A54]/30',
    danger:
      'bg-[#B42318] hover:bg-[#911c13] text-white shadow-xs focus:ring-[#B42318]/40 active:translate-y-px',
    ghost:
      'bg-transparent hover:bg-stone-100 text-[#17231D] focus:ring-stone-300',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon && iconPosition === 'left' ? (
        <span className="shrink-0">{icon}</span>
      ) : null}

      <span>{children}</span>

      {!loading && icon && iconPosition === 'right' ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
    </button>
  );
};
