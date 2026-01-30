'use client';

import { useParams } from 'next/navigation';
import { CaseVoirDireQuestionsManager } from '@/components/case-voir-dire-questions/case-voir-dire-questions-manager';

export default function CaseVoirDireQuestionsPage() {
  const params = useParams();
  const caseId = params.id as string;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-filevine-gray-900">Case-Level Voir Dire Questions</h1>
          <p className="mt-2 text-sm text-filevine-gray-600">
            Manage questions that can be asked to all jurors in this case. These questions can be
            AI-generated or created manually.
          </p>
        </div>

        <CaseVoirDireQuestionsManager caseId={caseId} />
      </div>
    </div>
  );
}
