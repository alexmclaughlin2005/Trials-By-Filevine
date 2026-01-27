'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { FileText, AlertCircle } from 'lucide-react';

interface EmptyArgumentsStateProps {
  caseId: string;
}

export function EmptyArgumentsState({ caseId }: EmptyArgumentsStateProps) {
  const router = useRouter();

  const handleCreateArgument = () => {
    // Navigate to arguments page with create action
    router.push(`/cases/${caseId}/arguments?action=create`);
  };

  const handleGoToArguments = () => {
    // Navigate to arguments page
    router.push(`/cases/${caseId}/arguments`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Arguments to Test
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Focus groups need an argument or opening statement to react to
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h4 className="mt-4 text-lg font-medium text-gray-900">
          No Arguments Created Yet
        </h4>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          Before running a focus group, you need to create at least one argument
          or opening statement for the panel to react to.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={handleCreateArgument}
          >
            Create Your First Argument
          </Button>
          <Button
            variant="outline"
            onClick={handleGoToArguments}
          >
            Go to Arguments Page
          </Button>
        </div>
      </div>

      {/* Informational Box */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="ml-3">
            <h5 className="text-sm font-medium text-blue-800">
              What makes a good argument to test?
            </h5>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Opening statements for trial</li>
                <li>Key themes or theories of the case</li>
                <li>Closing arguments</li>
                <li>Responses to anticipated defenses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
