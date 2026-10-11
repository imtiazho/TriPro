import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-stone-200/60 rounded-lg w-full" />
      ))}
    </div>
  );
};
