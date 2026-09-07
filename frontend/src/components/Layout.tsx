/**
 * Main layout component with navigation
 */
import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { 
  Home, 
  Users, 
  Activity, 
  BarChart3, 
  LogOut, 
  Eye,
  AlertCircle 
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['health_worker', 'clinician', 'admin'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['health_worker', 'clinician', 'admin'] },
    { name: 'Screening', href: '/screening', icon: Eye, roles: ['health_worker', 'clinician', 'admin'] },
    { name: 'Reviews', href: '/reviews', icon: Activity, roles: ['clinician', 'admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['clinician', 'admin'] },
  ];

  const filteredNav = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Eye className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  DrishtiXAI
                </span>
              </div>

              {/* Navigation links */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Demo mode indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-800">DEMO MODE</span>
              </div>

              {/* User info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p className="font-medium text-red-600 mb-2">
              ⚠️ RESEARCH PROTOTYPE - NOT FOR CLINICAL USE
            </p>
            <p>
              This is a screening decision support system. All predictions require clinical validation.
              Not a replacement for professional medical diagnosis.
            </p>
            <p className="mt-2 text-xs">
              © 2026 DrishtiXAI - Smart India Hackathon 2026 | SIH26038
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
