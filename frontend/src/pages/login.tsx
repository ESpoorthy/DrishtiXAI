/**
 * Login page â€” split panel
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle, ScanEye, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const PERKS = [
  { icon: ScanEye,     text: 'AI-powered fundus image analysis' },
  { icon: Shield,      text: 'Grad-CAM explainability built-in' },
  { icon: Zap,         text: 'Instant quality gate & referral' },
  { icon: CheckCircle2,text: 'Full clinician review workflow' },
];

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error,   setError]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.login({ username, password });
      setUser(res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* â”€â”€ Left hero panel â”€â”€ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden
                      bg-gradient-hero flex-col justify-between p-12">
        {/* decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-800/50 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary-900/40 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth=".5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
          </svg>
        </div>

        {/* brand */}
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20
                          flex items-center justify-center shadow-lg">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-xl leading-tight">DrishtiXAI</p>
            <p className="text-blue-300 text-xs">DR Screening Platform</p>
          </div>
        </div>

        {/* hero text */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Explainable AI<br/>
              <span className="text-blue-300">for Diabetic</span><br/>
              Retinopathy
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-xs">
              Trustworthy, rural-friendly screening with visual AI explanations and
              clinical decision support.
            </p>
          </div>

          {/* perks */}
          <ul className="space-y-3">
            {PERKS.map(p => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20
                                  flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <span className="text-blue-100 text-sm">{p.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Team badge */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="text-yellow-300 text-xs font-semibold">
              ðŸ† Team AetherAI &nbsp;Â·&nbsp; Smart India Hackathon 2026
            </span>
          </div>
        </div>
      </div>

      {/* â”€â”€ Right form panel â”€â”€ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-700 to-primary-500
                            flex items-center justify-center shadow-md">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900">DrishtiXAI</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to access the DR screening platform
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label">Username</label>
              <input type="text" className="input" placeholder="Enter username"
                value={username} onChange={e => setUsername(e.target.value)}
                required autoComplete="username" />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-11"
                  placeholder="Enter password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30
                                   border-t-white animate-spin" />
                  Signing inâ€¦
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Demo Credentials
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-400 mb-0.5">Username</p>
                <p className="font-mono font-semibold text-slate-800 text-xs">admin</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-400 mb-0.5">Password</p>
                <p className="font-mono font-semibold text-slate-800 text-xs">admin123</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            âš  Research prototype Â· Not for clinical use
          </p>
        </div>
      </div>
    </div>
  );
}
