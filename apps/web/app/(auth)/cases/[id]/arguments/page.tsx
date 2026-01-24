'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ArgumentsTab } from '@/components/case/arguments-tab';

interface Argument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
  version: number;
  isCurrent: boolean;
  parentId?: string;
  changeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CaseResponse {
  case: {
    id: string;
    arguments: Argument[];
  };
}

export default function ArgumentsPage() {
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

  return <ArgumentsTab caseId={caseId} arguments={data.arguments || []} />;
}
