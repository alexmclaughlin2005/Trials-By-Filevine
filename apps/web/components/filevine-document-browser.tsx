'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileText, Download, Loader2, Calendar, User } from 'lucide-react';
import {
  getFilevineFolderDocuments,
  importFilevineDocument,
  type FilevineDocument,
} from '@/lib/filevine-client';

interface FilevineDocumentBrowserProps {
  caseId: string;
  folderId: string;
  folderName: string;
}

export function FilevineDocumentBrowser({
  caseId,
  folderId,
  folderName,
}: FilevineDocumentBrowserProps) {
  const [documents, setDocuments] = useState<FilevineDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch documents
  React.useEffect(() => {
    if (!folderId) return;

    async function fetchDocuments() {
      try {
        setLoading(true);
        const data = await getFilevineFolderDocuments(caseId, folderId);
        setDocuments(data.items);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, [caseId, folderId]);

  const handleImport = async (document: FilevineDocument) => {
    const docId = document.documentId.native;
    setImporting((prev) => new Set(prev).add(docId));

    try {
      await importFilevineDocument(caseId, {
        filevineDocumentId: docId.toString(),
        fivevineFolderId: folderId,
        filename: document.filename,
        folderName: document.folderName,
        currentVersion: document.currentVersion,
        uploadDate: document.uploadDate,
        uploaderFullname: document.uploaderFullname,
        size: document.size,
      });

      // TODO: Show success message or update UI
    } catch (err) {
      const error = err as Error;
      console.error('Failed to import document:', error);
      // TODO: Show error message
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No documents found in this folder</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Documents in {folderName}</h3>
        <p className="text-sm text-gray-500">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const docId = doc.documentId.native;
          const isImporting = importing.has(docId);

          return (
            <div
              key={docId}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    {doc.uploadDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {doc.uploaderFullname && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{doc.uploaderFullname}</span>
                      </div>
                    )}
                    {doc.size && <span>{formatFileSize(doc.size)}</span>}
                    {doc.currentVersion && <span>v{doc.currentVersion}</span>}
                  </div>
                </div>
                <Button size="sm" onClick={() => handleImport(doc)} disabled={isImporting}>
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
