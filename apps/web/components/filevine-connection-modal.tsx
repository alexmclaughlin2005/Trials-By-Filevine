'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { setupFilevineConnection, type FilevineConnectionSetup } from '@/lib/filevine-client';

interface FilevineConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'instructions' | 'credentials' | 'testing' | 'success';

export function FilevineConnectionModal({
  isOpen,
  onClose,
  onSuccess,
}: FilevineConnectionModalProps) {
  const [step, setStep] = useState<Step>('instructions');
  const [credentials, setCredentials] = useState<FilevineConnectionSetup>({
    clientId: '',
    clientSecret: '',
    personalAccessToken: '',
    connectionName: 'Filevine Integration',
  });
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('instructions');
    setCredentials({
      clientId: '',
      clientSecret: '',
      personalAccessToken: '',
      connectionName: 'Filevine Integration',
    });
    setError(null);
    setTestResult(null);
    onClose();
  };

  const handleContinueToCredentials = () => {
    setStep('credentials');
  };

  const handleSubmitCredentials = async () => {
    setError(null);

    // Validation
    if (!credentials.clientId || !credentials.clientSecret || !credentials.personalAccessToken) {
      setError('All credential fields are required');
      return;
    }

    // Validate UUID format for client ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(credentials.clientId)) {
      setError('Client ID must be a valid UUID format');
      return;
    }

    // Validate PAT length
    if (credentials.personalAccessToken.length !== 64) {
      setError('Personal Access Token must be exactly 64 characters');
      return;
    }

    setStep('testing');

    try {
      const result = await setupFilevineConnection(credentials);

      if (result.success) {
        setTestResult({
          success: result.testPassed,
          message: result.testPassed
            ? 'Connection test successful!'
            : `Connection created but test failed: ${result.testError}`,
        });
        setStep('success');
      } else {
        setError(result.error || 'Failed to setup connection');
        setStep('credentials');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred while setting up the connection');
      setStep('credentials');
    }
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-filevine-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-bold text-filevine-gray-900">
              Connect to Filevine
            </h2>
            <p className="mt-1 text-sm text-filevine-gray-600">
              Import documents and case data from your Filevine account
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-filevine-gray-100"
          >
            <X className="h-5 w-5 text-filevine-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Instructions */}
          {step === 'instructions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-filevine-gray-900 mb-3">
                  Before You Begin
                </h3>
                <p className="text-filevine-gray-700 mb-4">
                  You&apos;ll need to obtain API credentials from your Filevine account. Follow these steps:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-filevine-primary-100 text-sm font-semibold text-filevine-primary-700">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-filevine-gray-900">
                      Log into your Filevine account
                    </p>
                    <p className="mt-1 text-sm text-filevine-gray-600">
                      Open Filevine in a separate tab or window
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-filevine-primary-100 text-sm font-semibold text-filevine-primary-700">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-filevine-gray-900">
                      Navigate to API Settings
                    </p>
                    <p className="mt-1 text-sm text-filevine-gray-600">
                      Go to: <span className="font-mono bg-filevine-gray-100 px-1 py-0.5 rounded">
                        Settings → Developer → API Credentials
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-filevine-primary-100 text-sm font-semibold text-filevine-primary-700">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-filevine-gray-900">
                      Copy your credentials
                    </p>
                    <p className="mt-1 text-sm text-filevine-gray-600">
                      You&apos;ll need: <strong>Client ID</strong>, <strong>Client Secret</strong>, and <strong>Personal Access Token</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-filevine-primary-50 p-4 border border-filevine-primary-200">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-filevine-primary-700 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-filevine-primary-900">
                      Keep your credentials secure
                    </p>
                    <p className="mt-1 text-sm text-filevine-primary-700">
                      Your credentials will be encrypted and stored securely. Never share them with anyone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinueToCredentials}
                  className="bg-filevine-primary-600 hover:bg-filevine-primary-700 text-white"
                >
                  I Have My Credentials
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Enter Credentials */}
          {step === 'credentials' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-filevine-gray-900 mb-2">
                  Enter Your Filevine API Credentials
                </h3>
                <p className="text-sm text-filevine-gray-600">
                  Paste the credentials you copied from Filevine
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="connectionName">Connection Name (Optional)</Label>
                  <Input
                    id="connectionName"
                    type="text"
                    placeholder="e.g., Filevine Integration"
                    value={credentials.connectionName}
                    onChange={(e) =>
                      setCredentials({ ...credentials, connectionName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="clientId">
                    Client ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientId"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={credentials.clientId}
                    onChange={(e) =>
                      setCredentials({ ...credentials, clientId: e.target.value.trim() })
                    }
                    className="mt-1 font-mono text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-filevine-gray-500">
                    UUID format (e.g., 12345678-1234-1234-1234-123456789abc)
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientSecret">
                    Client Secret <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Your client secret"
                    value={credentials.clientSecret}
                    onChange={(e) =>
                      setCredentials({ ...credentials, clientSecret: e.target.value.trim() })
                    }
                    className="mt-1 font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="personalAccessToken">
                    Personal Access Token <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="personalAccessToken"
                    type="password"
                    placeholder="64-character token"
                    value={credentials.personalAccessToken}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        personalAccessToken: e.target.value.trim(),
                      })
                    }
                    className="mt-1 font-mono text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-filevine-gray-500">
                    Exactly 64 characters (hexadecimal)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-filevine-gray-200">
                <Button variant="outline" onClick={() => setStep('instructions')}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmitCredentials}
                  className="bg-filevine-primary-600 hover:bg-filevine-primary-700 text-white"
                >
                  Connect & Test
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Testing */}
          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-filevine-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-filevine-gray-900 mb-2">
                Testing Connection...
              </h3>
              <p className="text-sm text-filevine-gray-600 text-center max-w-md">
                We&apos;re verifying your credentials and testing the connection to Filevine.
                This may take a few seconds.
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                {testResult?.success ? (
                  <>
                    <div className="rounded-full bg-green-100 p-3 mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-filevine-gray-900 mb-2">
                      Connection Successful!
                    </h3>
                    <p className="text-sm text-filevine-gray-600 text-center max-w-md">
                      Your Filevine account is now connected. You can start importing documents
                      and case data.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-yellow-100 p-3 mb-4">
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-filevine-gray-900 mb-2">
                      Connection Created
                    </h3>
                    <p className="text-sm text-filevine-gray-600 text-center max-w-md mb-4">
                      {testResult?.message}
                    </p>
                    <p className="text-xs text-filevine-gray-500 text-center max-w-md">
                      You can try testing the connection again from the settings page.
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-filevine-gray-200">
                <Button
                  onClick={handleFinish}
                  className="bg-filevine-primary-600 hover:bg-filevine-primary-700 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
