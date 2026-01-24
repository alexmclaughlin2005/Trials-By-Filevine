import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Case {
  id: string;
  name: string;
  caseNumber: string;
  caseType: string;
  status: string;
  trialDate: string | null;
  _count: {
    juryPanels: number;
    facts: number;
    arguments: number;
  };
}

interface CasesResponse {
  cases: Case[];
}

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const data = await apiClient.get<CasesResponse>('/cases');
      // Ensure we always return an array
      return Array.isArray(data.cases) ? data.cases : [];
    },
    // Set initial data to empty array to prevent undefined errors
    placeholderData: [],
  });
}
