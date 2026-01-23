'use client';

import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { getFilevineProjectFolders, type FilevineFolder } from '@/lib/filevine-client';

interface FolderTreeNode extends FilevineFolder {
  children: FolderTreeNode[];
}

interface FilevineFolderBrowserProps {
  caseId: string;
  onFolderSelect: (folderId: string, folderName: string) => void;
  selectedFolderId?: string;
}

export function FilevineFolderBrowser({
  caseId,
  onFolderSelect,
  selectedFolderId,
}: FilevineFolderBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<FilevineFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders
  React.useEffect(() => {
    async function fetchFolders() {
      try {
        setLoading(true);
        const data = await getFilevineProjectFolders(caseId);
        setFolders(data.items);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to fetch folders');
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, [caseId]);

  // Build folder tree
  const buildTree = (folders: FilevineFolder[]): FolderTreeNode[] => {
    const folderMap = new Map<number, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // Initialize all folders
    folders.forEach((folder) => {
      folderMap.set(folder.folderId.native, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach((folder) => {
      const node = folderMap.get(folder.folderId.native)!;
      if (folder.parentId?.native) {
        const parent = folderMap.get(folder.parentId.native);
        if (parent) {
          parent.children.push(node);
        } else {
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderTreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.folderId.native);
    const isSelected = selectedFolderId === folder.folderId.native.toString();
    const hasChildren = folder.children.length > 0;

    return (
      <div key={folder.folderId.native}>
        <div
          className={`flex items-center gap-2 cursor-pointer rounded-lg py-2 px-3 transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (hasChildren) toggleFolder(folder.folderId.native);
            onFolderSelect(folder.folderId.native.toString(), folder.name);
          }}
        >
          {hasChildren && (
            <button
              className="p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.folderId.native);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-600" />
          ) : (
            <Folder className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-sm font-medium">{folder.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div>{folder.children.map((child) => renderFolder(child, level + 1))}</div>
        )}
      </div>
    );
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

  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No folders found in this project</div>
    );
  }

  const tree = buildTree(folders);

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b bg-gray-50 p-3">
        <h3 className="font-semibold text-gray-900">Project Folders</h3>
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {tree.map((folder) => renderFolder(folder))}
      </div>
    </div>
  );
}
