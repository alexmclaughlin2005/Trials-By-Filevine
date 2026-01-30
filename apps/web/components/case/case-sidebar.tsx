'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  MessageSquare,
  Users,
  Scale,
  HelpCircle,
  Folder,
  UserSearch,
} from 'lucide-react';

interface CaseSidebarProps {
  caseId: string;
  jurorCount?: number;
  factsCount?: number;
  argumentsCount?: number;
  witnessesCount?: number;
  focusGroupsCount?: number;
}

export function CaseSidebar({
  caseId,
  jurorCount = 0,
  factsCount = 0,
  argumentsCount = 0,
  witnessesCount = 0,
  focusGroupsCount = 0,
}: CaseSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Overview',
      href: `/cases/${caseId}`,
      icon: Home,
      exact: true,
    },
    {
      name: 'Facts',
      href: `/cases/${caseId}/facts`,
      icon: FileText,
      count: factsCount,
    },
    {
      name: 'Arguments',
      href: `/cases/${caseId}/arguments`,
      icon: MessageSquare,
      count: argumentsCount,
    },
    {
      name: 'Witnesses',
      href: `/cases/${caseId}/witnesses`,
      icon: Users,
      count: witnessesCount,
    },
    {
      name: 'Jurors',
      href: `/cases/${caseId}/jurors`,
      icon: UserSearch,
      count: jurorCount,
    },
    {
      name: 'Voir Dire Setup',
      href: `/cases/${caseId}/voir-dire-questions`,
      icon: HelpCircle,
    },
    {
      name: 'Focus Groups',
      href: `/cases/${caseId}/focus-groups`,
      icon: Scale,
      count: focusGroupsCount,
    },
    {
      name: 'Documents',
      href: `/cases/${caseId}/filevine`,
      icon: Folder,
    },
  ];

  return (
    <div className="flex w-56 flex-col border-r border-filevine-gray-200 bg-white">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-filevine-blue text-white'
                  : 'text-filevine-gray-700 hover:bg-filevine-gray-100'
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-filevine-gray-200 text-filevine-gray-700'
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
