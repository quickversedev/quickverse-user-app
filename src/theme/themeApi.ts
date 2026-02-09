import { AUTHORIZATION_KEY } from '@env';
import axiosInstance, { withHeaders } from '../config/api/axios.config';

export interface ThemeConfigResponse {
  theme: unknown;
  [key: string]: unknown;
}

const THEME_ENDPOINT = '/v3/theme';

/**
 * Fetches the theme config from the backend.
 * @param themeId - The theme ID to fetch (defaults to 'theme1')
 * @returns Promise<ThemeConfigResponse>
 */
export async function fetchThemeConfig(themeId: string = 'theme1'): Promise<ThemeConfigResponse> {
  const authHeader = AUTHORIZATION_KEY && !AUTHORIZATION_KEY.startsWith('Basic ')
    ? `Basic ${AUTHORIZATION_KEY}`
    : AUTHORIZATION_KEY;

  const authHeaders = {
    Authorization: authHeader,
  };

  const response = await axiosInstance.get<ThemeConfigResponse>(
    `${THEME_ENDPOINT}?themeId=${themeId}`,
    withHeaders(authHeaders)
  );
  return response.data;
}
