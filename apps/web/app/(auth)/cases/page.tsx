'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';

interface Case {
  id: string;
  name: string;
  caseNumber: string | null;
  caseType: string | null;
  status: string;
  trialDate: string | null;
  updatedAt: string;
  _count: {
    juryPanels: number;
    facts: number;
    arguments: number;
  };
}

export default function CasesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiClient.get<{ cases: Case[] }>('/cases');
      return response;
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-muted-foreground">Manage all your trial cases</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
            Failed to load cases. Please try again.
          </div>
        )}

        {data && data.cases && data.cases.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="mb-4">No cases yet. Create your first case to get started with TrialForge AI</p>
            <Link href="/cases/new">
              <Button>Create Case</Button>
            </Link>
          </div>
        )}

        {data && data.cases &&
          data.cases.map((caseItem) => (
            <div key={caseItem.id} className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{caseItem.name}</h3>
                  {caseItem.caseNumber && (
                    <p className="text-sm text-muted-foreground">
                      Case #{caseItem.caseNumber}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    caseItem.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : caseItem.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Trial Date</p>
                  <p className="font-medium">
                    {caseItem.trialDate
                      ? format(new Date(caseItem.trialDate), 'MMM dd, yyyy')
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jury Panels</p>
                  <p className="font-medium">{caseItem._count.juryPanels} panel(s)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(caseItem.updatedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link href={`/cases/${caseItem.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
