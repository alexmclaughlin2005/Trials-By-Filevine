'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { usePrompt, useVersions, useCreateVersion, useDeployVersion, useRollbackVersion } from '@/hooks/prompts/usePrompts';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Rocket,
  History,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PromptDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);

  const { data: prompt, isLoading: promptLoading } = usePrompt(serviceId);
  const { data: versions, isLoading: versionsLoading } = useVersions(prompt?.id || null);
  const createVersion = useCreateVersion(prompt?.id || '');
  const deployVersion = useDeployVersion();
  const rollbackVersion = useRollbackVersion();

  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<{ message: string; deployed: boolean } | null>(null);

  const currentVersion = versions?.find((v) => v.id === prompt?.currentVersionId);

  const handleEdit = () => {
    if (currentVersion) {
      setEditedPrompt(currentVersion.userPromptTemplate);
      setSystemPrompt(currentVersion.systemPrompt || '');
    }
    setIsEditing(true);
  };

  const handleSave = async (deploy: boolean = false) => {
    if (!prompt || !currentVersion || !versions) return;

    // Confirm deployment if deploying
    if (deploy) {
      const confirmed = window.confirm(
        'Are you sure you want to save and deploy this version to production?\n\n' +
        'This will immediately affect all live prompts using this template.'
      );
      if (!confirmed) return;
    }

    // Find the highest version number from all versions
    const versionNumbers = versions.map((v) => {
      const parts = v.version.replace(/^v/, '').split('.');
      return {
        major: parseInt(parts[0] || '0'),
        minor: parseInt(parts[1] || '0'),
        patch: parseInt(parts[2] || '0'),
      };
    });

    const maxVersion = versionNumbers.reduce((max, curr) => {
      if (curr.major > max.major) return curr;
      if (curr.major === max.major && curr.minor > max.minor) return curr;
      if (curr.major === max.major && curr.minor === max.minor && curr.patch > max.patch) return curr;
      return max;
    }, { major: 1, minor: 0, patch: 0 });

    const newVersion = `v${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch + 1}`;

    try {
      setSaveError(null);
      setSaveSuccess(null);

      const newVersionData = await createVersion.mutateAsync({
        version: newVersion,
        systemPrompt: systemPrompt || undefined,
        userPromptTemplate: editedPrompt,
        config: currentVersion.config,
        variables: currentVersion.variables,
        outputSchema: currentVersion.outputSchema,
        notes: versionNotes || `Updated prompt template`,
        isDraft: false,
      });

      // If deploy flag is true, deploy the new version immediately
      if (deploy && newVersionData.id) {
        await deployVersion.mutateAsync({
          serviceId: prompt.serviceId,
          versionId: newVersionData.id,
        });
      }

      setIsEditing(false);
      setVersionNotes('');
      setSaveSuccess({
        message: deploy
          ? `Version ${newVersion} saved and deployed successfully!`
          : `Version ${newVersion} saved as draft. Click "Deploy" to make it live.`,
        deployed: deploy,
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      console.error('Failed to save version:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save version');
    }
  };

  const handleDeploy = async (versionId: string) => {
    if (!prompt) return;

    try {
      await deployVersion.mutateAsync({
        serviceId: prompt.serviceId,
        versionId,
      });
    } catch (error) {
      console.error('Failed to deploy version:', error);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!prompt) return;

    if (confirm('Are you sure you want to rollback to this version?')) {
      try {
        await rollbackVersion.mutateAsync({
          serviceId: prompt.serviceId,
          versionId,
        });
      } catch (error) {
        console.error('Failed to rollback version:', error);
      }
    }
  };

  if (promptLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Prompt not found</h3>
            <p className="text-red-600 text-sm mt-1">
              The prompt &quot;{serviceId}&quot; does not exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{prompt.name}</h1>
                <p className="text-gray-600 mt-1">{prompt.serviceId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Prompt
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={createVersion.isPending || deployVersion.isPending}
                    className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    {createVersion.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={createVersion.isPending || deployVersion.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {createVersion.isPending || deployVersion.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    Save & Deploy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="col-span-2 space-y-6">
            {saveSuccess && (
              <div className={`border rounded-lg p-4 ${
                saveSuccess.deployed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {saveSuccess.deployed ? (
                    <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${
                      saveSuccess.deployed ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {saveSuccess.deployed ? 'Deployed!' : 'Draft Saved'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      saveSuccess.deployed ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {saveSuccess.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-semibold">Failed to save version</h3>
                    <p className="text-red-600 text-sm mt-1">{saveError}</p>
                    <button
                      onClick={() => setSaveError(null)}
                      className="text-sm text-red-700 underline mt-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="bg-white rounded-lg p-6 border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version Notes
                </label>
                <input
                  type="text"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Describe what changed in this version"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">User Prompt Template</h2>
                <span className="text-sm text-gray-500">
                  {isEditing ? editedPrompt.length : currentVersion?.userPromptTemplate.length || 0} characters
                </span>
              </div>
              <PromptEditor
                value={isEditing ? editedPrompt : currentVersion?.userPromptTemplate || ''}
                onChange={setEditedPrompt}
                readOnly={!isEditing}
                height="400px"
              />
            </div>

            {(systemPrompt || currentVersion?.systemPrompt) && (
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Prompt</h2>
                <PromptEditor
                  value={isEditing ? systemPrompt : currentVersion?.systemPrompt || ''}
                  onChange={setSystemPrompt}
                  readOnly={!isEditing}
                  height="200px"
                />
              </div>
            )}

            {currentVersion && (
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <p className="mt-1 text-sm text-gray-900">{currentVersion.config.model}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                    <p className="mt-1 text-sm text-gray-900">{currentVersion.config.maxTokens}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <p className="mt-1 text-sm text-gray-900">{currentVersion.config.temperature || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Version & Deployment Management */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Version & Deployment</h2>
                </div>
                <p className="text-xs text-gray-500">
                  Manage versions and deploy changes. Only the deployed version (✓) is live.
                </p>
              </div>
              {versionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : versions && versions.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 border rounded-lg ${
                        version.id === prompt.currentVersionId
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{version.version}</span>
                            {version.id === prompt.currentVersionId && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          {version.notes && (
                            <p className="text-xs text-gray-600 mt-1">{version.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(version.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {version.id !== prompt.currentVersionId ? (
                            <>
                              <button
                                onClick={() => handleDeploy(version.id)}
                                disabled={deployVersion.isPending}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1 justify-center"
                                title="Deploy this version to production"
                              >
                                <Rocket className="w-3 h-3" />
                                Deploy
                              </button>
                              <button
                                onClick={() => handleRollback(version.id)}
                                disabled={rollbackVersion.isPending}
                                className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded border border-orange-200 flex items-center gap-1 justify-center"
                                title="Rollback to this version (same as deploy)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Revert
                              </button>
                            </>
                          ) : (
                            <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded font-medium text-center">
                              Deployed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No versions yet</p>
              )}
            </div>

            {currentVersion && (
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Variables</h2>
                <div className="space-y-2">
                  {Object.keys(currentVersion.variables).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 text-sm rounded">
                        {`{{${key}}}`}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
