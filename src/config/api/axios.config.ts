import axios, { AxiosResponse, CancelTokenSource, InternalAxiosRequestConfig } from 'axios';
import { ApiError, RetryConfig } from './axios.types';

// API Configuration
const API_CONFIG = {
  baseURL: 'http://192.168.0.3:8080/quickVerse',
  timeout: 15000, // 15 seconds default timeout
  retries: 3, // number of retries for failed requests
  timeoutMessage: 'Request timed out. Please check your internet connection and try again.',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
  },
} as const;

// Store cancel tokens by request key
const cancelTokens: Map<string, CancelTokenSource> = new Map();

// Helper function to generate a unique key for each request
const getRequestKey = (config: InternalAxiosRequestConfig): string => {
  const method = config?.method || 'get';
  const url = config?.url || '';
  const params = config?.params || {};
  const data = config?.data || {};
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Add a request interceptor for timeout and retries
axiosInstance.interceptors.request.use(
  (config: RetryConfig) => {
    // Ensure timeout is set for each request
    if (!config.timeout) {
      config.timeout = API_CONFIG.timeout;
    }

    // Cancel any existing request with the same key
    const requestKey = getRequestKey(config);
    if (cancelTokens.has(requestKey)) {
      const existingCancelToken = cancelTokens.get(requestKey);
      if (existingCancelToken?.cancel) {
        existingCancelToken.cancel('Request superseded by newer request');
        cancelTokens.delete(requestKey);
      }
    }

    // Create new cancel token for this request
    const source = axios.CancelToken.source();
    if (source?.token) {
      config.cancelToken = source.token;
      cancelTokens.set(requestKey, source);
    }

    return config;
  },
  error => {
    return Promise.reject({
      status: 500,
      message: error?.message || 'Request failed',
      isCancelled: false,
    });
  }
);

// Add a response interceptor to handle timeout errors and retries
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response?.config) {
      const requestKey = getRequestKey(response.config);
      cancelTokens.delete(requestKey);
    }
    return response;
  },
  async (error: any) => {
    // Don't retry cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject({
        status: 499, // Client Closed Request
        message: 'Request was cancelled',
        isCancelled: true,
      });
    }

    const config = error?.config as RetryConfig | undefined;

    // Clean up cancel token after error
    if (config) {
      const requestKey = getRequestKey(config);
      cancelTokens.delete(requestKey);
    }

    // If no config exists or retry count exceeded, reject with error
    if (!config || !API_CONFIG.retries || (config.retryCount ?? 0) >= API_CONFIG.retries) {
      if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
        return Promise.reject({
          status: 408,
          message: API_CONFIG.timeoutMessage,
          isCancelled: false,
        });
      }
      return Promise.reject({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || 'An error occurred',
        isCancelled: false,
      });
    }

    // Increment retry count
    const currentRetryCount = config.retryCount ?? 0;
    config.retryCount = currentRetryCount + 1;

    // Create new promise with exponential backoff
    const backoff = new Promise(resolve => {
      setTimeout(() => {
        resolve(null);
      }, Math.min(1000 * 2 ** (currentRetryCount + 1), 10000));
    });

    // Wait for backoff, then retry the request
    await backoff;
    return axiosInstance(config);
  }
);

// Helper function to handle API calls with timeout
export const apiCall = async <T>(
  promise: Promise<AxiosResponse<T>>,
  customTimeout?: number
): Promise<T> => {
  try {
    const response = await Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject({
            status: 408,
            message: API_CONFIG.timeoutMessage,
            isCancelled: false,
          });
        }, customTimeout || API_CONFIG.timeout);
      }),
    ]);
    return (response as AxiosResponse<T>)?.data;
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      // Handle cancelled request
      throw {
        status: 499, // Client Closed Request
        message: 'Request was cancelled',
        isCancelled: true,
      };
    }

    const apiError = error as ApiError;
    if (apiError?.status === 408) {
      throw apiError;
    }
    throw {
      status: apiError?.response?.status || 500,
      message: apiError?.response?.data?.message || 'An error occurred',
      isCancelled: apiError?.isCancelled || false,
    };
  }
};

// Cleanup function to remove all cancel tokens
export const cleanupCancelTokens = () => {
  cancelTokens.forEach(token => {
    if (token?.cancel) {
      token.cancel('Cleanup');
    }
  });
  cancelTokens.clear();
};

export default axiosInstance;
