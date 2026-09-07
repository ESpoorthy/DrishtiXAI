/**
 * Layout — dark sidebar + top bar
 */
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, ScanEye, ClipboardCheck,
  BarChart3, LogOut, Eye, Bell, Menu, X,
  ChevronRight, Shield,
} from 'lucide-react';

interface Props { children: ReactNode }

const NAV = [
  { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard, roles: ['health_worker','clinician','admin'] },
  { label: 'Patients',   href: '/patients',  icon: Users,            roles: ['health_worker','clinician','admin'] },
  { label: 'Screening',  href: '/screening/new', icon: ScanEye,       roles: ['health_worker','clinician','admin'] },
  { label: 'Reviews',    href: '/reviews',   icon: ClipboardCheck,   roles: ['clinician','admin'] },
  { label: 'Analytics',  href: '/analytics', icon: BarChart3,        roles: ['clinician','admin'] },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  health_worker: { label: 'Health Worker',  cls: 'bg-emerald-500/20 text-emerald-300' },
  clinician:     { label: 'Clinician',      cls: 'bg-blue-500/20 text-blue-300' },
  admin:         { label: 'Administrator',  cls: 'bg-purple-500/20 text-purple-300' },
};

export default function Layout({ children }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };
  const nav = NAV.filter(n => n.roles.includes(user?.role ?? ''));
  const role = ROLE_BADGE[user?.role ?? 'health_worker'];
  const initials = (user?.full_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-brand-600
                          flex items-center justify-center shadow-lg flex-shrink-0">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">DrishtiXAI</p>
            <p className="text-slate-500 text-[10px] tracking-wider uppercase">DR Screening</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="section-header px-3 mb-2">Main Menu</p>
        {nav.map(item => {
          const Icon = item.icon;
          const active = router.pathname === item.href || 
                        (item.href !== '/dashboard' && router.pathname.startsWith(item.href.replace('/new', '')));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
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
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15
                        border border-amber-500/25 text-amber-300 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          DEMO — Not for clinical use
        </div>
      </div>

      {/* User panel */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5
                        transition-colors cursor-default">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-blue-400
                          flex items-center justify-center text-white text-xs font-bold
                          flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${role.cls}`}>
              {role.label}
            </span>
          </div>
          <button onClick={handleLogout} title="Sign out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10
                       transition-colors flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0f172a] flex-shrink-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex flex-col w-64 bg-[#0f172a] animate-slide-in">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200
                           flex items-center px-4 lg:px-6 gap-4 z-20">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-400 hidden sm:block">DrishtiXAI</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
            <span className="font-semibold text-slate-800 truncate capitalize">
              {router.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex badge badge-demo gap-1.5">
              <Shield className="w-3 h-3" /> Demo Mode
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-400
                            flex items-center justify-center text-white text-xs font-bold
                            shadow-sm lg:hidden">
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
        <footer className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-3
                           flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-red-500">⚠ RESEARCH PROTOTYPE — NOT FOR CLINICAL USE</span>
          <span className="hidden sm:block">© 2026 DrishtiXAI · SIH26038</span>
        </footer>
      </div>
    </div>
  );
}
