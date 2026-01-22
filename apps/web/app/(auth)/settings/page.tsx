'use client';

import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-filevine-gray-900">Settings</h1>
        <p className="mt-2 text-filevine-gray-600">
          Manage your account and application settings
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info Section */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-filevine-gray-900">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-filevine-gray-600">Name</label>
              <p className="mt-1 text-filevine-gray-900">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-filevine-gray-600">Email</label>
              <p className="mt-1 text-filevine-gray-900">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-filevine-gray-600">Organization</label>
              <p className="mt-1 text-filevine-gray-900">
                {user?.organization?.name || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-filevine-gray-600">Role</label>
              <p className="mt-1 text-filevine-gray-900">{user?.role || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="rounded-lg border-2 border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-12">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-filevine-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-filevine-gray-900">
              Additional Settings Coming Soon
            </h3>
            <p className="mt-2 text-sm text-filevine-gray-600">
              More configuration options will be available in future updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
