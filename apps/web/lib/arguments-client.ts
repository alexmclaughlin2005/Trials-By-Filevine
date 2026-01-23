import { apiClient } from './api-client';

export interface ArgumentDocument {
  id: string;
  attachedAt: string;
  attachedBy: string;
  notes?: string;
  document: {
    id: string;
    filename: string;
    folderName?: string;
    localFileUrl?: string;
    thumbnailUrl?: string;
    size?: string;
    extractedText?: string;
    textExtractionStatus: string;
    importedAt: string;
  };
}

/**
 * Attach a document to an argument
 */
export async function attachDocumentToArgument(
  caseId: string,
  argumentId: string,
  documentId: string,
  notes?: string
): Promise<{ attachment: ArgumentDocument }> {
  return apiClient.post(`/cases/${caseId}/arguments/${argumentId}/documents`, {
    documentId,
    notes,
  });
}

/**
 * Get all documents attached to an argument
 */
export async function getArgumentDocuments(
  caseId: string,
  argumentId: string
): Promise<{ attachments: ArgumentDocument[] }> {
  return apiClient.get(`/cases/${caseId}/arguments/${argumentId}/documents`);
}

/**
 * Remove a document attachment from an argument
 */
export async function detachDocumentFromArgument(
  caseId: string,
  argumentId: string,
  attachmentId: string
): Promise<void> {
  return apiClient.delete(`/cases/${caseId}/arguments/${argumentId}/documents/${attachmentId}`);
}
