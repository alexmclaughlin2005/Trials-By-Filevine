'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FileText, MessageSquare, Users, Scale, HelpCircle, UserSearch } from 'lucide-react';
import Link from 'next/link';

interface Case {
  id: string;
  name: string;
  caseNumber: string;
  caseType: string;
  plaintiffName: string;
  defendantName: string;
  ourSide: string;
  trialDate: string | null;
  status: string;
  jurisdiction: string | null;
  venue: string | null;
}

interface CaseResponse {
  case: Case;
}

export default function CaseOverviewPage() {
  const params = useParams();
  const caseId = params.id as string;

  const { data } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await apiClient.get<CaseResponse>(`/cases/${caseId}`);
      return response.case;
    },
  });

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-filevine-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link
            href={`/cases/${caseId}/facts`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <FileText className="mb-2 h-6 w-6 text-filevine-blue" />
            <p className="font-medium text-filevine-gray-900">Manage Facts</p>
            <p className="mt-1 text-xs text-filevine-gray-600">Add and organize case facts</p>
          </Link>
          <Link
            href={`/cases/${caseId}/arguments`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <MessageSquare className="mb-2 h-6 w-6 text-filevine-green" />
            <p className="font-medium text-filevine-gray-900">Build Arguments</p>
            <p className="mt-1 text-xs text-filevine-gray-600">Craft persuasive arguments</p>
          </Link>
          <Link
            href={`/cases/${caseId}/witnesses`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <Users className="mb-2 h-6 w-6 text-filevine-blue" />
            <p className="font-medium text-filevine-gray-900">Add Witnesses</p>
            <p className="mt-1 text-xs text-filevine-gray-600">Document witness strategies</p>
          </Link>
          <Link
            href={`/cases/${caseId}/jurors`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <UserSearch className="mb-2 h-6 w-6 text-purple-500" />
            <p className="font-medium text-filevine-gray-900">Research Jurors</p>
            <p className="mt-1 text-xs text-filevine-gray-600">Profile and analyze jury panel</p>
          </Link>
          <Link
            href={`/cases/${caseId}/questions`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <HelpCircle className="mb-2 h-6 w-6 text-filevine-blue" />
            <p className="font-medium text-filevine-gray-900">Generate Questions</p>
            <p className="mt-1 text-xs text-filevine-gray-600">AI-powered voir dire questions</p>
          </Link>
          <Link
            href={`/cases/${caseId}/focus-groups`}
            className="rounded-lg border border-filevine-gray-200 p-4 text-left transition-colors hover:border-filevine-blue hover:bg-filevine-blue/5"
          >
            <Scale className="mb-2 h-6 w-6 text-filevine-green" />
            <p className="font-medium text-filevine-gray-900">Run Focus Groups</p>
            <p className="mt-1 text-xs text-filevine-gray-600">Simulate jury deliberations</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
