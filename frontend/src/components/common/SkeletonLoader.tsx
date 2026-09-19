import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'rounded-xl h-32 w-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded h-4 w-full';
    }
  };

  const baseStyles = 'animate-pulse bg-slate-200/80 dark:bg-slate-800/80';

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${getVariantStyles()} ${className}`}
          />
        ))}
      </div>
    );
  }

  return <div className={`${baseStyles} ${getVariantStyles()} ${className}`} />;
};

export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="w-24 h-3.5" />
      <Skeleton variant="circular" className="w-8 h-8" />
    </div>
    <Skeleton className="w-36 h-7" />
    <div className="flex items-center gap-2 pt-1">
      <Skeleton className="w-14 h-4" />
      <Skeleton className="w-20 h-3" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b border-slate-100 dark:border-slate-800/50">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <Skeleton className={`h-4 ${i === 0 ? 'w-36' : 'w-20'}`} />
      </td>
    ))}
  </tr>
);
