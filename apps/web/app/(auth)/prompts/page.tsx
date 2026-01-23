'use client';

import Link from 'next/link';
import { usePrompts } from '@/hooks/prompts/usePrompts';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Plus, Loader2 } from 'lucide-react';

export default function PromptsPage() {
  const { data: prompts, isLoading, error } = usePrompts();

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error loading prompts</h3>
            <p className="text-red-600 text-sm mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="text-red-600 text-sm mt-2">
              Make sure the Prompt Service is running
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prompt Management</h1>
            <p className="text-gray-600 mt-1">
              Manage AI prompts across all services
            </p>
          </div>
          <button className="px-4 py-2 bg-filevine-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Prompt
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : prompts && prompts.length > 0 ? (
          <div className="grid gap-4">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.serviceId}`}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{prompt.serviceId}</p>
                      {prompt.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {prompt.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        {prompt.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {prompt.category}
                          </span>
                        )}
                        {prompt.latestVersion && (
                          <span className="text-xs text-gray-500">
                            {prompt.latestVersion}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Updated{' '}
                          {formatDistanceToNow(new Date(prompt.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prompt.currentVersionId
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {prompt.currentVersionId ? 'Active' : 'No version deployed'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No prompts yet</h3>
            <p className="text-gray-500 mt-1">
              Create your first prompt to get started
            </p>
            <button className="mt-4 px-4 py-2 bg-filevine-blue text-white rounded-lg hover:bg-blue-700">
              Create Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
