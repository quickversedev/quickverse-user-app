import axios, {
  AxiosError,
  AxiosResponse,
  CancelTokenSource,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, RetryConfig } from './axios.types';

// API Configuration
const API_CONFIG = {
  baseURL: 'http://192.168.31.144:8080/quickVerse',
  timeout: 15000, // 15 seconds default timeout
  retries: 3, // number of retries for failed requests
  timeoutMessage: 'Request timed out. Please check your internet connection and try again.',
  headers: {
    'Content-Type': 'application/json',
    'Request-Origin': 'CUSTOMER',
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
  async (error: unknown) => {
    // Don't retry cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject({
        status: 499, // Client Closed Request
        message: 'Request was cancelled',
        isCancelled: true,
      });
    }

    const axiosError = error as AxiosError;
    const config = axiosError?.config as RetryConfig | undefined;

    // Clean up cancel token after error
    if (config) {
      const requestKey = getRequestKey(config);
      cancelTokens.delete(requestKey);
    }

    // If no config exists or retry count exceeded, reject with error
    if (!config || !API_CONFIG.retries || (config.retryCount ?? 0) >= API_CONFIG.retries) {
      if (axiosError?.code === 'ECONNABORTED' && axiosError?.message?.includes('timeout')) {
        return Promise.reject({
          status: 408,
          message: API_CONFIG.timeoutMessage,
          isCancelled: false,
        });
      }

      // Handle network errors
      if (axiosError?.code === 'ERR_NETWORK') {
        return Promise.reject({
          status: 0,
          message: 'Network error. Please check your internet connection.',
          isCancelled: false,
        });
      }

      // Handle server errors (5xx)
      if (axiosError?.response?.status && axiosError.response.status >= 500) {
        return Promise.reject({
          status: axiosError.response.status,
          message: 'Server error. Please try again later.',
          isCancelled: false,
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
        });
      }

      return Promise.reject({
        status: axiosError?.response?.status || 500,
        message: 'An unexpected error occurred',
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

    // Validate response data
    const responseData = (response as AxiosResponse<T>)?.data;
    if (responseData === undefined || responseData === null) {
      throw {
        status: 500,
        message: 'Invalid response data received from server',
        isCancelled: false,
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
      };
    }

    const apiError = error as ApiError;
    console.log('apiError', apiError);
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
