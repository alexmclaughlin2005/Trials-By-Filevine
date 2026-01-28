'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, RefreshCw, Users, TestTube, ToggleLeft, Flag } from 'lucide-react';
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
      const data = await response.json();
      setFeatureFlags(data.flags || []);
    } catch (error) {
      console.error('Error loading feature flags:', error);
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to seed feature flags');
      }

      const data = await response.json();
      alert(`Success: ${data.message || 'Feature flags seeded successfully!'}`);
      await loadFeatureFlags();
    } catch (error) {
      console.error('Error seeding feature flags:', error);
      alert(`Failed to seed feature flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Check status on mount
  useEffect(() => {
    checkSeedStatus();
    loadFeatureFlags();
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
                    className="ml-4"
                  >
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
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
    </div>
  );
}
