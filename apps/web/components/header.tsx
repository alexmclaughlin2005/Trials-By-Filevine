'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Folder,
  Search,
  Bell,
  MessageSquare,
  HelpCircle,
  LogOut,
  Menu,
  UserSearch,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface HeaderProps {
  onOpenChat?: () => void;
}

export function Header({ onOpenChat }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Zap, label: 'Dashboard', href: '/dashboard' },
    { icon: Folder, label: 'Cases', href: '/cases' },
    { icon: UserSearch, label: 'Personas', href: '/personas' },
    { icon: MessageSquare, label: 'Focus Groups', href: '/focus-groups' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-filevine-gray-800 bg-filevine-black">
      <div className="flex h-14 items-center px-4">
        {/* Mobile menu button */}
        <button className="mr-3 flex items-center justify-center rounded p-2 text-white hover:bg-filevine-gray-900 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="mr-6 flex items-center gap-3">
          <Image
            src="/filevine-logo.jpeg"
            alt="Filevine"
            width={32}
            height={32}
            className="h-8 w-8 rounded"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">Juries</span>
            <span className="text-xs text-filevine-gray-400 leading-tight">by Filevine</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center space-x-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-filevine-gray-900 text-white'
                    : 'text-filevine-gray-400 hover:bg-filevine-gray-900 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-filevine-gray-500" />
            <input
              type="text"
              placeholder="Search cases, jurors, personas..."
              className="h-9 w-64 rounded border border-filevine-gray-800 bg-filevine-gray-900 pl-10 pr-3 text-sm text-white placeholder:text-filevine-gray-500 focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
            />
          </div>

          {/* Icon buttons */}
          <button
            onClick={() => onOpenChat?.()}
            className="flex items-center justify-center rounded p-2 text-filevine-gray-400 hover:bg-filevine-gray-900 hover:text-white"
            title="API Assistant"
          >
            <Bot className="h-5 w-5" />
          </button>
          <button
            className="relative flex items-center justify-center rounded p-2 text-filevine-gray-400 hover:bg-filevine-gray-900 hover:text-white"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            className="flex items-center justify-center rounded p-2 text-filevine-gray-400 hover:bg-filevine-gray-900 hover:text-white"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center justify-center rounded-full bg-filevine-gray-700 p-1 hover:bg-filevine-gray-600">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-filevine-blue to-filevine-green flex items-center justify-center text-xs font-semibold text-white">
                {user ? getInitials(user.name) : 'U'}
              </div>
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-3 border-b border-filevine-gray-200">
                <p className="text-sm font-medium text-filevine-gray-900">{user?.name}</p>
                <p className="text-xs text-filevine-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center px-4 py-2 text-sm text-filevine-gray-700 hover:bg-filevine-gray-100"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
