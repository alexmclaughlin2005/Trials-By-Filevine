'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Clock, Plus, Calendar } from 'lucide-react';
import { useCases } from '@/hooks/use-cases';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: cases, isLoading, error } = useCases();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent mx-auto"></div>
          <p className="mt-4 text-filevine-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-filevine-red">Error loading dashboard data</p>
          <p className="mt-2 text-sm text-filevine-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const activeCases = cases?.filter((c) => c.status === 'active') || [];
  const totalJurors = cases?.reduce((sum, c) => sum + (c._count?.juryPanels || 0), 0) || 0;

  return (
    <div className="h-full p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-filevine-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-filevine-gray-600">
            Here's an overview of your trial preparation
          </p>
        </div>
        <Link href="/cases/new">
          <Button variant="primary" size="default">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard
          title="Active Cases"
          value={activeCases.length.toString()}
          icon={<Briefcase className="h-5 w-5 text-filevine-blue" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Cases"
          value={(cases?.length || 0).toString()}
          icon={<Users className="h-5 w-5 text-filevine-green" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Jury Panels"
          value={totalJurors.toString()}
          icon={<TrendingUp className="h-5 w-5 text-filevine-orange" />}
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Organization"
          value={user?.organization.name || 'N/A'}
          icon={<Clock className="h-5 w-5 text-filevine-red" />}
          bgColor="bg-red-50"
          isText
        />
      </div>

      {/* Recent Cases */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-filevine-gray-900">Recent Cases</h2>
          <Link href="/cases">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="rounded-lg border border-filevine-gray-200 bg-white shadow-sm">
          {!cases || cases.length === 0 ? (
            <div className="p-16 text-center">
              <Briefcase className="mx-auto h-16 w-16 text-filevine-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-filevine-gray-900">No cases yet</h3>
              <p className="mt-2 text-sm text-filevine-gray-600">
                Get started by creating your first trial case
              </p>
              <Link href="/cases/new">
                <Button variant="primary" size="default" className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first case
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-filevine-gray-200 bg-filevine-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-filevine-gray-600">
                      Case Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-filevine-gray-600">
                      Case Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-filevine-gray-600">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-filevine-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-filevine-gray-600">
                      Trial Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-filevine-gray-200">
                  {cases.slice(0, 5).map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-filevine-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/cases/${caseItem.id}`}>
                          <div className="text-sm font-medium text-filevine-blue hover:underline">
                            {caseItem.name}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-filevine-gray-600">{caseItem.caseNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-filevine-gray-600">{caseItem.caseType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            caseItem.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-filevine-gray-600">
                          {caseItem.trialDate ? (
                            <>
                              <Calendar className="mr-2 h-4 w-4" />
                              {new Date(caseItem.trialDate).toLocaleDateString()}
                            </>
                          ) : (
                            <span className="text-filevine-gray-400">Not set</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-filevine-gray-900">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/cases/new">
            <div className="group flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-filevine-gray-300 bg-white shadow-sm transition-all hover:border-filevine-blue hover:bg-filevine-blue hover:shadow-md">
              <Briefcase className="mb-3 h-10 w-10 text-filevine-gray-400 transition-colors group-hover:text-white" />
              <div className="font-semibold text-filevine-gray-700 transition-colors group-hover:text-white">
                Create New Case
              </div>
            </div>
          </Link>
          <Link href="/personas">
            <div className="group flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-filevine-gray-300 bg-white shadow-sm transition-all hover:border-filevine-green hover:bg-filevine-green hover:shadow-md">
              <Users className="mb-3 h-10 w-10 text-filevine-gray-400 transition-colors group-hover:text-white" />
              <div className="font-semibold text-filevine-gray-700 transition-colors group-hover:text-white">
                Manage Personas
              </div>
            </div>
          </Link>
          <Link href="/focus-groups/new">
            <div className="group flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-filevine-gray-300 bg-white shadow-sm transition-all hover:border-filevine-orange hover:bg-filevine-orange hover:shadow-md">
              <TrendingUp className="mb-3 h-10 w-10 text-filevine-gray-400 transition-colors group-hover:text-white" />
              <div className="font-semibold text-filevine-gray-700 transition-colors group-hover:text-white">
                Run Focus Group
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  bgColor,
  isText = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wide text-filevine-gray-600">
          {title}
        </span>
        <div className={`rounded-lg p-2.5 ${bgColor}`}>{icon}</div>
      </div>
      <div className={`${isText ? 'text-xl' : 'text-4xl'} font-bold text-filevine-gray-900`}>
        {value}
      </div>
    </div>
  );
}
