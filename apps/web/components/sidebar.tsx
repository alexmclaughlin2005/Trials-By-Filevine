'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Briefcase,
  Users,
  MessageSquare,
  Settings,
  Gavel,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Cases', href: '/cases', icon: Briefcase },
  { name: 'Personas', href: '/personas', icon: Users },
  { name: 'Focus Groups', href: '/focus-groups', icon: MessageSquare },
  { name: 'Trial Mode', href: '/trial-mode', icon: Gavel },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Gavel className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">TrialForge AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            JA
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">John Attorney</p>
            <p className="text-xs text-muted-foreground">attorney@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
