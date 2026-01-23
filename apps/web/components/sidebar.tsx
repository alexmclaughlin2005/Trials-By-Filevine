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
  FileSearch,
  UserSearch,
  FileCode,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Cases', href: '/cases', icon: Briefcase },
  { name: 'Jurors', href: '/jurors', icon: Users },
  { name: 'Personas', href: '/personas', icon: UserSearch },
  { name: 'Focus Groups', href: '/focus-groups', icon: MessageSquare },
  { name: 'Research', href: '/research', icon: FileSearch },
  { name: 'Trial Mode', href: '/trial-mode', icon: Gavel },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-48 flex-col border-r border-filevine-gray-200 bg-white">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">

        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-filevine-blue text-white'
                  : 'text-filevine-gray-700 hover:bg-filevine-gray-100'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-filevine-gray-200 p-3 space-y-1">
        <Link
          href="/prompts"
          className={cn(
            'flex items-center space-x-3 rounded px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/prompts' || pathname?.startsWith('/prompts/')
              ? 'bg-filevine-blue text-white'
              : 'text-filevine-gray-700 hover:bg-filevine-gray-100'
          )}
        >
          <FileCode className="h-4 w-4" />
          <span>Prompts</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            'flex items-center space-x-3 rounded px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings' || pathname?.startsWith('/settings/')
              ? 'bg-filevine-blue text-white'
              : 'text-filevine-gray-700 hover:bg-filevine-gray-100'
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
