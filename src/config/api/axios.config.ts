import axios, { AxiosError, AxiosResponse } from 'axios';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { ApiError } from './axios.types';
/**
 * Callback function type for handling session expiration
 */
type SessionExpiredCallback = () => void;

/**
 * Global callback for session expiration
 */
let sessionExpiredCallback: SessionExpiredCallback | null = null;

/**
 * Set the session expired callback
 */
export const setSessionExpiredCallback = (callback: SessionExpiredCallback) => {
  sessionExpiredCallback = callback;
};

/**
 * Clear the session expired callback
 */
export const clearSessionExpiredCallback = () => {
  sessionExpiredCallback = null;
};

/**
 * Show toast message based on platform
 */
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.TOP);
  } else {
    Alert.alert('Session Expired', message);
  }
};

/**
 * API Configuration Object
 *
 * Centralized configuration for all API requests including:
 * - Base URL for the QuickVerse API
 * - Timeout settings for request handling
 * - Default headers for all requests
 */
export const API_CONFIG = {
  /** Base URL for the QuickVerse API server */
  baseURL: 'http://beta.quickverse.in/quickVerse',

  /** Default timeout for all requests (15 seconds) */
  timeout: 15000,

  /** Default headers applied to all requests */
  headers: {
    'Content-Type': 'application/json',
    'Request-Origin': 'CUSTOMER', // Identifies this as a customer app request
  },
} as const;

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
 * Simple Error Handler
 *
 * Converts axios errors to a consistent format
 */
const handleAxiosError = (error: AxiosError | unknown): ApiError => {
  // Type guard to check if it's an AxiosError
  if (!axios.isAxiosError(error)) {
    return {
      status: 500,
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      isCancelled: false,
      apiEndpoint: 'Unknown',
    };
  }

  const axiosError = error as AxiosError<unknown>;

  // Handle network errors
  if (axiosError.code === 'ERR_NETWORK') {
    return {
      status: (axiosError as AxiosError).response?.status || 0,
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      isCancelled: false,
      apiEndpoint: (axiosError as AxiosError).config?.url || 'Unknown',
    };
  }

  // Handle timeout errors
  if (axiosError.code === 'ECONNABORTED') {
    return {
      status: 408,
      message: 'Request timed out. Please check your internet connection and try again.',
      code: 'TIMEOUT',
      isCancelled: false,
      apiEndpoint: (axiosError as AxiosError).config?.url || 'Unknown',
    };
  }

  // Handle cancelled requests
  if (axios.isCancel(axiosError)) {
    return {
      status: 499,
      message: 'Request was cancelled',
      code: 'CANCELLED',
      isCancelled: true,
      apiEndpoint: (axiosError as AxiosError).config?.url || 'Unknown',
    };
  }

  // Handle HTTP errors
  if ((axiosError as AxiosError).response) {
    const responseData = (axiosError as AxiosError)?.response?.data as {
      code: string;
      message: string;
    };

    // Backend always returns errors in this format:
    // { "error": { "code": "1052", "message": "Tag already exists" } }
    const errorMessage =
      responseData?.message || responseData?.error?.message || 'An error occurred';
    const errorCode = responseData?.code || responseData?.error?.code || '';

    // Check for session expired error (code 1047)
    if (errorCode === '1047' || errorCode === '1042') {
      showToast('invalid session');
      sessionExpiredCallback?.();
    }

    return {
      status: (axiosError as AxiosError)?.response?.status || 500,
      message: errorMessage,
      code: errorCode,
      isCancelled: false,
      apiEndpoint: (axiosError as AxiosError).config?.url || 'Unknown',
      error: responseData || { code: errorCode, message: errorMessage },
    };
  }

  // Handle any other errors
  return {
    status: 500,
    message: (axiosError as AxiosError).message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    isCancelled: false,
    apiEndpoint: (axiosError as AxiosError).config?.url || 'Unknown',
  };
};

/**
 * Simple API Call Function
 *
 * Wraps axios calls with simple error handling
 */
export const apiCall = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    console.error('error caught in Axios Config', error);
    throw handleAxiosError(error as AxiosError);
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

export default axiosInstance;
