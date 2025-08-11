import { InternalAxiosRequestConfig } from 'axios';

export interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

export interface ApiError {
  status: number;
  message: string;
  isCancelled?: boolean;
  apiEndpoint?: string; // API endpoint that failed
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}
