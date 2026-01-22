import { useEffect, useMemo } from 'react';
import { useCollaboration } from '@/contexts/collaboration-context';

export function useCaseCollaboration(caseId: string) {
  const { joinRoom, leaveRoom, activeViewers, isConnected, onCollaborationEvent } =
    useCollaboration();

  // Auto-join case room when component mounts
  useEffect(() => {
    if (caseId && isConnected) {
      console.log('Auto-joining case room:', caseId);
      joinRoom('case', caseId);

      return () => {
        console.log('Auto-leaving case room:', caseId);
        leaveRoom('case', caseId);
      };
    }
  }, [caseId, isConnected, joinRoom, leaveRoom]);

  // Filter viewers for this specific case
  const caseViewers = useMemo(() => {
    return activeViewers.filter(
      (viewer) => viewer.resourceType === 'case' && viewer.resourceId === caseId
    );
  }, [activeViewers, caseId]);

  // Subscribe to case-specific collaboration events
  useEffect(() => {
    if (!onCollaborationEvent) return;

    const handleCaseUpdate = (data: unknown) => {
      const update = data as { resourceType?: string; resourceId?: string };
      if (update.resourceType === 'case' && update.resourceId === caseId) {
        console.log('Case update:', data);
        // Handle case-specific updates here
      }
    };

    const cleanup = onCollaborationEvent('collaboration:event', handleCaseUpdate);
    return cleanup;
  }, [caseId, onCollaborationEvent]);

  return {
    isConnected,
    activeViewers: caseViewers,
    viewerCount: caseViewers.length,
  };
}
