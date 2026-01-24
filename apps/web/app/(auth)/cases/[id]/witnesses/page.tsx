'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { WitnessesTab } from '@/components/case/witnesses-tab';

interface Witness {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  summary?: string;
  directOutline?: string;
  crossOutline?: string;
  sortOrder: number;
}

interface CaseResponse {
  case: {
    id: string;
    witnesses: Witness[];
  };
}

export default function WitnessesPage() {
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

  return <WitnessesTab caseId={caseId} witnesses={data.witnesses || []} />;
}
