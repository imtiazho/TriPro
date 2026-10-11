import React from 'react';
import { ObligationStatus } from '../../types';
import { CheckCircle2, XCircle, Clock, AlertTriangle, HelpCircle, Eye } from 'lucide-react';

interface StatusBadgeProps {
  status: ObligationStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'compliant':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Compliant
        </span>
      );
    case 'non_compliant':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Non-Compliant
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          In Progress
        </span>
      );
    case 'pending_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <Eye className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case 'needs_attention':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF2F3] text-[#790D16] border border-[#F7C6C9] ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#790D16]" />
          Needs Attention
        </span>
      );
    case 'not_started':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
          Not Started
        </span>
      );
  }
};
