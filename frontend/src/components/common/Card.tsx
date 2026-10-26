import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  padding = 'md',
  border = true,
  onClick,
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl ${
        border ? 'border border-[#E1E7E0]' : ''
      } shadow-xs ${className}`}
    >
      {header && (
        <div className="px-4 sm:px-6 py-4 border-b border-[#E1E7E0] bg-[#F7F7F2]/40 rounded-t-2xl">
          {header}
        </div>
      )}
      <div className={paddingStyles}>{children}</div>
      {footer && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#E1E7E0] bg-[#F7F7F2]/40 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};
