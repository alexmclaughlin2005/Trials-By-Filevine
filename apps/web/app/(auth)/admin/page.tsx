'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SeedStatus {
  serviceId: string;
  exists: boolean;
  hasCurrentVersion: boolean;
  promptId: string | null;
}

interface SeedStatusResponse {
  prompts: SeedStatus[];
  allSeeded: boolean;
}

interface SeedResult {
  success: boolean;
  message: string;
  data?: {
    results: Array<{
      serviceId: string;
      action: string;
      promptId: string;
      versionId?: string;
    }>;
  };
}

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [status, setStatus] = useState<SeedStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkSeedStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await apiClient.get<SeedStatusResponse>('/admin/seed-status');
      setStatus(response);
    } catch (error) {
      console.error('Error checking seed status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSeedPrompts = async () => {
    try {
      setIsSeeding(true);
      setSeedError(null);
      setSeedResult(null);

      const response = await apiClient.post('/admin/seed-prompts');

      setSeedResult(response);

      // Refresh status after seeding
      await checkSeedStatus();
    } catch (error) {
      console.error('Error seeding prompts:', error);
      setSeedError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Check status on mount
  useEffect(() => {
    checkSeedStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage system configuration and database seeding</p>
      </div>

      {/* Prompt Seeding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Prompt Seeding
          </CardTitle>
          <CardDescription>
            Seed required AI prompts in the database. Run this after deployment or if prompts are missing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Current Status</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkSeedStatus}
                  disabled={isCheckingStatus}
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="space-y-2">
                {status.prompts.map((prompt) => (
                  <div
                    key={prompt.serviceId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{prompt.serviceId}</p>
                      <p className="text-xs text-muted-foreground">
                        {prompt.exists
                          ? prompt.hasCurrentVersion
                            ? 'Seeded and ready'
                            : 'Exists but missing currentVersionId'
                          : 'Not seeded'}
                      </p>
                    </div>
                    {prompt.exists && prompt.hasCurrentVersion ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {!status.allSeeded && (
                <Alert>
                  <AlertDescription>
                    Some prompts are missing or misconfigured. Click &quot;Seed Prompts&quot; to fix.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Seed Button */}
          <Button
            onClick={handleSeedPrompts}
            disabled={isSeeding}
            className="w-full"
            size="lg"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Prompts...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Prompts
              </>
            )}
          </Button>

          {/* Success Message */}
          {seedResult && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {seedResult.message}
                {seedResult.data?.results && (
                  <div className="mt-2 text-xs">
                    {seedResult.data.results.map((result, idx) => (
                      <div key={idx}>
                        • {result.serviceId}: {result.action}
                      </div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {seedError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to seed prompts: {seedError}
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">When to use this:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>After deploying to a new environment</li>
              <li>If you see &quot;Prompt not found&quot; errors in logs</li>
              <li>If conversations are failing with &quot;Failed to render prompt&quot; errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
