// src/theme/ThemeContext.tsx
// NOTE: ThemeProvider will always use DefaultTheme if useDefaultTheme is true in the config or if the API fails, as handled by the store.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import useThemeStore from '../store/themeStore';

type ButtonColors = {
  default_background: string;
  default_text: string;
  pressed_background: string;
  pressed_text: string;
  disabled_background: string;
  disabled_text: string;
};

type Shadow = {
  color: string;
  opacity: number;
  offset_width: number;
  offset_height: number;
  radius: number;
};

export type Colors = {
  main: string;
  secondary: string;
  background: string;
  tabBackground: string;
  card: string;
  error: string;
  border: string;
  overlay: string;
  white: string;
  black: string;
  text: string;
  subText: string;
  placeholder: string;
  button: ButtonColors;
  shadow: Shadow;
  borderHighlight: string;
};

type Typography = {
  fontFamily: string;
  lineHeightMultiplier: number;
  h1: number;
  h2: number;
  subtitle: number;
  body: number;
  caption: number;
  small: number;
};

type BorderRadius = {
  sm: number;
  md: number;
  max: number;
};

export type Theme = {
  colors: Colors;
  typography: Typography;
  borderRadius: BorderRadius;
};

type ThemeContextType = {
  theme: Theme;
  isLoading: boolean;
  error: Error | null;
  getColor: (colorKey: keyof Colors | 'primary' | 'primaryLight' | 'success') => string;
  getButtonColor: (
    state: 'default' | 'pressed' | 'disabled',
    element: 'background' | 'text'
  ) => string;
  getTypography: (type: keyof Omit<Typography, 'fontFamily' | 'lineHeightMultiplier'>) => number;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(DefaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const themeStore = useThemeStore();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        setTheme(themeStore.getTheme());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setTheme(DefaultTheme);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _validateTheme = (apiTheme: unknown): Theme => {
    // Basic validation - expand according to your API contract
    const isValid =
      apiTheme &&
      typeof apiTheme === 'object' &&
      apiTheme !== null &&
      'colors' in apiTheme &&
      'typography' in apiTheme &&
      typeof (apiTheme as Partial<Theme>)?.colors?.button?.default_background === 'string' &&
      typeof (apiTheme as Partial<Theme>)?.typography?.h1 === 'number';

    return isValid ? (apiTheme as Theme) : DefaultTheme;
  };

  const getColor = (colorKey: keyof Colors | 'primary' | 'primaryLight' | 'success'): string => {
    const map: Record<string, keyof Colors> = {
      primary: 'main',
      primaryLight: 'overlay',
      success: 'secondary',
    };
    const resolvedKey = (map[colorKey as string] || colorKey) as keyof Colors;
    return (theme.colors[resolvedKey] || DefaultTheme.colors[resolvedKey]) as string;
  };

  const getTypography = (
    type: keyof Omit<Typography, 'fontFamily' | 'lineHeightMultiplier'>
  ): number => {
    return theme.typography[type] || DefaultTheme.typography[type];
  };

  const getButtonColor = (
    state: 'default' | 'pressed' | 'disabled',
    element: 'background' | 'text'
  ): string => {
    const key = `${state}_${element}` as keyof ButtonColors;
    const value = theme.colors.button[key] ?? DefaultTheme.colors.button[key];
    return value as string;
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLoading,
        error,
        getColor,
        getTypography,
        getButtonColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeProvider, useTheme };
