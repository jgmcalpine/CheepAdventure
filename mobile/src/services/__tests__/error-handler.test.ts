import { AppError, ErrorHandler, errorHandler } from '../error-handler';
import { analytics } from '../analytics';

// Mock analytics service
jest.mock('../analytics', () => ({
  analytics: {
    trackError: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AppError', () => {
    it('should create an AppError with default type', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('unknown');
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError with custom type and context', () => {
      const context = { userId: '123' };
      const error = new AppError('Test error', 'network', context);
      expect(error.type).toBe('network');
      expect(error.context).toBe(context);
    });
  });

  describe('withRetry', () => {
    it('should return successful operation result without retrying', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await errorHandler.withRetry(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error and succeed', async () => {
      const networkError = new AppError('Network error', 'network');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await errorHandler.withRetry(operation, { maxAttempts: 2 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect maxAttempts and throw after all retries fail', async () => {
      const networkError = new AppError('Network error', 'network');
      const operation = jest.fn().mockRejectedValue(networkError);

      await expect(
        errorHandler.withRetry(operation, { maxAttempts: 3 })
      ).rejects.toThrow(networkError);

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new AppError('Auth error', 'auth');
      const operation = jest.fn().mockRejectedValue(authError);

      await expect(errorHandler.withRetry(operation)).rejects.toThrow(authError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff for delays', async () => {
      const networkError = new AppError('Network error', 'network');
      const operation = jest.fn().mockRejectedValue(networkError);

      const retryPromise = errorHandler.withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffFactor: 2,
      });

      // First attempt fails immediately
      await jest.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Second attempt after 1000ms
      await jest.advanceTimersByTimeAsync(1000);
      expect(operation).toHaveBeenCalledTimes(2);

      // Third attempt after 2000ms more (backoff factor of 2)
      await jest.advanceTimersByTimeAsync(2000);
      expect(operation).toHaveBeenCalledTimes(3);

      await expect(retryPromise).rejects.toThrow(networkError);
    });
  });

  describe('handleError', () => {
    it('should track general errors in analytics', async () => {
      const error = new Error('Test error');
      await errorHandler.handleError(error);

      expect(analytics.trackError).toHaveBeenCalledWith(
        'general',
        error,
        expect.any(Object)
      );
    });

    it('should track AppErrors with correct type', async () => {
      const error = new AppError('Test error', 'audio', { playId: '123' });
      await errorHandler.handleError(error);

      expect(analytics.trackError).toHaveBeenCalledWith(
        'audio',
        error,
        expect.objectContaining({ playId: '123' })
      );
    });
  });

  describe('wrapPromise', () => {
    it('should wrap rejected promise with AppError', async () => {
      const originalError = new Error('Original error');
      const promise = Promise.reject(originalError);

      await expect(
        errorHandler.wrapPromise(promise, 'Operation failed', 'api')
      ).rejects.toThrow(AppError);

      await expect(
        errorHandler.wrapPromise(promise, 'Operation failed', 'api')
      ).rejects.toMatchObject({
        message: 'Operation failed: Original error',
        type: 'api',
      });
    });

    it('should pass through successful promise results', async () => {
      const promise = Promise.resolve('success');
      const result = await errorHandler.wrapPromise(promise, 'Operation failed');
      expect(result).toBe('success');
    });
  });
}); 