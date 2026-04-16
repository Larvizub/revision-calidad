import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppPageSkeletonProps {
  actionCount?: number;
  showSearch?: boolean;
  rows?: number;
  columns?: number;
}

export const AuthLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Skeleton className="h-16 w-40 rounded-xl" />
        </div>

        <div className="rounded-xl border bg-card/80 p-6 shadow-xl space-y-6">
          <div className="space-y-3 text-center">
            <Skeleton className="h-8 w-56 mx-auto" />
            <Skeleton className="h-4 w-72 max-w-full mx-auto" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        <Skeleton className="h-3 w-64 mx-auto" />
      </div>
    </div>
  );
};

export const AppPageSkeleton: React.FC<AppPageSkeletonProps> = ({
  actionCount = 2,
  showSearch = true,
  rows = 6,
  columns = 4
}) => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {Array.from({ length: actionCount }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-36" />
              ))}
            </div>
          </div>
        </div>

        {showSearch ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-28" />
          </div>
        ) : null}

        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((_, idx) => (
                <Skeleton key={idx} className="h-4" />
              ))}
            </div>

            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, idx) => (
                <div
                  key={idx}
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: columns }).map((__, colIdx) => (
                    <Skeleton key={colIdx} className="h-9" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardLoadingSkeleton: React.FC = () => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 lg:p-6 space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-56 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RevisionLoadingSkeleton: React.FC = () => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 lg:p-6 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-4 lg:p-6 space-y-4">
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-12" />
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-4 space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-3">
              <Skeleton className="h-10 col-span-1" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProfileLoadingSkeleton: React.FC = () => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 lg:p-6 space-y-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface InlineRowsSkeletonProps {
  rows?: number;
}

export const InlineRowsSkeleton: React.FC<InlineRowsSkeletonProps> = ({ rows = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-6 gap-3">
          <Skeleton className="h-9 col-span-2" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      ))}
    </div>
  );
};
