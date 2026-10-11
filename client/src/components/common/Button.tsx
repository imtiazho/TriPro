import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-[#790D16] text-white hover:bg-[#640E15] active:bg-[#541116] focus:ring-[#790D16] shadow-sm',
    secondary:
      'bg-[#F4EFE6] text-[#5A4C34] hover:bg-[#EAE1D0] active:bg-[#E5D3AF] focus:ring-[#A98E60]',
    outline:
      'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100 focus:ring-[#790D16]',
    danger:
      'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus:ring-red-600',
    ghost:
      'text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 focus:ring-[#790D16]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
