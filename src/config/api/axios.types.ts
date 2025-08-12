export interface ApiError {
  status: number;
  message: string;
  code?: string; // Error code from API response
  isCancelled?: boolean;
  apiEndpoint?: string; // API endpoint that failed
  error?: {
    code: string;
    message: string;
  };
}
