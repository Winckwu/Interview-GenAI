/**
 * Comprehensive API Error Handling Utilities
 *
 * Provides:
 * - Error classification (client, server, network)
 * - User-friendly error messages
 * - Retry logic with exponential backoff
 * - Error recovery suggestions
 * - Error logging and reporting
 */

export interface ApiError {
  code: string;
  status?: number;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, any>;
  code?: string;
}

/**
 * Classify errors into categories for better handling
 */
export const classifyError = (error: unknown): ApiError => {
  // Network error
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      retryable: true,
      userMessage: 'Network connection error. Please check your internet connection and try again.',
    };
  }

  // Axios or fetch error
  if (error instanceof Error) {
    const errorData = (error as any).response?.data as ErrorResponse | undefined;
    const status = (error as any).response?.status;

    if (status === 401) {
      return {
        code: 'UNAUTHORIZED',
        status,
        message: 'Unauthorized access',
        retryable: false,
        userMessage: 'Your session has expired. Please log in again.',
      };
    }

    if (status === 403) {
      return {
        code: 'FORBIDDEN',
        status,
        message: 'Access forbidden',
        retryable: false,
        userMessage: 'You do not have permission to access this resource.',
      };
    }

    if (status === 404) {
      return {
        code: 'NOT_FOUND',
        status,
        message: 'Resource not found',
        retryable: false,
        userMessage: 'The requested resource was not found.',
      };
    }

    if (status === 422 || status === 400) {
      return {
        code: 'VALIDATION_ERROR',
        status,
        message: 'Validation failed',
        details: errorData?.details,
        retryable: false,
        userMessage: errorData?.message || 'Please check your input and try again.',
      };
    }

    if (status === 429) {
      return {
        code: 'RATE_LIMITED',
        status,
        message: 'Too many requests',
        retryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.',
      };
    }

    if (status === 500 || status === 502 || status === 503 || status === 504) {
      return {
        code: 'SERVER_ERROR',
        status,
        message: 'Server error',
        retryable: true,
        userMessage: 'Server error. Please try again in a moment.',
      };
    }

    // Generic HTTP error
    if (status) {
      return {
        code: `HTTP_${status}`,
        status,
        message: error.message,
        retryable: status >= 500,
        userMessage: errorData?.message || `An error occurred (${status}). Please try again.`,
      };
    }
  }

  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    retryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
};

/**
 * Get recovery suggestion based on error type
 */
export const getRecoverySuggestion = (error: ApiError): string | null => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Try checking your internet connection or refreshing the page.';
    case 'UNAUTHORIZED':
      return 'Please log in again to continue.';
    case 'RATE_LIMITED':
      return 'Please wait a moment before trying again.';
    case 'SERVER_ERROR':
      return 'The server is temporarily unavailable. Please try again in a moment.';
    case 'VALIDATION_ERROR':
      return 'Please check your input for errors and try again.';
    default:
      return null;
  }
};

/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Execute async function with retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: ApiError) => void
): Promise<T> => {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ApiError = {
    code: 'UNKNOWN',
    message: 'Unknown error',
    retryable: false,
    userMessage: 'Unknown error',
  };
  let delay = fullConfig.initialDelayMs;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry if error is not retryable
      if (!lastError.retryable) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === fullConfig.maxRetries) {
        throw lastError;
      }

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * fullConfig.backoffMultiplier, fullConfig.maxDelayMs);
    }
  }

  throw lastError;
};

/**
 * Handle API error with logging
 */
export const logError = (
  error: ApiError,
  context: {
    action: string;
    timestamp?: Date;
    userId?: string;
    additionalData?: Record<string, any>;
  }
): void => {
  const logEntry = {
    ...error,
    ...context,
    timestamp: context.timestamp || new Date(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', logEntry);
  }

  // In production, you might send to error tracking service (Sentry, LogRocket, etc.)
  // Example:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { contexts: { api: logEntry } });
  // }
};

/**
 * Check if error should show retry button
 */
export const shouldShowRetry = (error: ApiError): boolean => {
  return error.retryable && error.code !== 'RATE_LIMITED';
};

/**
 * Format validation error messages
 */
export const formatValidationError = (details: Record<string, any> | undefined): string => {
  if (!details) {
    return 'Please check your input and try again.';
  }

  const errors = Object.entries(details)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');

  return errors || 'Validation failed. Please check your input.';
};

/**
 * API Error with user-friendly handling
 */
export class UserFacingError extends Error {
  constructor(
    public code: string,
    public userMessage: string,
    public details?: Record<string, any>,
    public retryable: boolean = false
  ) {
    super(userMessage);
    this.name = 'UserFacingError';
  }
}

/**
 * Create user-facing error from API error
 */
export const toUserFacingError = (error: ApiError): UserFacingError => {
  return new UserFacingError(error.code, error.userMessage, error.details, error.retryable);
};
