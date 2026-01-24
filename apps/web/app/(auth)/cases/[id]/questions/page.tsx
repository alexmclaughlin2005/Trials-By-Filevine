'use client';

import { useParams } from 'next/navigation';
import { QuestionGenerator } from '@/components/question-generator';

export default function QuestionsPage() {
  const params = useParams();
  const caseId = params.id as string;

  return <QuestionGenerator caseId={caseId} />;
}
