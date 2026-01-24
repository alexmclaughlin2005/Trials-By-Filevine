'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FactsTab } from '@/components/case/facts-tab';

interface Fact {
  id: string;
  content: string;
  factType: string;
  source?: string;
  sortOrder: number;
}

interface CaseResponse {
  case: {
    id: string;
    facts: Fact[];
  };
}

export default function FactsPage() {
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

  return <FactsTab caseId={caseId} facts={data.facts || []} />;
}
