import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_PROMPT_SERVICE_URL || 'http://localhost:3002';

// Ensure the URL has a protocol
const baseURL = API_URL.startsWith('http') ? API_URL : `https://${API_URL}`;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Prompt {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  category: string | null;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  latestVersion?: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: string;
  systemPrompt: string | null;
  userPromptTemplate: string;
  config: {
    model: string;
    maxTokens: number;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
  variables: Record<string, unknown>;
  outputSchema: unknown;
  createdBy: string | null;
  createdAt: string;
  isDraft: boolean;
  notes: string | null;
}

export interface Analytics {
  versionId: string;
  total: number;
  successRate: number;
  avgTokens: number;
  avgLatencyMs: number;
  avgConfidence: number;
  recent: Array<{
    id: string;
    success: boolean;
    tokensUsed: number;
    latencyMs: number;
    confidence: number;
    createdAt: string;
  }>;
}

// API functions
export const promptApi = {
  // List all prompts
  listPrompts: async (): Promise<Prompt[]> => {
    const response = await api.get('/api/v1/admin/prompts');
    return response.data;
  },

  // Get prompt by ID
  getPrompt: async (serviceId: string): Promise<Prompt> => {
    const response = await api.get(`/api/v1/prompts/${serviceId}`);
    return response.data;
  },

  // Get all versions of a prompt
  getVersions: async (promptId: string): Promise<PromptVersion[]> => {
    const response = await api.get(`/api/v1/admin/prompts/${promptId}/versions`);
    return response.data;
  },

  // Create new prompt
  createPrompt: async (data: {
    serviceId: string;
    name: string;
    description?: string;
    category?: string;
  }): Promise<Prompt> => {
    const response = await api.post('/api/v1/admin/prompts', data);
    return response.data;
  },

  // Create new version
  createVersion: async (
    promptId: string,
    data: {
      version: string;
      systemPrompt?: string;
      userPromptTemplate: string;
      config: {
        model: string;
        maxTokens: number;
        temperature?: number;
        topP?: number;
        topK?: number;
      };
      variables: Record<string, unknown>;
      outputSchema?: unknown;
      notes?: string;
      isDraft?: boolean;
    }
  ): Promise<PromptVersion> => {
    const response = await api.post(
      `/api/v1/admin/prompts/${promptId}/versions`,
      data
    );
    return response.data;
  },

  // Deploy version
  deployVersion: async (serviceId: string, versionId: string): Promise<void> => {
    await api.post(`/api/v1/admin/prompts/${serviceId}/deploy`, { versionId });
  },

  // Rollback to version
  rollbackVersion: async (serviceId: string, versionId: string): Promise<void> => {
    await api.post(`/api/v1/admin/prompts/${serviceId}/rollback`, { versionId });
  },

  // Get analytics
  getAnalytics: async (serviceId: string, versionId: string): Promise<Analytics> => {
    const response = await api.get(
      `/api/v1/prompts/${serviceId}/versions/${versionId}/analytics`
    );
    return response.data;
  },

  // Test render prompt
  renderPrompt: async (
    serviceId: string,
    variables: Record<string, unknown>,
    version?: string
  ): Promise<{
    promptId: string;
    versionId: string;
    version: string;
    systemPrompt: string | null;
    userPrompt: string;
    config: unknown;
  }> => {
    const response = await api.post(`/api/v1/prompts/${serviceId}/render`, {
      variables,
      version: version || 'latest',
    });
    return response.data;
  },
};
