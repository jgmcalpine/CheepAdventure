import { analytics } from './analytics';

export class AppError extends Error {
  constructor(
    message: string,
    public type: 'network' | 'auth' | 'api' | 'audio' | 'unknown' = 'unknown',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof AppError) {
      // Retry network errors and certain API errors
      return error.type === 'network' || 
        (error.type === 'api' && error.message.includes('rate limit'));
    }
    // For unknown errors, check if they're likely network-related
    return error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('connection');
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const finalConfig = { ...defaultRetryConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryableError(lastError) || attempt === finalConfig.maxAttempts) {
          // Track the error if it's the final attempt
          await this.handleError(lastError);
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, finalConfig);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never happen due to the throw in the loop
    throw lastError || new Error('Unknown error in retry logic');
  }

  public async handleError(error: Error, context?: Record<string, unknown>): Promise<void> {
    let errorType: 'audio' | 'api' | 'general' = 'general';
    let errorContext = context || {};

    if (error instanceof AppError) {
      switch (error.type) {
        case 'audio':
          errorType = 'audio';
          break;
        case 'api':
          errorType = 'api';
          break;
        default:
          errorType = 'general';
      }
      errorContext = { ...errorContext, ...error.context };
    }

    // Track the error in analytics
    await analytics.trackError(errorType, error, errorContext);

    // Log the error for debugging
    if (__DEV__) {
      console.error('App Error:', {
        type: errorType,
        message: error.message,
        stack: error.stack,
        context: errorContext,
      });
    }
  }

  public wrapPromise<T>(
    promise: Promise<T>,
    errorMessage: string,
    errorType: AppError['type'] = 'unknown',
    context?: Record<string, unknown>
  ): Promise<T> {
    return promise.catch(error => {
      const appError = new AppError(
        `${errorMessage}: ${error.message}`,
        errorType,
        context
      );
      throw appError;
    });
  }
}

export const errorHandler = ErrorHandler.getInstance(); 