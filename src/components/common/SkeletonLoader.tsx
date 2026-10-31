import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ className = "h-6 w-full", count = 1 }) => {
  return (
    <div className="space-y-3 animate-pulse" role="status" aria-label="Loading data">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-200 dark:bg-slate-800/80 rounded-md ${className}`}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};
