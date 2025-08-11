import axios, {
  AxiosError,
  AxiosResponse,
  CancelTokenSource,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, RetryConfig } from './axios.types';

/**
 * API Configuration Object
 *
 * Centralized configuration for all API requests including:
 * - Base URL for the QuickVerse API
 * - Timeout settings for request handling
 * - Retry configuration for failed requests
 * - Default headers for all requests
 */
const API_CONFIG = {
  /** Base URL for the QuickVerse API server */
  baseURL: 'http://192.168.31.144:8080/quickVerse',

  /** Default timeout for all requests (15 seconds) */
  timeout: 15000,

  /** Maximum number of retry attempts for failed requests */
  retries: 3,

  /** User-friendly timeout error message */
  timeoutMessage: 'Request timed out. Please check your internet connection and try again.',

  /** Default headers applied to all requests */
  headers: {
    'Content-Type': 'application/json',
    'Request-Origin': 'CUSTOMER', // Identifies this as a customer app request
  },
} as const;

/**
 * Cancel Token Storage
 *
 * Maps request keys to their cancel tokens to enable request cancellation
 * and prevent duplicate requests from running simultaneously
 */
const cancelTokens: Map<string, CancelTokenSource> = new Map();

/**
 * Generates a unique key for each request based on method, URL, params, and data
 * Used to identify and cancel duplicate requests
 *
 * @param config - Axios request configuration
 * @returns Unique string key for the request
 */
const getRequestKey = (config: InternalAxiosRequestConfig): string => {
  const method = config?.method || 'get';
  const url = config?.url || '';
  const params = config?.params || {};
  const data = config?.data || {};
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

/**
 * Axios Instance Configuration
 *
 * Creates a configured axios instance with:
 * - Base URL pointing to QuickVerse API
 * - Default timeout settings
 * - Standard headers for all requests
 */
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

/**
 * Request Interceptor
 *
 * Handles request preprocessing including:
 * - Timeout enforcement
 * - Request deduplication via cancellation
 * - Cancel token management
 */
axiosInstance.interceptors.request.use(
  (config: RetryConfig) => {
    // Ensure timeout is set for each request
    if (!config.timeout) {
      config.timeout = API_CONFIG.timeout;
    }

    // Cancel any existing request with the same key to prevent duplicates
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
      apiEndpoint: 'Unknown', // Request interceptor doesn't have config context
    });
  }
);

/**
 * Response Interceptor
 *
 * Handles response processing and error management including:
 * - Cleanup of cancel tokens on successful responses
 * - Automatic retry with exponential backoff for failed requests
 * - Comprehensive error categorization and messaging
 * - Network error handling
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Clean up cancel token on successful response
    if (response?.config) {
      const requestKey = getRequestKey(response.config);
      cancelTokens.delete(requestKey);
    }
    return response;
  },
  async (error: unknown) => {
    const axiosError = error as AxiosError;
    const config = axiosError?.config as RetryConfig | undefined;

    // Handle cancelled requests (don't retry)
    if (axios.isCancel(error)) {
      return Promise.reject({
        status: 499, // Client Closed Request
        message: 'Request was cancelled',
        isCancelled: true,
        apiEndpoint: config?.url || 'Unknown',
      });
    }

    // Clean up cancel token after error
    if (config) {
      const requestKey = getRequestKey(config);
      cancelTokens.delete(requestKey);
    }

    // If no config exists or retry count exceeded, reject with error
    if (!config || !API_CONFIG.retries || (config.retryCount ?? 0) >= API_CONFIG.retries) {
      // Handle timeout errors specifically
      if (axiosError?.code === 'ECONNABORTED' && axiosError?.message?.includes('timeout')) {
        return Promise.reject({
          status: 408, // Request Timeout
          message: API_CONFIG.timeoutMessage,
          isCancelled: false,
          apiEndpoint: config?.url || 'Unknown',
        });
      }

      // Handle network connectivity errors
      if (axiosError?.code === 'ERR_NETWORK') {
        return Promise.reject({
          status: 0, // Network Error
          message: 'Network error. Please check your internet connection.',
          isCancelled: false,
          apiEndpoint: config?.url || 'Unknown',
        });
      }

      // Handle server errors (5xx)
      if (axiosError?.response?.status && axiosError.response.status >= 500) {
        return Promise.reject({
          status: axiosError.response.status,
          message: 'Server error. Please try again later.',
          isCancelled: false,
          apiEndpoint: config?.url || 'Unknown',
        });
      }

      // Handle client errors (4xx)
      if (
        axiosError?.response?.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        const responseData = axiosError.response.data as { message?: string } | undefined;
        const errorMessage =
          responseData?.message ||
          (axiosError.response.status === 401
            ? 'Unauthorized. Please login again.'
            : axiosError.response.status === 403
            ? 'Access forbidden.'
            : axiosError.response.status === 404
            ? 'Resource not found.'
            : axiosError.response.status === 422
            ? 'Invalid data provided.'
            : 'Client error occurred.');

        return Promise.reject({
          status: axiosError.response.status,
          message: errorMessage,
          isCancelled: false,
          apiEndpoint: config?.url || 'Unknown',
        });
      }

      // Handle any other unexpected errors
      return Promise.reject({
        status: axiosError?.response?.status || 500,
        message: 'An unexpected error occurred',
        isCancelled: false,
        apiEndpoint: config?.url || 'Unknown',
      });
    }

    // Implement retry logic with exponential backoff
    const currentRetryCount = config.retryCount ?? 0;
    config.retryCount = currentRetryCount + 1;

    // Calculate backoff delay: min(1000 * 2^retryCount, 10000ms)
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

/**
 * Enhanced API Call Function with Timeout Support
 *
 * Wraps axios promises with additional timeout handling and response validation
 *
 * @param promise - The axios promise to execute
 * @param customTimeout - Optional custom timeout (overrides default)
 * @returns Promise with validated response data
 */
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
            apiEndpoint: 'Custom Timeout', // Generic for custom timeout
          });
        }, customTimeout || API_CONFIG.timeout);
      }),
    ]);

    // Validate response data
    const responseData = (response as AxiosResponse<T>)?.data;
    if (responseData === undefined || responseData === null) {
      throw {
        status: 500,
        message: 'Invalid response data received from server',
        isCancelled: false,
        apiEndpoint: (response as AxiosResponse<T>)?.config?.url || 'Unknown',
      };
    }

    return responseData;
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      // Handle cancelled request
      throw {
        status: 499, // Client Closed Request
        message: 'Request was cancelled',
        isCancelled: true,
        apiEndpoint: 'Unknown',
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
      apiEndpoint: apiError?.apiEndpoint || 'Unknown',
    };
  }
};

// Helper function to add extra headers to requests
export const withHeaders = (extraHeaders: Record<string, string>) => {
  return {
    headers: extraHeaders,
  };
};

// Helper function to create a request with custom headers
export const createRequestWithHeaders = (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: unknown,
  extraHeaders?: Record<string, string>
) => {
  const config: { headers?: Record<string, string> } = {};

  if (extraHeaders) {
    config.headers = extraHeaders;
  }

  if (data && method !== 'get') {
    return axiosInstance[method](url, data, config);
  }

  return axiosInstance[method](url, config);
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
