/**
 * Landing page — DrishtiXAI
 * Clean, clinical AI research product feel. No marketing fluff.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import {
  Eye, Upload, ScanEye, FileText, ClipboardCheck,
  ArrowRight, ShieldAlert, CheckCircle2, Activity,
  Microscope, BookOpen,
} from 'lucide-react';

const WORKFLOW = [
  { n: '1', icon: Upload,        label: 'Upload',   sub: 'Fundus / retinal image'       },
  { n: '2', icon: ScanEye,       label: 'Screen',   sub: 'Automated quality + AI analysis' },
  { n: '3', icon: Eye,           label: 'Explain',  sub: 'Grad-CAM visual explanation'  },
  { n: '4', icon: ClipboardCheck,label: 'Review',   sub: 'Clinician review & referral'  },
];

const CAPABILITIES = [
  {
    icon: ScanEye,
    title: 'Automated DR Screening',
    desc:  'EfficientNet-B0 model classifies 5 severity levels: No DR, Mild, Moderate, Severe and Proliferative NPDR.',
  },
  {
    icon: Eye,
    title: 'Image Quality Gate',
    desc:  'Automatic blur, illumination, contrast and coverage checks reject unsuitable images before analysis runs.',
  },
  {
    icon: Microscope,
    title: 'Explainable AI (Grad-CAM)',
    desc:  'Gradient-weighted class activation maps highlight the retinal regions that influenced the model\'s prediction.',
  },
  {
    icon: Activity,
    title: 'Referral Triage',
    desc:  'Severity, confidence and patient risk factors combine to produce a structured referral priority recommendation.',
  },
  {
    icon: ClipboardCheck,
    title: 'Clinical Review Workflow',
    desc:  'Clinicians can review, agree or override AI predictions with a full audit trail.',
  },
  {
    icon: FileText,
    title: 'Screening Report',
    desc:  'Downloadable PDF report covering image quality, prediction, confidence, explanation and referral recommendation.',
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink">DrishtiXAI</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#capabilities"
              className="hidden sm:block text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="hidden sm:block text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Workflow
            </a>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary btn-sm"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 text-center">

          {/* Product badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          bg-white/10 border border-white/20 text-teal-200
                          text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
            AI-Assisted Retinal Screening · Research Prototype
          </div>

          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20
                            flex items-center justify-center shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 text-white">
            DrishtiXAI
          </h1>
          <p className="text-xl text-teal-100 font-medium mb-4">
            Explainable AI-assisted retinal screening
          </p>
          <p className="text-teal-200/80 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Upload a retinal fundus image, assess image quality, screen for diabetic
            retinopathy patterns and inspect the AI's visual explanation — with full
            clinical review workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-teal-800
                         font-bold text-sm shadow-lg hover:bg-teal-50 transition-colors
                         flex items-center justify-center gap-2"
            >
              Launch Screening Platform
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/30
                         text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              View Demo
            </button>
          </div>

        </div>
      </section>

      {/* ── Three outcome states ── */}
      <section className="py-16 bg-surface-muted border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle text-center mb-8">
            Supported screening outcomes
          </p>
          <div className="grid sm:grid-cols-3 gap-4">

            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  State A
                </span>
              </div>
              <p className="font-semibold text-ink text-sm mb-1">
                No supported abnormality detected
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Model found no patterns associated with diabetic retinopathy.
                Routine follow-up recommended.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  State B
                </span>
              </div>
              <p className="font-semibold text-ink text-sm mb-1">
                Possible abnormality detected
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Model detected patterns consistent with DR changes.
                Severity, confidence and referral priority are reported.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  State C
                </span>
              </div>
              <p className="font-semibold text-ink text-sm mb-1">
                Unable to reliably analyse
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Image quality insufficient or image is not a suitable retinal
                photograph. Recapture or clinical assessment recommended.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">
              Screening pipeline
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-ink">
              From image to recommendation in seconds
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-0">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="flex lg:flex-col items-center gap-4 lg:gap-3 flex-1">
                  <div className="flex lg:flex-col items-center gap-4 lg:gap-3 flex-1 w-full">
                    <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center
                                    text-white shadow-md flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="lg:text-center">
                      <p className="font-semibold text-ink text-sm">{step.label}</p>
                      <p className="text-ink-muted text-xs mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-teal-300 flex-shrink-0 lg:rotate-90 hidden lg:block mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section id="capabilities" className="py-20 bg-surface-muted">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">
              Platform capabilities
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-ink">
              Built for transparency and clinical safety
            </h2>
            <p className="text-ink-muted text-sm mt-3 max-w-xl mx-auto">
              Every prediction comes with a confidence score, visual explanation and
              structured referral recommendation — designed for responsible AI-assisted screening.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map(cap => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="bg-white rounded-2xl border border-surface-border p-5
                                                 hover:border-teal-200 hover:shadow-card-hover
                                                 transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100
                                  flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="font-semibold text-ink text-sm mb-1.5">{cap.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Disclaimer section ── */}
      <section className="py-12 bg-white border-t border-surface-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-amber-50 border border-amber-200 text-amber-700
                          text-xs font-semibold mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            Medical Disclaimer
          </div>
          <p className="text-sm text-ink-muted leading-relaxed max-w-lg mx-auto">
            DrishtiXAI is an AI-assisted screening prototype intended for research and
            educational purposes only. Results must not be used as a standalone
            medical diagnosis or treatment decision. All findings should be reviewed
            by a qualified healthcare professional.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-hero text-white">
        <div className="max-w-xl mx-auto text-center px-6">
          <h2 className="text-2xl font-bold mb-3">Run a screening workflow</h2>
          <p className="text-teal-200 text-sm mb-8">
            Sign in and complete a full DR screening in under a minute —
            from image upload to referral recommendation.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-xl bg-white text-teal-800 font-bold text-sm
                       shadow-lg hover:bg-teal-50 transition-colors inline-flex items-center gap-2"
          >
            Launch Platform <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-teal-300/70 text-xs mt-5">
            Research prototype · Not validated for clinical use
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-surface-dark text-slate-500 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center
                        justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-teal-700/60 flex items-center justify-center">
              <Eye className="w-3 h-3 text-teal-300" />
            </div>
            <span className="text-slate-400 font-medium">DrishtiXAI</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Smart India Hackathon 2026 · SIH26038</span>
          </div>
          <span className="text-amber-500/80 font-semibold">Research Prototype · Not for Clinical Use</span>
        </div>
      </footer>

    </div>
  );
}
