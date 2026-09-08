/**
 * Reusable error states
 */
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import Layout from '@/components/Layout';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
  /** 'network' | 'notfound' | 'generic' */
  variant?: 'network' | 'notfound' | 'generic';
}

export function ErrorState({
  title,
  message,
  onRetry,
  fullPage = false,
  variant = 'generic',
}: Props) {
  const Icon   = variant === 'network' ? WifiOff : AlertCircle;
  const head   = title   ?? (variant === 'network' ? 'Connection error' : variant === 'notfound' ? 'Not found' : 'Something went wrong');
  const detail = message ?? (variant === 'network' ? 'Could not reach the server. Check your connection and try again.' : 'An unexpected error occurred. Please try again.');

  const inner = (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
        <Icon className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-700">{head}</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">{detail}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );

  if (fullPage) return <Layout>{inner}</Layout>;
  return <div className="card">{inner}</div>;
}

/** Inline alert banner (not full-page) */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-error">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1 text-sm">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-2 text-xs font-semibold underline hover:no-underline">
          Retry
        </button>
      )}
    </div>
  );
}
