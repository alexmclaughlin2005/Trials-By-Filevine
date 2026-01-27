'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CaseInfo {
  id: string;
  name: string;
  caseNumber: string;
  caseType: string;
  status: string;
  trialDate?: string | null;
  venue?: string | null;
  jurisdiction?: string | null;
}

interface CaseContextHeaderProps {
  caseInfo: CaseInfo;
  onBack?: () => void;
  backHref?: string;
  sticky?: boolean;
}

export function CaseContextHeader({
  caseInfo,
  onBack,
  backHref,
  sticky = true,
}: CaseContextHeaderProps) {
  const router = useRouter();

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.push(`/cases/${caseInfo.id}/focus-groups`);
    }
  };

  const statusVariant = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      className={`border-b border-filevine-gray-200 bg-white px-6 py-3 ${
        sticky ? 'sticky top-14 z-10' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Folder className="h-5 w-5 text-filevine-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-filevine-gray-900 truncate">
                {caseInfo.name}
              </h2>
              <Badge
                className={
                  statusVariant[caseInfo.status as keyof typeof statusVariant] ||
                  statusVariant.active
                }
              >
                {caseInfo.status}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-filevine-gray-600 flex-wrap">
              <span>Case #{caseInfo.caseNumber}</span>
              <span>•</span>
              <span className="capitalize">{caseInfo.caseType}</span>
              {caseInfo.trialDate && formatDate(caseInfo.trialDate) && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Trial: {formatDate(caseInfo.trialDate)}</span>
                  </div>
                </>
              )}
              {caseInfo.venue && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{caseInfo.venue}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2 flex-shrink-0 ml-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Button>
      </div>
    </div>
  );
}
