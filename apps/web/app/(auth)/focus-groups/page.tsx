'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function FocusGroupsPage() {
  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-filevine-gray-900">Focus Groups</h1>
        <p className="mt-2 text-filevine-gray-600">
          Run virtual focus groups with AI-powered juror personas
        </p>
      </div>

      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-filevine-gray-300 bg-filevine-gray-50">
        <div className="text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-filevine-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-filevine-gray-900">
            Focus Groups Coming Soon
          </h3>
          <p className="mt-2 text-sm text-filevine-gray-600">
            This feature is currently under development
          </p>
          <Button variant="primary" className="mt-6" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}
