'use client';

import React, { useState } from 'react';
import { FilevineProjectSelector } from '@/components/filevine-project-selector';
import { FilevineFolderBrowser } from '@/components/filevine-folder-browser';
import { FilevineDocumentBrowser } from '@/components/filevine-document-browser';
import {
  getCaseFilevineLink,
  getImportedDocuments,
  deleteImportedDocument,
  type CaseFilevineLink,
  type ImportedDocument
} from '@/lib/filevine-client';
import { FolderOpen, Download, FileText, Eye, Trash2, Search, X } from 'lucide-react';

interface FilevineDocumentsTabProps {
  caseId: string;
}

export function FilevineDocumentsTab({ caseId }: FilevineDocumentsTabProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browse' | 'imported'>('browse');
  const [linkStatus, setLinkStatus] = useState<{ linked: boolean; link?: CaseFilevineLink } | null>(null);
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  // Check link status
  React.useEffect(() => {
    async function checkLink() {
      try {
        const status = await getCaseFilevineLink(caseId);
        setLinkStatus(status);
      } catch (err) {
        console.error('Failed to check link status:', err);
      }
    }
    checkLink();
  }, [caseId]);

  // Fetch imported documents
  React.useEffect(() => {
    if (!linkStatus?.linked) return;

    async function fetchImported() {
      try {
        const data = await getImportedDocuments(caseId);
        setImportedDocs(data.documents);
      } catch (err) {
        console.error('Failed to fetch imported documents:', err);
      }
    }
    fetchImported();
  }, [caseId, linkStatus]);

  const handleProjectLinked = async () => {
    const status = await getCaseFilevineLink(caseId);
    setLinkStatus(status);
  };

  const handleDocumentImported = async () => {
    // Refetch imported documents after import
    try {
      const data = await getImportedDocuments(caseId);
      setImportedDocs(data.documents);
    } catch (err) {
      console.error('Failed to refresh imported documents:', err);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeleting((prev) => new Set(prev).add(documentId));

    try {
      await deleteImportedDocument(caseId, documentId);
      // Refetch imported documents
      const data = await getImportedDocuments(caseId);
      setImportedDocs(data.documents);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  };

  // Filter imported documents based on search
  const filteredImportedDocs = importedDocs.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.folderName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!linkStatus?.linked) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Connect to Filevine</h3>
          <p className="mb-4 text-sm text-blue-700">
            Link this case to a Filevine project to import documents and sync case data.
          </p>
        </div>
        <FilevineProjectSelector caseId={caseId} onLinked={handleProjectLinked} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Browse Filevine
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'imported'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="h-4 w-4" />
            Imported Documents ({importedDocs.length})
          </button>
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <FilevineFolderBrowser
              caseId={caseId}
              selectedFolderId={selectedFolderId}
              onFolderSelect={(id, name) => {
                setSelectedFolderId(id);
                setSelectedFolderName(name);
              }}
            />
          </div>
          <div>
            {selectedFolderId ? (
              <FilevineDocumentBrowser
                caseId={caseId}
                folderId={selectedFolderId}
                folderName={selectedFolderName}
                onDocumentImported={handleDocumentImported}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Select a folder to view documents
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imported Documents Tab */}
      {activeTab === 'imported' && (
        <div className="space-y-4">
          {/* Search Bar */}
          {importedDocs.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {importedDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents imported yet. Browse folders to import documents.
            </div>
          ) : filteredImportedDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents match your search.
            </div>
          ) : (
            filteredImportedDocs.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <p className="font-medium text-gray-900">{doc.filename}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      From: {doc.folderName || 'Unknown folder'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Imported {new Date(doc.importedAt).toLocaleString()}
                    </p>
                    {doc.status === 'failed' && doc.errorMessage && (
                      <p className="mt-1 text-xs text-red-600">
                        Error: {doc.errorMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        doc.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                    {doc.status === 'completed' && doc.localFileUrl && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(doc.localFileUrl, '_blank')}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-1"
                          title="Preview document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </button>
                        <a
                          href={doc.localFileUrl}
                          download={doc.filename}
                          className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-1"
                          title="Download document"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleting.has(doc.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting.has(doc.id) ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
