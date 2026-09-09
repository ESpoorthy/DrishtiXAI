/**
 * Login page — clean clinical workspace login
 * Simplified from split-panel to focused single-panel
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      setUser(res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Sign-in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">

      {/* Minimal top bar */}
      <header className="h-14 bg-white border-b border-surface-border flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-ink text-sm">DrishtiXAI</span>
        </div>
      </header>

      {/* Centred form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center
                            mx-auto mb-5 shadow-md">
              <Eye className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-ink">Sign in to DrishtiXAI</h1>
            <p className="text-ink-muted text-sm mt-1.5">
              AI-assisted retinal screening platform
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-ink-subtle hover:text-ink-muted transition-colors"
                >
                  {showPwd
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30
                                   border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials — clearly labelled, compact */}
          <div className="mt-6 p-4 rounded-xl bg-white border border-surface-border">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Demo access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-ink-subtle mb-0.5">Username</p>
                <p className="font-mono font-semibold text-ink bg-surface-muted
                               rounded-lg px-2.5 py-1.5">admin</p>
              </div>
              <div>
                <p className="text-ink-subtle mb-0.5">Password</p>
                <p className="font-mono font-semibold text-ink bg-surface-muted
                               rounded-lg px-2.5 py-1.5">admin123</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-5 flex items-start gap-2 text-xs text-ink-subtle">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <p>
              Research prototype. Not validated for clinical use.
              Results must be reviewed by a qualified clinician.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
