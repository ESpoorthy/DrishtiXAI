/**
 * Landing page
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import {
  Eye, Shield, Zap, Users, Globe, Heart,
  ArrowRight, CheckCircle2, Star,
} from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Explainable AI',        desc: 'Grad-CAM heatmaps show exactly which retinal regions drove every prediction.',       color: 'from-blue-500 to-brand-600' },
  { icon: Zap,    title: 'Quality Gate',           desc: 'Automatic blur, illumination & contrast checks before any AI prediction runs.',       color: 'from-amber-500 to-orange-500' },
  { icon: Users,  title: 'Rural-Friendly',         desc: 'Mobile-first, low-bandwidth design built for community health workers.',               color: 'from-emerald-500 to-teal-500' },
  { icon: Globe,  title: 'Multilingual-Ready',     desc: 'Architecture supports Hindi, Tamil, Telugu and other Indian languages.',              color: 'from-purple-500 to-pink-500' },
  { icon: Heart,  title: 'Clinical Decision Support', desc: 'Referral prioritisation engine combines severity, confidence and patient risk.',   color: 'from-red-500 to-rose-500' },
  { icon: Eye,    title: 'Human-in-the-Loop',      desc: 'Clinicians can review, override and annotate every AI decision with audit trail.',    color: 'from-cyan-500 to-blue-500' },
];

const STATS = [
  { val: '5', label: 'DR Severity Levels' },
  { val: '20+', label: 'API Endpoints' },
  { val: '4', label: 'User Role Types' },
  { val: '100%', label: 'Explainable' },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  useEffect(() => { if (isAuthenticated) router.push('/dashboard'); }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-primary-500
                            flex items-center justify-center shadow-md">
              <Eye className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">DrishtiXAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex badge badge-demo">SIH26038 · MathWorks</span>
            <button onClick={() => router.push('/login')} className="btn-primary btn-sm">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        {/* bg decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-800/40 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-primary-900/40 blur-3xl" />
          {/* grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-white/10 border border-white/20 text-sm font-medium text-blue-200 mb-8">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              Smart India Hackathon 2026 · Problem SIH26038
            </div>

            {/* Eye icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20
                              flex items-center justify-center shadow-xl">
                <Eye className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-tight">
              <span className="text-white">Drishti</span>
              <span className="text-blue-300">XAI</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 font-medium mb-3">
              Explainable AI for Diabetic Retinopathy Screening
            </p>
            <p className="text-blue-200/80 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              A trustworthy, rural-friendly screening platform with Grad-CAM visual explanations,
              automatic quality gates and clinical decision support — built for rural India.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => router.push('/login')}
                className="btn btn-lg bg-white text-brand-700 hover:bg-blue-50
                           shadow-xl font-bold w-full sm:w-auto">
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => router.push('/login')}
                className="btn btn-lg border border-white/30 text-white hover:bg-white/10
                           w-full sm:w-auto">
                View Demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center px-4 py-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <p className="text-3xl font-black text-white mb-1">{s.val}</p>
                <p className="text-blue-200 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge badge-info mb-4">Core Capabilities</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-3">
              Built for Trust & Transparency
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Every design decision prioritises explainability, safety and ease of use for
              community health workers in resource-limited settings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card hover:shadow-card-hover transition-all duration-200 group">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color}
                                  flex items-center justify-center mb-4 shadow-md
                                  group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">AI Screening Pipeline</h2>
            <p className="text-slate-500 mt-3">Five steps from fundus image to clinical recommendation</p>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {[
              { n:'1', title:'Upload', sub:'Fundus image capture', color:'bg-blue-500' },
              { n:'2', title:'Quality', sub:'Blur / illumination check', color:'bg-amber-500' },
              { n:'3', title:'Predict', sub:'EfficientNet-B0 × 5 classes', color:'bg-purple-500' },
              { n:'4', title:'Explain', sub:'Grad-CAM heatmap overlay', color:'bg-emerald-500' },
              { n:'5', title:'Refer', sub:'Priority + risk stratification', color:'bg-red-500' },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex lg:flex-col items-center gap-3 lg:gap-2 flex-1">
                <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center
                                text-white font-black text-lg shadow-md flex-shrink-0`}>
                  {s.n}
                </div>
                <div className="lg:text-center">
                  <p className="font-bold text-slate-900 text-sm">{s.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0
                                        lg:rotate-90 lg:self-start lg:mt-1 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to explore the prototype?</h2>
          <p className="text-blue-200 mb-8">
            Sign in with demo credentials and run a complete DR screening workflow in minutes.
          </p>
          <button onClick={() => router.push('/login')}
            className="btn btn-lg bg-white text-brand-700 hover:bg-blue-50 font-bold shadow-xl">
            Launch Demo <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-blue-300/70 text-xs mt-6">
            ⚠ Research prototype · Not validated for clinical use
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f172a] text-slate-500 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-600" />
            <span className="text-slate-400 font-medium">DrishtiXAI</span>
          </div>
          <span>Smart India Hackathon 2026 · SIH26038 · MathWorks</span>
          <span className="text-red-500 font-semibold">NOT FOR CLINICAL USE</span>
        </div>
      </footer>
    </div>
  );
}
