import { create } from 'zustand';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import { fetchThemeConfig, ThemeConfigResponse } from '../theme/themeApi';
import { Theme } from '../theme/ThemeContext';

interface ThemeStore {
  theme: Theme;
  categoryImages: Record<string, string>;
  promoImages: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  getTheme: () => Theme;
  getCategoryImages: () => Record<string, string>;
  getPromoImages: () => Record<string, string>;
}

const initialStringRecord = () => {
  const obj = { __dummy: '' } as Record<string, string>;
  delete obj.__dummy;
  return obj;
};

const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: DefaultTheme,
  categoryImages: initialStringRecord(),
  promoImages: initialStringRecord(),
  loading: false,
  error: null,

  /**
   * Fetches theme config from API. If useDefaultTheme is true in the response, or if the API fails,
   * always fallback to DefaultTheme and empty categoryImages.
   */
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const config: ThemeConfigResponse = await fetchThemeConfig();
      if (config.useDefaultTheme) {
        set({
          theme: DefaultTheme,
          categoryImages: initialStringRecord(),
          promoImages: initialStringRecord(),
          loading: false,
          error: null,
        });
      } else {
        set({
          theme: (config.theme as Theme) || DefaultTheme,
          categoryImages: config.categoryImages || initialStringRecord(),
          promoImages: config.promoImages || initialStringRecord(),
          loading: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      set({
        theme: DefaultTheme,
        categoryImages: initialStringRecord(),
        promoImages: initialStringRecord(),
        loading: false,
        error: (err as Error)?.message || 'Failed to fetch theme config',
      });
    }
  },

  getTheme: () => get().theme,
  getCategoryImages: () => get().categoryImages,
  getPromoImages: () => get().promoImages,
}));

export default useThemeStore;
