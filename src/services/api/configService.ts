import { AUTHORIZATION_KEY } from '@env';
import axiosInstance, { apiCall } from '../../config/api/axios.config';
import { InitialConfigParams, InitialConfigResponse } from '../../types/config';

const CONFIG_ENDPOINTS = {
  initialConfig: '/v1/initialConfig',
} as const;

const AUTH_HEADERS = {
  Authorization: AUTHORIZATION_KEY,
} as const;

/**
 * Fetches initial configuration based on location coordinates
 * @param params - Object containing longitude and latitude
 * @returns Promise<InitialConfigResponse>
 */
export const fetchInitialConfig = async (
  params: InitialConfigParams
): Promise<InitialConfigResponse> => {
  const authHeader = AUTHORIZATION_KEY && !AUTHORIZATION_KEY.startsWith('Basic ')
    ? `Basic ${AUTHORIZATION_KEY}`
    : AUTHORIZATION_KEY;

  console.log('AUTHORIZATION_KEY', { ...AUTH_HEADERS, Authorization: authHeader });
  const response = await apiCall(
    axiosInstance.get<InitialConfigResponse>(CONFIG_ENDPOINTS.initialConfig, {
      params,
      headers: { ...AUTH_HEADERS, Authorization: authHeader },
    })
  );

  return response;
};
