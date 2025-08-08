'use client';

import { Home, Calendar, Activity, FileText, BarChart3 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCallback, memo, useRef, useState, useEffect, startTransition } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/exercise', label: 'Exercise', icon: Activity },
  { href: '/scales', label: 'Scales', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proactively prefetch routes to make the first navigation instant
  useEffect(() => {
    try {
      navItems.forEach(({ href }) => {
        // Best-effort prefetch; ignore errors in dev
        // @ts-ignore - prefetch exists on app router
        router.prefetch?.(href);
      });
    } catch { /* noop */ }
    // Also prefetch current path neighbors on path change
  }, [router]);

  const handleNavigation = useCallback((href: string) => {
    // Prevent multiple rapid clicks and navigation to the same page
    if (pathname === href || isNavigating) {
      return;
    }

    setIsNavigating(true);
    
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Debounced navigation
    navigationTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(href);
      });
      // give the router a tick to swap routes before unlocking
      setTimeout(() => setIsNavigating(false), 50);
    }, 150);
  }, [pathname, router, isNavigating]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <button
              key={href}
              onClick={() => handleNavigation(href)}
              onPointerEnter={() => {
                // Warm up on hover/touch
                try {
                  // @ts-ignore - prefetch exists on app router
                  router.prefetch?.(href);
                } catch { /* noop */ }
              }}
              disabled={isNavigating}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-colors disabled:opacity-50",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                isNavigating && "cursor-wait"
              )}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(BottomNavigation);