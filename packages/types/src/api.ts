// Standard API response types

export interface APIResponse<T = unknown> {
  data?: T;
  error?: APIError;
  meta?: APIMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface APIMetadata {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Standard API error codes
export enum APIErrorCode {
  VALIDATION_ERROR = 'validation_error',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INTERNAL_ERROR = 'internal_error',
}
