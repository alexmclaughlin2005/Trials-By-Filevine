import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptApi, Prompt, PromptVersion } from '@/lib/prompts/api';

// List all prompts
export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: promptApi.listPrompts,
  });
}

// Get single prompt
export function usePrompt(serviceId: string | null) {
  return useQuery({
    queryKey: ['prompt', serviceId],
    queryFn: () => promptApi.getPrompt(serviceId!),
    enabled: !!serviceId,
  });
}

// Get versions
export function useVersions(promptId: string | null) {
  return useQuery({
    queryKey: ['versions', promptId],
    queryFn: () => promptApi.getVersions(promptId!),
    enabled: !!promptId,
  });
}

// Get analytics
export function useAnalytics(serviceId: string | null, versionId: string | null) {
  return useQuery({
    queryKey: ['analytics', serviceId, versionId],
    queryFn: () => promptApi.getAnalytics(serviceId!, versionId!),
    enabled: !!serviceId && !!versionId,
  });
}

// Create prompt
export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promptApi.createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}

// Create version
export function useCreateVersion(promptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof promptApi.createVersion>[1]) =>
      promptApi.createVersion(promptId, data),
    onSuccess: () => {
      // Invalidate both versions and prompts to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['versions', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: () => {
      // Refetch versions on error in case version already exists
      queryClient.invalidateQueries({ queryKey: ['versions', promptId] });
    },
  });
}

// Deploy version
export function useDeployVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, versionId }: { serviceId: string; versionId: string }) =>
      promptApi.deployVersion(serviceId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['versions'] });
    },
  });
}

// Rollback version
export function useRollbackVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, versionId }: { serviceId: string; versionId: string }) =>
      promptApi.rollbackVersion(serviceId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['versions'] });
    },
  });
}

// Test render
export function useRenderPrompt() {
  return useMutation({
    mutationFn: ({
      serviceId,
      variables,
      version,
    }: {
      serviceId: string;
      variables: Record<string, any>;
      version?: string;
    }) => promptApi.renderPrompt(serviceId, variables, version),
  });
}
