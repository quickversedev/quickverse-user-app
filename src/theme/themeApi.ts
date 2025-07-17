import axiosInstance from '../config/api/axios.config';

export interface ThemeConfigResponse {
  theme: unknown;
  categoryImages: Record<string, string>;
  useDefaultTheme?: boolean;
  [key: string]: unknown;
}

const THEME_CONFIG_ENDPOINT = '/theme-config'; // relative to baseURL

/**
 * Fetches the theme config from the backend.
 * If useDefaultTheme is true in the response, the consumer should use DefaultTheme.
 */
export async function fetchThemeConfig(): Promise<ThemeConfigResponse> {
  const response = await axiosInstance.get<{ config: ThemeConfigResponse }>(THEME_CONFIG_ENDPOINT);
  if (response.data && response.data.config) {
    return response.data.config;
  }
  throw new Error('Invalid theme config response');
}
