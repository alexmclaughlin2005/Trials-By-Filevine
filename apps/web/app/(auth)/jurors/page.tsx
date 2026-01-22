'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Case {
  id: string;
  name: string;
  caseNumber: string;
  juryPanels: Array<{
    id: string;
    panelDate: string;
    jurors: Array<{
      id: string;
      jurorNumber: string;
      firstName: string;
      lastName: string;
      occupation: string | null;
      status: string;
    }>;
  }>;
}

interface CasesResponse {
  cases: Case[];
}

export default function JurorsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cases-with-jurors'],
    queryFn: async () => {
      const response = await apiClient.get<CasesResponse>('/cases?include=juryPanels.jurors');
      return response.cases;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-filevine-blue border-t-transparent"></div>
          <p className="mt-4 text-filevine-gray-600">Loading jurors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : 'Failed to load jurors'}
          </p>
        </div>
      </div>
    );
  }

  // Flatten all jurors from all cases
  const allJurors = data?.flatMap((c) =>
    (c.juryPanels || []).flatMap((panel) =>
      (panel.jurors || []).map((juror) => ({
        ...juror,
        caseName: c.name,
        caseNumber: c.caseNumber,
        panelDate: panel.panelDate,
      }))
    )
  ) || [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-filevine-gray-900">Jurors</h1>
          <p className="mt-1 text-filevine-gray-600">
            View and analyze jurors from all your cases
          </p>
        </div>

        {allJurors.length === 0 ? (
          <div className="rounded-lg border border-filevine-gray-200 bg-white p-8 text-center">
            <p className="text-filevine-gray-600">No jurors found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-filevine-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-filevine-gray-200">
              <thead className="bg-filevine-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Juror #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Occupation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-filevine-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-filevine-gray-200 bg-white">
                {allJurors.map((juror) => (
                  <tr key={juror.id} className="hover:bg-filevine-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-filevine-gray-900">
                      {juror.jurorNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-filevine-gray-900">
                      {juror.firstName} {juror.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-filevine-gray-600">
                      {juror.occupation || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 text-sm text-filevine-gray-600">
                      <div>
                        <div className="font-medium text-filevine-gray-900">
                          {juror.caseName}
                        </div>
                        <div className="text-xs text-filevine-gray-500">
                          {juror.caseNumber}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          juror.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : juror.status === 'selected'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {juror.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/jurors/${juror.id}`}
                        className="text-filevine-blue hover:text-filevine-blue-dark hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
