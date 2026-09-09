/**
 * LoadingSpinner — inline and full-page loading states
 */
import { Eye, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';

interface Props {
  fullPage?: boolean;
  message?:  string;
}

function SpinnerContent({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Eye className="w-7 h-7 text-teal-400" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
      {message && <p className="text-sm text-ink-muted">{message}</p>}
    </div>
  );
}

export function LoadingSpinner({ fullPage, message }: Props) {
  if (fullPage) {
    return (
      <Layout>
        <SpinnerContent message={message} />
      </Layout>
    );
  }
  return (
    <div className="card">
      <SpinnerContent message={message} />
    </div>
  );
}

/** Compact inline spinner */
export function InlineSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}
