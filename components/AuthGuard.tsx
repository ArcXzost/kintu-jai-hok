'use client';

import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Handle browser navigation to prevent going back to login when authenticated
    const handlePopState = (event: PopStateEvent) => {
      if (user) {
        // If user is authenticated and tries to go back to login, redirect to home
        if (window.location.pathname === '/login') {
          event.preventDefault();
          router.replace('/');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Prevent browser back to login if user is already authenticated
    if (user && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '') {
        router.replace('/');
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
