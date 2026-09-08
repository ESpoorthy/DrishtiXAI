/**
 * Reusable loading states
 */
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';

interface Props {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = 'Loading…', fullPage = false }: Props) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="w-9 h-9 text-brand-500 animate-spin" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
  if (fullPage) return <Layout>{inner}</Layout>;
  return inner;
}

/** Skeleton placeholder cards */
export function SkeletonCards({ count = 4, cols = 4 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-28" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-0 overflow-hidden space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-none border-b border-slate-100 last:border-0" />
      ))}
    </div>
  );
}
