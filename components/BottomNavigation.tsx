'use client';

import { Home, Calendar, Activity, FileText, BarChart3 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/exercise', label: 'Exercise', icon: Activity },
  { href: '/scales', label: 'Scales', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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