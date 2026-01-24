'use client';

import { useParams } from 'next/navigation';
import { JurorsTab } from '@/components/case/jurors-tab';

export default function JurorsPage() {
  const params = useParams();
  const caseId = params.id as string;

  return <JurorsTab caseId={caseId} />;
}
