'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FocusGroupManager } from '@/components/focus-group-manager';

interface Argument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
  version: number;
  isCurrent: boolean;
}

interface CaseResponse {
  case: {
    id: string;
    arguments: Argument[];
  };
}

export default function FocusGroupsPage() {
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

  return <FocusGroupManager caseId={caseId} arguments={data.arguments || []} />;
}
