// Custom error classes for Claude API client

export class ClaudeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ClaudeError';
    Object.setPrototypeOf(this, ClaudeError.prototype);
  }
}

export class RateLimitError extends ClaudeError {
  constructor(
    message: string,
    public retryAfter?: number // milliseconds
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InvalidRequestError extends ClaudeError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = 'InvalidRequestError';
    Object.setPrototypeOf(this, InvalidRequestError.prototype);
  }
}

export class AuthenticationError extends ClaudeError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class TimeoutError extends ClaudeError {
  constructor(message: string) {
    super(message, 408);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
