'use client';

import { useParams } from 'next/navigation';
import { FilevineDocumentsTab } from '@/components/case/filevine-documents-tab';

export default function FilevinePage() {
  const params = useParams();
  const caseId = params.id as string;

  return <FilevineDocumentsTab caseId={caseId} />;
}
