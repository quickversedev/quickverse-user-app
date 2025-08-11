import { create } from 'zustand';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import { fetchThemeConfig, ThemeConfigResponse } from '../theme/themeApi';
import { Theme } from '../theme/ThemeContext';
import useConfigStore from './configStore';

interface ThemeStore {
  theme: Theme;
  loading: boolean;
  error: string | null;
  fetchTheme: (themeId?: string) => Promise<void>;
  getTheme: () => Theme;
}

const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: DefaultTheme,
  loading: false,
  error: null,

  /**
   * Fetches theme config from API based on configuration.
   *
   * Use cases:
   * 1. Fallback is always the default theme
   * 2. If defaultThemeEnabled is false, call themeApi to get the theme
   * 3. If defaultThemeEnabled is true, use the default theme
   * 4. If defaultThemeEnabled is undefined (initialConfig API failure), use default theme
   * 5. If themeApi fails to fetch the theme, use default theme
   */
  fetchTheme: async (themeId?: string) => {
    set({ loading: true, error: null });

    try {
      // Check if default theme is enabled from config store
      const isDefaultThemeEnabled = useConfigStore.getState().defaultThemeEnabled();

      // Use cases 3 & 4: If default theme is enabled or undefined, use DefaultTheme
      if (isDefaultThemeEnabled === true || isDefaultThemeEnabled === undefined) {
        set({
          theme: DefaultTheme,
          loading: false,
          error: null,
        });
        return;
      }

      // Use case 2: If defaultThemeEnabled is false, call themeApi
      const finalThemeId = themeId || useConfigStore.getState().getThemeId() || 'theme1';
      const config: ThemeConfigResponse = await fetchThemeConfig(finalThemeId);

      if (config.useDefaultTheme) {
        // Use case 1: Fallback to default theme if API response indicates to use default
        set({
          theme: DefaultTheme,
          loading: false,
          error: null,
        });
      } else {
        // Use custom theme from API response, with fallback to default
        set({
          theme: (config.theme as Theme) || DefaultTheme,
          loading: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      // Use case 5: If themeApi fails, use default theme
      set({
        theme: DefaultTheme,
        loading: false,
        error: (err as Error)?.message || 'Failed to fetch theme config',
      });
    }
  },

  getTheme: () => get().theme,
}));

export default useThemeStore;
