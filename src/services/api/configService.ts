import axiosInstance, { apiCall } from '../../config/api/axios.config';
import { InitialConfigParams, InitialConfigResponse } from '../../types/config';

const CONFIG_ENDPOINTS = {
  initialConfig: '/v1/initialConfig',
} as const;

const AUTH_HEADERS = {
  Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
} as const;

/**
 * Fetches initial configuration based on location coordinates
 * @param params - Object containing longitude and latitude
 * @returns Promise<InitialConfigResponse>
 */
export const fetchInitialConfig = async (
  params: InitialConfigParams
): Promise<InitialConfigResponse> => {
  const response = await apiCall(
    axiosInstance.get<InitialConfigResponse>(CONFIG_ENDPOINTS.initialConfig, {
      params,
      headers: AUTH_HEADERS,
    })
  );
  return response;
};



