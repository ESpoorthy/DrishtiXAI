/**
 * Layout — teal sidebar + top bar
 * Clean, clinical workspace aesthetic
 */
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, ScanEye, ClipboardCheck,
  BarChart3, LogOut, Eye, Menu, X,
  ChevronRight, ShieldAlert, Microscope,
} from 'lucide-react';

interface Props { children: ReactNode }

const NAV = [
  { label: 'Dashboard',        href: '/dashboard',        icon: LayoutDashboard, roles: ['health_worker','clinician','admin'] },
  { label: 'Patients',         href: '/patients',          icon: Users,           roles: ['health_worker','clinician','admin'] },
  { label: 'New Screening',    href: '/screening/new',     icon: ScanEye,         roles: ['health_worker','clinician','admin'] },
  { label: 'Clinical Reviews', href: '/reviews',           icon: ClipboardCheck,  roles: ['clinician','admin'] },
  { label: 'Analytics',        href: '/analytics',         icon: BarChart3,       roles: ['clinician','admin'] },
  { label: 'Model Info',       href: '/model-performance', icon: Microscope,      roles: ['clinician','admin'] },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  health_worker: { label: 'Health Worker',  cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' },
  clinician:     { label: 'Clinician',      cls: 'bg-teal-400/20 text-teal-200 border border-teal-400/20' },
  admin:         { label: 'Administrator',  cls: 'bg-amber-400/20 text-amber-200 border border-amber-400/20' },
};

export default function Layout({ children }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };
  const nav      = NAV.filter(n => n.roles.includes(user?.role ?? ''));
  const roleMeta = ROLE_BADGE[user?.role ?? 'health_worker'];
  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  /* Active check: exact match for /dashboard, prefix match otherwise */
  const isActive = (href: string) =>
    href === '/dashboard'
      ? router.pathname === href
      : router.pathname.startsWith(href.replace('/new', ''));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center
                          shadow-sm flex-shrink-0">
            <Eye className="w-4.5 h-4.5 text-white" style={{ width:'18px', height:'18px' }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">DrishtiXAI</p>
            <p className="text-[10px] uppercase tracking-wider"
               style={{ color: 'rgba(148,197,190,0.7)' }}>
              Retinal Screening
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="section-header px-3 mb-3" style={{ color:'rgba(148,197,190,0.5)' }}>
          Navigation
        </p>
        {nav.map(item => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Demo warning */}
      <div className="px-3 mb-3">
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl
                        border text-xs font-medium"
             style={{
               background: 'rgba(251,191,36,0.08)',
               borderColor: 'rgba(251,191,36,0.20)',
               color: 'rgba(253,230,138,0.85)',
             }}>
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>DEMO MODE — Not for clinical use</span>
        </div>
      </div>

      {/* User panel */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                        hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleMeta.cls}`}>
              {roleMeta.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color:'rgba(148,197,190,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,197,190,0.6)')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 overflow-hidden"
        style={{ background: '#1a2e2b' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative z-10 flex flex-col w-64 animate-slide-in"
            style={{ background: '#1a2e2b' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-surface-border
                           flex items-center px-4 lg:px-6 gap-4 z-20">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-muted text-ink-muted"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-ink-subtle hidden sm:block text-xs">DrishtiXAI</span>
            <ChevronRight className="w-3.5 h-3.5 text-surface-border hidden sm:block" />
            <span className="font-semibold text-ink truncate capitalize text-sm">
              {router.pathname.split('/')[1]?.replace(/-/g, ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Right — demo badge + user avatar (mobile) */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 badge badge-demo text-xs">
              <ShieldAlert className="w-3 h-3" /> Demo
            </span>
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center
                            text-white text-xs font-bold shadow-sm lg:hidden">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-surface-border bg-white
                           px-6 py-2.5 flex items-center justify-between text-[11px] text-ink-subtle">
          <span className="font-semibold text-amber-600">
            ⚠ Research Prototype — Not for Clinical Use
          </span>
          <span className="hidden sm:block">© 2026 DrishtiXAI · SIH26038</span>
        </footer>
      </div>
    </div>
  );
}
