'use client';

import React, { useState } from 'react';
import { FilevineProjectSelector } from '@/components/filevine-project-selector';
import { FilevineFolderBrowser } from '@/components/filevine-folder-browser';
import { FilevineDocumentBrowser } from '@/components/filevine-document-browser';
import { getCaseFilevineLink, getImportedDocuments } from '@/lib/filevine-client';
import { FolderOpen, Download, FileText } from 'lucide-react';

interface FilevineDocumentsTabProps {
  caseId: string;
}

export function FilevineDocumentsTab({ caseId }: FilevineDocumentsTabProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browse' | 'imported'>('browse');
  const [linkStatus, setLinkStatus] = useState<{ linked: boolean; link?: any } | null>(null);
  const [importedDocs, setImportedDocs] = useState<any[]>([]);

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
          {importedDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents imported yet. Browse folders to import documents.
            </div>
          ) : (
            importedDocs.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
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
                  </div>
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
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
