'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, MessageSquare, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FocusGroupSession } from '@/types/focus-group';

interface SessionCardProps {
  session: FocusGroupSession & {
    _count?: {
      personas?: number;
      results?: number;
      recommendations?: number;
    };
    case?: {
      id: string;
      name: string;
      caseNumber: string;
      caseType: string;
      status: string;
    };
  };
  showCaseInfo?: boolean;
  onViewResults?: (sessionId: string) => void;
  onGoToCase?: (caseId: string) => void;
}

export function SessionCard({
  session,
  showCaseInfo = false,
  onViewResults,
  onGoToCase,
}: SessionCardProps) {
  const statusVariant = {
    completed: 'bg-green-100 text-green-700',
    running: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Case name - prominent if showing case info */}
          {showCaseInfo && session.case && (
            <Link href={`/cases/${session.case.id}`} className="group">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-filevine-blue" />
                <h3 className="text-lg font-bold text-filevine-blue group-hover:underline">
                  {session.case.name}
                </h3>
                <span className="text-sm text-filevine-gray-500">
                  #{session.case.caseNumber}
                </span>
              </div>
            </Link>
          )}

          {/* Session name */}
          <h4
            className={`font-semibold text-filevine-gray-900 ${showCaseInfo ? 'text-base' : 'text-lg'}`}
          >
            {session.name}
          </h4>

          {/* Description */}
          {session.description && (
            <p className="mt-2 text-sm text-filevine-gray-600">{session.description}</p>
          )}

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-filevine-gray-600">
            {session.completedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.completedAt)}</span>
              </div>
            )}
            {!session.completedAt && session.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(session.createdAt)}</span>
              </div>
            )}
            {(session._count?.personas ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{session._count?.personas} personas</span>
              </div>
            )}
            {(session._count?.results ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>{session._count?.results} reactions</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Badge
          className={`ml-4 ${statusVariant[session.status as keyof typeof statusVariant] || statusVariant.draft}`}
        >
          {session.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        {session.status === 'completed' && onViewResults && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewResults(session.id)}
            className="flex items-center gap-2"
          >
            View Results
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {session.status === 'running' && onViewResults && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewResults(session.id)}
            className="flex items-center gap-2"
          >
            View Progress
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {session.status === 'draft' && (
          <Button variant="outline" size="sm" disabled>
            Draft
          </Button>
        )}
        {showCaseInfo && session.case && onGoToCase && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoToCase(session.case!.id)}
            className="flex items-center gap-2"
          >
            <Folder className="h-4 w-4" />
            Go to Case
          </Button>
        )}
      </div>
    </div>
  );
}
