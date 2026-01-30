'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Loader2, Search, ArrowUpDown, AlertCircle, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

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
  filevineProject?: {
    id: string;
    filevineProjectId: string;
    projectName: string;
  } | null;
}

type SortField = 'name' | 'trialDate' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiClient.get<{ cases: Case[] }>('/cases');
      return response.cases || [];
    },
    placeholderData: [],
  });

  // Calculate urgency for trial dates
  const getTrialUrgency = (trialDate: string | null) => {
    if (!trialDate) return null;
    const days = differenceInDays(new Date(trialDate), new Date());
    if (days < 0) return 'past';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'upcoming';
  };

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter((caseItem) => {
      const matchesSearch =
        caseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caseItem.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'trialDate' || sortField === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, searchQuery, sortField, sortDirection, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, upcoming: 0 };
    const active = data.filter((c) => c.status === 'active').length;
    const upcoming = data.filter((c) => {
      if (!c.trialDate) return false;
      const days = differenceInDays(new Date(c.trialDate), new Date());
      return days >= 0 && days <= 30;
    }).length;
    return { total: data.length, active, upcoming };
  }, [data]);

  return (
    <div className="p-8">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Cases</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Active Cases</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Trials This Month</p>
            <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases by name or case number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </Button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-lg border bg-card">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 p-6 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load cases. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-4 text-lg font-medium">No cases yet</p>
            <p className="mb-6 text-sm">Create your first case to get started with Juries by Filevine</p>
            <Link href="/cases/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Case
              </Button>
            </Link>
          </div>
        )}

        {data && data.length > 0 && (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-6 py-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-5 flex items-center gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Case Name
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => handleSort('trialDate')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Trial Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
              <div className="col-span-1">Jurors</div>
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Last Updated
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {filteredAndSortedCases.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No cases match your search criteria</p>
                </div>
              ) : (
                filteredAndSortedCases.map((caseItem) => {
                  const urgency = getTrialUrgency(caseItem.trialDate);
                  // Generate initials for avatar
                  const initials = caseItem.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  // Generate consistent color for avatar based on case name
                  const getAvatarColor = (name: string) => {
                    const colors = [
                      'from-blue-500 to-blue-600',
                      'from-purple-500 to-purple-600',
                      'from-green-500 to-green-600',
                      'from-orange-500 to-orange-600',
                      'from-pink-500 to-pink-600',
                      'from-indigo-500 to-indigo-600',
                      'from-teal-500 to-teal-600',
                      'from-red-500 to-red-600',
                    ];
                    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return colors[hash % colors.length];
                  };

                  return (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                    >
                      {/* Case Name & Number */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          {/* Urgency Indicator */}
                          <div
                            className={`h-10 w-1 rounded-full ${
                              urgency === 'urgent'
                                ? 'bg-red-500'
                                : urgency === 'soon'
                                  ? 'bg-yellow-500'
                                  : urgency === 'upcoming'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-200'
                            }`}
                          />
                          {/* Avatar with initials */}
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(caseItem.name)} text-sm font-semibold text-white shadow-sm`}>
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-foreground">{caseItem.name}</p>
                              {caseItem.filevineProject && (
                                <div className="group relative">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-filevine-blue">
                                    <svg
                                      className="h-3 w-3 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                      />
                                    </svg>
                                  </div>
                                  {/* Tooltip */}
                                  <div className="absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                                    Linked to Filevine
                                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {caseItem.caseNumber && (
                              <p className="truncate text-sm text-muted-foreground">#{caseItem.caseNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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

                      {/* Trial Date */}
                      <div className="col-span-2 flex items-center">
                        {caseItem.trialDate ? (
                          <div>
                            <p className="text-sm font-medium">{format(new Date(caseItem.trialDate), 'MMM d, yyyy')}</p>
                            {urgency && urgency !== 'past' && (
                              <p
                                className={`text-xs ${
                                  urgency === 'urgent'
                                    ? 'text-red-600'
                                    : urgency === 'soon'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                }`}
                              >
                                {differenceInDays(new Date(caseItem.trialDate), new Date())} days
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </div>

                      {/* Jurors */}
                      <div className="col-span-1 flex items-center">
                        <p className="text-sm">
                          <span className="font-medium">{caseItem._count.juryPanels}</span>
                          <span className="text-muted-foreground"> panel(s)</span>
                        </p>
                      </div>

                      {/* Last Updated */}
                      <div className="col-span-2 flex items-center">
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
