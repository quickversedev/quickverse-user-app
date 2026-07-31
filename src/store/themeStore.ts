import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import { LightTheme } from '../assets/theme/lightTheme';
import { fetchThemeConfig, ThemeConfigResponse } from '../theme/themeApi';
import { Theme } from '../theme/ThemeContext';
import useConfigStore from './configStore';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../utils/cache';

export type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  themeMode: ThemeMode;
  loading: boolean;
  error: string | null;
  _lastFetchedAt: number;
  fetchTheme: (themeId?: string) => Promise<void>;
  getTheme: () => Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  reset: () => void;
}

const initialState = {
  theme: DefaultTheme as Theme,
  themeMode: 'light' as ThemeMode,
  loading: false,
  error: null as string | null,
  _lastFetchedAt: 0,
};

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchTheme: async (themeId?: string) => {
        if (isCacheFresh(get()._lastFetchedAt, CACHE_TTL.THEME) && get().theme) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const isDefaultThemeEnabled = useConfigStore.getState().defaultThemeEnabled();

          if (isDefaultThemeEnabled === true || isDefaultThemeEnabled === undefined) {
            set({
              theme: LightTheme,
              loading: false,
              error: null,
              _lastFetchedAt: Date.now(),
            });
            return;
          }

          const finalThemeId = themeId || useConfigStore.getState().getThemeId() || 'theme1';
          const config: ThemeConfigResponse = await fetchThemeConfig(finalThemeId);

          if (config.useDefaultTheme) {
            set({
              theme: LightTheme,
              loading: false,
              error: null,
              _lastFetchedAt: Date.now(),
            });
          } else {
            set({
              theme: (config as unknown as Theme) || LightTheme,
              loading: false,
              error: null,
              _lastFetchedAt: Date.now(),
            });
          }
        } catch (err: unknown) {
          set({
            theme: LightTheme,
            loading: false,
            error: (err as Error)?.message || 'Failed to fetch theme config',
          });
        }
      },

      getTheme: () => get().theme,

      toggleTheme: () => {
        set({
          themeMode: 'light',
          theme: LightTheme,
        });
      },

      setThemeMode: (_mode: ThemeMode) => {
        set({
          themeMode: 'light',
          theme: LightTheme,
        });
      },

      reset: () => set(initialState),
    }),
    createPersistedConfig<ThemeStore>('theme-storage-v3', state => ({
      themeMode: state.themeMode,
      theme: state.theme,
      _lastFetchedAt: state._lastFetchedAt,
    }))
  )
);

export default useThemeStore;
