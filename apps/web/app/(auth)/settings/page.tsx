'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Link2, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { FilevineConnectionModal } from '@/components/filevine-connection-modal';
import {
  getFilevineConnectionStatus,
  testFilevineConnection,
  removeFilevineConnection,
  type FilevineConnectionStatus,
} from '@/lib/filevine-client';

export default function SettingsPage() {
  const { user } = useAuth();
  const [showFilevineModal, setShowFilevineModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<FilevineConnectionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [removingConnection, setRemovingConnection] = useState(false);

  // Load connection status on mount
  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoadingStatus(true);
      console.log('[Filevine] Loading connection status...');
      const status = await getFilevineConnectionStatus();
      console.log('[Filevine] Connection status:', status);
      setConnectionStatus(status);
    } catch (error) {
      console.error('[Filevine] Failed to load connection status:', error);
      // Even on error, show the UI with disconnected state
      setConnectionStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
      console.log('[Filevine] Loading complete');
    }
  };

  const handleTestConnection = async () => {
    if (!connectionStatus?.id) return;

    try {
      setTestingConnection(true);
      await testFilevineConnection(connectionStatus.id);
      // Reload status to get updated test results
      await loadConnectionStatus();
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connectionStatus?.id) return;

    if (!confirm('Are you sure you want to remove the Filevine connection? This will delete all stored credentials.')) {
      return;
    }

    try {
      setRemovingConnection(true);
      await removeFilevineConnection(connectionStatus.id);
      await loadConnectionStatus();
    } catch (error) {
      console.error('Failed to remove connection:', error);
      alert('Failed to remove connection. Please try again.');
    } finally {
      setRemovingConnection(false);
    }
  };

  const handleConnectionSuccess = () => {
    setShowFilevineModal(false);
    loadConnectionStatus();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

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

        {/* Filevine Integration Section */}
        <div className="rounded-lg border border-filevine-gray-200 bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-filevine-primary-600" />
                <h2 className="text-xl font-semibold text-filevine-gray-900">
                  Filevine Integration
                </h2>
              </div>
              <p className="mt-1 text-sm text-filevine-gray-600">
                Connect to your Filevine account to import documents and case data
              </p>
            </div>
          </div>

          {loadingStatus ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-filevine-gray-400" />
              <span className="ml-2 text-sm text-filevine-gray-500">Loading connection status...</span>
            </div>
          ) : connectionStatus?.connected ? (
            // Connected State
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {connectionStatus.lastTestSuccessful ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Connected & Verified
                    </span>
                  </>
                ) : connectionStatus.lastTestSuccessful === false ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      Connection Failed
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      Connected (Not Tested)
                    </span>
                  </>
                )}
              </div>

              {/* Connection Details */}
              <div className="rounded-lg bg-filevine-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-filevine-gray-600">
                      Connection Name
                    </label>
                    <p className="mt-1 text-sm text-filevine-gray-900">
                      {connectionStatus.connectionName || 'Filevine Integration'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-filevine-gray-600">
                      Status
                    </label>
                    <p className="mt-1 text-sm text-filevine-gray-900">
                      {connectionStatus.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-filevine-gray-600">
                      Last Tested
                    </label>
                    <p className="mt-1 text-sm text-filevine-gray-900">
                      {formatDate(connectionStatus.lastTestAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-filevine-gray-600">
                      Token Expires
                    </label>
                    <p className="mt-1 text-sm text-filevine-gray-900">
                      {connectionStatus.hasValidToken ? (
                        formatDate(connectionStatus.tokenExpiresAt)
                      ) : (
                        <span className="text-yellow-700">Expired - will refresh</span>
                      )}
                    </p>
                  </div>
                </div>

                {connectionStatus.lastErrorMessage && (
                  <div className="pt-2 border-t border-filevine-gray-200">
                    <label className="text-xs font-medium text-filevine-gray-600">
                      Last Error
                    </label>
                    <p className="mt-1 text-sm text-red-700 font-mono">
                      {connectionStatus.lastErrorMessage}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveConnection}
                  disabled={removingConnection}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {removingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Not Connected State
            <div className="py-8 text-center">
              <div className="mx-auto w-fit rounded-full bg-filevine-gray-100 p-3 mb-4">
                <Link2 className="h-6 w-6 text-filevine-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-filevine-gray-900 mb-2">
                No Connection Configured
              </h3>
              <p className="text-sm text-filevine-gray-600 mb-6 max-w-md mx-auto">
                Connect your Filevine account to import documents, case information, and other data
                directly into Juries by Filevine.
              </p>
              <Button
                onClick={() => setShowFilevineModal(true)}
                className="bg-filevine-primary-600 hover:bg-filevine-primary-700 text-white"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Connect to Filevine
              </Button>
            </div>
          )}
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

      {/* Filevine Connection Modal */}
      <FilevineConnectionModal
        isOpen={showFilevineModal}
        onClose={() => setShowFilevineModal(false)}
        onSuccess={handleConnectionSuccess}
      />
    </div>
  );
}
