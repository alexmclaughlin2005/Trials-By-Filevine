'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, RefreshCw, Users, TestTube, ToggleLeft, Flag, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

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

  // Persona V2 import state
  const [isImportingPersonas, setIsImportingPersonas] = useState(false);
  const [personaImportResult, setPersonaImportResult] = useState<{ success: boolean; message: string; imported?: number } | null>(null);
  const [personaImportError, setPersonaImportError] = useState<string | null>(null);

  // Feature flags state
  interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
  }
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState(false);
  const [isSeedingFlags, setIsSeedingFlags] = useState(false);

  // Persona headshot generation state
  const [isGeneratingHeadshots, setIsGeneratingHeadshots] = useState(false);
  const [headshotStatus, setHeadshotStatus] = useState<{ imageCount: number; totalSizeMB: string } | null>(null);
  const [isLoadingHeadshotStatus, setIsLoadingHeadshotStatus] = useState(false);
  const [headshotResult, setHeadshotResult] = useState<{ success: boolean; message: string; statusId?: string } | null>(null);
  const [headshotError, setHeadshotError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    total: number;
    processed: number;
    skipped: number;
    failed: number;
    current?: { personaId: string; nickname: string; archetype: string };
    result?: { processed: number; skipped: number; failed: number; errors: string[] };
    error?: string;
  } | null>(null);
  const [isPollingProgress, setIsPollingProgress] = useState(false);

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

      const response = await apiClient.post<SeedResult>('/admin/seed-prompts', {});

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

  const handleImportPersonas = async () => {
    try {
      setIsImportingPersonas(true);
      setPersonaImportError(null);
      setPersonaImportResult(null);

      const response = await apiClient.post<{ success: boolean; message: string; imported?: number }>('/admin/import-personas-v2', {});

      setPersonaImportResult(response);
    } catch (error) {
      console.error('Error importing personas:', error);
      setPersonaImportError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsImportingPersonas(false);
    }
  };

  const loadFeatureFlags = async () => {
    try {
      setIsLoadingFlags(true);
      // Use Next.js API route instead of backend to avoid CORS
      const response = await fetch('/api/admin/feature-flags');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load feature flags:', response.status, errorData);
        // Don't set flags if there's an error - might be migration issue
        setFeatureFlags([]);
        return;
      }
      
      const data = await response.json();
      console.log('Loaded feature flags:', data);
      setFeatureFlags(data.flags || []);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      setFeatureFlags([]);
    } finally {
      setIsLoadingFlags(false);
    }
  };

  const handleSeedFeatureFlags = async () => {
    try {
      setIsSeedingFlags(true);
      // Call the backend seed endpoint via Next.js API route
      const response = await fetch('/api/admin/seed-feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Send empty JSON body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Seed error response:', response.status, errorData);
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to seed feature flags`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Seed success:', data);
      alert(`Success: ${data.message || 'Feature flags seeded successfully!'}`);
      // Reload flags after seeding
      await loadFeatureFlags();
    } catch (error) {
      console.error('Error seeding feature flags:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to seed feature flags: ${errorMessage}\n\nThis might mean:\n1. Database migration hasn't been run\n2. Prisma client needs regeneration\n3. Check backend logs for details`);
    } finally {
      setIsSeedingFlags(false);
    }
  };

  const handleToggleFlag = async (key: string, currentlyEnabled: boolean) => {
    try {
      // Use Next.js API route instead of backend to avoid CORS
      const response = await fetch(`/api/admin/feature-flags/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle flag');
      }

      await loadFeatureFlags();
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      alert('Failed to toggle feature flag');
    }
  };

  const checkHeadshotStatus = async () => {
    try {
      setIsLoadingHeadshotStatus(true);
      const response = await apiClient.get<{ imageCount: number; totalSizeMB: string }>('/admin/persona-headshots-count');
      setHeadshotStatus(response);
    } catch (error) {
      console.error('Error checking headshot status:', error);
      setHeadshotStatus({ imageCount: 0, totalSizeMB: '0' });
    } finally {
      setIsLoadingHeadshotStatus(false);
    }
  };

  const handleGenerateHeadshots = async (regenerate: boolean = false) => {
    try {
      setIsGeneratingHeadshots(true);
      setHeadshotError(null);
      setHeadshotResult(null);
      setGenerationProgress(null);

      const response = await apiClient.post<{ success: boolean; message: string; statusId: string }>('/admin/generate-persona-headshots', {
        regenerate,
        updateJson: true,
      });

      setHeadshotResult({
        success: true,
        message: 'Headshot generation started',
        statusId: response.statusId,
      });

      // Start polling for progress
      if (response.statusId) {
        setIsPollingProgress(true);
        pollGenerationProgress(response.statusId);
      }

      // Refresh image count status after a delay
      setTimeout(() => {
        checkHeadshotStatus();
      }, 5000);
    } catch (error) {
      console.error('Error generating headshots:', error);
      setHeadshotError(error instanceof Error ? error.message : 'Unknown error');
      setIsPollingProgress(false);
    } finally {
      setIsGeneratingHeadshots(false);
    }
  };

  const pollGenerationProgress = async (statusId: string) => {
    let pollDelay = 60000; // Start with 60 seconds (increased from 30s)
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3; // Reduced from 5 - stop faster on connection errors
    let pollTimeout: NodeJS.Timeout | null = null;

    const poll = async () => {
      try {
        const status = await apiClient.get<{
          status: 'pending' | 'running' | 'completed' | 'failed';
          progress: {
            total: number;
            processed: number;
            skipped: number;
            failed: number;
            current?: { personaId: string; nickname: string; archetype: string };
          };
          result?: { processed: number; skipped: number; failed: number; errors: string[] };
          error?: string;
        }>(`/admin/persona-headshots-status/${statusId}`);

        // Reset error counter on success
        consecutiveErrors = 0;
        pollDelay = 60000; // Reset to base delay

        setGenerationProgress({
          status: status.status,
          total: status.progress.total,
          processed: status.progress.processed,
          skipped: status.progress.skipped,
          failed: status.progress.failed,
          current: status.progress.current,
          result: status.result,
          error: status.error,
        });

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          setIsPollingProgress(false);
          
          // Refresh image count
          setTimeout(() => {
            checkHeadshotStatus();
          }, 2000);
          return;
        }

        // Schedule next poll
        pollTimeout = setTimeout(poll, pollDelay);
      } catch (error: any) {
        consecutiveErrors++;

        // Check if it's a connection error (API Gateway not running)
        const isConnectionError = error?.message?.includes('Failed to fetch') || 
                                   error?.message?.includes('ERR_CONNECTION_REFUSED') ||
                                   error?.message?.includes('NetworkError') ||
                                   (error?.statusCode === 0 && !error?.status);

        // Check if it's a 429 (Too Many Requests) error
        const isRateLimitError = error?.statusCode === 429 || 
                                  error?.message?.includes('429') || 
                                  error?.message?.includes('Too Many Requests');

        if (isConnectionError) {
          // Stop immediately on connection errors - API Gateway is likely down
          console.warn('API Gateway connection failed. Stopping polling.');
          setIsPollingProgress(false);
          setHeadshotError('Cannot connect to API Gateway. Please ensure the API Gateway is running on port 3001.');
          return;
        } else if (isRateLimitError) {
          // Exponential backoff for rate limit errors (max 2 minutes)
          pollDelay = Math.min(pollDelay * 1.5, 120000);
          console.warn(`Rate limited. Increasing poll interval to ${pollDelay / 1000}s`);
        } else {
          // For other errors, log but continue polling (up to max errors)
          if (consecutiveErrors < maxConsecutiveErrors) {
            console.warn(`Error polling generation progress (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
          }
        }

        // Stop polling after too many consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('Too many consecutive errors. Stopping polling.');
          setIsPollingProgress(false);
          setHeadshotError('Failed to poll generation status. Please refresh the page or check if the API Gateway is running.');
          return;
        }

        // Schedule next poll with current delay
        pollTimeout = setTimeout(poll, pollDelay);
      }
    };

    // Start polling
    setIsPollingProgress(true);
    pollTimeout = setTimeout(poll, 5000); // First poll after 5 seconds

    // Cleanup timeout after 30 minutes (safety timeout)
    setTimeout(() => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
      setIsPollingProgress(false);
    }, 30 * 60 * 1000);
  };

  // Check status on mount
  useEffect(() => {
    checkSeedStatus();
    loadFeatureFlags();
    checkHeadshotStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage system configuration and database seeding</p>
      </div>

      {/* AI Services Testing Link */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            AI Services V2 Testing
          </CardTitle>
          <CardDescription>
            Test all Phase 4 AI services with production V2 persona data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/ai-testing">
            <Button className="w-full" variant="default">
              <TestTube className="mr-2 h-4 w-4" />
              Open AI Testing Dashboard
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            Test Persona Suggester, Voir Dire Generator, and Case Strategy services
          </p>
        </CardContent>
      </Card>

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

      {/* Persona V2 Import Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Persona V2 Data Import
          </CardTitle>
          <CardDescription>
            Import 60 V2 personas across 10 archetypes into the production database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import Button */}
          <Button
            onClick={handleImportPersonas}
            disabled={isImportingPersonas}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            {isImportingPersonas ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Personas...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Import V2 Personas
              </>
            )}
          </Button>

          {/* Success Message */}
          {personaImportResult && personaImportResult.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {personaImportResult.message}
                {personaImportResult.imported && (
                  <div className="mt-2 text-xs">
                    Successfully imported {personaImportResult.imported} personas across 10 archetypes
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {personaImportError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to import personas: {personaImportError}
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">What this does:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Imports 60 enhanced V2 personas from JSON files</li>
              <li>Covers 10 archetype categories (Bootstrapper, Crusader, Scale-Balancer, etc.)</li>
              <li>Includes instant reads, danger levels, verdict predictions, and strike/keep strategies</li>
              <li>Safe to run multiple times (will skip duplicates)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags (V2 Rollout Control)
          </CardTitle>
          <CardDescription>
            Control which V2 features are enabled in production. Toggle flags for safe rollout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seed Flags Button (only if no flags) */}
          {featureFlags.length === 0 && !isLoadingFlags && (
            <Button
              onClick={handleSeedFeatureFlags}
              disabled={isSeedingFlags}
              variant="outline"
              className="w-full"
            >
              {isSeedingFlags ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Flags...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Feature Flags
                </>
              )}
            </Button>
          )}

          {/* Loading State */}
          {isLoadingFlags && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-filevine-blue-600" />
            </div>
          )}

          {/* Feature Flags List */}
          {!isLoadingFlags && featureFlags.length > 0 && (
            <div className="space-y-3">
              {featureFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-start justify-between p-4 border border-filevine-gray-200 rounded-lg hover:bg-filevine-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-filevine-gray-900">
                        {flag.name}
                      </h3>
                      {flag.enabled ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-filevine-gray-600">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    {flag.description && (
                      <p className="text-sm text-filevine-gray-600">
                        {flag.description}
                      </p>
                    )}
                    <p className="text-xs text-filevine-gray-500 mt-1">
                      Key: <code className="bg-filevine-gray-100 px-1 py-0.5 rounded">{flag.key}</code>
                    </p>
                  </div>
                  <Button
                    onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                    variant={flag.enabled ? 'destructive' : 'default'}
                    size="sm"
                    className="ml-4 flex-shrink-0"
                  >
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - Show if no flags and not loading */}
          {!isLoadingFlags && featureFlags.length === 0 && (
            <Alert>
              <AlertDescription>
                No feature flags found. Click &quot;Initialize Feature Flags&quot; above to create them.
                {featureFlags.length === 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    If seeding fails, check that:
                    <ul className="list-disc list-inside mt-1 ml-2">
                      <li>Database migration has been run</li>
                      <li>Prisma client has been regenerated</li>
                      <li>Backend API is accessible</li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Refresh Button */}
          {featureFlags.length > 0 && (
            <Button
              onClick={loadFeatureFlags}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Flags
            </Button>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-medium">How to use:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>personas_v2:</strong> Enable V2 persona data globally</li>
              <li><strong>focus_groups_v2:</strong> Use V2 data in focus group simulations</li>
              <li><strong>voir_dire_v2:</strong> Enable V2 voir dire question generation</li>
              <li>Toggle ON to enable a feature, OFF to revert to V1</li>
              <li>Changes take effect immediately across all services</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Persona Headshot Generation Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Persona Headshot Generation
          </CardTitle>
          <CardDescription>
            Generate professional headshot images for all personas using OpenAI DALL-E 3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Current Status</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkHeadshotStatus}
                disabled={isLoadingHeadshotStatus}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingHeadshotStatus ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoadingHeadshotStatus ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-filevine-blue-600" />
              </div>
            ) : headshotStatus ? (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Generated Images</p>
                    <p className="text-xs text-muted-foreground">
                      {headshotStatus.imageCount} images ({headshotStatus.totalSizeMB} MB)
                    </p>
                  </div>
                  {headshotStatus.imageCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            ) : null}

            {/* Generation Progress */}
            {generationProgress && (
              <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Generation Progress</h4>
                  {generationProgress.status === 'running' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {generationProgress.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {generationProgress.status === 'failed' && (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {generationProgress.total > 0 && (
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((generationProgress.processed + generationProgress.skipped + generationProgress.failed) / generationProgress.total) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{generationProgress.total}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processed</p>
                        <p className="font-semibold text-green-600">{generationProgress.processed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Skipped</p>
                        <p className="font-semibold text-gray-600">{generationProgress.skipped}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-semibold text-red-600">{generationProgress.failed}</p>
                      </div>
                    </div>

                    {/* Current Item */}
                    {generationProgress.current && generationProgress.status === 'running' && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <p className="text-muted-foreground">Currently processing:</p>
                        <p className="font-medium">
                          {generationProgress.current.nickname} ({generationProgress.current.personaId})
                        </p>
                        <p className="text-muted-foreground">{generationProgress.current.archetype}</p>
                      </div>
                    )}

                    {/* Completion Message */}
                    {generationProgress.status === 'completed' && generationProgress.result && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                        <p className="text-green-800 font-medium">✓ Generation completed!</p>
                        <p className="text-green-700">
                          Processed: {generationProgress.result.processed}, 
                          Skipped: {generationProgress.result.skipped}, 
                          Failed: {generationProgress.result.failed}
                        </p>
                        {generationProgress.result.errors.length > 0 && (
                          <details className="mt-1">
                            <summary className="text-red-600 cursor-pointer">View errors ({generationProgress.result.errors.length})</summary>
                            <ul className="list-disc list-inside mt-1 text-red-700">
                              {generationProgress.result.errors.slice(0, 5).map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                              {generationProgress.result.errors.length > 5 && (
                                <li>... and {generationProgress.result.errors.length - 5} more</li>
                              )}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {generationProgress.status === 'failed' && generationProgress.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                        <p className="text-red-800 font-medium">✗ Generation failed</p>
                        <p className="text-red-700">{generationProgress.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleGenerateHeadshots(false)}
              disabled={isGeneratingHeadshots}
              className="w-full"
              size="lg"
              variant="default"
            >
              {isGeneratingHeadshots ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate Missing Headshots
                </>
              )}
            </Button>

            <Button
              onClick={() => handleGenerateHeadshots(true)}
              disabled={isGeneratingHeadshots}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {isGeneratingHeadshots ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate All Headshots
                </>
              )}
            </Button>
          </div>

          {/* Success Message */}
          {headshotResult && headshotResult.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {headshotResult.message}
                <div className="mt-2 text-xs">
                  <p>💡 Tip: Generation runs in the background. Refresh the status above to see progress.</p>
                  <p>⏱️ Estimated time: ~15-20 minutes for all personas</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {headshotError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to start headshot generation: {headshotError}
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Generate Missing:</strong> Only creates images for personas that don't have one yet</li>
              <li><strong>Regenerate All:</strong> Recreates all images (useful if you want to update them)</li>
              <li>Images are saved to <code className="bg-muted px-1 py-0.5 rounded">Juror Personas/images/</code></li>
              <li>JSON files are automatically updated with image URLs</li>
              <li>Uses OpenAI DALL-E 3 (~$0.04 per image, ~$4-5 for all personas)</li>
            </ul>
            <p className="font-medium mt-3">Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>OPENAI_API_KEY must be set in environment variables</li>
              <li>Persona JSON files must exist in <code className="bg-muted px-1 py-0.5 rounded">Juror Personas/generated/</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
