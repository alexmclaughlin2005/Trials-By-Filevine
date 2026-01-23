'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FolderOpen,
  Link as LinkIcon,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  listFilevineProjects,
  linkCaseToFilevineProject,
  getCaseFilevineLink,
  type FilevineProject,
} from '@/lib/filevine-client';

interface FilevineProjectSelectorProps {
  caseId: string;
  onLinked: () => void;
}

export function FilevineProjectSelector({
  caseId,
  onLinked,
}: FilevineProjectSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<FilevineProject | null>(null);
  const [projects, setProjects] = useState<FilevineProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<{ linked: boolean; link?: any } | null>(null);

  // Check if already linked
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

  // Fetch projects
  React.useEffect(() => {
    if (linkStatus?.linked) return;

    async function fetchProjects() {
      try {
        setLoading(true);
        const data = await listFilevineProjects({ limit: 100 });
        setProjects(data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [linkStatus]);

  const handleLink = async (project: FilevineProject) => {
    try {
      setLinking(true);
      setError(null);

      await linkCaseToFilevineProject(caseId, {
        filevineProjectId: project.projectId.native.toString(),
        projectName: project.projectName,
        projectTypeName: project.projectTypeName,
        clientName: project.clientName,
      });

      onLinked();
    } catch (err: any) {
      setError(err.message || 'Failed to link project');
    } finally {
      setLinking(false);
    }
  };

  if (linkStatus?.linked) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Linked to Filevine Project</p>
            <p className="text-sm text-green-700">{linkStatus.link?.projectName}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {filteredProjects.map((project) => (
            <div
              key={project.projectId.native}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                selectedProject?.projectId.native === project.projectId.native
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-gray-900">{project.projectName}</p>
                  </div>
                  {project.clientName && (
                    <p className="mt-1 text-sm text-gray-600">Client: {project.clientName}</p>
                  )}
                  {project.projectTypeName && (
                    <p className="text-xs text-gray-500">Type: {project.projectTypeName}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <Button
          onClick={() => handleLink(selectedProject)}
          disabled={linking}
          className="w-full"
        >
          {linking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Linking...
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              Link to {selectedProject.projectName}
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
