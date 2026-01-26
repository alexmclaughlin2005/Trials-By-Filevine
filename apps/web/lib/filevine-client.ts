/**
 * Filevine API Client
 * Frontend client for Filevine integration endpoints
 */

import { apiClient } from './api-client';

// Types
export interface FilevineConnectionSetup {
  clientId: string;
  clientSecret: string;
  personalAccessToken: string;
  connectionName?: string;
}

export interface FilevineConnectionStatus {
  connected: boolean;
  id?: string;
  connectionName?: string;
  isActive?: boolean;
  lastSyncedAt?: string;
  lastTestSuccessful?: boolean;
  lastTestAt?: string;
  lastErrorMessage?: string;
  tokenExpiresAt?: string;
  hasValidToken?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilevineConnectionSetupResponse {
  success: boolean;
  connectionId?: string;
  testPassed: boolean;
  testError?: string;
  error?: string;
}

export interface FilevineTestResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export interface FilevineProject {
  projectId: {
    native: number;
  };
  projectName: string;
  projectTypeId: number;
  projectTypeName?: string;
  clientName?: string;
  isDeleted?: boolean;
  phaseId?: number;
  phaseName?: string;
  createDate?: string;
  [key: string]: unknown;
}

export interface FilevineProjectsResponse {
  items: FilevineProject[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Setup a new Filevine connection
 */
export async function setupFilevineConnection(
  credentials: FilevineConnectionSetup
): Promise<FilevineConnectionSetupResponse> {
  return apiClient.post<FilevineConnectionSetupResponse>(
    '/filevine/connections',
    credentials
  );
}

/**
 * Get current Filevine connection status
 */
export async function getFilevineConnectionStatus(): Promise<FilevineConnectionStatus> {
  return apiClient.get<FilevineConnectionStatus>('/filevine/connections');
}

/**
 * Update Filevine connection
 */
export async function updateFilevineConnection(
  connectionId: string,
  updates: Partial<FilevineConnectionSetup> & { isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  return apiClient.put<{ success: boolean; error?: string }>(
    `/filevine/connections/${connectionId}`,
    updates
  );
}

/**
 * Remove Filevine connection
 */
export async function removeFilevineConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  return apiClient.delete<{ success: boolean; error?: string }>(
    `/filevine/connections/${connectionId}`
  );
}

/**
 * Test Filevine connection
 */
export async function testFilevineConnection(
  connectionId: string
): Promise<FilevineTestResponse> {
  return apiClient.post<FilevineTestResponse>(
    `/filevine/connections/${connectionId}/test`,
    {} // Empty body to satisfy Fastify's content-type validation
  );
}

/**
 * List Filevine projects
 */
export async function listFilevineProjects(params?: {
  limit?: number;
  offset?: number;
}): Promise<FilevineProjectsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return apiClient.get<FilevineProjectsResponse>(
    `/filevine/projects${query ? `?${query}` : ''}`
  );
}

/**
 * Get specific Filevine project
 */
export async function getFilevineProject(projectId: string): Promise<FilevineProject> {
  return apiClient.get<FilevineProject>(`/filevine/projects/${projectId}`);
}

// ============================================
// CASE-FILEVINE INTEGRATION
// ============================================

export interface CaseFilevineLink {
  id: string;
  caseId: string;
  filevineProjectId: string;
  projectName: string;
  projectTypeName?: string;
  clientName?: string;
  linkedAt: string;
  lastSyncedAt?: string;
  autoSyncDocuments: boolean;
}

export interface FilevineFolder {
  folderId: { native: number };
  parentId?: { native: number };
  projectId: { native: number };
  name: string;
  isArchived: boolean;
}

export interface FilevineDocument {
  documentId: { native: number };
  filename: string;
  folderId: { native: number };
  folderName?: string;
  currentVersion?: string;
  uploadDate?: string;
  uploaderFullname?: string;
  size?: number;
}

export interface ImportedDocument {
  id: string;
  filevineDocumentId: string;
  filename: string;
  folderName?: string;
  localFileUrl?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  importedAt: string;
  documentCategory?: string;
  tags?: string[];
  size?: string;
  errorMessage?: string;
  downloadAttempts?: number;
  textExtractionStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed';
  textExtractedAt?: string;
  textExtractionError?: string;
  extractedTextUrl?: string;
  extractedTextChars?: number;
}

/**
 * Fetch extracted text content for a document
 */
export async function getDocumentExtractedText(textUrl: string): Promise<string> {
  const response = await fetch(textUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch extracted text');
  }
  return response.text();
}

/**
 * Link a case to a Filevine project
 */
export async function linkCaseToFilevineProject(
  caseId: string,
  projectData: {
    filevineProjectId: string;
    projectName: string;
    projectTypeName?: string;
    clientName?: string;
    autoSyncDocuments?: boolean;
  }
): Promise<{ link: CaseFilevineLink }> {
  return apiClient.post(`/cases/${caseId}/filevine/link`, projectData);
}

/**
 * Get case Filevine link status
 */
export async function getCaseFilevineLink(
  caseId: string
): Promise<{ linked: boolean; link?: CaseFilevineLink }> {
  return apiClient.get(`/cases/${caseId}/filevine/link`);
}

/**
 * Unlink a case from a Filevine project
 */
export async function unlinkCaseFromFilevineProject(
  caseId: string
): Promise<{ success: boolean }> {
  return apiClient.delete(`/cases/${caseId}/filevine/link`);
}

/**
 * Get folder structure for a linked Filevine project
 */
export async function getFilevineProjectFolders(
  caseId: string
): Promise<{ items: FilevineFolder[]; count: number }> {
  return apiClient.get(`/cases/${caseId}/filevine/folders`);
}

/**
 * Get documents in a folder
 */
export async function getFilevineFolderDocuments(
  caseId: string,
  folderId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ items: FilevineDocument[]; count: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const query = params.toString();
  return apiClient.get(
    `/cases/${caseId}/filevine/folders/${folderId}/documents${query ? `?${query}` : ''}`
  );
}

/**
 * Import a document from Filevine
 */
export async function importFilevineDocument(
  caseId: string,
  documentData: {
    filevineDocumentId: string;
    fivevineFolderId: string;
    filename: string;
    folderName?: string;
    currentVersion?: string;
    uploadDate?: string;
    uploaderFullname?: string;
    size?: number;
    documentCategory?: string;
    tags?: string[];
    notes?: string;
  }
): Promise<{ document: ImportedDocument }> {
  return apiClient.post(`/cases/${caseId}/filevine/documents/import`, documentData);
}

/**
 * Get list of imported documents for a case
 */
export async function getImportedDocuments(
  caseId: string
): Promise<{ documents: ImportedDocument[] }> {
  return apiClient.get(`/cases/${caseId}/filevine/documents`);
}

/**
 * Delete an imported document
 */
export async function deleteImportedDocument(
  caseId: string,
  documentId: string
): Promise<{ success: boolean }> {
  return apiClient.delete(`/cases/${caseId}/filevine/documents/${documentId}`);
}

/**
 * Upload a document manually (for users without Filevine)
 */
export async function uploadDocument(
  caseId: string,
  file: File,
  metadata?: {
    documentCategory?: string;
    tags?: string[];
    notes?: string;
    folderName?: string;
  }
): Promise<{ document: ImportedDocument }> {
  const formData = new FormData();
  formData.append('file', file);

  // Add optional metadata
  if (metadata?.documentCategory) {
    formData.append('documentCategory', metadata.documentCategory);
  }
  if (metadata?.tags && metadata.tags.length > 0) {
    formData.append('tags', JSON.stringify(metadata.tags));
  }
  if (metadata?.notes) {
    formData.append('notes', metadata.notes);
  }
  if (metadata?.folderName) {
    formData.append('folderName', metadata.folderName);
  }

  // Use fetch directly for multipart/form-data
  const token = localStorage.getItem('auth_token');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const response = await fetch(`${apiUrl}/cases/${caseId}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || 'Upload failed');
  }

  return response.json();
}
