import type { APIResponse, APIError } from '@trialforge/types';

class APIClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data: APIResponse<T> = await response.json();

      if (!response.ok) {
        throw new APIClientError(
          data.error?.message || 'An error occurred',
          response.status,
          data.error
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof APIClientError) {
        throw error;
      }

      throw new APIClientError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  setAuthToken(token: string) {
    // This will be used to set the authorization header
    // In a real implementation, you'd store this and add it to all requests
  }
}

export class APIClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiError?: APIError
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

// Export singleton instance
export const apiClient = new APIClient();
