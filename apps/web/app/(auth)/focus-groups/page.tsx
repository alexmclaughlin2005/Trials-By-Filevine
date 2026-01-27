'use client';

import { GlobalSessionsList } from '@/components/focus-groups/GlobalSessionsList';

export default function FocusGroupsPage() {
  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-filevine-gray-900">
          Recent Focus Groups
        </h1>
        <p className="mt-2 text-filevine-gray-600">
          View focus group results from all your cases
        </p>
      </div>

      <GlobalSessionsList />
    </div>
  );
}
