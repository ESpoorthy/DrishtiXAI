/**
 * /screening — redirect to patients list so the user picks a patient first
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Users, ScanEye, ArrowRight } from 'lucide-react';

export default function ScreeningIndex() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/patients'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-20 space-y-6 animate-fade-up text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center
                        mx-auto shadow-sm">
          <ScanEye className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Start a Screening</h1>
          <p className="text-ink-muted text-sm mt-2">
            Select or register a patient first, then proceed to upload and analyse a retinal image.
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
        <p className="text-xs text-ink-subtle">Redirecting to patients list…</p>
      </div>
    </Layout>
  );
}
