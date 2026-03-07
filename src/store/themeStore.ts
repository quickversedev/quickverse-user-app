import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import { LightTheme } from '../assets/theme/lightTheme';
import { fetchThemeConfig, ThemeConfigResponse } from '../theme/themeApi';
import { Theme } from '../theme/ThemeContext';
import useConfigStore from './configStore';
import { mmkvStorage } from '../services/localStorage/storage.service';

export type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  themeMode: ThemeMode;
  loading: boolean;
  error: string | null;
  fetchTheme: (themeId?: string) => Promise<void>;
  getTheme: () => Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: DefaultTheme,
      themeMode: 'light' as ThemeMode,
      loading: false,
      error: null,

      /**
       * Fetches theme config from API based on configuration.
       */
      fetchTheme: async (themeId?: string) => {
        set({ loading: true, error: null });

        try {
          const isDefaultThemeEnabled = useConfigStore.getState().defaultThemeEnabled();
          const currentMode = get().themeMode;

          // Use local theme based on mode
          if (isDefaultThemeEnabled === true || isDefaultThemeEnabled === undefined) {
            set({
              // theme: currentMode === 'dark' ? DefaultTheme : LightTheme,
              theme: LightTheme,
              loading: false,
              error: null,
            });
            return;
          }

          const finalThemeId = themeId || useConfigStore.getState().getThemeId() || 'theme1';
          const config: ThemeConfigResponse = await fetchThemeConfig(finalThemeId);

          if (config.useDefaultTheme) {
            set({
              // theme: currentMode === 'dark' ? DefaultTheme : LightTheme,
              theme: LightTheme,
              loading: false,
              error: null,
            });
          } else {
            set({
              // theme: (config as unknown as Theme) || (currentMode === 'dark' ? DefaultTheme : LightTheme),
              theme: (config as unknown as Theme) || LightTheme,
              loading: false,
              error: null,
            });
          }
        } catch (err: unknown) {
          const currentMode = get().themeMode;
          set({
            // theme: currentMode === 'dark' ? DefaultTheme : LightTheme,
            theme: LightTheme,
            loading: false,
            error: (err as Error)?.message || 'Failed to fetch theme config',
          });
        }
      },

      getTheme: () => get().theme,

      toggleTheme: () => {
        // const currentMode = get().themeMode;
        // const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
        set({
          themeMode: 'light',
          theme: LightTheme,
        });
      },

      setThemeMode: (mode: ThemeMode) => {
        set({
          themeMode: 'light',
          theme: LightTheme,
        });
      },
    }),
    {
      name: 'theme-storage-v2', // Reset storage to clear persisted dark theme
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({ themeMode: state.themeMode }),
      onRehydrateStorage: () => state => {
        // After rehydration, set the correct theme based on saved mode
        if (state) {
          // state.theme = state.themeMode === 'dark' ? DefaultTheme : LightTheme;
          state.theme = LightTheme;
        }
      },
    }
  )
);

export default useThemeStore;
