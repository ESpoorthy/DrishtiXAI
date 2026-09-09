/**
 * Error state components — inline banner and full-page state
 */
import { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';

interface BannerProps {
  message:   string;
  onRetry?:  () => void;
}

export function ErrorBanner({ message, onRetry }: BannerProps) {
  return (
    <div className="alert alert-error">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-semibold
                     text-red-700 hover:text-red-800 transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}

interface StateProps {
  title?:    string;
  message:   string;
  onRetry?:  () => void;
  fullPage?: boolean;
  children?: ReactNode;
}

function Inner({ title, message, onRetry, children }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200
                      flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      {title && <p className="font-semibold text-ink text-base">{title}</p>}
      <p className="text-ink-muted text-sm max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-2">
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ fullPage, ...rest }: StateProps) {
  if (fullPage) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-8 card">
          <Inner {...rest} />
        </div>
      </Layout>
    );
  }
  return (
    <div className="card">
      <Inner {...rest} />
    </div>
  );
}
