/**
 * /screening — redirect to patients list so user picks a patient first
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Users, ScanEye, ArrowRight } from 'lucide-react';

export default function ScreeningIndex() {
  const router = useRouter();

  // Auto-redirect after a brief moment
  useEffect(() => {
    const t = setTimeout(() => router.push('/patients'), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto mt-20 space-y-6 animate-fade-up text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-primary-500
                        flex items-center justify-center mx-auto shadow-lg">
          <ScanEye className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Start a Screening</h1>
          <p className="text-slate-500 text-sm mt-2">
            To start a screening, first select or register a patient.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push('/patients')} className="btn-primary">
            <Users className="w-4 h-4" /> Select Patient
          </button>
          <button onClick={() => router.push('/patients/register')} className="btn-secondary">
            Register New Patient <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400">Redirecting to patients list…</p>
      </div>
    </Layout>
  );
}
