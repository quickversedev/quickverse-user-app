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
  const authHeaders = {
    Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
  };

  const response = await axiosInstance.get<ThemeConfigResponse>(
    `${THEME_ENDPOINT}?themeId=${themeId}`,
    withHeaders(authHeaders)
  );

  return response.data;
}
