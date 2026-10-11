import React from 'react';

export type BadgeVariant =
  | 'burgundy'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'sky'
  | 'sand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  burgundy: 'bg-[#FDF2F3] text-[#790D16] border-[#F7C6C9]',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-stone-100 text-stone-700 border-stone-200',
  sky: 'bg-sky-50 text-sky-800 border-sky-200',
  sand: 'bg-[#F4EFE6] text-[#6F5C3E] border-[#E5D3AF]',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
