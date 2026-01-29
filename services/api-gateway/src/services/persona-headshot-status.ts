/**
 * In-memory status tracking for persona headshot generation
 * In production, this could be moved to Redis or database
 */

export interface HeadshotGenerationStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  progress: {
    total: number;
    processed: number;
    skipped: number;
    failed: number;
    current?: {
      personaId: string;
      nickname: string;
      archetype: string;
    };
  };
  result?: {
    processed: number;
    skipped: number;
    failed: number;
    errors: string[];
  };
  error?: string;
}

const statusStore = new Map<string, HeadshotGenerationStatus>();

/**
 * Create a new generation status
 */
export function createGenerationStatus(id: string): HeadshotGenerationStatus {
  const status: HeadshotGenerationStatus = {
    id,
    status: 'pending',
    startedAt: new Date(),
    progress: {
      total: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
    },
  };
  statusStore.set(id, status);
  return status;
}

/**
 * Update generation status
 */
export function updateGenerationStatus(
  id: string,
  updates: Partial<HeadshotGenerationStatus>
): HeadshotGenerationStatus | null {
  const status = statusStore.get(id);
  if (!status) {
    return null;
  }

  const updated = {
    ...status,
    ...updates,
    progress: {
      ...status.progress,
      ...(updates.progress || {}),
    },
  };

  statusStore.set(id, updated);
  return updated;
}

/**
 * Get generation status
 */
export function getGenerationStatus(id: string): HeadshotGenerationStatus | null {
  return statusStore.get(id) || null;
}

/**
 * Get latest generation status (most recent)
 */
export function getLatestGenerationStatus(): HeadshotGenerationStatus | null {
  const statuses = Array.from(statusStore.values());
  if (statuses.length === 0) {
    return null;
  }

  // Return the most recently started
  return statuses.sort((a, b) => 
    b.startedAt.getTime() - a.startedAt.getTime()
  )[0];
}

/**
 * Clean up old completed statuses (older than 1 hour)
 */
export function cleanupOldStatuses(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const [id, status] of statusStore.entries()) {
    if (
      (status.status === 'completed' || status.status === 'failed') &&
      status.completedAt &&
      status.completedAt.getTime() < oneHourAgo
    ) {
      statusStore.delete(id);
    }
  }
}

// Clean up old statuses every 10 minutes
setInterval(cleanupOldStatuses, 10 * 60 * 1000);
