import type { APIError } from '@juries/types';

class APIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  getAuthToken(): string | null {
    if (this.token) return this.token;

    // Try to get from localStorage if in browser
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }

    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new APIClientError(
          data.error || 'An error occurred',
          response.status,
          data
        );
      }

      return data as T;
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

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
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
