import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FDF2F3] text-[#790D16] flex items-center justify-center mb-4">
        {icon || <ShieldAlert className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-stone-900">{title}</h4>
      <p className="text-sm text-stone-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
