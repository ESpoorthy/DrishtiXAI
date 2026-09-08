import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  // Restore auth state from localStorage on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Protect routes — only redirect AFTER auth state has been resolved
  useEffect(() => {
    if (isLoading) return;
    const publicPaths = ['/', '/login'];
    if (!isAuthenticated && !publicPaths.includes(router.pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return <Component {...pageProps} />;
}
